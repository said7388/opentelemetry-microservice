import { validateEmail } from "./createOrganizationValidator.js";
import moment from "moment-timezone";
export const isInvalidOrganizationUpdatePayload = (organizationPayload) => {
  if (organizationPayload.public_name) {
    const trimedPublicName = organizationPayload.public_name.trim();
    if (!trimedPublicName) {
      return "Public business name can't be empty.";
    }
  }

  if (organizationPayload.legal_name) {
    const trimedLegalName = organizationPayload.legal_name.trim();
    if (!trimedLegalName) {
      return "Legal business name can't be empty.";
    }
  }

  if (organizationPayload.email && !validateEmail(organizationPayload.email)) {
    return "The provided business email address is not valid.";
  }

  if (organizationPayload.phone) {
    const trimedPhone = organizationPayload.phone.trim();
    if (!trimedPhone) {
      return "Phone number can't be empty.";
    }
  }

  if (organizationPayload.street_address) {
    const trimedStreetAddress = organizationPayload.street_address.trim();
    if (!trimedStreetAddress) {
      return "Street address can't be empty.";
    }
  }

  if (organizationPayload.state) {
    const trimedState = organizationPayload.state.trim();
    if (!trimedState) {
      return "State can't be empty.";
    }
  }

  if (organizationPayload.city) {
    const trimedCity = organizationPayload.city.trim();
    if (!trimedCity) {
      return "City can't be empty.";
    }
  }

  if (organizationPayload.zip_code) {
    const trimedZipCode = organizationPayload.zip_code.trim();
    if (!trimedZipCode) {
      return "Zip code can't be empty.";
    }
  }

  if (organizationPayload.country) {
    const trimedCountry = organizationPayload.country.trim();
    if (!trimedCountry) {
      return "Country can't be empty.";
    }
  }

  if (organizationPayload.timezone) {
    const trimedTimeZone = organizationPayload.timezone.trim();
    if (!trimedTimeZone) {
      return "Time zone can't be empty.";
    }
  }
  if (organizationPayload.logo_url) {
    const trimedLogoUrl = organizationPayload.logo_url.trim();
    if (!trimedLogoUrl) {
      return "Logo URL can't be empty.";
    }
  }

  if (organizationPayload.niche) {
    const trimedNiche = organizationPayload.niche.trim();
    if (!trimedNiche) {
      return "Business niche can't be empty.";
    }
  }
  if (organizationPayload.language) {
    const trimedLanguage = organizationPayload.language.trim();
    if (!trimedLanguage) {
      return "Language can't be empty.";
    }
  }
  if (organizationPayload.authorised_person_first_name) {
    const trimedAuthorisedPersonFirstName =
      organizationPayload.authorised_person_first_name.trim();
    if (!trimedAuthorisedPersonFirstName) {
      return "Authorised person first name can't be empty.";
    }
  }
  if (organizationPayload.authorised_person_last_name) {
    const trimedAuthorisedPersonLastName =
      organizationPayload.authorised_person_last_name.trim();
    if (!trimedAuthorisedPersonLastName) {
      return "Authorised person last name can't be empty.";
    }
  }
  if (organizationPayload.authorised_person_email) {
    const trimedAuthorisedPersonEmail =
      organizationPayload.authorised_person_email.trim();
    if (!trimedAuthorisedPersonEmail) {
      return "Authorised person email can't be empty.";
    }
  }
  if (organizationPayload.authorised_person_phone) {
    const trimedAuthorisedPersonPhone =
      organizationPayload.authorised_person_phone.trim();
    if (!trimedAuthorisedPersonPhone) {
      return "Authorised person phone number can't be empty.";
    }
  }
  if (organizationPayload.authorised_person_job_position) {
    const trimedAuthorisedPersonJobPosition =
      organizationPayload.authorised_person_job_position.trim();
    if (!trimedAuthorisedPersonJobPosition) {
      return "Authorised person job position can't be empty.";
    }
  }
  if (organizationPayload.fax) {
    const trimedFax = organizationPayload.fax.trim();
    if (!trimedFax) {
      return "Fax number can't be empty.";
    }
  }
  if (organizationPayload.website) {
    const trimedWebsite = organizationPayload.website.trim();
    if (!trimedWebsite) {
      return "Website address can't be empty.";
    }
  }

  if (organizationPayload.zapier_api_key) {
    return "Updates to the Zapier API-Key are not permitted.";
  }

  if (organizationPayload.twillio_api_key) {
    const trimedTwillioAPIKey = organizationPayload.twillio_api_key.trim();
    if (!trimedTwillioAPIKey) {
      return "Twillio API-Key can't be empty.";
    }
  }
  return null;
};

export const validateActiveStatusPayload = (activeStatusPayload) => {
  const trimmedOrgId = activeStatusPayload.organization_id
    ? activeStatusPayload.organization_id.trim()
    : null;
  if (!trimmedOrgId) {
    return "Organization Id is required.";
  }
  if (
    !activeStatusPayload.hasOwnProperty("is_active") ||
    typeof activeStatusPayload.is_active !== "boolean"
  ) {
    return "Invalid value of 'is_active'. Must be a boolean";
  }

  return null;
};

export const formateUpdateOrgPayloadForDb = (orgPayload) => {
  return {
    public_name: orgPayload.public_name ? orgPayload.public_name : undefined,
    legal_name: orgPayload.legal_name ? orgPayload.legal_name : undefined,
    email: orgPayload.email ? orgPayload.email : undefined,
    logo_url: orgPayload.logo_url ? orgPayload.logo_url : undefined,
    phone: orgPayload.phone ? orgPayload.phone : undefined,
    niche: orgPayload.niche ? orgPayload.niche : undefined,
    street_address: orgPayload.street_address
      ? orgPayload.street_address
      : undefined,
    state: orgPayload.state ? orgPayload.state : undefined,
    city: orgPayload.city ? orgPayload.city : undefined,
    zip_code: orgPayload.zip_code ? orgPayload.zip_code : undefined,
    country: orgPayload.country ? orgPayload.country : undefined,
    timezone: orgPayload.timezone ? orgPayload.timezone : undefined,
    language: orgPayload.language ? orgPayload.language : undefined,
    authorised_person_first_name: orgPayload.authorised_person_first_name
      ? orgPayload.authorised_person_first_name
      : undefined,
    authorised_person_last_name: orgPayload.authorised_person_last_name
      ? orgPayload.authorised_person_last_name
      : undefined,
    authorised_person_email: orgPayload.authorised_person_email
      ? orgPayload.authorised_person_email
      : undefined,
    authorised_person_phone: orgPayload.authorised_person_phone
      ? orgPayload.authorised_person_phone
      : undefined,
    authorised_person_job_position: orgPayload.authorised_person_job_position
      ? orgPayload.authorised_person_job_position
      : undefined,
    fax: orgPayload.fax ? orgPayload.fax : undefined,
    website: orgPayload.website ? orgPayload.website : undefined,
    updated_at: moment().tz("Etc/UTC"),
  };
};
