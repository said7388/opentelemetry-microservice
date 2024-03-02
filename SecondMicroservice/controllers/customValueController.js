import asyncHandler from "express-async-handler";
import CustomValue from "../models/customValueModel.js";
import { isInvalidCustomValuePayload } from "../utils/createCustomValueValidator.js";
import { removeEmptyStringProperties } from "../utils/removeEmptyStringProperties.js";
import { generateOrganizationFilters } from "../utils/generateFilters.js";
import { pushDataToAwsSqs } from "../utils/pushDataToAwsSqs.js";

// List of Custom Values
const getCustomValueList = asyncHandler(async (req, res) => {
  const page = req?.query?.page ? Number(req.query.page) : 1; // Page number (starting from 1)
  const limit = req?.query?.limit ? Number(req.query.limit) : 10; // Number of documents per page
  const sortBy = req?.query?.sortBy ? req.query.sortBy : "-createdAt"; // by default Created At descending order.
  const search = req?.query?.search ? req.query.search : "";
  const organizationId = req?.query?.organizationId ? req.query.organizationId : "";
  const filters = generateOrganizationFilters(req);
  // Create a regular expression for wildcard search
  const regex = new RegExp(`.*${search}.*`, "i"); // "i" for case-insensitive search


  // Calculate the skip value based on the page size and number
  const skip = (page - 1) * limit;

  if (
    req.user.organization_id !== organizationId
  ) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  try {
    const query = CustomValue.find({
      $and: [
        {
          $or: [
            { custom_name: { $regex: regex } },
          ],
        },
        { organization_id: organizationId },
        filters,
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);


    // execute custom value Query
    const customValues = await query.exec();
    // Getting the Total Document Count
    const totalCount = await CustomValue.countDocuments(query.getFilter());


    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "Custom Value list",
      data: customValues,
      paginationData,
    });
  } catch (err) {
    console.log("Error from getCustomValueList: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});




// Add Individual custom value
const addIndividualCustomValue = asyncHandler(async (req, res) => {
  // Check if any empty value is passed in
  const errorMessage = isInvalidCustomValuePayload(req.body);


  if (errorMessage) {
    // if so, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }


  // Remove empty string values from the payload
  const customValuePayload = removeEmptyStringProperties(req.body);


  // Creating a new Custom Value instance
  const newCustomValue = new CustomValue({
    ...customValuePayload,
    organization_id: req.user.organization_id, // getting the organization from the request user
  });


  try {
    // Saving custom value into DB and sending custom value data back
    const savedCustomValue = await newCustomValue.save();

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "CustomValue",
      module_name: "CustomValue",
      user_name: req?.user?.username,
      action_taken: "Created CustomValue" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);
    
    res.status(201).json({ message: "Custom Value created", data: savedCustomValue });
  } catch (err) {
    console.log("Error from addIndividualCustomValue: ", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});




// Delete A Custom Value
const deleteCustomValue = asyncHandler(async (req, res) => {
  const customValueId = req.params.customValueId;


  try {
    // Search for requested custom value
    const foundCustomValue = await CustomValue.findById(customValueId);
    if (!foundCustomValue) {
      // if no custom value found
      return res.status(404).json({ message: "Custom Value Not Found" });
    }


    if (foundCustomValue.organization_id != req.user.organization_id) {
      // if A delete request is made for different organization's custom value
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }


    if (foundCustomValue.is_deleted) {
      // if custom value is already deleted
      return res.status(400).json({ message: "Custom Value is already deleted." });
    }
    // find and delete the custom value
    const deletedCustomValue = await CustomValue.findByIdAndUpdate(customValueId, {
      $set: {
        is_deleted: true,
      },
    });

    // sqs Object
    const sqsMessageObject = {
    organization_id: req?.user?.organization_id,
    table_name: "CustomValue",
    module_name: "CustomValue",
    user_name: req?.user?.username,
    action_taken: "Deleted CustomValue" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);


    await deletedCustomValue.save(); // Save the custom value deletion into DB


    return res
      .status(200)
      .json({ message: "Custom Value is deleted successfully." });
  } catch (err) {
    console.log("Error from deleteCustomValue: ", err);
    return res.status(404).json({ message: "CustomValue Not Found" });
  }
});




// Update individual custom value
const updateIndividualCustomValue = asyncHandler(async (req, res) => {
  const customValueId = req.params.customValueId;


  try {
    // Search for requested custom value
    const foundCustomValue = await CustomValue.findById(customValueId);


    if (!foundCustomValue) {
      // if no custom value found
      return res.status(404).json({ message: "CustomValue Not Found" });
    }


    if (foundCustomValue.organization_id != req.user.organization_id) {
      // if A update request is made for different organization's custom value
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }
    // Check if any empty value is passed in
    const errorMessage = isInvalidCustomValuePayload(req.body);


    if (errorMessage) {
      // If so, send the error message with 400
      return res.status(400).json({ message: errorMessage });
    }


    // Remove empty string values from the payload
    const customValuePayload = removeEmptyStringProperties(req.body);


    // Update the found custom value with the new payload
    const updatedCustomValue = await CustomValue.findByIdAndUpdate(
      customValueId,
      customValuePayload,
      { new: true }
    );

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "CustomValue",
      module_name: "CustomValue",
      user_name: req?.user?.username,
      action_taken: "Updated CustomValue" ,
    }
  
    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);


    res.status(200).json({ message: "Custom Value updated", data: updatedCustomValue });
  } catch (err) {
    console.error("Error from updateIndividualCustomValue: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// View an custom value
const viewCustomValue = asyncHandler(async (req, res) => {
  const customValueId = req.params.customValueId;
  if (
    req.user.role === "super_admin"
  ) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  // Find the custom value by id
  try {
    const customValue = await CustomValue.findById(customValueId);

    return res
      .status(200)
      .json({ message: "CustomValue Deails", data: customValue });
  } catch (err) {
    console.log("Error from CustomValue: ", err);
    return res.status(404).json({ message: "CustomValue not found." });
  }
});


export {
  addIndividualCustomValue,
  viewCustomValue,
  updateIndividualCustomValue,
  getCustomValueList,
  deleteCustomValue,
};
