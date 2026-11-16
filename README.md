# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/rokeita/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/rokeita/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A lean, no-framework frontend for make.fun, shipped as a static site with no build step. It talks straight to make.fun's public API and covers the four pages a visitor needs: the live bounty board, a bounty page, its leaderboard, and any hunter's public profile.

## Features

- Live bounty board — every bounty with its live pot, entry fee, time left, and entry count, plus search, sorting, and a closing-soon filter
- Bounty pages — reward breakdown with live fee shares, dates, and the full 20-place rewards table
- Leaderboards — ranked entries with judge win rate, validity, and dossier size
- Public profiles — avatar, bio, links, record stats, and entries for any handle
- ETag caching — API answers are revalidated with If-None-Match, so repeat visits cost almost nothing
- Tiny first load — 1 file, 2,094 bytes gzip (5,113 raw); the whole app is 5 files, 23,801 bytes

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=f419cs6j&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
