HINDU MANTRA JAP COUNTER
========================

A mobile-friendly Hindu mantra jap counter with a browser version and an Android build workflow.

FEATURES
--------
- Tap-to-count mantra jap counter
- Visual 108-bead mala
- Built-in and custom mantras
- Daily repetition goals and streaks
- Daily, weekly, monthly, and yearly history
- Undo and session reset
- Multiple color themes
- Browser progress saved locally on the device

PROJECT LOCATIONS
-----------------
Browser app: index.html
Expo / React Native mobile app: artifacts/mobile/
Android APK workflow: .github/workflows/main.yml

BUILD AND DOWNLOAD THE ANDROID APK
----------------------------------
1. Visit:
   https://github.com/dearasyouwish-ceo/hindu-mantra-jap-counter/actions

2. Open the latest "Build Hindu Mantra Jap APK" workflow run.

3. Check that all workflow steps have passed.

4. In the successful run, scroll to "Artifacts".

5. Download "Hindu-Mantra-Jap-APK" and extract the ZIP file to get the APK.

6. Transfer the APK to your Android phone and open it to install.
   Android may ask you to allow installation from that source.

IMPORTANT: An APK is only available after the workflow completes successfully.
If a run fails, open the failed step and inspect its log.

GITHUB PAGES (WEB APP)
----------------------
1. Open the repository Settings, then Pages.
2. Choose "Deploy from a branch".
3. Select branch "main" and folder "/(root)".
4. Save the settings.

Web app URL:
https://dearasyouwish-ceo.github.io/hindu-mantra-jap-counter/

LOCAL DATA NOTE
---------------
Browser progress is saved in the browser on that device. It is not automatically
synchronized between devices. Clearing browser site data may remove saved progress.

ANDROID BUILD DETAILS
---------------------
GitHub Actions installs dependencies from artifacts/mobile/package.json, generates
the Android project with Expo Prebuild, builds a debug APK with Gradle, and uploads
the APK as a workflow artifact. The generated android/ directory is created during
the workflow and does not need to be committed to the repository.
