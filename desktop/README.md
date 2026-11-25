# Mizan desktop app

Mizan for Windows and macOS, built with [Tauri 2](https://v2.tauri.app). It's a window
on the live site (`https://mizanfront-production.up.railway.app`), not a second copy of
it: whatever is deployed to Railway is what the app shows, and nothing needs releasing
for site changes.

The app adds what a window without a browser can't do alone:

| What | Where |
| --- | --- |
| Splash page; "no connection" with retry | `splash/index.html` |
| Links that would open a new tab open in the computer's browser | `src-tauri/src/main.rs` (`on_new_window`) and `open_external` |
| Save as… for exports, the system viewer for receipts, printing (`window.print()` does nothing on macOS) | `src-tauri/src/commands.rs`, used by `lib/desktop.ts` and `lib/files.ts` in the site |
| Google sign-in through the browser, back via `mizan://` | below |
| Updates of the app itself | `src-tauri/src/updates.rs` |

The site knows it runs in the app from `window.__MIZAN_DESKTOP__` (`lib/desktop.ts`). Only
the site's own address, in the main window, may call the app's commands. This is the
capability added in `main.rs`, so a page from anywhere else gets no access.

## Signing in with Google

Google refuses to sign in inside an embedded browser. So the app's Google button opens
the computer's browser at `/desktop/sign-in` instead. The person signs in there, the page
gets a one-time code (backend `POST /api/auth/desktop-code`) and opens
`mizan://auth?code=…&state=…`. The app then loads `/desktop/callback`, which checks the
state and trades the code for a session. The whole flow is described in
`lib/desktop-sign-in.ts`. Email and password sign-in works inside the app as usual.

## Developing

You need Node 24, [Rust](https://rustup.rs) and, on Windows, Visual Studio Build Tools
with "Desktop development with C++".

```bash
cd desktop
npm install
# The app on the local site (run the site on :3000 and the API on :4000 first):
MIZAN_APP_URL=http://localhost:3000 npx tauri build --debug --no-bundle
./src-tauri/target/debug/Mizan.exe
```

`MIZAN_APP_URL` is read when building; without it the app shows the production site. To
inspect the window from Chrome, start the app with
`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333` and open
`chrome://inspect`.

## Releasing

1. Raise `version` in `src-tauri/tauri.conf.json` (and `package.json`, `src-tauri/Cargo.toml`).
2. Commit, then push a matching tag: `git tag desktop-v0.2.0 && git push origin desktop-v0.2.0`.
3. `.github/workflows/desktop.yml` builds Windows and macOS (about 20 minutes) and
   publishes the release with:
   - the installers;
   - `latest.json` for the in-app updater;
   - fixed-name copies (`Mizan-Windows-Setup.exe`, `Mizan-macOS.dmg`) for the
     `/download` page.

   Installed apps offer the update the next time they start.

### The updater key: don't lose it

Updates are signed, and installed apps only accept updates signed with the private key
that matches the `pubkey` in `tauri.conf.json`. **If the key is lost, apps already
installed can never update again**: everyone would have to download the app again by hand.

- The private key: `~/.tauri/mizan-updater.key` on the machine that made it. Keep a copy
  somewhere safe (a password manager).
- GitHub: the repository secret `TAURI_SIGNING_PRIVATE_KEY` holds the key file's
  contents. The key has no password, so `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` can stay unset.

### Code signing

The installers aren't code-signed (no paid certificate), so:

- Windows shows "Windows protected your PC" the first time (More info → Run anyway).
- macOS asks to allow the app in System Settings → Privacy & Security.

The `/download` page explains both steps. To sign later, see Tauri's guides for
[Windows](https://v2.tauri.app/distribute/sign/windows/) and
[macOS](https://v2.tauri.app/distribute/sign/macos/). The macOS one needs an Apple
Developer account.
