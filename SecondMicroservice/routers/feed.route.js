import express from "express";
import { getFeedList } from "../controllers/feed.controller.js";
import { checkContext } from "../middleware/feed.js";

const router = express.Router();

router.get("/", checkContext, getFeedList);

export default router;
