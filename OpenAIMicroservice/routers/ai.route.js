import express from "express";
import { generateNewPost } from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/generate", generateNewPost);

export default router;
