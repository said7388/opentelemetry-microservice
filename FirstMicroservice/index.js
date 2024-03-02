import bodyParser from "body-parser";
import cors from "cors";
import dotEnv from "dotenv";
import express from "express";
import { feedMiddleware } from "./middleware/feed.js";
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

// connectDb(); // connect to database

app.use(express.json()); // enable JSON serialization

// The Organization Route
app.use("/api/feeds", feedMiddleware, feedRoutes);

// Demo Route for testing
app.get("/", (req, res) => {
  res.send("Feeds Microservice is running...");
});

const Port = process.env.PORT || 3000;
// listening to the port
app.listen(Port, console.log("Listening to port ", Port));
