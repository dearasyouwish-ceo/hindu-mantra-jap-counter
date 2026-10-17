# Hindu Mantra Jap Counter

A mobile-friendly Hindu mantra jap counter with a browser version and an Android build workflow.

## Features

- Tap-to-count mantra jap counter
- Visual 108-bead mala
- Built-in mantras and custom mantra support
- Daily repetition goals and streaks
- Daily, weekly, monthly, and yearly history
- Undo and session reset
- Multiple color themes
- Browser progress stored locally on the device

## Project locations

- Browser app: `index.html` in the repository root
- Expo / React Native mobile app: `artifacts/mobile/`
- Android APK workflow: `.github/workflows/main.yml`

## Build and download the Android APK

The repository uses GitHub Actions to generate the Android project and build a debug APK.

1. Open the repository's **Actions** tab: https://github.com/dearasyouwish-ceo/hindu-mantra-jap-counter/actions
2. Select **Build Hindu Mantra Jap APK**.
3. Open the latest run and check that all steps have passed.
4. In the successful run, scroll to **Artifacts**.
5. Download **Hindu-Mantra-Jap-APK** and extract the ZIP to get the APK file.
6. Transfer the APK to your Android phone and open it to install. You may need to allow installation from that source in Android settings.

If a run fails, open the failed step and read the error in its log. An APK is only available after a successful run.

## Run the web app with GitHub Pages

1. Ensure `index.html` is present in the repository root.
2. Open **Settings → Pages**.
3. Under the build/deployment settings, choose **Deploy from a branch**.
4. Select branch `main` and folder `/(root)`, then save.

Web app URL: https://dearasyouwish-ceo.github.io/hindu-mantra-jap-counter/

## Local data note

Browser progress is stored in that browser on that device. It is not automatically synchronized between devices. Clearing browser site data may remove locally stored progress.

## Android build details

The workflow installs dependencies from `artifacts/mobile/package.json`, generates the Android native project with Expo Prebuild, runs Gradle to assemble a debug APK, and uploads the APK as a workflow artifact. The generated `android/` directory is created during the workflow; it does not need to be committed to the repository.
