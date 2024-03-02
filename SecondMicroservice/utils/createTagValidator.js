export const isInvalidTagPayload = (tagPayload) => {
  if (tagPayload.tag_name) {
    const tag_name = tagPayload.tag_name.trim();
    if (!tag_name) return "Tag Name cann't be empty.";
  }

  if (tagPayload.is_active) {
    if (typeof tagPayload.is_active !== 'boolean') return "IsActive should be boolean.";
  }

  return null;
};

// Remove All Empty Properties
export const removeEmptyStringProperties = (obj) => {
  for (let key in obj) {
    if (
      obj.hasOwnProperty(key) &&
      typeof obj[key] === "string" &&
      obj[key].trim() === ""
    ) {
      delete obj[key];
    }
  }
  return obj;
};