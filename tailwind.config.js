// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultTheme = require("tailwindcss/defaultTheme");
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        zb: {
          text: "hsl( var(--text) )",
          base: "hsl( var(--bg) )",
          muted: "hsl( var(--muted) )",
          border: "hsl( var(--border) )",
          shadow: "hsl( var(--shadow) )",
          "bg-focused": "hsl( var(--bg-focused) )",
          "bg-unfocused": "hsl( var(--bg-unfocused) )",
          icon: "hsl( var(--icon) )",
          memory: "hsl( var(--memory) )",
          cpu: "hsl( var(--cpu) )",
          "cpu-high-usage": "hsl( var(--cpu-high-usage) )",
          battery: {
            good: "hsl( var(--battery-good) )",
            mid: "hsl( var(--battery-mid) )",
            low: "hsl( var(--battery-low) )"
          },
          "focused-process": "hsl( var(--focused-process) )",
          process: "hsl( var(--process) )",
          displayed: "hsl( var(--displayed) )",
          ws: {
            0: "hsl( var(--ws-1) )",
            1: "hsl( var(--ws-2) )",
            2: "hsl( var(--ws-3) )",
            3: "hsl( var(--ws-4) )",
            4: "hsl( var(--ws-5) )"
          },
          accent: "hsl( var(--accent) )",
          "tiling-direction": "hsl( var(--tiling-direction) )",
          network: "hsl( var(--network) )",
          weather: "hsl( var(--weather) )",
          volume: {
            start: "hsl( var(--volume-start) )",
            end: "hsl( var(--volume-end) )",
            inner: "hsl( var(--volume-inner) )"
          }
        },
        blend: generateBlends()
      },
      borderRadius: {
        base: "var(--radius)"
      },
      borderWidth: {
        DEFAULT: "var(--border-size)"
      },
      boxShadow: {
        button:
          "var(--shadow-size-button) var(--shadow-size-button) 0 hsl(var(--shadow))",
        bar: "var(--shadow-size-bar) var(--shadow-size-bar) 0 hsl(var(--shadow))",
        "inverted-l": "var(--radius) 0 0 0 hsl(var(--bg))",
        "inverted-r": "calc(-1*var(--radius)) 0 0 0 hsl(var(--bg))"
      },
      translate: {
        boxShadowX: "var(--shadow-size-button)",
        boxShadowY: "var(--shadow-size-button)",
        reverseBoxShadowX: "-var(--shadow-size-button)",
        reverseBoxShadowY: "-var(--shadow-size-button)"
      },
      transitionDuration: {
        DEFAULT: "var(--transition-duration)"
      },
      fontFamily: {
        zb: ["var(--font-family)", ...defaultTheme.fontFamily.sans]
      },
      fontWeight: {
        base: "var(--font-weight)"
      },
      fontSize: {
        "zb-size": "var(--font-size)"
      },
      height: {
        bar: "var(--height)",
        radius: "var(--radius)"
      },
      width: {
        radius: "var(--radius)",
        processIcon: "var(--process-icon-width)"
      },
      inset: {
        radius: "var(--radius)"
      },
      margin: {
        zbx: "var(--bar-margin-x)",
        zby: "var(--bar-margin-y)",
        zrby: "var(--right-margin)",
        zlby: "var(--left-margin)"
      },
      padding: {
        zrby: "var(--right-margin)",
        zlby: "var(--left-margin)"
      }
    }
  },
  safelist: [
    "text-zb-ws-0",
    "text-zb-ws-1",
    "text-zb-ws-2",
    "text-zb-ws-3",
    "text-zb-ws-4",
    "border-zb-ws-0",
    "border-zb-ws-1",
    "border-zb-ws-2",
    "border-zb-ws-3",
    "border-zb-ws-4",
    "justify-self-start",
    "justify-self-center",
    "justify-self-end"
  ],
  plugins: []
};

function generateBlends() {
  const blends = {};
  for (let i = 5; i <= 100; i += 5) {
    blends[i] = `color-mix(in srgb, currentColor ${i}%, transparent)`;
  }
  return blends;
}
