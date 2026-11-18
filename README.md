# App Tester Project

A throwaway Expo (React Native) mobile app for testing control of **Vercel**
and **Supabase** from a single app. Built with Expo Router, TypeScript, and
tabs for each integration.

> ⚠️ **This is a disposable testing project.** Don't use production
> credentials. Use scoped/low-privilege tokens and test/staging projects
> only.

## Structure

```
src/
  app/
    _layout.tsx          # Root layout (providers, status bar)
    (tabs)/
      _layout.tsx         # Tab navigator (Settings, Vercel, Supabase)
      index.tsx           # Settings tab — enter & store credentials
      vercel.tsx          # Vercel tab — list/redeploy/cancel deployments
      supabase.tsx        # Supabase tab — browse/insert table rows
  lib/
    secure-storage.ts     # SecureStore (native) / localStorage (web) wrapper
    settings-context.tsx  # React context persisting credentials on-device
    vercel.ts             # Minimal Vercel REST API client
    supabase.ts           # Supabase client factory + table helpers
```

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `w` for web, `a`/`i`
for an emulator.

### Configuring credentials

Open the **Settings** tab in the app and fill in:

- **Vercel**: a [personal access token](https://vercel.com/account/tokens)
  and the target project's ID (and team ID if the project belongs to a
  team).
- **Supabase**: the project URL and anon key (Project Settings → API).

Credentials are stored locally on-device via `expo-secure-store` (native) —
on web they fall back to `localStorage`, which is **not** secure and is only
there so the app still runs in a browser during testing.

### What each tab does

- **Vercel**: lists recent deployments for the configured project, lets you
  redeploy the latest one, and cancel one that's still building.
- **Supabase**: lets you query up to 20 rows from a table by name and insert
  a new row via a raw JSON editor.

## Security note

Because this app stores Vercel/Supabase credentials on-device and calls
their APIs directly from the client, don't point it at production
resources. For anything beyond personal testing, put a server-side proxy in
front of these APIs so tokens never ship inside the app bundle.
