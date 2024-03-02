export const generateOrganizationFilters = (req) => {
  const filters = {};

  for (let key in req.query) {
    if (
      key === "page" ||
      key === "limit" ||
      key === "is_deleted" ||
      key === "sort_by" ||
      key === "search" ||
      key === "organizationId" ||
      key === "is_active"
    ) {
      continue;
    } else {
      filters[key] = { $regex: req.query[key], $options: "i" };
    }
  }

  filters.is_deleted = req.query.is_deleted ? req.query.is_deleted : false;
  filters.is_active = req.query.is_active ? req.query.is_active : true;

  return filters;
};
