import ignoredApps from "#lib/ignored_apps.json";
import type { Icon } from "@tabler/icons-svelte";
import Background from "@tabler/icons-svelte/icons/background";
import Terminal_2 from "@tabler/icons-svelte/icons/terminal-2";
import BrandVscode from "@tabler/icons-svelte/icons/brand-vscode";
import BrandVisualStudio from "@tabler/icons-svelte/icons/brand-visual-studio";
import BrandTeams from "@tabler/icons-svelte/icons/brand-teams";
import Mail from "@tabler/icons-svelte/icons/mail";
import BrandArc from "@tabler/icons-svelte/icons/brand-arc";
import BrandChrome from "@tabler/icons-svelte/icons/brand-chrome";
import BrandVivaldi from "@tabler/icons-svelte/icons/brand-vivaldi";
import BrandFirefox from "@tabler/icons-svelte/icons/brand-firefox";
import CircleLetterZ from "@tabler/icons-svelte/icons/circle-letter-z";
import BrandEdge from "@tabler/icons-svelte/icons/brand-edge";
import BrandDiscord from "@tabler/icons-svelte/icons/brand-discord";
import BrandSpotify from "@tabler/icons-svelte/icons/brand-spotify";
import Spy from "@tabler/icons-svelte/icons/spy";
import Screenshot from "@tabler/icons-svelte/icons/screenshot";
import Settings from "@tabler/icons-svelte/icons/settings";
import Folder from "@tabler/icons-svelte/icons/folder";
import Photo from "@tabler/icons-svelte/icons/photo";
import Headphones from "@tabler/icons-svelte/icons/headphones";
import FileSpreadsheet from "@tabler/icons-svelte/icons/file-spreadsheet";
import Note from "@tabler/icons-svelte/icons/note";
import Presentation from "@tabler/icons-svelte/icons/presentation";
import FileWord from "@tabler/icons-svelte/icons/file-word";
import Palette from "@tabler/icons-svelte/icons/palette";
import BrandSteam from "@tabler/icons-svelte/icons/brand-steam";
import HexagonLetterV from "@tabler/icons-svelte/icons/hexagon-letter-v";
import BrandDocker from "@tabler/icons-svelte/icons/brand-docker";
import BrandKotlin from "@tabler/icons-svelte/icons/brand-kotlin";
import BrandTelegram from "@tabler/icons-svelte/icons/brand-telegram";
import BrandWechat from "@tabler/icons-svelte/icons/brand-wechat";
import BrandQq from "@tabler/icons-svelte/icons/brand-qq";
import BrandXbox from "@tabler/icons-svelte/icons/brand-xbox";
import Check from "@tabler/icons-svelte/icons/check";
import Music from "@tabler/icons-svelte/icons/music";
import Markdown from "@tabler/icons-svelte/icons/markdown";
import Notebook from "@tabler/icons-svelte/icons/notebook";
import FileTypePdf from "@tabler/icons-svelte/icons/file-type-pdf";
import FileZip from "@tabler/icons-svelte/icons/file-zip";
import BrandAndroid from "@tabler/icons-svelte/icons/brand-android";
import type { Window } from "glazewm";

// Imported one at a time for offline support and tree shaking. The first entry that
// matches wins, so the order matters.
const ICONS: { appNames: string[]; icon: Icon }[] = [
  {
    appNames: ["alacritty", "wezterm", "wezterm-gui", "windowsterminal", "wt"],
    icon: Terminal_2
  },
  { appNames: ["code"], icon: BrandVscode },
  { appNames: ["devenv"], icon: BrandVisualStudio },
  { appNames: ["ms-teams"], icon: BrandTeams },
  { appNames: ["airmail", "olk", "OUTLOOK"], icon: Mail },
  { appNames: ["arc"], icon: BrandArc },
  { appNames: ["chrome", "chromium", "thorium"], icon: BrandChrome },
  { appNames: ["vivaldi"], icon: BrandVivaldi },
  { appNames: ["firefox"], icon: BrandFirefox },
  { appNames: ["zen"], icon: CircleLetterZ },
  { appNames: ["msedge"], icon: BrandEdge },
  { appNames: ["discord"], icon: BrandDiscord },
  { appNames: ["spotify"], icon: BrandSpotify },
  {
    appNames: [
      "azure vpn client",
      "AutoHotkey Window Spy",
      "ProtonVPN",
      "clash-verge"
    ],
    icon: Spy
  },
  { appNames: ["snippingtool"], icon: Screenshot },
  { appNames: ["control panel", "settings", "FanControl"], icon: Settings },
  { appNames: ["explorer", "dopus", "fpilot"], icon: Folder },
  { appNames: ["photos"], icon: Photo },
  { appNames: ["sound"], icon: Headphones },
  { appNames: ["excel"], icon: FileSpreadsheet },
  { appNames: ["onenote"], icon: Note },
  { appNames: ["powerpnt"], icon: Presentation },
  { appNames: ["winword"], icon: FileWord },
  { appNames: ["mspaint"], icon: Palette },
  { appNames: ["steam"], icon: BrandSteam },
  { appNames: ["neovide", "gvim"], icon: HexagonLetterV },
  { appNames: ["Docker Desktop"], icon: BrandDocker },
  {
    appNames: [
      "clion64",
      "idea64",
      "pycharm64",
      "webstorm64",
      "goland64",
      "rider64",
      "rustrover64"
    ],
    icon: BrandKotlin
  },
  { appNames: ["telegram", "unigram"], icon: BrandTelegram },
  { appNames: ["WeChat"], icon: BrandWechat },
  { appNames: ["QQ"], icon: BrandQq },
  { appNames: ["Xbox"], icon: BrandXbox },
  { appNames: ["Microsoft To Do"], icon: Check },
  {
    appNames: ["Media Player", "AppleMusic", "Cider", "ZuneMusic"],
    icon: Music
  },
  { appNames: ["Typora"], icon: Markdown },
  { appNames: ["Obsidian", "zotero"], icon: Notebook },
  {
    appNames: ["SumatraPDF", "Acrobat Reader", "Foxit Reader", "sioyek"],
    icon: FileTypePdf
  },
  { appNames: ["7zFM", "WinRAR", "WinZip", "bandizip"], icon: FileZip },
  { appNames: ["MuMuPlayer"], icon: BrandAndroid }
];

const lowerCaseIcons = ICONS.map(({ appNames, icon }) => ({
  names: new Set(appNames.map((name) => name.toLowerCase())),
  icon
}));
const ignoredNames = new Set(ignoredApps.map((app) => app.name.toLowerCase()));

/** The icon for a window, matched on its title or process name in any case. */
export function getProcessIcon(window: Window): Icon {
  const title = window.title.toLowerCase();
  const processName = window.processName.toLowerCase();

  if (ignoredNames.has(title) || ignoredNames.has(processName)) {
    return Background;
  }

  const entry = lowerCaseIcons.find(
    ({ names }) => names.has(title) || names.has(processName)
  );
  return entry?.icon ?? Background;
}

/**
 * The icon for the app behind a media session. Its id is the app's executable, like
 * `Spotify.exe`, or a Store app's id, like `Microsoft.ZuneMusic_8wekyb3d8bbwe!App`.
 */
export function getAppIcon(sessionId: string): Icon {
  const app = (sessionId.split("!")[0] ?? "")
    .toLowerCase()
    .replace(/\.exe$/, "")
    .replace(/_[a-z0-9]{13}$/, "");
  const names = [app, app.split(".").at(-1) ?? app];

  const entry = lowerCaseIcons.find((icon) =>
    names.some((name) => icon.names.has(name))
  );
  return entry?.icon ?? Music;
}
