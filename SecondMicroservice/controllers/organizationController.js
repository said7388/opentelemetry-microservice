import asyncHandler from "express-async-handler";
import moment from "moment-timezone";
import jwt from "jsonwebtoken";
import dotEnv from "dotenv";
import Organization from "../models/organizationModel.js";
import { pushDataToAwsSqs } from "../utils/pushDataToAwsSqs.js";
import {
  isInvalidOrganizationPayload,
  removeEmptyProperties,
} from "../utils/createOrganizationValidator.js";
import {
  formateUpdateOrgPayloadForDb,
  isInvalidOrganizationUpdatePayload,
  validateActiveStatusPayload,
} from "../utils/updateOrganizationValidator.js";
import { generateOrganizationFilters } from "../utils/generateFilters.js";
import BusinessProfileSettings from "../models/businessProfileSettingsModel.js";
import PlivoRentedNumber from "../models/plivoRentedNumberModel.js";
dotEnv.config(); // allow .env file to load

// List of organizations
const getOrganizationList = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sort_by ? req.query.sort_by : "-created_at"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const filters = generateOrganizationFilters(req);

  // console.log(filters);

  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;
  try {
    const query = Organization.find({
      $and: [
        {
          $or: [
            { public_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    // execute organization Query
    const organizations = await query.exec();
    // Getting the Total Document Count
    const totalCount = await Organization.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "Account list",
      data: organizations,
      paginationData,
    });
  } catch (err) {
    console.log("Error from getOrganizationList: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Create a new Organization
const createOrganization = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  // Check if the required field is empty
  const errorMessage = isInvalidOrganizationPayload(req.body);

  if (errorMessage) {
    // if so, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

  // Remove empty properties from the payload
  const organizationPayload = removeEmptyProperties(req.body);
  // Creating a new Organization instance
  const newOrganization = new Organization({
    ...organizationPayload,
    created_at: moment().tz("Etc/UTC"),
    updated_at: moment().tz("Etc/UTC"),
  });

  try {
    // Saving organization into DB and sending organization data back
    const savedOrganizations = await newOrganization.save();
    if (savedOrganizations) {
      // Creating a new Business Profile Settings instance
      const newBusinessProfileSettings = new BusinessProfileSettings({
        organization_id: savedOrganizations._id,
        created_at: moment().tz("Etc/UTC"),
        updated_at: moment().tz("Etc/UTC"),
      });
      // saved business profile settings into DB
      await newBusinessProfileSettings.save();
      // generate Zapier API Key
      const zapApiKey = jwt.sign(
        {
          organization_id: savedOrganizations._id,
          organization_name: savedOrganizations.public_name,
        },
        process.env.ZAPIER_JWT_SECRET
      );
      // Update organization with zapier API key
      const updatedOrgInfo = await Organization.findByIdAndUpdate(
        savedOrganizations._id,
        {
          $set: {
            zapier_api_key: zapApiKey,
            updated_at: moment().tz("Etc/UTC"),
          },
        },
        {
          new: true,
        }
      );

      // sqs Object
      const sqsMessageObject = {
        organization_id: req?.user?.organization_id,
        table_name: "Organization",
        module_name: "Organization",
        user_name: req?.user?.username,
        action_taken: "Created Account and Business Profile" ,
      }

      // push data aws sqs
      pushDataToAwsSqs(sqsMessageObject);

      return res
        .status(201)
        .json({ message: "Account created", data: updatedOrgInfo });
    }
    return res.status(500).json({ message: "Something went wrong." });
  } catch (err) {
    console.log("Error from createOrganization: ", err);
    // if error code is 11000 then an org. is already registered with this email
    if (err.code === 11000 && err.keyPattern.email === 1) {
      return res.status(400).json({
        message:
          "This business email has already been taken for another account",
      });
    }
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// View Organization wit Zapier Key
const viewOrganizationFromOtherService = asyncHandler(async (req, res) => {
  const organizationId = req.user.organization_id;
  try {
    // Find the organization by id
    const organization = await Organization.findById(organizationId);

    if (!organization || organization.is_deleted || !organization.is_active) {
      // No org found or the organization is inactive or deleted
      return res.status(404).json({ message: "No account found.", org: null });
    }

    return res
      .status(200)
      .json({ message: "Account Deails", org: organization });
  } catch (err) {
    console.log("Error from viewOrganizationFromOtherService: ", err);
    return res.status(404).json({ message: "Account not found.", org: null });
  }
});

// View an Organization
const viewOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  if (
    req.user.role !== "super_admin" &&
    req.user.organization_id !== organizationId
  ) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  // Find the organization by id
  try {
    const organization = await Organization.findById(organizationId);

    return res
      .status(200)
      .json({ message: "Account Deails", data: organization });
  } catch (err) {
    console.log("Error from viewOrganization: ", err);
    return res.status(404).json({ message: "Account not found." });
  }
});

// Delete An Organization
const deleteOrganization = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // Only Super admin is allowed to delete organizations
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const organizationId = req.params.organizationId;

  if (req.user.organization_id == organizationId) {
    // It's a suicide attempt.
    return res.status(403).json({
      message:
        "The termination of your own account is not permitted. Such an action would be analogous to self-destruction.",
    });
  }

  try {
    // get the requested Org.
    const foundOrg = await Organization.findById(organizationId);
    if (!foundOrg || foundOrg.is_deleted) {
      // if no Org. found or the "is_deleted" flag is set to true,
      return res.status(400).json({ message: "Account is already deleted." });
    }
    // find and delete the organization
    const deletedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      {
        $set: {
          is_deleted: true,
          updated_at: moment().tz("Etc/UTC"),
        },
      }
    );

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "Organization",
      module_name: "Organization",
      user_name: req?.user?.username,
      action_taken: "Deleted Account" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    await deletedOrganization.save(); // Save the organization deletion into DB
    const now = moment();

    const deleteAssociatedNumber = await PlivoRentedNumber.findOneAndUpdate(
      { organization_id: organizationId },
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

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.log("Error from deleteOrganization: ", err);

    return res.status(404).json({ message: "Account not found" });
  }
});

// Update An Organization
const updateOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;

  if (!["super_admin", "admin"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  if (req.user.role == "admin" && req.user.organization_id != organizationId) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  // Check if any field is empty
  const errorMessage = isInvalidOrganizationUpdatePayload(req.body);

  if (errorMessage) {
    // if so, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

  // Remove empty properties from the payload
  const organizationPayload = removeEmptyProperties(
    formateUpdateOrgPayloadForDb(req.body)
  );

  try {
    // find and Update the organization
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      {
        $set: organizationPayload,
      },
      {
        new: true,
      }
    );
    
    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "Organization",
      module_name: "Organization",
      user_name: req?.user?.username,
      action_taken: "Updated Account Informations" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    return res.status(200).json({
      message: "Organization updated successfully.",
      data: updatedOrganization,
    });
  } catch (err) {
    console.log("Error from updateOrganization: ", err);

    return res.status(404).json({ message: "Organization Not Found" });
  }
});

// Make Organization as acitve or inactive
const makeOrganizationActiveOrInactive = asyncHandler(async (req, res) => {
  if (req.user.role !== "super_admin") {
    // Only Super admin is allowed to delete organizations
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const errorMessage = validateActiveStatusPayload(req.body);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  if (req.user.organization_id == req.body.organization_id) {
    // It's a suicide attempt.
    return res.status(403).json({
      message: "The root account status can't be changed.",
    });
  }

  try {
    // get the requested Org.
    const foundOrg = await Organization.findById(req.body.organization_id);
    if (!foundOrg || foundOrg.is_deleted) {
      // if no Org. found or the "is_deleted" flag is set to true,
      return res.status(400).json({ message: "No account found" });
    }
    // find and unpdate the organization status
    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.body.organization_id,
      {
        $set: {
          is_active: req.body.is_active,
          updated_at: moment().tz("Etc/UTC"),
        },
      }
    );

    await updatedOrganization.save(); // Save the organization deletion into DB
    if (!req.body.is_active) {
      const foundAssociation = await PlivoRentedNumber.findOne({
        organization_id: req.body.organization_id,
        is_active: true,
      });
      if (foundAssociation && foundAssociation.plivo_number) {
        const now = moment();

        const associatedNumber = await PlivoRentedNumber.findOneAndUpdate(
          { organization_id: req.body.organization_id },
          {
            $set: {
              plivo_number: "",
              is_active: req.body.is_active,
              deactivation_date: now,
              updated_at: moment().tz("Etc/UTC"),
            },
          }
        );

        await associatedNumber.save();
      }
    }

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "Organization",
      module_name: "Organization",
      user_name: req?.user?.username,
      action_taken: "Updated Account Status" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    return res
      .status(200)
      .json({ message: "Account status updated successfully." });
  } catch (err) {
    console.log("Error from deleteOrganization: ", err);

    return res.status(404).json({ message: "Account not found" });
  }
});

// Get the timeZone list
const getAvailableTimeZoneList = asyncHandler(async (req, res) => {
  try {
    const timeZoneList = moment.tz.names();
    return res.status(200).json({
      message: "Timezone List.",
      data: timeZoneList,
    });
  } catch (err) {
    console.log("Error from timeZoneList: ", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

// get zapier API key by organization admin only
const getOrgZapierAPIKey = asyncHandler(async (req, res) => {
  if (!["super_admin", "admin"].includes(req.user.role)) {
    // Only the organization admin is allowed to view its zapier key
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  try {
    // find requested organization
    const foundOrg = await Organization.findById(req.user.organization_id);
    if (!foundOrg) {
      return res.status(404).json({ message: "No account found." });
    }
    // store zapier api key in a constant
    const zapierAPIKey = foundOrg.zapier_api_key;

    return res
      .status(200)
      .json({ message: "Your zapier API key.", api_Key: zapierAPIKey });
  } catch (err) {
    console.log("Error from getOrgZapierAPIKey: ", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});


// View an Organization custom fields
const viewOrganizationCustomField = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  if (
    req.user.role !== "super_admin" &&
    req.user.organization_id !== organizationId
  ) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  // Find the organization by id
  try {

    const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
    const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
    const search = req?.query?.search ? req.query.search : "";
    const organization = await Organization.findById(organizationId);
    const organizationStringifiedData = JSON.stringify(organization);
    const organizationData = JSON.parse(organizationStringifiedData);

    delete organizationData?._id;
    delete organizationData?.createdAt;
    delete organizationData?.updatedAt;
  
    let transformedData = [];

    for (const key in organizationData) {
          transformedData.push({
              custom_name: key,
              Folder: "General",
              custom_key: `{{customField.${key}}}`,
              custom_value: organizationData[key]
          });
    }

    let paginationData;
    let totalPages;
    const totalCount = transformedData?.length;
    const skip = (page - 1) * limit;
    totalPages = Math.ceil(totalCount / limit);
    transformedData = transformedData?.filter(item => item.custom_name.includes(search));

    if(search){

      totalPages = Math.ceil(transformedData?.length / limit);
      paginationData = {
        currentPage: page, // Current page number
        perPage: limit, // Number of items per page
        totalPages: totalPages, // Total number of pages
        totalCount: transformedData?.length, // Total number of items across all pages
      };

    } else {

      paginationData = {
        currentPage: page, // Current page number
        perPage: limit, // Number of items per page
        totalPages: totalPages, // Total number of pages
        totalCount: totalCount, // Total number of items across all pages
      };

    }

    // Simulating skip
    transformedData = transformedData?.slice(skip); // Skips the first 'skip' elements

    // Simulating limit
    transformedData = transformedData?.slice(0, limit); // Limits the array to 'limit' elements

    return res
      .status(200)
      .json({
      message: "Custom Field List",
      data: transformedData,
      paginationData,
    });
  } catch (err) {
    console.log("Error from viewCustomField: ", err);
    return res.status(404).json({ message: "Custom Field not found." });
  }
});

// Create a new Organization
const createOrganizationFromEmr = asyncHandler(async (req, res) => {

  const errorMessage = isInvalidOrganizationPayload(req.body);
 
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const organizationPayload = removeEmptyProperties(req.body);
  const newOrganization = new Organization({
    ...organizationPayload,
  });

  try {
    const savedOrganizations = await newOrganization.save();
    if (savedOrganizations) {
      console.log('before profile save');
            const newBusinessProfileSettings = new BusinessProfileSettings({
              organization_id: savedOrganizations._id,
              is_emr_data: true,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"), 
            });
            await newBusinessProfileSettings.save();  
            console.log('after profile save');
      const zapApiKey = jwt.sign(
        {
          organization_id: savedOrganizations._id,
          organization_name: savedOrganizations.public_name,
        },
        process.env.ZAPIER_JWT_SECRET
      );

      const updatedOrgIngo = await Organization.findByIdAndUpdate(
        savedOrganizations._id,
        {
          $set: {
            zapier_api_key: zapApiKey,
          },
        },
        {
          new: true,
        }
      );

      // sqs Object
      const sqsMessageObject = {
        organization_id: savedOrganizations._id,
        table_name: "Organization",
        module_name: "Organization",
        user_name: "EMR User",
        action_taken: "Account created from EMR" ,
      }

      // push data aws sqs
      pushDataToAwsSqs(sqsMessageObject);

      return res
        .status(201)
        .json({ message: "Organization created", data: updatedOrgIngo });
    }
    return res.status(500).json({ message: "Something went wrong." });
  } catch (err) {
    console.log(err);
    if (err.code === 11000 && err.keyPattern.email === 1) {
      return res.status(400).json({
        message:
          "This business email has already been taken for another organization",
      });
    }
    return res.status(500).json({ message: "Something went wrong." });
  }
});


const updateOrganizationAccessFromEmr = asyncHandler(async (req, res) => {
 
  const emrFacilityId = req.body.emr_facility_id;

  const getFacility = await Organization.find({ emr_facility_id: emrFacilityId });

  if (!getFacility || getFacility.length === 0 || getFacility[0].isDeleted) {
    return createOrganizationFromEmr(req, res);
  }
   
  const facility = getFacility[0];
  const organizationId = getFacility[0]._id;

  const errorMessage = isInvalidOrganizationUpdatePayload(req.body);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const organizationPayload = removeEmptyProperties(req.body);

  try {
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      {
        $set: organizationPayload,
      },
      {
        new: true,
      }
    );
    
    // sqs Object
    const sqsMessageObject = {
      organization_id: updatedOrganization?.organization_id,
      table_name: "Organization",
      module_name: "Organization",
      user_name: "Emr User",
      action_taken: "Updated Account Informations from EMR" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    return res.status(200).json({
      message: "Organization updated successfully.",
      data: updatedOrganization,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "Organization Not Found" });
  }
});


const organizationStatus = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;

  try {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found.",
      });
    }
        
    if (!organization.has_crm_access) {
      return res.status(404).json({
        message: "Organization does not have CRM access",
      });
    }
    return res.status(200).json({
      message: "succees",
    });
     
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "Organization Not Found." });
    }
});

export {
  createOrganization,
  updateOrganization,
  getOrganizationList,
  viewOrganization,
  viewOrganizationFromOtherService,
  deleteOrganization,
  getAvailableTimeZoneList,
  makeOrganizationActiveOrInactive,
  getOrgZapierAPIKey,
  viewOrganizationCustomField,
  createOrganizationFromEmr,
  updateOrganizationAccessFromEmr,
  organizationStatus
};
