# Saad Ur Rehman — Portfolio

A frontend-only portfolio site built with **React + Vite**. No backend required.

```
project/
├── frontend/                     React + Vite app (the whole site)
└── legacy-rock-paper-scissors/   your original vanilla JS game, kept for reference
```

The Rock, Paper, Scissors game in the Projects section is your original game logic
rebuilt in React — fully playable. The API Test Console in the Testing Lab section
calls a free public API (`jsonplaceholder.typicode.com`) directly from the browser,
so it works with no server of your own.

## Running it locally

Requires [Node.js](https://nodejs.org) 18+.

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Building for production

```bash
cd frontend
npm run build
```

This outputs static files to `frontend/dist/`. Deploy that folder as-is to any
static host — Netlify, Vercel, GitHub Pages, or Cloudflare Pages all work with
zero configuration for a Vite app.

## The contact form

There's no backend, so submitting the form opens the visitor's email client with
a `mailto:` link, addressed to you and pre-filled with their message and email.
That's in `src/App.jsx`, inside the `submit` function.

If you want an actual "send" experience without running your own server, a form
service is the easiest upgrade — point the form's `fetch` at one of:

- [Formspree](https://formspree.io) — free tier, just needs your form endpoint URL
- [Web3Forms](https://web3forms.com) — free, no signup required for basic use
- [EmailJS](https://www.emailjs.com) — sends straight from the browser via their SDK

Any of these drops in without writing a backend yourself.

## Customizing

- Colors, fonts, and copy all live in `frontend/src/App.jsx` — the design tokens
  are at the top of the file (`TOKENS` object).
- Your photo is at `frontend/public/profile.jpg` — swap it for a new file with
  the same name to update it everywhere.
- Experience, skills, and projects are plain arrays near the top of `App.jsx`
  (`EXPERIENCE`, `SKILLS`, `PROJECTS`, `CODE_SAMPLES`, `INITIAL_TICKETS`) — edit
  those instead of hunting through JSX to update content.
