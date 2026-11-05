import { execSync } from "node:child_process";
import { cpSync } from "node:fs";

cpSync("misc", "static/misc", { recursive: true });
cpSync("README.md", "static/README.md");

execSync("vite build", { stdio: "inherit" });
