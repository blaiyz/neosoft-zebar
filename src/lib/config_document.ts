import { configSchema, defaultConfig, type Config } from "./config_schema.ts";

/**
 * Settings as the user set them, before defaults are filled in. It's a partial
 * config, and only holds what differs, so a changed default reaches everyone who
 * didn't choose a value of their own.
 */
export type ConfigDocument = Record<string, unknown>;

type ParsedDocument = {
  config: Config;
  /** The document, without the keys that failed validation. */
  document: ConfigDocument;
  /** One line for each key that failed validation. */
  issues: string[];
};

export function isDocument(value: unknown): value is ConfigDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Removes a key, or the whole array if the key is inside one. */
function removeKey(document: ConfigDocument, path: PropertyKey[]) {
  let parent = document;
  for (const [index, key] of path.entries()) {
    const value = parent[key as string];
    if (index === path.length - 1 || Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete parent[key as string];
      return;
    }
    if (!isDocument(value)) return;
    parent = value;
  }
}

/**
 * Validates a document, dropping only the keys that fail. A stored document can't
 * be fixed by hand, so one bad value must not cost the user everything else.
 */
export function parseDocument(input: ConfigDocument): ParsedDocument {
  const document = structuredClone(input);
  const issues: string[] = [];

  // Each pass removes at least one key, or there's nothing left to try.
  for (let pass = 0; pass < 100; pass++) {
    const result = configSchema.safeParse(document);
    if (result.success) return { config: result.data, document, issues };

    for (const { path, message } of result.error.issues) {
      issues.push(`${path.join(".")}: ${message}`);
      removeKey(document, path);
    }
  }

  return { config: defaultConfig, document: {}, issues };
}

/** Puts `changes` over `document`, key by key. Arrays are replaced whole. */
export function mergeDocuments(
  document: ConfigDocument,
  changes: ConfigDocument
): ConfigDocument {
  const merged = { ...document };
  for (const [key, value] of Object.entries(changes)) {
    const current = merged[key];
    merged[key] =
      isDocument(current) && isDocument(value)
        ? mergeDocuments(current, value)
        : value;
  }
  return merged;
}
