import fs from "fs-extra";
import { execSync } from "child_process";
import path from "path";

const STATIC_DIR = "static";
const MISC_DIR = "misc";

async function release() {
  try {
    console.log("🔄 Starting release build...");

    console.log("📂 Copying misc files...");
    await fs.copy(MISC_DIR, path.join(STATIC_DIR, "misc"));
    await fs.copy("README.md", path.join(STATIC_DIR, "README.md"));

    // Run build using static directory
    console.log("🏗️ Running release build...");
    execSync("npx vite build", { stdio: "inherit" });

    console.log("✅ Release build completed successfully!");
  } catch (error) {
    console.error("❌ Release build failed:", error.message);
    process.exit(1);
  }
}

release();
