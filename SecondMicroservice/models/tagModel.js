import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
    organization_id: {
      type: String,
      required: true,
    },
    tag_name: {
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

tagSchema.methods.toJSON = function () {
  const tagObject = this.toObject();
  delete tagObject.isDeleted;
  return tagObject;
};

const Tag = mongoose.model("tags", tagSchema);

export default Tag;