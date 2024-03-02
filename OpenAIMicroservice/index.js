import bodyParser from "body-parser";
import cors from "cors";
import dotEnv from "dotenv";
import express from "express";
import { connectToDatabase } from "./config/db.js";
import { generateNewPost } from "./controllers/ai.controller.js";

dotEnv.config(); // allow .env file to load

const app = express(); // initializing express app

const corsOptions = {
  // cors configuration options
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // enable cors

app.use(bodyParser.urlencoded({ extended: false })); // enable body parsing

connectToDatabase(); // connect to database

app.use(express.json()); // enable JSON serialization

// The Organization Route
const interval = setInterval(generateNewPost, 30000);

// Demo Route for testing
app.get("/", (req, res) => {
  res.send("OpenAI Microservice is running...");
});

const Port = process.env.PORT || 5000;
// listening to the port
app.listen(Port, console.log("Listening to port ", Port));
