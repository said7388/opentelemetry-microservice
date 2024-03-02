import axios from "axios";
import jwt, { decode } from "jsonwebtoken";
import qs from "qs";
import dotEnv from "dotenv";
import { scopeMaps } from "../config/userPermissions.js";

dotEnv.config(); // allow .env file to load
// Hydra endpoint
const hydraServerEndpoint =
  process.env.HYDRA_ADMIN_URL + "/admin/oauth2/introspect";
// User permission endpoint
const getUserPermissionEndpoint = (username) =>
  process.env.AUTH_SERVICE_BASE_URL + `/api/user/permission/${username}`;

async function verifyAuthenticUser(req, res, next, scope) {
  const token = req.headers["authorization"];
  let tokenWithoutBearer = null;
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }
  if (token && token.startsWith("Bearer ")) {
    // Remove the "Bearer " keyword and extract the token
    tokenWithoutBearer = token.split(" ")[1];
  }

  const hydraPayload = {
    token: tokenWithoutBearer,
  };

  // Convert the object to x-www-form-urlencoded format
  const xWwwFormUrlencoded = qs.stringify(hydraPayload);
  try {
    // get Response from Hydra
    const hydraResponse = await axios.post(
      hydraServerEndpoint,
      xWwwFormUrlencoded,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // if hydra denied for requested scope
    if (!hydraResponse.data.active) {
      return res.status(401).json({ message: "Permission denied" });
    }

    // Search for user N permission data
    const resData = await axios.get(
      getUserPermissionEndpoint(hydraResponse.data.sub),
      {
        headers: {
          Authorization: token,
        },
      }
    );

    const { data: permission } = resData?.data;

    if (!permission || !permission?.permissions?.includes(scope)) {
      return res.status(401).json({ message: "Permission Denied" });
    }

    req.user = {
      id: permission.user_id,
      organization_id: permission.organization_id,
      username: permission.username,
      role: permission.role,
      permissions: permission.permissions,
    };
    next();
  } catch (err) {
    console.log("Error from verifyAuthenticUser: ", err);
    return res.status(401).json({ message: "Permission Denied" });
  }
}
// For internal service & zapier Only
export async function verifyAuthenticService(req, res, next) {
  // store authorization Token
  const token = req.headers["authorization"];
  let zapierTokenWithoutBearer = null;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token missing", org: null });
  }

  if (token && token.startsWith("Bearer ")) {
    // Remove the "Bearer " keyword and extract the token
    zapierTokenWithoutBearer = token.split(" ")[1];
  }

  try {
    // Verify Token validity
    jwt.verify(
      zapierTokenWithoutBearer,
      process.env.ZAPIER_JWT_SECRET,
      (err, orgData) => {
        if (err) {
          // if the token is invalid
          return res.status(403).json({ message: "Invalid Token", org: null });
        }
        // console.log(orgData)
        // set the req user data
        req.user = orgData;
        return next();
      }
    );
  } catch (err) {
    console.log("Error from verifyAuthenticUser: ", err);
    return res.status(401).json({ message: "Permission Denied", org: null });
  }
}

// Has permission on business-profile-settings
export const identifyRequestUserForBusinessProfileSettings = (
  req,
  res,
  next
) => {
  const scope = scopeMaps["/business-profile-settings"];
  return verifyAuthenticUser(req, res, next, scope);
};

// has permission to access organization
export const identifyRequestUser = (req, res, next) => {
  const scope = scopeMaps["/organization"];

  return verifyAuthenticUser(req, res, next, scope);
};


// has permission to access organization user setting
export const identifyRequestUserForSetting = (req, res, next) => {
  const scope = scopeMaps["/settings"];

  return verifyAuthenticUser(req, res, next, scope);
};
export async function verifyAuthenticEmrUser(req, res, next) {
 
  const token = req.headers["authorization"];

  let zapierTokenWithoutBearer = null;
  
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token missing", org: null });
  }

  if (token && token.startsWith("Bearer ")) {
    zapierTokenWithoutBearer = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(zapierTokenWithoutBearer, process.env.ZAPIER_JWT_SECRET);
 
    if (!decoded) {
      return res.status(403).json({ message: "Invalid Token", org: null });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    console.log("Error from verifyAuthenticEmrUser: ", err);
    return res.status(401).json({ message: "Permission Denied", org: null });
  }
} 
