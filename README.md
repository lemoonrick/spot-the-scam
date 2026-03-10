# Spot the Scam

> A media literacy quiz app that teaches people how to identify digital scams through real-world UI simulations, not theory.

![App Screenshot](/public/app-homepage.jpeg)

[Live demo](https://spot-the-scam-ebon.vercel.app/) · Built for [FactTree](https://myfactree.org)

---

## What is this web app?

Most people learn about scams after they've already fallen for one.

**Spot the Scam** flips that. Instead of reading a list of "tips," you're dropped into a simulated WhatsApp message, Gmail inbox, Instagram DM, or UPI payment screen and asked: _is this real or a scam?_

After you guess, the app walks you through exactly what the red flags were, highlights them directly on the UI, and links you to a FactTree article that goes deeper. It's hands-on, low-stakes practice for something that has very real consequences.

The target audience is anyone who uses a smartphone, as the scam patterns shown are common and can affect users worldwide.

---

## Features

### Simulated Real-World UIs

The app doesn't show screenshots. It renders fully functional, pixel-accurate replicas of:

- WhatsApp (Business account messages)
- Gmail (both plain-text and rich HTML marketing emails)
- SMS (Indian bank and telecom format)
- Instagram DMs
- Browser popups
- Google Pay / UPI collect request screens

Every UI is built in React with CSS that matches the real thing, fonts, colors, layout, icons. The point is that if it looks real, the lesson sticks.

### Interactive Flag System

When you click "Show me →", the app highlights the exact suspicious element inside the UI a spoofed sender address, a fake domain, an urgency phrase and shows a FlagCard explaining _why_ it's a red flag. Multi-flag scams step through each flag one by one.

### Randomized Question Order

The 10 scam examples (a mix of phishing and legitimate messages) are shuffled on every session using a Fisher-Yates shuffle, so repeat users don't memorize answer patterns.

### Analytics Screen

After all 10 questions, you get a score breakdown with:

- An SVG ring chart showing your correct/incorrect ratio
- A per-question review of every answer you gave
- Direct links to relevant FactTree fact-check articles for each scam

### Haptic Feedback

On Android, the app uses the `navigator.vibrate` API to give physical feedback when you pick an answer a double pulse for phishing, a single buzz for legitimate. Small details gives you big feel.

### Mobile Responsive

The entire app is designed mobile-first. The simulated phone UIs scale correctly on small screens, the FlagCard repositions relative to the flagged element, and the page auto-scrolls to keep the card in view. So **the user doesn’t have to scroll down to reach the buttons.**

### Progress Bar

A live progress bar at the top of the quiz tracks where you are in the 10 question set.

---

## Tech Stack

| Layer     | Tech                                                                           |
| --------- | ------------------------------------------------------------------------------ |
| Framework | React 18 (Vite)                                                                |
| Styling   | Plain CSS with custom properties (no UI library)                               |
| State     | React hooks only (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`) |
| Routing   | None. single-page state machine                                                |
| Data      | Static JS module (`scams.js`)                                                  |
| Fonts     | Poppins via Google Fonts                                                       |
| Build     | Vite                                                                           |

No backend. No database. No auth. Fully static deployable to GitHub Pages, Netlify, Vercel, or any CDN.

---

## Architecture

```
src/
├── App.jsx                  # Root. mounts ScamScreen
├── App.css                  # Global tokens, animations, ScamScreen styles, flag active states
├── scams.js                 # All 10 scam definitions (message data + flags + articles)
├── ScamScreen.jsx           # Core quiz logic. phase state machine, FlagCard positioning
├── AnalyticsScreen.jsx      # Results screen with SVG ring chart
└── components/
    ├── FlagCard.jsx         # Floating explanation card
    ├── SmsScam.jsx          # SMS UI
    ├── WhatsAppScam.jsx     # WhatsApp UI
    ├── EmailScam.jsx        # Gmail UI
    ├── InstagramScam.jsx    # Instagram DM UI
    ├── PopupScam.jsx        # Browser popup UI
    └── UpiScam.jsx          # UPI mobile UI
```

### How the quiz state machine works

`ScamScreen` manages a `phase` variable that moves through four states:

```
idle → verdict-chosen → revealing → [next scam or analytics]
```

- `idle` — Scam is displayed, Phishing/Legitimate buttons are visible
- `verdict-chosen` — User has picked, "Show me →" button appears
- `revealing` — FlagCard is shown, flags step through one by one
- After the last flag of the last scam → `AnalyticsScreen`

### How FlagCard positioning works

The FlagCard is `position: absolute` inside `.scam-relative-container`. When a flag is revealed, `positionAndScroll()` queries the DOM for the active flagged element (`.active`, `.safe-active`, or `.upi-active`), calculates its position relative to the container, and places the FlagCard directly below it.

If the FlagCard would overflow below the phone UI's natural height, `paddingBottom` is added to the container to make room. A separate `useEffect` watching `containerPad` fires after the DOM has updated to scroll the card into view ensuring the scroll target is calculated against the final, fully-grown container height.

---

## Scam Coverage

| #   | Platform      | Type                        | Verdict    |
| --- | ------------- | --------------------------- | ---------- |
| 1   | SMS           | ICICI bank phishing         | Phishing   |
| 2   | SMS           | SBI OTP (real transaction)  | Legitimate |
| 3   | Email         | Amazon billing scam         | Phishing   |
| 4   | Email         | Netflix marketing email     | Legitimate |
| 5   | WhatsApp      | Jio KYC scam                | Phishing   |
| 6   | WhatsApp      | Swiggy order confirmation   | Legitimate |
| 7   | Instagram     | Fake brand collaboration DM | Phishing   |
| 8   | Browser Popup | Fake virus alert            | Phishing   |
| 9   | Email         | FactTree newsletter         | Legitimate |
| 10  | UPI           | Collect request scam (GPay) | Phishing   |

Each scam is tied to a [FactTree](https://myfactree.org) article so users can read the real investigative context behind it.

---

## Why it matters

India had over 1.1 million cybercrime complaints in 2023. A significant portion of them UPI fraud, phishing, fake KYC prey on people who simply haven't seen these patterns before.

<!-- Reading a blog post about "how to spot phishing" is easy to forget. *Almost falling for something* is not. This app creates that near-miss experience in a safe environment. -->

The goal isn't to make people paranoid it's to build pattern recognition so that when a real scam lands in their inbox, something feels off before they act.

It's also built to be embeddable in digital literacy workshops, school curricula, and journalism training anywhere people need practical, low-barrier media literacy education.

---

## Running locally

```bash
git clone https://github.com/your-username/spot-the-scam.git
cd spot-the-scam
npm install
npm run dev
```

Requires Node 18+. No environment variables needed.

---

## Built by

[Hrithik](https://github.com/lemoonrick) — Web developer, and media literacy nerd at [FactTree](https://myfactree.org).

---

## License

MIT
