// Validate Email
export function validateEmail(email) {
  // Regular expression pattern for a basic email format
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Check if the email matches the pattern
  return emailPattern.test(email);
}

export const isInvalidOrganizationPayload = (organizationPayload) => {
  const trimedPublicName = organizationPayload?.public_name?.trim() || null;
  const trimedPhone = organizationPayload?.phone?.trim() || null;
  const trimedStreetAddress =
    organizationPayload?.street_address?.trim() || null;
  const trimedState = organizationPayload?.state?.trim() || null;
  const trimedCity = organizationPayload?.city?.trim() || null;
  const trimedZipCode = organizationPayload?.zip_code?.trim() || null;
  const trimedCountry = organizationPayload?.country?.trim() || null;
  const trimedTimeZone = organizationPayload?.timezone?.trim() || null;

  if (!trimedPublicName) {
    return "Public name is required.";
  }
  if (organizationPayload.legal_name) {
    const trimedLegalName = organizationPayload.legal_name.trim();
    if (!trimedLegalName) {
      return "Legal name can't be empty.";
    }
  }
  if (!validateEmail(organizationPayload?.email)) {
    return "The provided business email address is not valid.";
  }
  if (!trimedPhone) {
    return "Business phone number is required.";
  }
  if (!trimedStreetAddress) {
    return "Street address is required.";
  }
  if (!trimedState) {
    return "State is required.";
  }
  if (!trimedCity) {
    return "City is required.";
  }
  if (!trimedZipCode) {
    return "Zip code is required.";
  }
  if (!trimedCountry) {
    return "Country is required.";
  }
  if (!trimedTimeZone) {
    return "Time-zone is required.";
  }

  return null;
};

// Remove All Empty Properties
export const removeEmptyProperties = (obj) => {
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
