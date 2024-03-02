import dotEnv from "dotenv";
import { MongoClient } from "mongodb";
dotEnv.config();

// define the MongoDB client
const client = new MongoClient(process.env.MONGO_URI);

// to store the database instance
let database;

// this function will establish the connection with the MongoDB and create a database instance.
export const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    database = client.db(process.env.DB_NAME);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// This function will returns already created database instance or throws an error if it's not yet initialized.
export const getDatabase = () => {
  if (database) {
    return database;
  } else {
    throw new Error('Database connection not established yet.');
  }
};