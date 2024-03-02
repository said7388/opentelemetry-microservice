import express from "express";
import {
  createOrganization,
  deleteOrganization,
  getAvailableTimeZoneList,
  getOrgZapierAPIKey,
  getOrganizationList,
  makeOrganizationActiveOrInactive,
  updateOrganization,
  viewOrganization,
  viewOrganizationFromOtherService,
  viewOrganizationCustomField,
  createOrganizationFromEmr,
  updateOrganizationAccessFromEmr,
  organizationStatus,
} from "../controllers/organizationController.js";
import {
  addBusinessProfileSettings,
  updateBusinessProfileSettings,
  viewBusinessProfileSettings,
} from "../controllers/businessProfileSettingsController.js";
import {
  identifyRequestUser,
  identifyRequestUserForBusinessProfileSettings,
  identifyRequestUserForSetting,
  verifyAuthenticService,
  verifyAuthenticEmrUser,
} from "../middleware/authentication.js";
import {
  addPlivoRentedNumber,
  deleteAssociatedNumber,
  updatePlivoRentedNumber,
  viewOwnOrgRentedPhoneNumber,
  getAssociatedNumberList,
  getDissociatedNumberList,
} from "../controllers/plivoRentedNumberController.js";

import {
  addIndividualTag,
  viewTag,
  updateIndividualTag,
  getTagList,
  deleteTag
} from "../controllers/tagController.js";

import {
  addIndividualCustomValue,
  viewCustomValue,
  updateIndividualCustomValue,
  getCustomValueList,
  deleteCustomValue
} from "../controllers/customValueController.js";

const router = express.Router();

router.route("/organization/createOrganizationFromEmr").post(verifyAuthenticEmrUser, createOrganizationFromEmr);
router.route("/organization/updateOrganizationAccessFromEmr").post(verifyAuthenticEmrUser, updateOrganizationAccessFromEmr);  
router.route("/organizationStatus/:organizationId").get(organizationStatus); 

router
  .route("/business-profile-settings")
  .post(
    identifyRequestUserForBusinessProfileSettings,
    addBusinessProfileSettings
  );
router
  .route("/business-profile-settings/:organizationId")
  .put(
    identifyRequestUserForBusinessProfileSettings,
    updateBusinessProfileSettings
  );
router
  .route("/business-profile-settings/:organizationId")
  .get(
    identifyRequestUserForBusinessProfileSettings,
    viewBusinessProfileSettings
  );
router.route("/organization").post(identifyRequestUser, createOrganization);
router
  .route("/organization/zapier-api-key")
  .get(identifyRequestUser, getOrgZapierAPIKey);
// For interal organization service & zapier only
router
  .route("/organization/itself")
  .get(verifyAuthenticService, viewOrganizationFromOtherService);

// Add Plivo rented number to an organization
router
  .route("/organization/add-associated-number")
  .post(identifyRequestUser, addPlivoRentedNumber);

// Update Plivo rented number to an organization
router
  .route("/organization/update-associated-number")
  .put(identifyRequestUser, updatePlivoRentedNumber);

// View own rented number
router
  .route("/organization/my-associated-number")
  .get(identifyRequestUser, viewOwnOrgRentedPhoneNumber);

// Delete Associated number
router
  .route("/organization/delete-associated-number/:associatedNumberId")
  .delete(identifyRequestUser, deleteAssociatedNumber);

router
  .route("/organization/associated-numbers")
  .get(identifyRequestUser, getAssociatedNumberList);

router
  .route("/organization/dissociated-numbers")
  .get(identifyRequestUser, getDissociatedNumberList);

// Available Time Zone List
router.route("/organization/time-zone-list").get(getAvailableTimeZoneList);
// update org status
router
  .route("/organization/status-update")
  .put(identifyRequestUser, makeOrganizationActiveOrInactive);

router
  .route("/organization/:organizationId")
  .put(identifyRequestUser, updateOrganization);
router
  .route("/organization/:organizationId")
  .delete(identifyRequestUser, deleteOrganization);
router
  .route("/organization/:organizationId")
  .get(identifyRequestUser, viewOrganization);

router.route("/organization").get(identifyRequestUser, getOrganizationList);

// For tag related api under organization
router.route("/settings/addTag").post(identifyRequestUserForSetting, addIndividualTag);
router
  .route("/settings/getTag")
  .get(identifyRequestUserForSetting, getTagList);
router
  .route("/settings/tag/:tagId")
  .put(identifyRequestUserForSetting, updateIndividualTag);
router
.route("/settings/tag/:tagId")
.get(identifyRequestUserForSetting, viewTag);
router
  .route("/settings/tag/:tagId")
  .delete(identifyRequestUserForSetting, deleteTag);

// For custom values under organization
router.route("/settings/addCustomValue").post(identifyRequestUserForSetting, addIndividualCustomValue);
router
  .route("/settings/getCustomValue")
  .get(identifyRequestUserForSetting, getCustomValueList);
router
  .route("/settings/CustomValue/:customValueId")
  .get(identifyRequestUserForSetting, viewCustomValue);
router
  .route("/settings/CustomValue/:customValueId")
  .put(identifyRequestUserForSetting, updateIndividualCustomValue);
router
  .route("/settings/CustomValue/:customValueId")
  .delete(identifyRequestUserForSetting, deleteCustomValue);

router
.route("/settings/customfield/:organizationId")
.get(identifyRequestUserForSetting, viewOrganizationCustomField);

export default router;
