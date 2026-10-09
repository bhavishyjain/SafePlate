import path from "node:path";
import { mkdir } from "node:fs/promises";
import { MongoMemoryServer } from "mongodb-memory-server";

const databasePath = path.resolve(".data", "mongodb");
await mkdir(databasePath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: "safeplate",
    dbPath: databasePath,
    storageEngine: "wiredTiger",
  },
});

console.log(`SafePlate development MongoDB is running at ${server.getUri("safeplate")}`);
console.log(`Persistent database files: ${databasePath}`);

let stopping = false;
async function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`Stopping development MongoDB after ${signal}`);
  await server.stop({ doCleanup: false, force: false });
  process.exit(0);
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
await new Promise(() => {});
