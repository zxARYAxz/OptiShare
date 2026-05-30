import { cleanupExpiredFiles } from "../src/lib/cleanup";

cleanupExpiredFiles()
  .then((result) => {
    console.log(`Cleanup complete. Deleted ${result.deleted} file(s).`);
    if (result.errors.length) {
      console.error("Errors:", result.errors);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  });
