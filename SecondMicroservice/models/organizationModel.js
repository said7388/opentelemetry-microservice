import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    public_name: {
      type: String,
      required: true,
    },
    legal_name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    logo_url: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    niche: {
      type: String,
    },
    street_address: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    zip_code: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    language: {
      type: String,
    },
    authorised_person_first_name: {
      type: String,
    },
    authorised_person_last_name: {
      type: String,
    },
    authorised_person_email: {
      type: String,
    },
    authorised_person_phone: {
      type: String,
    },
    authorised_person_job_position: {
      type: String,
    },
    fax: {
      type: String,
    },
    website: {
      type: String,
    },
    zapier_api_key: {
      type: String,
    },
    twillio_api_key: {
      type: String,
    },
    is_emr_data: {
      type: Boolean,
      default: false,
    },
    emr_facility_id: {
      type: Number,
      default: null
    },
    has_crm_access: {
      type: Boolean,
      default: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

organizationSchema.methods.toJSON = function () {
  const organizationObject = this.toObject();
  delete organizationObject.is_deleted;
  delete organizationObject.zapier_api_key;
  return organizationObject;
};

const Organization = mongoose.model("organizations", organizationSchema);

export default Organization;
