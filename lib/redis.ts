import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import {requireEnv} from "./utils"
import {Redis} from "@upstash/redis";
import {Ratelimit} from "@upstash/ratelimit"

export const redis = new Redis({
  url: requireEnv("UPSTASH_REDIS_REST_URL"),
  token: requireEnv("UPSTASH_REDIS_REST_TOKEN")
});

export const chatBurstLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:chat:burst"
})

export const chatDailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, "86400 s"),
  analytics: true,
  prefix: "ratelimit:chat:daily"
})