# Chrona ⏰

Chrona is a cozy room of time tools: a countdown timer, stopwatch, Pomodoro, world clock and alarms, set in a hand-drawn anime room with rain on the window and a sleepy cat named Mochi on the rug.

It's built with **Next.js**, **React**, **TypeScript**, **Tailwind CSS** and **shadcn/ui**. The room is drawn entirely in SVG, with no images, and every sound is synthesized with the Web Audio API.

> **Status:** Chrona is actively under development.

---

## The room

* 🏠 **A real room in perspective.** It has a bookcase, desk, chair, bed, rug and clutter, drawn with a small one-point-perspective camera ([`components/scene/projection.ts`](components/scene/projection.ts)).
* 🌤️ **Time of day.** Morning, day, evening and night follow your clock, or you can pick one.
* 🌸 **Seasons.** Sakura in spring, fireflies and fireworks in summer, falling leaves and persimmons in autumn, snow in winter.
* 🌧️ **Weather.** Clear, drizzle, storm or snow, with drops running down the glass and lightning at night.
* ☀️ **Light.** Sun and moon patches are cast through the window panes onto the floor and desk, with soft light shafts and dust motes, plus a warm desk lamp.
* 🐈 **Mochi has a mind of her own.** She sleeps, stretches, sits, grooms, yawns, bats her yarn and watches the window when a train or birds pass.
* 🚃 **Things happen outside.** Trains roll through the valley, birds fly over, stars fall, a plane blinks past at night.
* 👆 **Almost everything is clickable.** Pet the cat, sip the tea, switch the lamp, play the radio, pull an omikuji fortune, ring the summer fūrin, or tap the teru teru bōzu to change the weather.
* 🎧 **Ambient sound.** Rain, wind, birds, cicadas and crickets, all generated live.

## Tools

* ⏳ **Timer** with presets, a time editor and quick adds.
* ⏱️ **Stopwatch** with laps, highlighting your best and slowest.
* 🍅 **Pomodoro** with custom lengths, auto-start options and daily stats.
* 🌍 **World clock** with a draggable 24-hour timeline to compare times across cities.
* ⏰ **Alarms** with repeat days and a sound per alarm.

The timer, stopwatch and Pomodoro keep running while you switch tools, and even across reloads. They show up in the top bar and the tab title, and finish with a sound on any page.

## Extras

* 🎵 **15 synthesized tones** in five categories (gentle, classic, Japanese, cute, nature), with previews.
* ⌨️ **Keyboard shortcuts:** Space start/pause, R reset, L lap, S skip, G watch the rain.
* 🔔 **Optional desktop notifications** when something finishes in a background tab.
* 👁️ **Watch-the-rain mode** hides the interface; the interface also fades while you're idle.
* 💾 **Everything stays in your browser.** No account.

---

## Available Routes

| Route          | Tool            |
| -------------- | --------------- |
| `/`            | Landing page    |
| `/timer`       | Countdown timer |
| `/stopwatch`   | Stopwatch       |
| `/pomodoro`    | Pomodoro timer  |
| `/world-clock` | World clock     |
| `/alarms`      | Browser alarms  |
| `/settings`    | Sounds, room and clock settings |
| `/feedback`    | Feedback form   |

---

## Tech Stack

* **Framework:** Next.js App Router
* **Language:** TypeScript
* **UI:** React
* **Styling:** Tailwind CSS
* **Components:** shadcn/ui
* **Icons:** Lucide React
* **State Management:** Zustand
* **Persistence:** Zustand persist middleware and browser storage
* **Analytics:** Microsoft Clarity and Vercel Analytics
* **Email:** Resend
* **Deployment:** Vercel

---

## Architecture

Chrona uses the Next.js App Router and separates application-shell concerns from individual productivity tools.

* **`components/scene/`** is the room. `landscape.tsx` draws the view outside, `rain-canvas.tsx` the weather, `room-*.tsx` the room in perspective (via `projection.ts`), `room-cat.tsx` Mochi and her behavior, and `ambience-sound.ts` the soundscape.
* **`components/shell/`** holds the interface around the tools: the top bar, dock, tool frame, dialogue box and room controls.
* **`components/tools/`** holds one folder per tool.
* **`stores/`** contains Zustand stores. The timer, Pomodoro and stopwatch run on wall-clock end times, so they survive navigation and reloads.
* **`lib/scene-time.ts`** resolves time of day, season and weather. A tiny boot script applies them before the first paint, so there's no flash.
* **`lib/sounds.ts`** and **`lib/sfx.ts`** synthesize every tone and sound effect.

This structure keeps the application modular and makes it easier to introduce new tools without duplicating infrastructure.

---

## Getting Started

### Prerequisites

Install:

* Node.js 20 or newer
* npm

### Clone the repository

```sh
git clone https://github.com/codingwithasim/chrona.git
cd chrona
```

### Install dependencies

```sh
npm install
```

### Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_CLARITY_ENABLED=false
NEXT_PUBLIC_CLARITY_PROJECT_ID=
```

Additional environment variables may be required to enable the production feedback email integration.

Analytics can remain disabled during local development:

```env
NEXT_PUBLIC_CLARITY_ENABLED=false
```

### Start the development server

```sh
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production Build

Create and run an optimized production build locally:

```sh
npm run build
npm run start
```

Before deploying, set the canonical production URL:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

The production URL is used for canonical links, sitemap entries, structured data, and social previews.

---

## Design Goals

Chrona aims to be:

* Minimal and distraction-free
* Fast and lightweight
* Accessible on desktop and mobile
* Useful without requiring an account
* Modular and maintainable
* Privacy-conscious
* Easy to extend with additional productivity tools

---

## Privacy

Chrona stores supported application data locally in the browser.

Microsoft Clarity analytics are loaded only according to the application's analytics-consent configuration. Some browsers, privacy extensions, and network-level blockers may prevent analytics from loading.

Chrona does not use Clarity for advertising.

---

## Roadmap

### Completed

* [x] Countdown timer
* [x] Stopwatch with laps
* [x] Pomodoro timer
* [x] World clock
* [x] Multiple browser alarms
* [x] Alarm labels
* [x] Local alarm persistence
* [x] Light and dark mode
* [x] Responsive desktop and mobile layouts
* [x] Feedback form
* [x] Analytics consent
* [x] Route-specific SEO metadata
* [x] Sitemap and robots configuration
* [x] Open Graph and social previews
* [x] Structured data
* [x] Web app manifest and application icons

### Planned

* [ ] Planner
* [ ] Calendar utilities
* [ ] Expanded keyboard shortcuts
* [ ] Additional notification options
* [ ] More user preferences
* [ ] Additional productivity tools
* [ ] Progressive Web App improvements

---

## Contributing

Contributions, suggestions, and bug reports are welcome.

To contribute:

1. Fork the repository.

2. Create a feature branch.

   ```sh
   git checkout -b feature/your-feature
   ```

3. Commit your changes.

   ```sh
   git commit -m "Add your feature"
   ```

4. Push the branch.

   ```sh
   git push origin feature/your-feature
   ```

5. Open a pull request.

Please keep changes focused, strongly typed, and consistent with the existing application architecture.

---

## License

Chrona is licensed under the [MIT License](LICENSE).
