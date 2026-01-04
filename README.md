# Trackboard

A private, local-only personal tracker (mood, stress, alcohol, sleep, goals) designed to run on GitHub Pages **without** sending your data anywhere.

## What’s included (this deploy)
- Home + navigation
- Check-in (mood 1–5, tags, notes, good thing, sleep)
- Alcohol (today / craving timer / progress with money+sleep estimates)
- Release stress (rant, brain dump, 3-minute calm)
- Goals (today + weekly)
- Calm (grounding, body scan audio placeholders, your calming text)
- Insights (basic weekly summary)
- Settings (local-only reminders guide + alcohol estimates + report)
- Report page (Print → Save as PDF)
- PWA shell + offline cache

## Local-only reminders (max privacy)
Because we’re not using any server/push service, use your phone OS reminders:
- Sleep: 00:30
- Check-ins: 10:30 / 15:30 / 20:30

Suggested reminder label: “Quick check-in — how are you?”

## Body scan audio
Two placeholder files are included:
- assets/body-scan-3min.mp3
- assets/body-scan-8min.mp3

Replace them with real MP3s (3 min and 8 min) when ready.

## Run locally
Open `index.html` with a local server (recommended) so the service worker can work.

## Deploy to GitHub Pages
Repo Settings → Pages → Deploy from branch (main / root).

