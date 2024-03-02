import dotEnv from "dotenv";
import OpenAI from 'openai';
dotEnv.config(); // 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

export default openai;