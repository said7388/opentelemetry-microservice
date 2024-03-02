import bodyParser from "body-parser";
import cors from "cors";
import dotEnv from "dotenv";
import express from "express";
import { connectToDatabase } from "./config/db.js";
import feedRoutes from "./routers/feed.route.js";

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
app.use("/api/feeds", feedRoutes);

// Demo Route for testing
app.get("/", (req, res) => {
  res.send("Organization Microservice is running...");
});

const Port = process.env.PORT || 4000;
// listening to the port
app.listen(Port, console.log("Listening to port ", Port));
