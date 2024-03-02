import mongoose from "mongoose";


const customValueSchema = new mongoose.Schema(
    {
    organization_id: {
      type: String,
      required: true,
    },
    custom_name: {
      type: String,
      required: true,
    },
    custom_key: {
      type: String,
      required: true,
    },
    custom_value: {
      type: String,
      required: true,
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


customValueSchema.methods.toJSON = function () {
  const customValueObject = this.toObject();
  delete customValueObject.isDeleted;
  return customValueObject;
};


const CustomValue = mongoose.model("customValues", customValueSchema);


export default CustomValue;