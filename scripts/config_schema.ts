import { readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import * as z from "zod";
import { configSchema, defaultConfig } from "../src/lib/config_schema.ts";

const SCHEMA_FILE = "static/schema.json";
const TEMPLATE_FILE = "static/config.json";

// The input side of the schema, where a key with a default is optional.
const schema = z.toJSONSchema(configSchema, {
  target: "draft-07",
  io: "input"
});

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

if (process.argv.includes("--check")) {
  const { $schema, ...template } = readJson(TEMPLATE_FILE);
  const problems = [
    !isDeepStrictEqual(template, defaultConfig) &&
      `${TEMPLATE_FILE} differs from the defaults in src/lib/config_schema.ts`,
    !isDeepStrictEqual(readJson(SCHEMA_FILE), schema) &&
      `${SCHEMA_FILE} is out of date, run pnpm schema`,
    $schema !== "./schema.json" &&
      `${TEMPLATE_FILE} should set $schema to ./schema.json`
  ].filter((problem) => problem !== false);

  for (const problem of problems) console.error(problem);
  process.exitCode = problems.length > 0 ? 1 : 0;
} else {
  writeFileSync(SCHEMA_FILE, JSON.stringify(schema, null, 2));
}
