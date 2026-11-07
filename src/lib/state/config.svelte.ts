import {
  differences,
  isDocument,
  mergeDocuments,
  parseDocument,
  setPath,
  type ConfigDocument
} from "#lib/config_document.ts";
import { migrate } from "#lib/config_migrations.ts";
import {
  CONFIG_VERSION,
  defaultConfig,
  type Config
} from "#lib/config_schema.ts";
import JSON5 from "json5";
import { flushSync } from "svelte";

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
/** No settings. The version keeps it from reading as an old file to upgrade. */
const EMPTY_DOCUMENT = { version: CONFIG_VERSION };

const config = $state(structuredClone(defaultConfig));

const configStatus = $state({
  /** Whether `config` holds the user's settings yet, rather than the defaults. */
  loaded: false,
  /** What was wrong with the settings, as one line per problem. */
  issues: [] as string[],
  /** Whether there's an earlier document to go back to. */
  canUndo: false
});

let channel: BroadcastChannel | undefined;
let fileIssues: string[] = [];
let fades = true;
/**
 * The longest a change waits for its fade, in milliseconds. A fade starts on the next
 * frame, which a window that's covered may not get.
 */
const FADE_WAIT = 200;
/** The newest settings, until they've been applied. */
let waiting: ReturnType<typeof parseDocument> | null = null;
let recoloring: ReturnType<typeof setTimeout> | undefined;

/**
 * For a window that spends its time hidden, where a fade would have to wait, or one
 * whose controls animate their own changes, which a fade would cover up.
 */
function skipConfigFades() {
  fades = false;
}

/**
 * The settings that change the look all at once, with no animation of their own.
 * The theme's colors are left out, as they ease across instead.
 */
const lookOf = ({
  theme,
  bar,
  clock,
  media,
  workspaces,
  taskbarIntegration
}: Config) =>
  JSON.stringify([
    theme.fontFamily,
    theme.fontSize,
    theme.radius,
    theme.customCss,
    media.style,
    workspaces.style,
    bar.gradient,
    bar.attachSides,
    clock.use24h,
    clock.showSeconds,
    taskbarIntegration
  ]);

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

const colorsOf = ({ theme }: Config) =>
  JSON.stringify([theme.preset, theme.colors]);

/** How long a fade takes in this window, in milliseconds. `+layout.svelte` sets it. */
const fadeTime = () =>
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--time-fade")
  ) || 0;

/** Eases every color to the theme's new ones, through a class `app.css` styles. */
function recolor() {
  const time = fadeTime();
  if (time === 0) return;

  const root = document.documentElement;
  root.classList.add("recoloring");
  clearTimeout(recoloring);
  recoloring = setTimeout(() => {
    root.classList.remove("recoloring");
  }, time);
}

function applyWaiting() {
  if (!waiting) return;

  const { config: parsed, issues } = waiting;
  waiting = null;
  if (configStatus.loaded && colorsOf(parsed) !== colorsOf(config)) recolor();
  syncState(config, parsed);
  configStatus.issues = [...issues, ...fileIssues];
  configStatus.canUndo = localStorage.getItem(BACKUP_KEY) !== null;
}

/**
 * A fade applies its change a moment later, and a newer change can arrive before
 * then. Whichever way it comes, only the newest is applied.
 */
function applyDocument(next: ConfigDocument) {
  const fading = waiting !== null;
  waiting = parseDocument(next);
  if (fading) return;

  if (
    fades &&
    configStatus.loaded &&
    fadeTime() > 0 &&
    lookOf(waiting.config) !== lookOf(config)
  ) {
    const transition = document.startViewTransition(() => {
      applyWaiting();
      flushSync();
    });
    // A newer fade cuts this one short, which is expected.
    transition.ready.catch(() => {});
    setTimeout(applyWaiting, FADE_WAIT);
  } else {
    applyWaiting();
  }
}

/**
 * Sends the document itself, because a change to `localStorage` can reach another
 * window later than this message does.
 */
function announceDocument(document: ConfigDocument) {
  channel?.postMessage(JSON.stringify(document));
}

/** Writes a document and applies it here and in every other window. */
function publishDocument(document: ConfigDocument) {
  writeDocument(document);
  applyDocument(readDocument());
  announceDocument(document);
}

/**
 * Changes settings from inside a window. Keys that aren't mentioned stay as they
 * are, and a key set to `undefined` goes back to its default. Nothing is written if
 * a value isn't valid, and what's wrong with it is returned.
 */
function updateConfig(changes: ConfigDocument) {
  const { issues } = parseDocument(
    JSON.parse(JSON.stringify(changes)) as ConfigDocument
  );
  if (issues.length === 0) {
    publishDocument(mergeDocuments(readDocument(), changes));
  }
  return issues;
}

/** Applies one setting by its dotted path. */
function updateSetting(path: string, value: unknown) {
  const changes: ConfigDocument = {};
  setPath(changes, path, value);
  return updateConfig(changes);
}

/** The settings as a file, holding only what differs from the defaults. */
function exportConfig(scope: "all" | "theme") {
  const current = $state.snapshot(config);
  // The tray's icons are this PC's apps, so a shared file leaves them out by
  // counting them as unchanged.
  const { pinned, order } = current.tray;
  const reference = mergeDocuments(defaultConfig, { tray: { pinned, order } });
  const changed = differences(current, reference);
  const document = scope === "theme" ? { theme: changed.theme ?? {} } : changed;

  return JSON.stringify({ ...document, version: CONFIG_VERSION }, null, 2);
}

/**
 * Merges a shared file over the settings, in any version it was written in. Keys
 * that can't be used are left out and reported.
 */
function importConfig(text: string) {
  const file: unknown = JSON5.parse(text);
  if (!isDocument(file)) throw new Error("It should hold an object");

  const { document, issues } = parseDocument(migrate(file));
  backUp(localStorage.getItem(DOCUMENT_KEY));
  publishDocument(mergeDocuments(readDocument(), document));
  return issues;
}

/** Swaps the document with its backup, so that undoing can be undone too. */
function undoConfigChange() {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (backup === null) return;

  backUp(localStorage.getItem(DOCUMENT_KEY) ?? JSON.stringify(EMPTY_DOCUMENT));
  localStorage.setItem(DOCUMENT_KEY, backup);
  publishDocument(readDocument());
}

function resetConfig() {
  backUp(localStorage.getItem(DOCUMENT_KEY));
  publishDocument(EMPTY_DOCUMENT);
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
  const merged = mergeDocuments(readDocument(), changes);
  writeDocument(merged);
  localStorage.setItem(importedKey, text);
  announceDocument(merged);
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
  channel.onmessage = ({ data }: MessageEvent<string>) => {
    applyDocument(JSON.parse(data) as ConfigDocument);
  };

  applyDocument(readDocument());
  await importConfigFile();
  await importCustomCss();
  applyDocument(readDocument());

  for (const issue of configStatus.issues) console.warn(issue);
  configStatus.loaded = true;
}

export {
  config,
  configStatus,
  exportConfig,
  importConfig,
  loadConfig,
  resetConfig,
  skipConfigFades,
  undoConfigChange,
  updateConfig,
  updateSetting
};
