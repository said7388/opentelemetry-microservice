// Remove All Empty Properties
export const removeObjectIdProperties = (obj) => {
  for (let key in obj) {
    if (key === "organization_id") {
      delete obj[key];
    }
  }
  return obj;
};
