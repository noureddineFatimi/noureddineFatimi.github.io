import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {Redis} from "@upstash/redis";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  } 
  return value;
}

export const redis = new Redis({
  url: requireEnv("UPSTASH_REDIS_REST_URL"),
  token: requireEnv("UPSTASH_REDIS_REST_TOKEN")
});