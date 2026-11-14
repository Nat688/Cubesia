# Cubesia website: developer wiki
Static website of the Cubesia Minecraft server, built with Jekyll and hosted on GitHub Pages: https://nat688.github.io/Cubesia/
## Contents
- [1. Overview](#1-overview)
- [2. Project structure](#2-project-structure)
- [3. Configuration](#3-configuration)
- [4. Pages](#4-pages)
- [5. Wiki conventions](#5-wiki-conventions)
- [6. Patch notes](#6-patch-notes)
- [7. Prices and icons](#7-prices-and-icons)
- [8. Display, themes and saved settings](#8-display-themes-and-saved-settings)
- [9. Tools](#9-tools)
- [10. GitHub Actions](#10-github-actions)
- [11. Issues and labels](#11-issues-and-labels)
- [12. Common tasks](#12-common-tasks)
- [13. Known limits](#13-known-limits)
## 1. Overview
- Static site: no build step is needed on your machine, GitHub Pages runs Jekyll.
- One layout (`_layouts/default.html`) is used by every page.
- Visible text is in English, the wiki also exists in French (EN / FR button).
- Each page loads its own CSS and JS, shared code lives in `base.css`, `theme.css`, `theme.js` and `doc.js`.
- The repository files are kept without comments or blank lines.
## 2. Project structure
| Path | Role |
|---|---|
| `_layouts/default.html` | Header, footer, theme loading, maintenance mode |
| `_config.yml` | Site settings (see section 3) |
| `_data.yml` | Patch file used by the plugin, generated from `patch.html` |
| `_data/prices.json` | Item prices, generated from `worth.yml` |
| `_data/staff.yml` | Staff roles, colors and members |
| `*.html` | One file per page |
| `styles/` | One CSS file per page, plus `base`, `theme`, `doc`, `minecraft` |
| `scripts/` | One JS file per page, plus `theme`, `doc`, `lucide.min.js` |
| `scripts/wiki-fr.json` | French dictionary of the wiki |
| `images/` | Logos, `wiki/` screenshots, `icon/` small icons |
| `_tools/` | Python and JS helpers (section 9) |
| `.github/` | Workflows, issue templates, labels |
| `feed.xml`, `sitemap.xml`, `robots.txt` | RSS, sitemap, robots |
## 3. Configuration
All settings are in `_config.yml`.
| Key | Purpose |
|---|---|
| `maintenance` | `true` shows the maintenance page on every URL |
| `discord_server_id` | Discord server used for the online players counter |
| `goatcounter` | GoatCounter site code, empty disables analytics |
| `apply_endpoint` | URL of the Cloudflare Worker that receives applications |
| `item_icon_url` | Icon URL template, `{name}` is the wiki file name and `{id}` the item id |
| `minecraft_style` | `true` makes the Minecraft style the default for new visitors |
## 4. Pages
| Page | Files | Notes |
|---|---|---|
| Home | `index.html`, `styles/index.css` | IP copy, counters, latest patch read from `patch.html` |
| Wiki | `wiki.html`, `wiki.js`, `doc.js`, `wiki.css`, `wiki-fr.json` | Sections, table of contents, search, FR |
| Patch | `patch.html`, `patch.js`, `patch.css` | Filters, expand and collapse, deep links |
| Rules | `rules.html`, `rules.js`, `rules.css` | Tiles opening a dialog, `updated:` date in front matter |
| Vote | `vote.html`, `vote.js`, `vote.css` | One timer per voting site, saved nickname |
| Prices | `prices.html`, `prices.js`, `prices.css` | Search, categories, sorting, sell calculator |
| Staff | `staff.html`, `staff.js`, `_data/staff.yml` | Roles, heads, contact |
| Apply | `apply.html`, `apply.js`, `_tools/apply-worker.js` | Form sent to Discord by the Worker |
| Map | `map.html`, `map.js`, `map.css` | Embedded Lodeway map |
| Store | `work-in-progress.html` | Placeholder |
| 404 | `404.html`, `404.css` | Error page |
## 5. Wiki conventions
### Commands
```html
<ul class="cmd-list">
<li><span class="command">/home</span> <span class="base">Opens the GUI to view, set, and delete your homes.</span></li>
</ul>
```
- Clicking a `.command` copies it.
- Descriptions start with a verb: Opens, Shows, Toggles, Allows you to.
- Several aliases can be listed as several `.command` spans.
### Patch chips
- Add `data-patch="patch-23"` (or `update-5`) to a heading to show an "Update #N" chip with the date read from `patch.html`.
- The latest patch or update gets a **NEW** badge automatically.
- The id must exist in `patch.html`, the checker fails otherwise.
### Item icons
- `data-ic="pickaxe axe shovel"` on a table cell shows the matching icons from `images/icon/`.
### Images
- Put screenshots in `images/wiki/` as `.webp`, always add a descriptive `alt`.
- Images open in the viewer automatically.
### French translation
- `scripts/wiki-fr.json` has two objects: `ui` (interface texts) and `t` (translations).
- A key in `t` is the **English HTML of the element** (inner HTML, whitespace collapsed), the value is the French HTML.
- Server proper names (ranks, enchantments, features) stay in English.
- Open the wiki in FR and run `cubesiaMissing()` in the console to list untranslated texts.
- If you change an English text, change its key in `wiki-fr.json` too.
- The table of contents search works in both languages and ignores accents.
## 6. Patch notes
- Every entry of `patch.html` is a `<details>`:
```html
<details id="patch-23" open data-date="2026-11-06">
<summary>Patch #23</summary>
<ul>
<li>Added <code>/sellmulti</code>.</li>
<li>Fixed an exploit involving swapping between fishing rods.</li>
</ul>
</details>
```
- Ids are `patch-N` or `update-N`.
- The first word of each item gives its label: New, Added, Fixed, Change, Removed.
- On push, the workflow `build-patches` regenerates `_data.yml`.
- Locally: `python _tools/build_patches.py --out _data.yml` (needs `pyyaml`), add `--feed feed.xml` to rebuild the RSS feed too.
## 7. Prices and icons
### Updating prices
1. Take the new `worth.yml` from the plugin.
2. Run `python _tools/build_prices.py path/to/worth.yml` (needs `pyyaml`).
3. Commit `_data/prices.json`.
### Icon names
- The icon URL is `item_icon_url` with `{name}` replaced by the item name, for example `Diamond_Sword`.
- When the wiki uses another name, `scripts/prices.js` tries alternatives in this order:
  - the `ALT` table (`beef` is `Raw_Beef`, `turtle_helmet` is `Turtle_Shell`...);
  - `Bucket_of_X` for mob buckets, `X_Boat_with_Chest`, `X_Armor_Trim`, `Banner_Pattern`, `Music_Disc_(X)`;
  - the name without `Waxed` for waxed copper items;
  - the same names in sentence case (`Copper_torch`);
  - each name is also tried as `.gif` (animated or enchanted items).
- No fake icon is used: an item without a real icon shows a colored tile with its first letter.
### Checking icons
- Open `prices.html?iconcheck`.
- A red box lists every item whose icon was not found, with the first link tried.
- Use "Copy the list" to share the list.
- In the console, `cubesiaIconsMissing()` returns the ids of failed icons.
- To fix one item: find the real file name on the item page of minecraft.wiki, then add it to `ALT` in `prices.js` (id in lowercase, wiki name with underscores).
## 8. Display, themes and saved settings
- The **Aa** button changes theme (Auto, Dark, Light), style (Normal, Minecraft) and text size (90 to 130 %).
- Minecraft style: `styles/minecraft.css` and pixel fonts, loaded only when needed. The page stays hidden (`mc-pending`) until the stylesheet is ready to avoid a flash.
- The header stays dark in light mode.
- Animations are disabled with `prefers-reduced-motion`.
- Everything is stored in the visitor browser (`localStorage`):
| Key | Content |
|---|---|
| `cubesia-theme`, `cubesia-style`, `cubesia-zoom` | Display settings |
| `cubesia-lang` | Wiki language |
| `cubesia-patch-filter`, `cubesia-patch-open` | Patch filter and open entries |
| `cubesia-vote-pseudo` | Nickname on the vote page |
| `cubesia-calc-lines`, `cubesia-calc-mults` | Sell calculator |
| `cubesia-apply-sent` | Application already sent |
## 9. Tools
| Tool | Command | Result |
|---|---|---|
| `_tools/check_site.py` | `python _tools/check_site.py` | Missing images, broken `#` links, duplicate ids, unknown `data-patch` |
| `_tools/build_patches.py` | `python _tools/build_patches.py --out _data.yml` | `_data.yml` from `patch.html`, RSS feed with `--feed feed.xml` |
| `_tools/build_prices.py` | `python _tools/build_prices.py worth.yml` | `_data/prices.json` |
| `_tools/update_meta.py` | `python _tools/update_meta.py` | `sitemap.xml` with `lastmod`, and `updated:` of `rules.html` |
| `_tools/check_links.py` | `python _tools/check_links.py` | Report of broken external links |
| `_tools/apply-worker.js` | Deployed on Cloudflare | Receives the form and posts it to Discord |
- Python 3.12 is used in the workflows.
- The site was never built with a real Jekyll on the maintainer side: always check the live site after a push.
## 10. GitHub Actions
| Workflow | Trigger | Job |
|---|---|---|
| `check-site` | Every push and pull request | Runs `check_site.py` |
| `build-patches` | Push touching `patch.html` | Regenerates `_data.yml` and commits it |
| `update-meta` | Push touching a `.html` file | Updates `sitemap.xml` and the rules date, commits if changed |
| `check-links` | Every Monday, or manually | Warns about broken external links |
| `sync-labels` | Push touching `.github/labels.json`, or manually | Creates and updates repository labels |
| `triage` | New issue | Posts a welcome comment |
- Workflows that commit need **Settings, Actions, General, Workflow permissions: Read and write permissions**.
## 11. Issues and labels
- Templates are in `.github/ISSUE_TEMPLATE/` and written in English.
- Open one from https://github.com/Nat688/Cubesia/issues/new/choose
| Template | Label |
|---|---|
| Bug Report | `bug` |
| Feature Request | `enhancement` |
| Question | `question` |
| Not Found / Missing resource | `not-found` |
| Translation issue | `translation` |
| Wiki or rules content | `content` |
| Prices issue | `prices` |
- Every new issue also gets `needs-triage`.
- Other labels: `accepted`, `in-progress`, `good first issue`, `wontfix`, `duplicate`.
- To change labels, edit `.github/labels.json` and push, or run the `sync-labels` workflow.
## 12. Common tasks
### Add a patch
1. Add a `<details id="patch-N">` block at the top of `patch.html`.
2. Add `data-patch="patch-N"` to the wiki sections that changed.
3. Push, then check the Actions tab.
### Add a wiki section
1. Add the heading with a unique `id` and its content in `wiki.html`.
2. Add the French texts to `scripts/wiki-fr.json`.
3. Run `python _tools/check_site.py`.
### Update the rules
- Edit `rules.html`. The `updated:` date is set by the `update-meta` workflow.
### Add a page
1. Create `page.html` with `layout: default`, a `title` and a `description` in the front matter.
2. Create `styles/page.css` and `scripts/page.js` if needed.
3. Add it to `PAGES` in `_tools/update_meta.py` and to the header in `_layouts/default.html`.
### Enable maintenance mode
- Set `maintenance: true` in `_config.yml` and push.
## 13. Known limits
- `robots.txt` is only read at the root of the domain, not inside `/Cubesia/`.
- The prices page contains about 1500 rows, rows are rendered lazily with `content-visibility`.
- Recent items can lack an icon on the wiki until it is updated.
- The light mode was only checked on the main pages.
