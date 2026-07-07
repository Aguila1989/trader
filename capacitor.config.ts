import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the built Vue SPA (web/dist) into native iOS/Android app
 * binaries for the App Store / Play Store — neither store accepts a bare web
 * app, so this is the launch-blocking "native wrapper" the gap analysis calls
 * for. This file is intentionally OUTSIDE the TypeScript build (root tsconfig
 * only includes src/**), so it never affects `tsc --noEmit`.
 *
 * One-time setup on a machine with the native toolchains (Xcode for iOS,
 * Android Studio for Android — NOT installable in CI/this sandbox):
 *
 *   npm --prefix web run build        # produce web/dist
 *   npx cap add ios                   # creates ./ios  (needs macOS + Xcode)
 *   npx cap add android               # creates ./android (needs Android Studio)
 *   npx cap sync                      # copy web/dist + plugins into native
 *   npx cap open ios | android        # open the native project to build/submit
 *
 * After every web rebuild: `npm --prefix web run build && npx cap sync`.
 *
 * Deep links (email verification / password reset land on https links) must be
 * registered as Universal Links (iOS) / App Links (Android) so the OS opens the
 * app instead of the browser — see DEPLOY.md.
 */
const config: CapacitorConfig = {
  appId: "app.atrium.trader",
  appName: "Atrium",
  // The Vite build output that Capacitor packages into the native shell.
  webDir: "web/dist",
  // App-review deep links + backend live at the deployed origin. Leaving the
  // server URL unset means the native shell serves the bundled web/dist offline
  // shell and calls the API over https from the app's configured origin.
  ios: {
    contentInset: "always",
  },
  android: {
    // Allow the WebView to reach the production https API origin only.
    allowMixedContent: false,
  },
};

export default config;
