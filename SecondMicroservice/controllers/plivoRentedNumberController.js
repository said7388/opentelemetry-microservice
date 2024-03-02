import plivo from "plivo";
import dotEnv from "dotenv";
import moment from "moment-timezone";
import asyncHandler from "express-async-handler";
import PlivoRentedNumber from "../models/plivoRentedNumberModel.js";
import {
  convertInputNumberOrDefault,
  findDissociatedPlivoNumbers,
  generateAssociatedNumbersFilterQueries,
  isInvalidPlivoRentedNumber,
} from "../utils/plivoRentedNumberValidation.js";
import Organization from "../models/organizationModel.js";

dotEnv.config(); // allow .env file to load
const plivoClient = new plivo.Client(
  process.env.PLIVO_AUTH_ID,
  process.env.PLIVO_AUTH_TOKEN
);
// add number to an organization
const addPlivoRentedNumber = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to add a number to an organization
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const errorMessage = isInvalidPlivoRentedNumber(req.body);
  if (errorMessage) {
    // if the payload is invalid, return a bad req. error
    return res.status(400).json({ message: errorMessage });
  }

  try {
    // check for organization
    const requestedOrganization = await Organization.findById(
      req.body.organization_id
    );
    if (!requestedOrganization) {
      // if no organization found
      return res.status(404).json({ message: "No account found." });
    }

    if (requestedOrganization.is_deleted || !requestedOrganization.is_active) {
      // if the request is made for a deleted or inactive organization
      return res
        .status(404)
        .json({ message: "This account is either deleted or inactive." });
    }

    // get Plivo number details
    const plivoNumber = await plivoClient.numbers.get(req.body.number);
    if (!plivoNumber) {
      return res.status(404).json({ message: "No Plivo Number found." });
    }

    const now = moment();
    const renewalDate = moment(plivoNumber.renewal_date);
    if (renewalDate.isBefore(now)) {
      return res
        .status(400)
        .json({ message: "Please renew the number and try again." });
    }

    const newPlivoRentedNumber = new PlivoRentedNumber({
      organization_id: req.body.organization_id,
      plivo_number: req.body.number,
      activation_date: now,
      number_type: plivoNumber.numberType,
      region: plivoNumber.region,
      created_at: moment().tz("Etc/UTC"),
      updated_at: moment().tz("Etc/UTC"),
    });

    await newPlivoRentedNumber.save();

    return res.status(201).json({ message: "Number added successfully." });
  } catch (err) {
    console.log("Error from addPlivoRentedNumber: ", err);
    // if the error code is 11000 the this number is already associated with an org.
    if (err.code === 11000 && err.keyPattern.organization_id === 1) {
      return res.status(400).json({
        message: "This number has already been taken for another Account.",
        associatied_org_id: err.keyValue.organization_id,
      });
    }
    // if error status is 404 & there is an apiID property available
    // then this error is coming from Plivo.
    if (err.status === 404 && err.apiID) {
      return res.status(404).json({ message: "No plivo number found." });
    }
    return res.status(500).json({ message: "Internal server error." });
  }
});

// update number to an organization
const updatePlivoRentedNumber = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to update a number to an organization
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const errorMessage = isInvalidPlivoRentedNumber(req.body);
  if (errorMessage) {
    // if the payload is invalid, return a bad req. error
    return res.status(400).json({ message: errorMessage });
  }

  try {
    // check for organization
    const requestedOrganization = await Organization.findById(
      req.body.organization_id
    );
    if (!requestedOrganization) {
      // if no organization found
      return res.status(404).json({ message: "No account found." });
    }

    if (requestedOrganization.is_deleted || !requestedOrganization.is_active) {
      // if the request is made for a deleted or inactive organization
      return res
        .status(404)
        .json({ message: "This account is either deleted or inactive." });
    }

    // check if the number is associated with any organization or not
    const associatedNumber = await PlivoRentedNumber.findOne({
      plivo_number: req.body.number,
      is_active: true,
      is_deleted: false,
    });

    if (associatedNumber) {
      // if there is a match, return bad req.
      return res.status(400).json({
        message:
          "This number has already been associated with another Account.",
      });
    }

    // get Plivo number details
    const plivoNumber = await plivoClient.numbers.get(req.body.number);
    if (!plivoNumber) {
      return res.status(404).json({ message: "No plivo number found." });
    }

    const now = moment();
    const renewalDate = moment(plivoNumber.renewal_date);
    if (renewalDate.isBefore(now)) {
      return res
        .status(400)
        .json({ message: "Please renew the number and try again." });
    }

    const updatedPlivoRentedNumber = await PlivoRentedNumber.findOneAndUpdate(
      {
        organization_id: req.body.organization_id,
      },
      {
        plivo_number: req.body.number,
        activation_date: now,
        number_type: plivoNumber.numberType,
        region: plivoNumber.region,
        is_active: true,
        is_deleted: false,
        updated_at: moment().tz("Etc/UTC"),
      }
    );

    await updatedPlivoRentedNumber.save();

    return res.status(200).json({ message: "Number updated successfully." });
  } catch (err) {
    console.log("Error from updatePlivoRentedNumber: ", err);
    // error code 11000 means this number already exist in the database
    //  associated with an account
    if (err.code === 11000 && err.keyPattern.organization_id === 1) {
      return res.status(400).json({
        message: "This number has already been taken for another Account.",
        associatied_org_id: err.keyValue.organization_id,
      });
    }
    // if error status is 404 & there is an apiID property available
    // then this error is coming from Plivo.
    if (err.status === 404 && err.apiID) {
      return res.status(404).json({ message: "No plivo number found." });
    }
    return res.status(500).json({ message: "Internal server error." });
  }
});

// view own rented phone number
const viewOwnOrgRentedPhoneNumber = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;

  try {
    const associatedNumber = await PlivoRentedNumber.findOne({
      organization_id: organizationId,
      is_active: true,
      is_deleted: false,
    });

    if (!associatedNumber) {
      return res.status(404).json({ message: "No associated number found." });
    }

    return res
      .status(200)
      .json({ message: "Rented number details", data: associatedNumber });
  } catch (err) {
    console.log("Error from viewOwnOrgRentedPhoneNumber: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Delete rented number associated with organization
const deleteAssociatedNumber = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to add a number to an organization
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const associatedNumberId = req.params.associatedNumberId;

  try {
    const foundNumber = await PlivoRentedNumber.findById(associatedNumberId);
    if (!foundNumber || foundNumber.is_deleted) {
      return res.status(404).json({ message: "No associated number found" });
    }

    const now = moment();
    const deleteAssociatedNumber = await PlivoRentedNumber.findByIdAndUpdate(
      associatedNumberId,
      {
        $set: {
          plivo_number: "",
          is_deleted: true,
          deactivation_date: now,
          updated_at: moment().tz("Etc/UTC"),
        },
      }
    );

    await deleteAssociatedNumber.save();

    return res.status(200).json({
      message: "The number is no more associated with this account.",
    });
  } catch (err) {
    console.log("Error from deleteAssociatedNumber: ", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// List  associated number
const getAssociatedNumberList = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const page = convertInputNumberOrDefault(req.query.page, 1); // Page number (starting from 1)
  const limit = convertInputNumberOrDefault(req.query.limit, 10); // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-activation_date"; // by default activation_date descending order.
  const search = req?.query?.search ? req.query.search : "";
  const filters = generateAssociatedNumbersFilterQueries(req); // generate filter queries

  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = PlivoRentedNumber.find({
      $and: [
        {
          $or: [
            { plivo_number: { $regex: regex } },
            { region: { $regex: regex } },
          ],
        },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute PlivoRentedNumber Query
    let associatedNumberList = await query.populate("org_details").exec();
    associatedNumberList = associatedNumberList.map((assoNum) => {
      const assN_Item = assoNum.toObject();
      const org_name = assoNum.org_details[0].public_name;
      const org_email = assoNum.org_details[0].email;
      const org_country = assoNum.org_details[0].country;
      delete assN_Item.is_deleted;
      return {
        ...assN_Item,
        org_name,
        org_email,
        org_country,
      };
    });
    // Getting the Total Document Count
    const totalCount = await PlivoRentedNumber.countDocuments(
      query.getFilter()
    );

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };

    return res.status(200).json({
      message: "Email history list",
      data: associatedNumberList,
      paginationData,
    });
  } catch (err) {
    console.log("Error form getAssociatedNumberList:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// get all available Plivo number
const getAllAvailablePlivoNumbers = async () => {
  let nextPointer = true;
  let offset = 0;
  let result = [];

  while (nextPointer) {
    const numbers = await plivoClient.numbers.list({ limit: 20, offset });
    result = result.concat(numbers);
    offset += 20;
    nextPointer = numbers?.meta?.next || false;
  }

  return result;
};

// get Disassociated numbers
const getDissociatedNumberList = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // only super admin is allowed to view this list
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  try {
    // get all rented Plivo numbers
    const availableNumbers = await getAllAvailablePlivoNumbers();
    // Get all associated items
    const associatedNumbers = await PlivoRentedNumber.find({
      is_deleted: false,
      is_active: true,
    }).exec();
    // Numbers that don't have any assoiciation
    const dissociatedNumbers = findDissociatedPlivoNumbers(
      associatedNumbers,
      availableNumbers
    );

    res.status(200).json({
      message: "Dissociated numbers list",
      data: dissociatedNumbers,
    });
  } catch (err) {
    console.log("Error from getDissociatedNumberList: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export {
  addPlivoRentedNumber,
  updatePlivoRentedNumber,
  viewOwnOrgRentedPhoneNumber,
  deleteAssociatedNumber,
  getAssociatedNumberList,
  getDissociatedNumberList,
};
