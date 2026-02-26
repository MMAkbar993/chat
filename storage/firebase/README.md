# Firebase credentials (Option A – single project)

This folder is used when `FIREBASE_CREDENTIALS=storage/firebase/firebase_credentials.json` in your `.env`.

To use **project dreamschat-14575** everywhere (so login and custom token work):

1. Open [Firebase Console](https://console.firebase.google.com/) and select project **dreamschat-14575**.
2. Go to **Project settings** (gear) → **Service accounts**.
3. Click **Generate new private key** and download the JSON file.
4. Save that file here as **firebase_credentials.json** (overwrite the existing file).
5. Restart your Laravel app (`php artisan serve` or your web server).

After this, backend and frontend both use dreamschat-14575 and login (including Laravel fallback / custom token) will work.

**Security:** Do not commit `firebase_credentials.json` to git. Add it to `.gitignore` if needed.
