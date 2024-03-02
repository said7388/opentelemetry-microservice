import openai from "../config/ai.config.js";
import { getDatabase } from "../config/db.js";
import { redis } from "../config/redis.config.js";
import { userIds } from "../utils/users.js";

export const generateNewPost = async () => {
  const prompt = "Write a post for social media within 100 words.";
  const post = {
    userId: "",
    userName: "Jane Smith",
    userProfilePic: "https://example.com/profile_pics/janesmith.jpg",
    content: "",
    contentType: "text",
    imageUrl: null,
    timestamp: "2024-03-02T11:25:00Z",
  };

  try {
    const db = getDatabase();
    const feedCollection = db.collection("newsfeeds");
    const resp = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    const result = resp.choices[0].message.content;
    
    if (result) {
      const userIindex = await redis.get("userId") || 0;
      const userId = userIds[userIindex];
      post.userId = userId;
      post.content = result;
      post.timestamp = new Date().toISOString();

      await feedCollection.insertOne(post);
      const nextUserId = userIindex === userIds.length - 1 ? 0 : userIindex + 1;
      redis.set("userId", nextUserId);
    };
  } catch (error) {
    console.log(error)
  }
};