# Neosoft [Zebar](https://github.com/glzr-io/zebar)

A Zebar configuration forked from [Neobrutal Zebar](https://github.com/adriankarlen/neobrutal-zebar) for Zebar V3, built with Svelte and Tailwind. This project would not have been possible without the original, please give it a star!

## ✨ Features

- Process icons for the current workspace with focus indicators
- System information meters with dynamic coloring and animations
- Smooth animations
- Media controls
- Configuration using CSS variables and a JSON file
- Customizable layout and appearance
- Built-in auto-tiler
- Multi-monitor support
- Windows Taskbar integration (experimental)
- Background effects (Acrylic, Blur, Mica)
- Click-through ability (disable interactivity and cursor events to windows below)

## 🖼️ Showcase

![fullscreen](./misc/fullscreen.png)

https://github.com/user-attachments/assets/f1c8f09f-aa07-4077-890b-8d1162ef65af

https://github.com/user-attachments/assets/c0abbb25-0e5a-4531-9400-c52b9a7f2ffe

https://github.com/user-attachments/assets/47b0a9ae-4f7d-4784-a224-cdf0b10943aa

### Taskbar Integration

![Taskbar Integration](./misc/taskbar-integration.png)

## 🚀 Getting Started

### Simple Installation

For both installtion methods, you can adjust `config.css` and `config.json` as needed (see [Configuration](#-configuration) and [CSS & Themes](#-css--themes))

#### Marketplace

You can now easily install Neosoft Zebar from the Zebar marketplace! Simply search for neosoft-zebar and click install.

The installation location is in `%appData%\zebar\downloads\blaiyz.neosoft-zebar@<version>` (you can find the config files there).

#### Manual

Download `neosoft-zebar.zip` from the latest release. Extract the contents into a folder and place it in your Zebar config directory.

### Advanced Installation (Building from Source)

#### Prerequisites

- Package manager/runtime of your choice (`pnpm` (recommended), `npm`, `bun`, `yarn`, etc.). We use `pnpm`, so the following instructions will demonstrate its usage.

#### Instructions

1. Download the repository and extract it anywhere
2. To avoid copying files on each rebuild, create a symlink in the Zebar config directory that points to `path/to/repo/neosoft-zebar/build`
3. Navigate to the root directory of neosoft-zebar
4. Install dependencies using your selected package manager:
   ```bash
   pnpm install
   ```
5. Make any desired edits
6. Build the project:
   ```bash
   pnpm run dev
   ```
7. Reload Zebar

> [!NOTE]
> `pnpm run dev` creates a local static folder called `dev_static`. This folder is not committed. Use this folder for your custom configurations without affecting the original files. In general, don't use `pnpm run build` unless you are making production changes.

## 🔧 Configuration

General configuration is defined in `config.json`, which ships together with the Neosoft Zebar bundle. The default configuration is:

```json
{
  "$schema": "./schema.json",
  "direction": "top",
  "gradient": "top",
  "attachSides": true,
  "taskbarIntegration": {
    "enabled": false,
    "extraIcons": 0,
    "primaryMonitorSelection": "all",
    "secondaryMonitorSelection": "monitor"
  },
  "transitionDuration": 400,
  "providersConfig": {
    "refreshIntervals": {
      "cpu": 2000,
      "memory": 5000,
      "battery": 60000,
      "weather": 900000,
      "network": 2000
    },
    "enableErrorLogging": false
  },
  "backgroundEffect": "inherit",
  "enableAutoTiling": true,
  "clickThroughByDefault": false,
  "showFullDateByDefault": false,
  "showHeartButton": true,
  "showCpuSection": true,
  "showMemorySection": true,
  "showBatterySection": true,
  "showNetworkSection": true,
  "showWeatherSection": true
}
```

In order to see the description and value options for each field, you need to open `config.json` in VSCode (or any editor that supports json schemas), which then detects the schema (shipped together in `schema.json`) and provides intellisense for each field.

Some settings might need to be configured in `zpack.json`, which is the configuration file Zebar uses (shipped together as well). In there, you have options to change the size and positioning of the widget.

> [!NOTE]
> If you're using window scaling in Windows, you may need to edit `zpack.json` to set the correct height (default is `40px`).

## 🎨 CSS & Themes

Style and color configuration is defined in `config.css`. After making changes there, reload Zebar.

Neosoft Zebar currently ships with 5 different themes: Tau (custom), Rosé Pine, Catppuccin, Nord, and Material. These themes are provided as palletes, with the colors represented by CSS variables. You can see the variables of each theme in [this directory](src/themes). At the moment, I've provided presets for 2 (+2 flavors) themes which are available below. In order to use them, replace the color variables (variables under `/* colors */`) in `config.css` with the corresponding variables from the desired theme. There are additional themes without presets which you can experiment with on your own, contributions for these themes are welcome!

In order to use custom colors, you need to replace the color variables with HSL-encoded colors without commas. For example, to change the text and accent colors modify the first lines:

```css
  /* colors */
  --text: 0 73% 56%;
  --accent: 300 100% 50%;
  ...
```

In addition to colors, `config.css` provides variables that control other style options, such as border radius with `--radius`, fonts with `--font-family` and different margins. Use all configuration files (`config.json`, `config.css`, `zpack.json`) to achieve the exact widget style you want.

> [!TIP]
> To scale the entire widget, you need to both increase height in `zpack.json` and increase the font size in `config.css`. Neosoft Zebar's component sizes are all sized relative to the font size.

#### **Here are the theme presets:**

### Tau (Default)

<details>
<summary>config.css</summary>

```css
/* colors */
--text: var(--tau-text);
--accent: var(--tau-accent);
--bg: var(--tau-overlay);
--muted: var(--tau-muted);
--border: var(--tau-highlight-low);
--shadow: var(--tau-highlight-low);
--icon: var(--tau-love);
--memory: var(--tau-weak);
--cpu: var(--tau-accent);
--cpu-high-usage: var(--tau-strong);
--battery-good: var(--tau-weak);
--battery-mid: var(--tau-mid);
--battery-low: var(--tau-strong);
--focused-process: var(--tau-text);
--process: var(--tau-muted);
--displayed: var(--tau-text);
--ws-1: var(--tau-weak);
--ws-2: var(--tau-low);
--ws-3: var(--tau-accent);
--ws-4: var(--tau-mid);
--ws-5: var(--tau-strong);
--tiling-direction: var(--tau-weak);
--not-playing: var(--tau-love);
--network: var(--tau-text);
--weather: var(--tau-text);
--volume-start: var(--tau-strong);
--volume-end: var(--tau-accent);
--volume-inner: var(--tau-accent);
--bg-focused: var(--tau-highlight-high) / 0.4;
--bg-unfocused: var(--tau-overlay) / 0.5;
```

</details>

### Rosé Pine (includes flavors)

<details>
<summary>config.css</summary>

#### Base

```css
/* colors */
--text: var(--rp-text);
--accent: var(--rp-foam);
--bg: var(--rp-overlay);
--muted: var(--rp-base);
--border: var(--rp-highlight-low);
--shadow: var(--rp-highlight-low);
--icon: var(--rp-love);
--memory: var(--rp-iris);
--cpu: var(--rp-rose);
--cpu-high-usage: var(--rp-love);
--battery-good: var(--rp-pine);
--battery-mid: var(--rp-gold);
--battery-low: var(--rp-love);
--focused-process: var(--rp-text);
--process: var(--rp-muted);
--displayed: var(--rp-text);
--ws-1: var(--rp-gold);
--ws-2: var(--rp-love);
--ws-3: var(--rp-pine);
--ws-4: var(--rp-foam);
--ws-5: var(--rp-iris);
--tiling-direction: var(--rp-rose);
--network: var(--rp-text);
--weather: var(--rp-text);
--volume-start: var(--rp-love);
--volume-end: var(--rp-foam);
--volume-inner: var(--rp-foam);
--bg-focused: var(--rp-subtle) / 0.4;
--bg-unfocused: var(--rp-base) / 0.5;
```

#### Moon

```css
/* colors */
--text: var(--rp-moon-text);
--accent: var(--rp-moon-foam);
--bg: var(--rp-moon-overlay);
--muted: var(--rp-moon-base);
--border: var(--rp-moon-highlight-low);
--shadow: var(--rp-moon-highlight-low);
--icon: var(--rp-moon-love);
--memory: var(--rp-moon-iris);
--cpu: var(--rp-moon-rose);
--cpu-high-usage: var(--rp-moon-love);
--battery-good: var(--rp-moon-pine);
--battery-mid: var(--rp-moon-gold);
--battery-low: var(--rp-moon-love);
--focused-process: var(--rp-moon-text);
--process: var(--rp-moon-muted);
--displayed: var(--rp-moon-text);
--ws-1: var(--rp-moon-gold);
--ws-2: var(--rp-moon-love);
--ws-3: var(--rp-moon-pine);
--ws-4: var(--rp-moon-foam);
--ws-5: var(--rp-moon-iris);
--tiling-direction: var(--rp-moon-rose);
--network: var(--rp-moon-text);
--weather: var(--rp-moon-text);
--volume-start: var(--rp-moon-love);
--volume-end: var(--rp-moon-foam);
--volume-inner: var(--rp-moon-foam);
--bg-focused: var(--rp-moon-subtle) / 0.4;
--bg-unfocused: var(--rp-moon-base) / 0.5;
```

#### Dawn

```css
/* colors */
--text: var(--rp-dawn-text);
--accent: var(--rp-dawn-foam);
--bg: var(--rp-dawn-base);
--muted: var(--rp-dawn-base);
--border: var(--rp-dawn-highlight-low);
--shadow: var(--rp-dawn-highlight-low);
--icon: var(--rp-dawn-love);
--memory: var(--rp-dawn-iris);
--cpu: var(--rp-dawn-rose);
--cpu-high-usage: var(--rp-dawn-love);
--battery-good: var(--rp-dawn-pine);
--battery-mid: var(--rp-dawn-gold);
--battery-low: var(--rp-dawn-love);
--focused-process: var(--rp-dawn-text);
--process: var(--rp-dawn-muted);
--displayed: var(--rp-dawn-text);
--ws-1: var(--rp-dawn-gold);
--ws-2: var(--rp-dawn-love);
--ws-3: var(--rp-dawn-pine);
--ws-4: var(--rp-dawn-foam);
--ws-5: var(--rp-dawn-iris);
--tiling-direction: var(--rp-dawn-rose);
--network: var(--rp-dawn-text);
--weather: var(--rp-dawn-text);
--volume-start: var(--rp-dawn-love);
--volume-end: var(--rp-dawn-foam);
--volume-inner: var(--rp-dawn-foam);
--bg-focused: var(--rp-dawn-overlay) / 0.4;
--bg-unfocused: var(--rp-dawn-text) / 0.5;
```

</details>

### Catppuccin (partial)

<details>
<summary>Colors</summary>

#### Mocha (thanks @Miitto!)

```css
/* colors */
--text: var(--ctp-mocha-text);
--accent: var(--ctp-mocha-lavender);
--bg: var(--ctp-mocha-base);
--border: var(--ctp-mocha-overlay0);
--shadow: var(--cpt-mocha-crust);
--icon: var(--ctp-mocha-red);
--memory: var(--ctp-mocha-sky);
--cpu: var(--ctp-mocha-blue);
--cpu-high-usage: var(--ctp-mocha-sapphire);
--battery-good: var(--ctp-mocha-green);
--battery-mid: var(--ctp-mocha-teal);
--battery-low: var(--ctp-mocha-red);
--focused-process: var(--ctp-mocha-text);
--process: var(--ctp-mocha-subtext0);
--displayed: var(--ctp-mocha-text);
--ws-1: var(--ctp-mocha-lavender);
--ws-2: var(--ctp-mocha-mauve);
--ws-3: var(--ctp-mocha-sapphire);
--ws-4: var(--ctp-mocha-green);
--ws-5: var(--ctp-mocha-peach);
--tiling-direction: var(--ctp-mocha-rosewater);
--not-playing: var(--ctp-mocha-red);
--now-playing: var(--ctp-mocha-teal);
--weather: var(--ctp-mocha-text);
--volume-start: var(--ctp-mocha-mauve);
--volume-end: var(--ctp-mocha-flamingo);
--volume-inner: var(--ctp-mocha-lavender);
--bg-focused: var(--ctp-mocha-lavender) / 0.4;
--bg-unfocused: var(--ctp-mocha-base) / 0.5;
```

</details>

## 🎉 Background Effects & Click-Through

> [!WARNING]
> Background effects do not work in Windows 11 (Currently, supports only Windows 10). To achieve similar background effects, use an external application like [Mica For Everyone](https://github.com/MicaForEveryone/MicaForEveryone).
> Click-through works fine in all platforms, however note that it completely disables interactivity with the Zebar widget.

> [!TIP]
> The permissions needed to enable these features have been added to upstream Zebar, no need to recompile Zebar anymore!

### Enable Background Effects

In `config.json`, set the `backgroundEffect` field to one of the values provided by the schema.

### Enable Click-Through

To use click-through, you must modify the GlazeWM configuration.

- In `config.yaml`, add a new binding mode for click-through under `binding_modes`:

```yaml
binding_modes:
  ...

  # Click-through mode disables interactivity
  - name: 'ct'
```

The name of the binding mode **must** be `ct` for the commands to work properly.

- Add a keybinding to toggle click-through mode under `keybindings`:

```yaml
keybindings:
  ...

  # Sends a signal to Zebar via the binding mode
  - commands: ['wm-enable-binding-mode --name ct', "wm-disable-binding-mode --name ct"]
    bindings: ['alt+shift+c']
```

And now you can toggle click-through mode by pressing `Alt + Shift + C`.

`config.json` also provides `clickThroughByDefault` field to enable click-through mode by default on startup.

## 🧪 Taskbar Integration

This is a highly experimental feature that may not work perfectly for everyone and requires extensive tweaking. It adds spaces in the widget containing window icons and the system tray, then moves the widget to overlay the taskbar position. To make both Zebar and the taskbar functional, the taskbar must be configured specifically.

The taskbar must be:

- Always on top
- Completely transparent
- Have clickable-through empty regions (so you can interact with the Zebar widget)
- Have centered icons

After configuring the taskbar, adjust the Zebar widget sizes and margins to align the icons perfectly. In `config.css`, modify these variables:

```css
--process-icon-width: 50px;
--right-margin: 290px;
--left-margin: 50px;
```

Enable taskbar integration in `config.json`:

```json
{
   ...
   "taskbarIntegration": {
      "enabled": true,
      "extraIcons": 0,
      "primaryMonitorSelection": "all",
      "secondaryMonitorSelection": "monitor"
   }
   ...
}
```

### Windows 10 (Tested Configuration)

Download and install TaskbarX from the [official GitHub repository](https://github.com/ChrisAnd1998/TaskbarX/releases), then run it with these arguments:

`Path\To\TaskbarX\TaskbarX.exe -tbs=1 -cfsa=1 -ftotc=1 -sti=1 -as=backeaseout -rzbt=1 -tbr=25 -tbsg=1`

This creates segments with rounded corners, click-through enabled, transparency, and centered icons. You must also unpin all taskbar icons and remove the Windows search bar (or increase the left margin mentioned above). Adjust the window selection in `config.json` and Windows settings to match your preferences.

### Windows 11

This hasn't been tested. If you find a way to achieve the same taskbar effect as TaskbarX, please let me know (Windhawk might be capable of this).

## Contributing

Contributions are welcome! If you have suggestions, improvements, or bug fixes, please open an issue or submit a pull request.

An easy way to contribute is by creating theme presets, or by adding additional themes. You can also help with the process icon map in [`src/lib/icon_loader.ts`](src/lib/icon_loader.ts).
