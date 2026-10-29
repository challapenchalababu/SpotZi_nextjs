import mongoose from "mongoose";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logError } from "@/lib/logger";
import { ensureModelIndexes } from "@/models";

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConn?: Promise<typeof mongoose> | null;
  mongooseIndexes?: Promise<void> | null;
};

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new AppError(
      503,
      isPreviewMode() ? "preview_readonly" : "database_unconfigured",
      isPreviewMode()
        ? "These screens are filled from src/data/preview.json. Add MONGODB_URI when you want to save live data."
        : "The database is not configured. Add MONGODB_URI to the environment.",
    );
  }
  if (!globalForMongoose.mongooseConn) {
    mongoose.set("strictQuery", true);
    globalForMongoose.mongooseConn = mongoose.connect(uri, { bufferCommands: false }).catch((error: unknown) => {
      globalForMongoose.mongooseConn = null;
      logError(error);
      throw new AppError(503, "database_unavailable", "Could not connect to the database.");
    });
  }
  try {
    await globalForMongoose.mongooseConn;
  } catch (error) {
    globalForMongoose.mongooseConn = null;
    if (error instanceof AppError) throw error;
    logError(error);
    throw new AppError(503, "database_unavailable", "Could not connect to the database.");
  }
  if (!globalForMongoose.mongooseIndexes) {
    globalForMongoose.mongooseIndexes = ensureModelIndexes().catch((error: unknown) => {
      globalForMongoose.mongooseIndexes = null;
      logError(error);
      throw new AppError(503, "database_unavailable", "Could not prepare database indexes.");
    });
  }
  await globalForMongoose.mongooseIndexes;
  return mongoose;
}
