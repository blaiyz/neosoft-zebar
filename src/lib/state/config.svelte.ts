import {
  isDocument,
  mergeDocuments,
  parseDocument,
  type ConfigDocument
} from "#lib/config_document.ts";
import { migrate } from "#lib/config_migrations.ts";
import { CONFIG_VERSION, defaultConfig } from "#lib/config_schema.ts";
import JSON5 from "json5";

/**
 * `localStorage` is where settings live, because a widget can't write files and
 * this storage is shared by every window of the pack and survives updates.
 */
const DOCUMENT_KEY = "neosoft.config";
/** The document as it was before the last migration or import. */
const BACKUP_KEY = "neosoft.config.backup";
/** The text of the files that were last imported. */
const IMPORTED_KEY = "neosoft.config.imported";
const IMPORTED_CSS_KEY = "neosoft.config.importedCss";
const CHANNEL_NAME = "neosoft.config";

const config = $state(structuredClone(defaultConfig));

const configStatus = $state({
  /** Whether `config` holds the user's settings yet, rather than the defaults. */
  loaded: false,
  /** What was wrong with the settings, as one line per problem. */
  issues: [] as string[]
});

let channel: BroadcastChannel | undefined;
let fileIssues: string[] = [];

/**
 * Copies `source` over `target`, touching only what differs, so that a change to
 * one setting doesn't wake everything else that reads `config`.
 */
function syncState(target: ConfigDocument, source: ConfigDocument) {
  for (const key of Object.keys(target)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (!(key in source)) delete target[key];
  }
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (isDocument(current) && isDocument(value)) {
      syncState(current, value);
    } else if (JSON.stringify(current) !== JSON.stringify(value)) {
      target[key] = value;
    }
  }
}

function writeDocument(document: ConfigDocument) {
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify(document));
}

function backUp(text: string | null) {
  if (text !== null) localStorage.setItem(BACKUP_KEY, text);
}

function readDocument(): ConfigDocument {
  const text = localStorage.getItem(DOCUMENT_KEY);
  if (text === null) return {};

  try {
    const stored: unknown = JSON.parse(text);
    if (!isDocument(stored)) throw new Error("Not an object");

    const migrated = migrate(stored);
    if (migrated.version !== stored.version) {
      backUp(text);
      writeDocument(migrated);
    }
    return migrated;
  } catch (error) {
    console.error("Discarding unreadable settings:", error);
    backUp(text);
    localStorage.removeItem(DOCUMENT_KEY);
    return {};
  }
}

function applyDocument(document: ConfigDocument) {
  const { config: parsed, issues } = parseDocument(document);
  syncState(config, parsed);
  configStatus.issues = [...issues, ...fileIssues];
}

async function readFile(path: string) {
  try {
    const response = await fetch(path);
    return response.ok ? await response.text() : null;
  } catch (error) {
    console.error(`Error reading ${path}:`, error);
    return null;
  }
}

/**
 * Merges a file's changes into the stored document if its text differs from the
 * last import, so that a file and the stored settings never fight: whichever
 * changed last wins. An edit to the file applies once and can still be changed
 * afterwards.
 */
function importIfChanged(
  importedKey: string,
  text: string,
  changes: ConfigDocument
) {
  if (text === localStorage.getItem(importedKey)) return;

  backUp(localStorage.getItem(DOCUMENT_KEY));
  writeDocument(mergeDocuments(readDocument(), changes));
  localStorage.setItem(importedKey, text);
  channel?.postMessage(null);
}

/**
 * An update replaces this file with the template, which holds no settings, so the
 * stored ones stay. Its problems are reported on every start, until it's fixed.
 */
async function importConfigFile() {
  fileIssues = [];

  const text = await readFile("config.json");
  if (text === null) return;

  try {
    const file: unknown = JSON5.parse(text);
    if (!isDocument(file)) throw new Error("It should hold an object");

    const { document, issues } = parseDocument(migrate(file));
    fileIssues = issues.map((issue) => `config.json: ${issue}`);

    importIfChanged(IMPORTED_KEY, text, document);
  } catch (error) {
    console.error("Error importing config.json:", error);
    fileIssues = [`config.json: ${String(error)}`];
  }
}

/**
 * The pack doesn't ship this file, because an update would replace a template and
 * its text would count as a change. A missing file leaves the stored CSS alone, so
 * the CSS outlives the folder of the version it was written in.
 */
async function importCustomCss() {
  const text = await readFile("custom.css");
  if (text === null) return;

  importIfChanged(IMPORTED_CSS_KEY, text, {
    version: CONFIG_VERSION,
    theme: { customCss: text }
  });
}

/** Stored settings apply at once, so the bar doesn't wait for a file to load. */
async function loadConfig() {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = () => {
    applyDocument(readDocument());
  };

  applyDocument(readDocument());
  await importConfigFile();
  await importCustomCss();
  applyDocument(readDocument());

  for (const issue of configStatus.issues) console.warn(issue);
  configStatus.loaded = true;
}

export { config, configStatus, loadConfig };
