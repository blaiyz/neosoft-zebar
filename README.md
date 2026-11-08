# Neosoft [Zebar](https://github.com/glzr-io/zebar)

A Zebar configuration forked from [Neobrutal Zebar](https://github.com/adriankarlen/neobrutal-zebar) for Zebar V3, built with Svelte and Tailwind. This project would not have been possible without the original, please give it a star!

## ✨ Features

- Process icons for the current workspace with focus indicators
- System information meters with dynamic coloring and animations
- Smooth animations
- Media controls
- A settings window with live preview, and sharing of settings and themes as a file
- Flyouts for audio devices, media players, the calendar, network and system details, and power options
- Customizable layout and appearance
- Built-in auto-tiler
- Multi-monitor support
- Windows Taskbar integration (experimental)
- Background effects (Acrylic, Blur, Mica)
- Click-through ability (disable interactivity and cursor events to windows below)

## 🖼️ Showcase

![The bar over a forest wallpaper](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/overview.jpg)

![The system flyout](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/system.jpg)

![The bar in six presets, with different workspace and media styles](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/themes.jpg)

More in the [Gallery](#-gallery).

### Taskbar Integration

![The bar at the bottom with taskbar integration, the Windows taskbar's icons in the middle and the system tray on the right](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/taskbar-integration.jpg)

## 🚀 Getting Started

### Simple Installation

For both installation methods, you can change the settings as needed (see [Configuration](#-configuration) and [Themes](#-themes))

#### Marketplace

You can now easily install Neosoft Zebar from the Zebar marketplace! Simply search for neosoft-zebar and click install.

The installation location is in `%appData%\zebar\downloads\blaiyz.neosoft-zebar@<version>` (you can find the config files there).

#### Manual

Download `neosoft-zebar.zip` from the latest release. Extract the contents into a folder and place it in your Zebar config directory.

### Advanced Installation (Building from Source)

#### Prerequisites

- [Node.js](https://nodejs.org), the version in `.node-version`.
- [pnpm](https://pnpm.io/installation), the version in the `packageManager` field of `package.json`. The repository is set up for pnpm only.

#### Instructions

1. Download the repository and extract it anywhere
2. To avoid copying files on each rebuild, create a symlink in the Zebar config directory that points to `path/to/repo/neosoft-zebar/build`
3. Navigate to the root directory of neosoft-zebar
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Start the dev build, which rebuilds on every change:
   ```bash
   pnpm run dev
   ```
6. Reload Zebar once. After that the widget reloads itself after each rebuild.

> [!NOTE]
> `pnpm run dev` creates a local static folder called `dev_static`. This folder is not committed. Use this folder for your custom configurations without affecting the original files. In general, don't use `pnpm run build` unless you are making production changes.

To work on the look of the bar in a normal browser, `pnpm run dev:mock` starts a dev server with hot reload and fake data.

## 🔧 Configuration

Neosoft Zebar keeps its settings in Zebar's storage, not in the folder of the installed pack, so they survive updates. There are two ways to change them, and they can be mixed.

**The settings window** opens from the gear at the left end of the bar, or from the `settings` widget's `default` preset in Zebar's tray menu. Changes apply to every bar as you make them. Its Config page exports your settings or just your theme, to the clipboard or to your Downloads folder, and imports them again, so a theme can be shared by pasting it. Exports leave out which tray icons are pinned and their order, since those are your PC's apps. Undo there goes back to before the last import or reset.

**`config.json`** ships together with the bundle. Edit it and reload Zebar with **Empty cache & reload configs** from its tray menu.

Only write what you want to change. Everything else keeps its default, and a new release can improve those defaults for you:

```jsonc
{
  "$schema": "./schema.json",
  "version": 2,
  "bar": { "direction": "bottom", "gradient": "solid" },
  "theme": { "preset": "nord" },
  "sections": { "cpu": true, "power": false },
  "clock": { "showSeconds": true }
}
```

To see the description and value options for each field, open `config.json` in VSCode (or any editor that supports json schemas), which detects the schema (shipped together in `schema.json`) and provides intellisense for each field.

**The last change wins.** `config.json` is applied whenever its contents change, and is ignored after that. Replacing it during an update changes nothing, because the settings it carried are already stored.

**Mistakes don't break the bar.** A value that isn't valid is ignored and everything else still applies. A warning icon appears in the bar until the file is fixed. Hover over it to see which settings were ignored.

**Sections** can be `true` (always shown), `false` (removed, along with the data it collects, except the disks, which the System flyout always shows) or `"auto"`, the default, which shows what there's room for. `network` can also be `"interface"` or `"statistics"`. `disk` and `keyboard` are off until you turn them on. `bar.primaryMonitorOnly` lists the sections that only appear on the primary monitor.

**Arranging:** drag sections between the left, middle and right groups on the Sections page of the settings window. The workspaces move the same way, and the settings, power and heart buttons move together. With taskbar integration, the taskbar's icons stay in the centre, and what you put in the middle group sits either side of them. In `config.json` this is `arrangement`, a list for each group.

**Styles:** `workspaces.style` and `media.style` each offer four looks, shown as live previews on the Sections page of the settings window.

**Performance:** the bar is always on screen, so `performance.animations` can cut how much it animates. `interactive`, the default, only animates what you do, like hovering the bar or switching workspaces, `all` animates every change, like the meters as readings come in, and `none` turns animations off. Turning off `performance.keepFlyoutsReady` saves around 40 MB by closing the flyout window when it's unused, at the cost of a second's wait when a flyout starts it again. Longer `providers.refreshIntervals` save CPU and GPU too. These are on the Behavior page of the settings window.

When the bar runs out of room, `"auto"` sections shorten and then hide, least useful first, and come back when there's room again. A section set to `true` never gives way, so the others make room for it. `clock.fullDate` and `workspaces.thinButtons` work the same way.

Right-clicking the clock switches the date on or off, and saves it. Turning it on sets `clock.fullDate` to `"preferred"`: other sections give way to it, but it can still collapse if they can't make enough room, and if there's no room for it at all, the click does nothing. Clicking the weather switches the unit, which is saved too. Saved settings apply to every monitor.

Some settings have to be configured in `zpack.json`, which is the configuration file Zebar uses (shipped together as well). In there, you have options to change the size and positioning of the widget.

> [!NOTE]
> If you're using window scaling in Windows, you may need to edit `zpack.json` to set the correct height (default is `40px`).

### Flyouts

Clicking a section opens a popup beside it, which closes when you click anywhere else:

| Section                      | Flyout                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| Volume                       | A slider and mute button for every playback and recording device           |
| Clock                        | A calendar with week numbers                                               |
| Network                      | Addresses, link speed, totals and a graph of recent traffic                |
| CPU, memory, disk or battery | Recent usage, disks, battery health and uptime                             |
| Media title                  | Every player, with its artist, album, progress and controls                |
| Power                        | Lock, sleep, sign out, restart and shut down, which all ask you to confirm |

Restarting and shutting down wait a minute, and the Power flyout can cancel them. Scrolling changes the volume over the volume icon, the workspace over the workspaces, and the player over the media section.

### System tray (experimental)

`sections.tray` shows the tray in a flyout, with any icons you pin in the bar. Drag icons to rearrange them, or to the top of the flyout to pin them.

> [!WARNING]
> It's off by default because Zebar's tray provider can break the native system tray on Windows 10 until Explorer restarts ([zebar#301](https://github.com/glzr-io/zebar/issues/301)). This part of the pack hasn't been tried against the real provider yet, and order and pins are matched by tooltip, because Zebar's icon ids change on every update.

### Upgrading from 1.x

Your old `config.json` still works: put it back and reload, and it's converted. Sections you had left on become `"auto"`, and anything you turned off stays off.

`config.css` is no longer read, but it's still valid: rename it to `custom.css`, and it keeps working (see [Custom CSS](#custom-css)). Keep only the lines you changed, because anything set there wins over the settings: a color stays the same in every theme, and `--font-family`, `--font-size`, `--radius` and the taskbar integration sizes would override `theme.fontFamily`, `theme.fontSize`, `theme.radius` and `taskbarIntegration`. The 1.x template's Montserrat font isn't included any more.

## 🎨 Themes

Pick a preset with `theme.preset`:

| Preset                                                                              | Theme                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tau`                                                                               | Tau, the default                                 |
| `rose-pine`, `rose-pine-moon`, `rose-pine-dawn`                                     | [Rosé Pine](https://rosepinetheme.com/)          |
| `catppuccin-mocha`, `catppuccin-macchiato`, `catppuccin-frappe`, `catppuccin-latte` | [Catppuccin](https://catppuccin.com/)            |
| `nord`                                                                              | [Nord](https://www.nordtheme.com/)               |
| `material`                                                                          | [Material](https://m2.material.io/design/color/) |

To change individual colors, use `theme.colors`, with HSL-encoded colors without commas. A color can also point at another with `var(--name)`: one of the theme's own, such as `var(--ws-2)`, which follows the preset, or any color in the [bundled palettes](https://github.com/blaiyz/neosoft-zebar/tree/main/src/themes). The Sections page of the settings window has each section's colors, with the theme's own as swatches. The names are in [`presets.css`](https://github.com/blaiyz/neosoft-zebar/blob/main/src/themes/presets.css).

```json
{
  "theme": {
    "preset": "tau",
    "colors": {
      "text": "0 73% 56%",
      "accent": "var(--rp-love)"
    }
  }
}
```

`theme` also sets the corner radius with `radius` and the font with `fontFamily` (Figtree is bundled as `Figtree Variable`).

### Custom CSS

For everything else, create a file called `custom.css` beside `config.json`, and reload Zebar with **Empty cache & reload configs**. It's added after the theme, so it can override any of the variables in `presets.css`, such as `--bar-margin-x` or `--shadow-size-bar`, and it can style anything else too:

```css
:root {
  --bar-margin-x: 0.5rem;
  --accent: 300 100% 50%;
}
```

Like `config.json`, it applies when its contents change, and the CSS is then stored, so it survives updates even though the file stays behind in the old version's folder. To remove your CSS, empty the file. Deleting it keeps the last CSS you imported.

For a line or two, `theme.customCss` in `config.json` does the same job:

```json
{ "theme": { "customCss": ":root { --bar-margin-x: 0.5rem; }" } }
```

> [!TIP]
> To scale the entire widget, you need to both increase height in `zpack.json` and increase `theme.fontSize`. Neosoft Zebar's component sizes are all sized relative to the font size.

## 🎉 Background Effects & Click-Through

> [!WARNING]
> Background effects may not work correctly on Windows 11: they have been seen to disappear, leaving the bar opaque, once it loses focus. They work on Windows 10, except `mica`, which is Windows 11 only. For similar effects, you can use an external application like [Mica For Everyone](https://github.com/MicaForEveryone/MicaForEveryone).
> Click-through works fine in all platforms, however note that it completely disables interactivity with the Zebar widget.

> [!NOTE]
> Background effects and click-through need Zebar 3.2 or newer.

### Enable Background Effects

In `config.json`, set `bar.backgroundEffect` to one of the values provided by the schema.

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

Enable taskbar integration in `config.json`, and adjust the Zebar widget sizes and margins to align the icons perfectly:

```json
{
   ...
   "taskbarIntegration": {
      "enabled": true,
      "extraIcons": 0,
      "primaryMonitorSelection": "all",
      "secondaryMonitorSelection": "monitor",
      "iconWidth": "50px",
      "marginLeft": "50px",
      "marginRight": "290px"
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

## 📷 Gallery

The bar over a forest wallpaper, with the `keys` workspace style and the `pill` media style:

![The bar over a forest wallpaper](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/overview.jpg)

The system flyout, with the `track` workspace style and the `capsule` media style:

![The system flyout](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/system.jpg)

The network flyout in Catppuccin Mocha, with the `string` workspace style:

![The network flyout in Catppuccin Mocha](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/network.jpg)

The media flyout, with a player for each app, and the `solid` workspace style and `tucked` media style:

![The media flyout with two players](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/media.jpg)

The audio flyout in Rosé Pine, with the `equalizer` media style:

![The audio flyout in Rosé Pine](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/audio.jpg)

The calendar flyout:

![The calendar flyout](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/calendar.jpg)

Six of the presets:

![The bar in six presets](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/themes.jpg)

The settings window's Appearance page:

![The settings window's Appearance page](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/settings.jpg)

The Sections page, with a map of the bar to pick a part from, and the workspace styles:

![The settings window's Sections page](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/sections.jpg)

Taskbar integration:

![The bar with taskbar integration](https://raw.githubusercontent.com/blaiyz/neosoft-zebar/main/misc/taskbar-integration.jpg)

## Contributing

Contributions are welcome! If you have suggestions, improvements, or bug fixes, please open an issue or submit a pull request.

An easy way to contribute is by creating theme presets, or by adding additional themes. You can also help with the process icon map in [`src/lib/icon_loader.ts`](https://github.com/blaiyz/neosoft-zebar/blob/main/src/lib/icon_loader.ts).

Before opening a pull request, run `pnpm verify`, which runs the linters, the type check and a build.

## Acknowledgements

The settings window, the flyouts and keeping settings in `localStorage` were inspired by [overline-zebar](https://github.com/mushfikurr/overline-zebar) by [mushfikurr](https://github.com/mushfikurr).
