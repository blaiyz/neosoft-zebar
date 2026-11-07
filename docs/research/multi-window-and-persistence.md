# Settings and multiple windows in a Zebar pack

Date: 2026-11-06. Zebar 3.3.1 on Windows 10, with WebView2 based on Chromium 156. Source paths are in `glzr-io/zebar` `main` at that date. Measurements come from a throwaway widget run in real Zebar, across two monitors at 150% scaling.

Question: if a settings window changes options, where do they go, and what can a pack's windows do together?

## Where settings can live

- **Widgets can't write files.** `packages/desktop/capabilities/widget.json` grants no filesystem permission. The only route is a shell command through `shellExec`, which would need a write rule in the published `zpack.json`.
- **Marketplace packs install into a folder per version** (`<author>.<pack>@<version>`). A file a user edits there is left behind by the next update.
- **`localStorage` lives outside that folder,** in `%AppData%\zebar\webview-cache\<pack id>\`. The pack ID has no version in it, so storage survives updates.
- **All widgets in a pack share that storage.** Zebar's source says so in a comment on `data_directory`, and the measurements below confirm it.
- **"Empty cache & reload configs" only clears the service worker cache,** so it doesn't touch `localStorage`.
- **Local and marketplace builds have different pack IDs,** so they don't share settings.
- **`zpack.json` can't move.** Height and docked edge are read when Zebar creates the window.

| Option                                                | Survives updates | Hand-editable | Problem                                                                         |
| ----------------------------------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------- |
| `config.json` as the source, written by PowerShell    | No               | Yes           | Lost on update, a process per save, and a published pack with a write privilege |
| `localStorage` only                                   | Yes              | No            | No file for dotfile users, and a broken document can't be fixed by hand         |
| `localStorage` as the source, `config.json` as import | Yes              | Yes           | Needs a clear rule for who wins                                                 |

The third is what the pack does, and the rule is that the last change wins: the file applies when its text changes, and is ignored after that.

Limits of this choice: clearing `%AppData%\zebar\webview-cache` loses settings, and Chromium flushes `localStorage` to disk shortly after a write, so a hard kill within seconds could lose the last change.

## Talking between windows

Each measured once, with both windows open.

| Mechanism          | Latency | Note                                            |
| ------------------ | ------- | ----------------------------------------------- |
| `BroadcastChannel` | 0-1 ms  | Also works across browser tabs under `dev:mock` |
| Tauri events       | 5 ms    | Needs Tauri, so the mock can't exercise it      |
| `storage` event    | 0-14 ms | Only says a key changed                         |

## Popup windows

- **`startWidget` can't pass arguments,** so a popup has to read its job from storage.
- **It makes a new window every call.** A preset start is a no-op if already open, but `startWidget` isn't.
- **Opening takes 157-236 ms** from the call to the popup's first script, which is quick enough that keeping a hidden window ready isn't worth it.
- **`setFocus` is denied by ACL,** and `start-dragging` isn't granted either. `setPosition`, `setSize`, `show`, `hide` and `close` are allowed. So a hidden window couldn't take focus when shown, which rules out blur-to-close for it.
- **`monitorSelection: { type: "name", match }` places a popup on the right monitor.** Offsets are logical pixels multiplied by the monitor's scale, and negative offsets from `bottom_right` work.
- **Moving a window with `setPosition` works,** at about 4 ms a call.
- **Closing on `tauri://blur` works,** from a normal window and from one with the bar's window settings, with `focused: true` in the popup's `zpack.json`.
  - `isFocused()` returned false on every popup, even with `document.hasFocus()` true, so only the events can be trusted.
  - Clicking the button that opened a popup closes it and then reopens it, because the click lands after the blur. The gap is however long the mouse button is held, about 100 ms in these tests, so a time window can't separate the two. Deciding on `pointerdown`, before the blur, can.
  - A file picker takes focus, so a popup that opens one has to stop closing on blur first.
- **Downloads, file pickers and clipboard writes work in a widget.** A download saves to the user's Downloads folder and gives no visible sign at all. Clipboard reads need the document to be focused.

## Other

- **`includeFiles` patterns are merged across a pack's widgets,** so `["**"]` on one widget covers the others.
- **A reload restores every open widget** and reruns its startup code.
- **Media `sessionId` is the app's identifier** (`Spotify.exe` here), and `focus --container-id` works from a widget.
- **The systray provider has known problems.** It creates a `Shell_TrayWnd` window ([#301](https://github.com/glzr-io/zebar/issues/301)), and `id`, `iconHash` and `iconUrl` regenerate on each update ([#328](https://github.com/glzr-io/zebar/issues/328)). It wasn't enabled for any of this.
- **Dock-to-edge has reported crashes** ([#326](https://github.com/glzr-io/zebar/issues/326)), so popups leave it off.

## Sources

- [glzr-io/zebar](https://github.com/glzr-io/zebar): `packages/desktop/capabilities/widget.json`, `packages/desktop/src/widget_factory.rs`.
- [mushfikurr/overline-zebar](https://github.com/mushfikurr/overline-zebar): a pack that keeps settings in `localStorage` with export and import, closes popups on `tauri://blur`, and places them from an element's rectangle. It has no license file, so its approach was studied and none of its code was copied.

## Open questions

- Whether a tray app's right-click menu survives a popup closing on blur.
- Two popups in the tests logged no blur at all. They were probably closed with their Close button, which wasn't logged.
