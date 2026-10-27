# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Resources: the Resources category on the All items tab shows a total card for Meat, Wood, Coal and Iron, and an Any card with the most each resource can reach from the Custom Resource chests; the Experts category shows cards for the Common Sigils, Books and total Affinity from the gifts
- Resources: a Core Resources tab with a collapsible Resources section for the Meat, Wood, Coal and Iron counts and the backpack stacks, including the Secured packs and the Custom Resource chests. It saves to the same counts as the All items tab, which keeps the earlier Resources view; a Fire Crystal section in one compact row holds the Fire Crystal, Fire Crystal Shard and Refined Fire Crystal counts; a Speedups section has one row per speedup type with a count for each duration; an Experts section holds the Expert Sigils, the affinity gifts, and the Common Expert Sigil and Book of Knowledge counts; a Pets section holds the advancement materials with the Pet Advancement Materials Custom Chest, and the pet food with the Wild Marks; a Hero Gear section holds the Enhancement XP Components, Essence Stones and Mithril, plus Mythic Hero Gear and the hero gear chests; a Chief Gear and Charms section holds the Chief Gear materials, the Chief Charm materials, and a row for their chests; a Hero Shards section lists the shard count of each hero up to the unlocked generation, and hides heroes with every star unless a switch is on; a General shards row shows the Rare, Epic and Mythic General Hero Shards, and hides the Rare or Epic one once every hero of that rarity has every star; rows for the Expedition and Exploration skill manuals, which hide once every hero of that rarity has maxed skills in that branch
- VIP: a daily sign-in button that adds the XP of the streak day, with Undo. The streak grows each UTC day and starts again after a missed day, and a field to set the streak day of today

### Changed

- Game data package 0.9.0: new Resources, Chief Material and Hero Gear Material item categories, a Shard item for every hero, the Enhancement XP Component split into the 10 and the 100, and new pieces and puzzle pictures in the Tundra Album
- The Wiki lists Justus. The Experts page leaves him out until the package has his stat bonus

### Fixed

- Buildings Plan: Add a building no longer lists a building that is at its final level, such as the Research Center at level 30. Buildings that the server age has not unlocked stay in the list, greyed out

## [0.1.0] - 2026-10-18

First release.

### Added

- App shell with the sidebar, mobile drawer, chief switcher, Saved chip, toasts with Undo, and the Frostbound light and dark theme
- Chiefs: create, edit, search, sort, set active and delete with Undo, each with a server start date and the heroes unlocked
- Settings: language and region, number and date formats, calculator defaults, theme, backup export, import with a full check and a Merge or Replace review, and reset
- Buildings, Daybreak Island and Research with upgrade queues, Plan flyouts and an upgrade log
- Heroes, hero gear, Chief Gear, Experts, Pets and Troops
- Alliance, Facilities and Tech
- Resources and Bonuses
- VIP, Skins, Events and Tundra Album
- Core Events, Dailies and History with event logs
- Overview of the active Chief
- Wiki: read only reference pages for the game data, record pages, and the server timeline
- Search engine setup: sitemap, robots rules, page metadata, a social preview image and structured data for the app and the public Wiki pages
- Footer with links to the main pages, Settings, backup and the About tab, plus the disclaimer
- 19 languages with their own number and date formats, in text catalogs for every page
- Cloud sync to GitHub, Google Drive, Dropbox or OneDrive, with a first sync review, conflict handling and sign-in that stays valid between visits
- The tab of every tabbed page in the address, so a link opens the same tab
- Castle position, pet skill and Chief Order boosts on the Start upgrade and Start training flows, off at each start
- Alliance prestige buildings with a tier for each, counted on the Bonuses page
- Core event dates that fill in from the cycle set on the Events page
- Footer links to the privacy policy, the terms and an optional Discord invite from `NEXT_PUBLIC_DISCORD_INVITE`
- MIT license file

### Changed

- Tracker pages are marked noindex and left out of the sitemap. Only the Wiki is indexable.
