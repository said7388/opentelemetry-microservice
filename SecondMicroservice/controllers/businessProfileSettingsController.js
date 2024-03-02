import asyncHandler from "express-async-handler";
import moment from "moment-timezone";
import BusinessProfileSettings from "../models/businessProfileSettingsModel.js";
import Organization from "../models/organizationModel.js";
import { removeObjectIdProperties } from "../utils/businessProfileSettingsUpdatePayload.js";
import { pushDataToAwsSqs } from "../utils/pushDataToAwsSqs.js";
// Add Business Profile Settings
const addBusinessProfileSettings = asyncHandler(async (req, res) => {
  const { voicemail_file_url, the_missed_call_back_text } = req.body;

  const { organization_id } = req.user;
  const organization = await Organization.findById(organization_id);
  if (!organization) {
    // Sending error message if organization is not found
    return res.status(404).json({ message: "Account not found" });
  }

  if (voicemail_file_url) {
    const trimedFileURL = voicemail_file_url.trim();
    if (!trimedFileURL) {
      return res
        .status(400)
        .json({ message: "Voicemail file URL can't be empty." });
    }
  }

  if (the_missed_call_back_text) {
    const trimedCallBackText = the_missed_call_back_text.trim();
    if (!trimedCallBackText) {
      return res
        .status(400)
        .json({ message: "Call Back Text can't be empty." });
    }
  }

  const newSettingsPayload = removeObjectIdProperties(req.body);

  // Creating a new Business Profile Settings instance
  const newBusinessProfileSettings = new BusinessProfileSettings({
    organization_id,
    ...newSettingsPayload,
    created_at: moment().tz("Etc/UTC"),
    updated_at: moment().tz("Etc/UTC"),
  });

  try {
    // Saving Business Profile Settings into DB and sending data back
    const savedBusinessProfileSettings =
      await newBusinessProfileSettings.save();
    res.status(201).json({
      message: "Business profile settings added",
      data: savedBusinessProfileSettings,
    });
  } catch (err) {
    console.log("Error from addBusinessProfileSettings: ", err);
    // if error code is 11000 then a business profile settings for this Org. is already there.
    if (err.code === 11000 && err.keyPattern.organization_id === 1) {
      return res.status(400).json({
        message: "Business profile settings for this account already exists.",
      });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
});

// View Business Profile Settings
const viewBusinessProfileSettings = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  // checking that the user has the right to view the business profile
  if (req.user.organization_id !== organizationId) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  try {
    // Get business profile settings
    const businessProfileSettings = await BusinessProfileSettings.findOne({
      organization_id: organizationId,
    });

    // Sending business profile settings details back
    return res.status(200).json({
      message: "Business profile settings deails",
      data: businessProfileSettings,
    });
  } catch (err) {
    console.log("Error from viewBusinessProfileSettings: ", err);
    // Send error message No business profile settings found
    return res
      .status(404)
      .json({ message: "Business profile settings not found." });
  }
});

// Update Business Profile Settings
const updateBusinessProfileSettings = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  
  // checking that the user has the right to update the business profile
  if (req.user.organization_id !== organizationId) {
    return res
      .status(403)
      .json({ message: "Insufficient rights to access this resource." });
  }

  const { voicemail_file_url, the_missed_call_back_text } = req.body;

  if (voicemail_file_url) {
    const trimedFileURL = voicemail_file_url.trim();
    if (!trimedFileURL) {
      return res
        .status(400)
        .json({ message: "Voicemail file URL can't be empty." });
    }
  }

  if (the_missed_call_back_text) {
    const trimedCallBackText = the_missed_call_back_text.trim();
    if (!trimedCallBackText) {
      return res
        .status(400)
        .json({ message: "Call Back Text can't be empty." });
    }
  }

  const updateSettingsPayload = removeObjectIdProperties(req.body);

  // Update business profile settings
  const updateBusinessProfileSettings =
    await BusinessProfileSettings.findOneAndUpdate(
      {
        organization_id: organizationId,
      },
      {
        ...updateSettingsPayload,
        updated_at: moment().tz("Etc/UTC"),
      },
      {
        new: true,
      }
    );

  try {
    const savedSettings = await updateBusinessProfileSettings.save();

    // sqs Object
    const sqsMessageObject = {
      organization_id: req?.user?.organization_id,
      table_name: "BusinessProfile",
      module_name: "BusinessProfile",
      user_name: req?.user?.username,
      action_taken: "Updated Business Profile Informations" ,
    }

    // push data aws sqs
    pushDataToAwsSqs(sqsMessageObject);
    
    res.status(200).json({
      message: "Business profile settings updated",
      data: savedSettings,
    });
  } catch (err) {
    console.log("Error from updateBusinessProfileSettings: ", err);
    res.status(404).json({ message: "Business profile settings not found" });
  }
});

export {
  addBusinessProfileSettings,
  viewBusinessProfileSettings,
  updateBusinessProfileSettings,
};
