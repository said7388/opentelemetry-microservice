import asyncHandler from "express-async-handler";
import Tag from "../models/tagModel.js";
import { isInvalidTagPayload } from "../utils/createTagValidator.js";
import { removeEmptyStringProperties } from "../utils/removeEmptyStringProperties.js";
import { generateOrganizationFilters } from "../utils/generateFilters.js";
import { pushDataToAwsSqs } from "../utils/pushDataToAwsSqs.js";
// List of tags
const getTagList = asyncHandler(async (req, res) => {
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
    const query = Tag.find({
      $and: [
        {
          $or: [
            { tag_name: { $regex: regex } },
          ],
        },
        filters,
        { organization_id: organizationId },
      ],
    })
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    // execute tag Query
    const tags = await query.exec();

    // Getting the Total Document Count
    const totalCount = await Tag.countDocuments(query.getFilter());

    const totalPages = Math.ceil(totalCount / limit);
    const paginationData = {
      currentPage: page, // Current page number
      perPage: limit, // Number of items per page
      totalPages: totalPages, // Total number of pages
      totalCount: totalCount, // Total number of items across all pages
    };
    res.status(200).json({
      message: "Tag list",
      data: tags,
      paginationData,
    });
  } catch (err) {
    console.log("Error from getTagList: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});


// Add Individual tag
const addIndividualTag = asyncHandler(async (req, res) => {
  // Check if any empty value is passed in
  const errorMessage = isInvalidTagPayload(req.body);

  if (errorMessage) {
    // if so, send the error message with 400
    return res.status(400).json({ message: errorMessage });
  }

//   // Remove empty string values from the payload
  const tagPayload = removeEmptyStringProperties(req.body);

  // Creating a new Tag instance
  const newTag = new Tag({
    ...tagPayload,
    organization_id: req.user.organization_id, // getting the organization from the request user
  });

  try {
    // Saving tag into DB and sending tag data back
    const savedTag = await newTag.save();

    // sqs Object
    const sqsMessageObject = {
      organization_id: savedTag?.organization_id,
      table_name: "Tag",
      module_name: "Tag",
      user_name: req?.user?.username,
      action_taken: "Created Tag" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    res.status(201).json({ message: "Tag created", data: savedTag });
  } catch (err) {
    console.log("Error from addIndividualTag: ", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});


// Delete A Tag
const deleteTag = asyncHandler(async (req, res) => {
  const tagId = req.params.tagId;

  try {
    // Search for requested tag
    const foundTag = await Tag.findById(tagId);
    if (!foundTag) {
      // if no tag found
      return res.status(404).json({ message: "Tag Not Found" });
    }

    if (foundTag.organization_id != req.user.organization_id) {
      // if A delete request is made for different organization's tag
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }

    if (foundTag.is_deleted) {
      // if tag is already deleted
      return res.status(400).json({ message: "Tag is already deleted." });
    }
    // find and delete the tag
    const deletedTag = await Tag.findByIdAndUpdate(tagId, {
      $set: {
        is_deleted: true,
      },
    });

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "Tag",
      module_name: "Tag",
      user_name: req?.user?.username,
      action_taken: "Deleted Tag" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    await deletedTag.save(); // Save the tag deletion into DB

    return res
      .status(200)
      .json({ message: "Tag is deleted successfully." });
  } catch (err) {
    console.log("Error from deleteTag: ", err);
    return res.status(404).json({ message: "Tag Not Found" });
  }
});


// Update individual tag
const updateIndividualTag = asyncHandler(async (req, res) => {
  const tagId = req.params.tagId;

  try {
    // Search for requested tag
    const foundTag = await Tag.findById(tagId);

    if (!foundTag) {
      // if no tag found
      return res.status(404).json({ message: "Tag Not Found" });
    }

    if (foundTag.organization_id != req.user.organization_id) {
      // if A update request is made for different organization's tag
      return res
        .status(403)
        .json({ message: "Insufficient rights to access this resource." });
    }
    // Check if any empty value is passed in
    const errorMessage = isInvalidTagPayload(req.body);

    if (errorMessage) {
      // If so, send the error message with 400
      return res.status(400).json({ message: errorMessage });
    }

    // Remove empty string values from the payload
    const tagPayload = removeEmptyStringProperties(req.body);

    // Update the found tag with the new payload
    const updatedTag = await Tag.findByIdAndUpdate(
      tagId,
      tagPayload,
      { new: true }
    );

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "Tag",
      module_name: "Tag",
      user_name: req?.user?.username,
      action_taken: "Updated Tag" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);

    res.status(200).json({ message: "Tag updated", data: updatedTag });
  } catch (err) {
    console.error("Error from updateIndividualTag: ", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// View an tag
const viewTag = asyncHandler(async (req, res) => {
  const tagId = req.params.tagId;
  if (
    req.user.role === "super_admin"
  ) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }
  // Find the tag by id
  try {
    const tag = await Tag.findById(tagId);

    return res
      .status(200)
      .json({ message: "Tag Deails", data: tag });
  } catch (err) {
    console.log("Error from viewTag: ", err);
    return res.status(404).json({ message: "Tag not found." });
  }
});

export {
  addIndividualTag,
  viewTag,
  updateIndividualTag,
  getTagList,
  deleteTag,
};
