import { readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import * as z from "zod";
import { CONFIG_VERSION, configSchema } from "../src/lib/config_schema.ts";

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
  const template = { $schema: "./schema.json", version: CONFIG_VERSION };
  const problems = [
    !isDeepStrictEqual(readJson(TEMPLATE_FILE), template) &&
      `${TEMPLATE_FILE} should only hold ${JSON.stringify(template)}, because anything in it is imported over the user's settings`,
    !isDeepStrictEqual(readJson(SCHEMA_FILE), schema) &&
      `${SCHEMA_FILE} is out of date, run pnpm schema`
  ].filter((problem) => problem !== false);

  for (const problem of problems) console.error(problem);
  process.exitCode = problems.length > 0 ? 1 : 0;
} else {
  writeFileSync(SCHEMA_FILE, JSON.stringify(schema, null, 2));
}
