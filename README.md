# Whiteout Survival Tracker

A free progress tracker for the mobile game Whiteout Survival. Keep several Chiefs (your game accounts), record where each one stands, and plan the next upgrades. Everything is saved in your browser. There is no account. Cloud sync is optional and keeps your data in your own storage.

This is an unofficial fan tool. It is not affiliated with, endorsed by, or connected to Whiteout Survival or Century Games. All trademarks and game content belong to their owners.

## What it does

Each Chief has one page per game area. Every change saves at once, and destructive actions can be undone.

- **Overview**: a summary of the active Chief across all areas.
- **Buildings and Daybreak Island**: building levels, upgrade costs and times, requirements, and the island.
- **Heroes and Chief Gear**: hero levels, skills, shards, hero gear, chief gear and charms.
- **Experts, Pets and Troops**: levels and plans for each.
- **Research**: research levels and the research queue.
- **Alliance, Facilities and Tech**: alliance structures and alliance tech.
- **Resources and Bonuses**: what you hold, and the bonuses that change costs and times.
- **VIP, Skins, Events and Tundra Album**: account collections and event history.
- **Core Events, Dailies and History**: event planning, daily tasks and a log of finished upgrades and events.
- **Wiki**: read only reference pages for the game data (buildings, heroes, gear, pets, research, events and more) and the server timeline.
- **Settings**: language and region, number and date formats, theme (light, dark or system), backup export and import, optional cloud sync, and reset.

Plan flyouts work out the cost and time of an upgrade from the game data. Values the data does not have yet show as Unknown or Estimate, never as 0.

## Run it

Node 24 and pnpm are required.

```
pnpm install
pnpm dev
```

Then open http://localhost:3000. Other commands:

```
pnpm build
pnpm lint
pnpm test
pnpm format:check
```

`pnpm install` also copies the game images into `public/images` (see below).

### Environment variables

All are optional and public (`NEXT_PUBLIC_`). Next.js reads them at build time, so redeploy after a change.

- `NEXT_PUBLIC_DISCORD_INVITE`: a bare Discord invite code. The footer shows a Join Discord link when it is set.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_DROPBOX_CLIENT_ID`, `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`: override the client IDs of the sync providers. The package `@gamerdexapp/gamerdex-sync` has defaults.
- `NEXT_PUBLIC_GAMERDEX_AUTH_URL`: override the address of the sign-in service. The package has a default.

## Project structure

- `src/app`: routes. Each tracker route has a `page.tsx` and a `layout.tsx` for its metadata.
- `src/components`: the app shell, the shared UI kit in `ui/`, and one folder per game area.
- `src/data`: navigation, the Wiki page list, site settings, and `game/`, the only place that imports the data package.
- `src/lib`: contexts, hooks and services (storage, queues, backup, calculators).
- `src/i18n`: the language setup and the text catalogs.
- `scripts`: asset copy and the text check.

## Game data

The game data comes from the `whiteout-survival-data` package, pinned to one exact version. Names, costs, times, stats and images are read from it and never copied by hand. The script `scripts/copy-game-assets.sh` copies the image folders the app uses from the package into `public/images`. That folder is not committed.

## Data and privacy

Everything you enter is stored in your browser under one `localStorage` key, `whiteout-survival-tracker`. The tracker has no analytics code and no account. Clearing site data removes it, so use Settings, Backup and data to export a JSON file. You can import it again later, on this device or another.

Cloud sync is off until you turn it on in Settings, Cloud sync. You choose GitHub, Google Drive, Dropbox or OneDrive, and the app keeps one file in your own storage. A small sign-in service, [gamerdex-auth](https://github.com/gamerdexapp/gamerdex-auth), only exchanges the login token and does not see or keep your data. The privacy policy and terms are at https://gamerdex.app/privacy and https://gamerdex.app/terms.

## Language support

The app ships in 19 languages: English, Arabic, German, Spanish (Spain and Latin America), French, Indonesian, Italian, Japanese, Korean, Malay, Portuguese (Brazil and Portugal), Russian, Thai, Turkish, Vietnamese and Chinese (Simplified and Traditional). The text lives in catalogs under `src/i18n/messages/<code>/`, so a new language is a new catalog folder and one entry in `src/i18n/locales.ts`. Game data such as item and event names stays in English. Number and date formats are separate choices in Settings.

## Design

The design plan and the page boards are kept in the `gamerdex-plan` repo, folder `whiteout-survival-tracker/`.

## License

MIT. See [LICENSE](LICENSE). The game, its name and its content belong to their owners.
