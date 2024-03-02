import mongoose, { Schema } from "mongoose";

const plivoRentedNumbersSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "organizations",
      required: true,
    },
    plivo_number: {
      type: String,
      required: true,
    },
    activation_date: {
      type: Date,
      required: true,
    },
    number_type: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    deactivation_date: {
      type: Date,
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
    timestamps: true,
    versionKey: false,
  }
);

// Define a compound unique index for organization_id, isActive, and isDeleted
// Compound Index and Unique Validation
plivoRentedNumbersSchema.index(
  {
    organization_id: 1,
    plivo_number: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      is_active: true,
      is_deleted: false,
    },
  }
);

// creates a virtual representation of organization
plivoRentedNumbersSchema.virtual("org_details", {
  ref: "organizations",
  localField: "organization_id",
  foreignField: "_id",
});
// removes is_deleted property
plivoRentedNumbersSchema.methods.toJSON = function () {
  const plivoRentedNumbersObject = this.toObject();
  delete plivoRentedNumbersObject.is_deleted;
  return plivoRentedNumbersObject;
};

const PlivoRentedNumber = mongoose.model(
  "plivo_rented_numbers",
  plivoRentedNumbersSchema
);

export default PlivoRentedNumber;
