# Harbor — Open Source YouTube Subscriptions Inbox (No Home Feed)

**Harbor** is an open-source **YouTube client without the home feed**. You only see channels you subscribe to — inbox, later, library, live, Shorts — so the algorithm does not pick the next hour.

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

## Features

- Subscriptions-only inbox
- Later queue with time buckets
- Channel pages, live, Shorts, library
- OPML import / export
- Pull-to-refresh, iOS-style chrome

> Uses public YouTube page metadata. Respect YouTube terms. Bring your own keys if you add the Data API.

## Who it is for

- People who want **YouTube without recommended**
- Parents / focus setups
- Developers building a **feed reader for video**

## Quick start

```bash
git clone https://github.com/Akshit1018/S.Harbor.git
cd S.Harbor
npm install
VITE_AUTH_ENABLED=false npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Tech stack

React 19 · TanStack Start · Vite · Tailwind · Zustand

## License

[MIT](LICENSE)

## Keywords

YouTube without recommended, subscriptions inbox, YouTube RSS client, focus YouTube app, OPML video reader, open source YouTube frontend
