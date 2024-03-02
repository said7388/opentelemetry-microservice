import { getDatabase } from "../config/db.js";
import { redis } from "../config/redis.config.js";

export const getFeedList = async (req, res, next) => {
  const storedFeeds = await redis.get("feeds");
  
  if (storedFeeds) {
    return res.status(200).json({
      feeds: JSON.parse(storedFeeds),
    });
  };

  const db = getDatabase();
  const feedCollection = db.collection("newsfeeds");
  const feeds = await feedCollection.find({}).toArray();
  redis.set("feeds", JSON.stringify(feeds));

  return res.status(200).json({
    feeds: feeds
  });
};