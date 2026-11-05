import { execSync } from "node:child_process";
import { cpSync } from "node:fs";

cpSync("README.md", "static/README.md");
cpSync("LICENSE", "static/LICENSE");

execSync("vite build", { stdio: "inherit" });
