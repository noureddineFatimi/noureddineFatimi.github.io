import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import {requireEnv} from "./utils"
import {Redis} from "@upstash/redis";

export const redis = new Redis({
  url: requireEnv("UPSTASH_REDIS_REST_URL"),
  token: requireEnv("UPSTASH_REDIS_REST_TOKEN")
});