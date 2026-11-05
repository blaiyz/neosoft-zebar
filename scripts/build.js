import { execSync } from "node:child_process";
import { cpSync } from "node:fs";

execSync("vite build", { stdio: "inherit" });

cpSync("README.md", "build/README.md");
cpSync("LICENSE", "build/LICENSE");
