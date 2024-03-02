export const isInvalidPlivoRentedNumber = (payload) => {
  const trimmedOrgId = payload.organization_id
    ? payload.organization_id.trim()
    : null;
  const trimmedPlivoNumber = payload.number ? payload.number.trim() : null;
  if (!trimmedOrgId) {
    return "Organization Id is required.";
  }

  if (!trimmedPlivoNumber) {
    return "Number is required";
  }

  return null;
};

// Convert Input number Or return the default
export function convertInputNumberOrDefault(input, defaultValue) {
  const parsedNumber = parseInt(input, 10); // Parse the input to an integer

  // Check if the parsedNumber is a valid integer and not NaN
  if (
    !isNaN(parsedNumber) &&
    Number.isInteger(parsedNumber) &&
    parsedNumber > 0
  ) {
    return parsedNumber; // Return the validated integer
  } else {
    return defaultValue; // Return the default value if input is invalid
  }
}

export const generateAssociatedNumbersFilterQueries = (req) => {
  const filters = {};

  for (let key in req.query) {
    if (
      key === "page" ||
      key === "limit" ||
      key === "sort_by" ||
      key === "search" ||
      key === "is_deleted" ||
      key === "activation_date" ||
      key === "is_active" ||
      key === "deactivation_date" ||
      key === "organization_id"
    ) {
      continue;
    } else if (key === "activation_date" || key === "deactivation_date") {
      filters[key] = { $lte: new Date(req.query[key]) };
    } else {
      filters[key] = { $regex: req.query[key], $options: "i" };
    }
  }
  if (req.query.is_active) {
    filters.is_active = req.query.is_active;
  }
  if (req.query.organization_id) {
    filters.organization_id = req.query.organization_id;
  }

  filters.is_deleted = req.query.is_deleted ? req.query.is_deleted : false;

  return filters;
};

// Function to find numbers in availableNumbers that don't match any number in associatedNumbers
export function findDissociatedPlivoNumbers(
  associatedNumbers,
  availableNumbers
) {
  return availableNumbers.filter(
    (availableNumber) =>
      !associatedNumbers.some(
        (associatedNumber) =>
          associatedNumber.plivo_number === availableNumber.number
      )
  );
}
