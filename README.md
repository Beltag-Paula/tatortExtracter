# tatortExtracter

A small Node.js script that automatically finds and downloads *Tatort: Münster* episodes that are available on the ARD Mediathek.

## What it does

1. **Scrapes episode titles** — Fetches [tatort-fans.de's Münster archive page](https://tatort-fans.de/category/stadt-archiv/tatort-muenster/) and parses the HTML (via `jsdom`) to pull every episode title out of the `.teaser-title` elements, stripping the leading "Folge Nr:" prefix.
2. **Searches ARD Mediathek** — For each title, queries the ARD Mediathek search API (`api.ardmediathek.de`) to find a matching video page, preferring a version tagged *"klare Sprache"* (clear/simplified audio) and falling back to the first non-"Outtakes" match.
3. **Resolves the stream URL** — Fetches the video page's media data and picks the highest-quality stream from the `_mediaStreamArray`.
4. **Downloads the video** — Streams the resulting `.mp4` to disk, saving it under the episode title (spaces replaced with underscores).

The whole pipeline runs sequentially over every episode found on the fan site until all available downloads are complete.

## Project structure

| File | Description |
|---|---|
| `test.js` | Main script — full scrape → search → resolve → download pipeline. |
| `test2.js` | Near-identical copy of `test.js` (appears to be a working/backup copy or earlier iteration). |
| `package.json` | Declares the single dependency, `jsdom`. |
| `WalktroghTatort.pdf` | Notes/walkthrough document for the project (not read by the code). |

## Requirements

- Node.js (with native `fetch` and `node:stream/promises` support — Node 18+)
- npm dependency: `jsdom`

## Setup

```bash
npm install
```

## Usage

```bash
node test.js
```

This will:
- Fetch the current list of Münster Tatort titles from tatort-fans.de
- Search for each one on ARD Mediathek
- Download each match to the current working directory as `<Episode_Title>.mp4`

Downloaded files are excluded from version control via `.gitignore` is currently only set to ignore `node_modules` — you may want to also add `*.mp4` if you don't want downloaded episodes tracked by git.

## Notes & limitations

- No error handling/retry logic beyond basic `try/catch` around the title-scraping step — a failed search or missing episode will throw and stop the script.
- No rate limiting between requests to either tatort-fans.de or the ARD API.
- Downloads run one at a time (sequential `for` loop with `await`), not in parallel.
- Relies on the current HTML structure of tatort-fans.de (`.teaser-title` selector) and the current shape of the ARD Mediathek API responses; both may break the script if those change.
