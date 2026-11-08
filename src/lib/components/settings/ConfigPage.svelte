<script lang="ts">
  import {
    configStatus,
    exportConfig,
    importConfig,
    resetConfig,
    undoConfigChange
  } from "#lib/state/config.svelte.ts";
  import { onDestroy } from "svelte";
  import Button from "../Button.svelte";
  import Choice from "./Choice.svelte";
  import Description from "./Description.svelte";
  import SettingsGroup from "./SettingsGroup.svelte";

  /** How long the reset button waits to be confirmed, in milliseconds. */
  const CONFIRM_TIME = 3000;

  type Scope = "all" | "theme";

  const scopes: { value: Scope; label: string }[] = [
    { value: "all", label: "Everything" },
    { value: "theme", label: "Theme only" }
  ];

  let scope = $state<Scope>("all");
  let imported = $state("");
  let message = $state("");
  let resetArmed = $state(false);
  let filePicker = $state<HTMLInputElement>();
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportConfig(scope));
      message = "Copied to the clipboard.";
    } catch (error) {
      message = `Couldn't copy: ${String(error)}`;
    }
  };

  /** Windows shows nothing for a download inside a widget, so this says so itself. */
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportConfig(scope)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `neosoft-${scope === "theme" ? "theme" : "config"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message = `Saved to Downloads as ${link.download}.`;
  };

  const runImport = (text: string) => {
    try {
      const { issues, customCss } = importConfig(text);
      imported = "";
      message = [
        issues.length > 0
          ? `Imported, without these: ${issues.join("; ")}`
          : "Imported.",
        customCss
          ? "It came with custom CSS, which can load things from other sites. Check it under Appearance, or undo the import."
          : ""
      ].join(" ");
    } catch (error) {
      message = `Couldn't import: ${String(error)}`;
    }
  };

  const chooseFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (file) runImport(await file.text());
    input.value = "";
  };

  const undo = () => {
    message = undoConfigChange()
      ? "Went back to the settings from before."
      : "The earlier settings couldn't be read, so nothing changed.";
  };

  const reset = () => {
    clearTimeout(resetTimer);

    if (resetArmed) {
      resetArmed = false;
      resetConfig();
      message = "Reset to the defaults.";
      return;
    }

    resetArmed = true;
    resetTimer = setTimeout(() => {
      resetArmed = false;
    }, CONFIRM_TIME);
  };

  onDestroy(() => {
    clearTimeout(resetTimer);
  });
</script>

{#if configStatus.issues.length > 0}
  <SettingsGroup title="Problems">
    <Description
      text="These settings were ignored, because they aren't valid."
    />
    <ul class="mt-1 list-inside list-disc text-sm text-zb-icon">
      {#each configStatus.issues as issue (issue)}
        <li>{issue}</li>
      {/each}
    </ul>
  </SettingsGroup>
{/if}

{#if message}
  <p class="mb-4 rounded-well bg-zb-surface-2 px-3 py-2 text-sm">{message}</p>
{/if}

<SettingsGroup title="Export">
  <Description
    text="Only what differs from the defaults, in the same format as `config.json`, so it's small enough to paste anywhere."
  />
  <div class="mt-2 flex items-center gap-2">
    <Choice
      label="What to export"
      value={scope}
      options={scopes}
      onchange={(next: Scope) => (scope = next)}
    />
    <Button main label="Copy" callback={() => void copy()} />
    <Button label="Download" callback={download} />
  </div>
</SettingsGroup>

<SettingsGroup title="Import">
  <Description
    text="Paste a shared file or choose one. It's merged over your settings, and a theme in it replaces your whole theme, apart from your custom CSS unless it brings its own. A `config.json` next to the pack is merged too when its text changes, one setting at a time."
  />
  <textarea
    class="mt-2 code-editor h-28"
    aria-label="Settings to import"
    spellcheck="false"
    bind:value={imported}></textarea>
  <div class="mt-2 flex items-center gap-2">
    <Button
      main
      label="Import"
      callback={() => {
        runImport(imported);
      }}
    />
    <Button
      label="Choose a file"
      callback={() => {
        filePicker?.click();
      }}
    />
    <input
      bind:this={filePicker}
      class="hidden"
      type="file"
      accept=".json,.jsonc,.json5,.txt"
      aria-label="Choose a file to import"
      onchange={(event) => void chooseFile(event.currentTarget)}
    />
  </div>
</SettingsGroup>

<SettingsGroup title="Start over">
  <Description
    text="Undo goes back to the settings from before the last import or reset."
  />
  <div class="mt-2 flex gap-2">
    {#if configStatus.canUndo}
      <Button label="Undo" callback={undo} />
    {/if}
    <Button
      class="text-zb-icon"
      label={resetArmed ? "Click again to reset" : "Reset to defaults"}
      callback={reset}
    />
  </div>
</SettingsGroup>
