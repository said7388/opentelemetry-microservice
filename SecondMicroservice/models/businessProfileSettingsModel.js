import mongoose from "mongoose";
import { Schema } from "mongoose";

const businessProfileSettingsSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "organizations",
      required: true,
      unique: true,
    },
    allow_duplicate_contact: {
      type: Boolean,
      default: false,
    },
    disable_contact_timezone: {
      type: Boolean,
      default: false,
    },
    allow_duplicate_opportunity: {
      type: Boolean,
      default: false,
    },
    mark_emails_as_invalid_due_to_hard_bounce: {
      type: Boolean,
      default: false,
    },
    validate_phone_number_when_first_sms_is_sent_to_a_new_contact: {
      type: Boolean,
      default: false,
    },
    enable_campaign: {
      type: Boolean,
      default: false,
    },
    enable_triggers: {
      type: Boolean,
      default: false,
    },
    incoming_call_timeout: {
      type: Number,
      default: 10,
    },
    voicemail_file_url: {
      type: String,
    },
    enable_missed_call_text_back: {
      type: Boolean,
      default: false,
    },
    the_missed_call_back_text: {
      type: String,
    },
    is_emr_data: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

const BusinessProfileSettings = mongoose.model(
  "business_profile_settings",
  businessProfileSettingsSchema
);

export default BusinessProfileSettings;
