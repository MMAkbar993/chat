# Firebase project mismatch (400 on login / signInWithCustomToken)

If you see **400 Bad Request** on `signInWithPassword` or `signInWithCustomToken`, it is usually because the **backend** and **frontend** use **different Firebase projects**.

- The **backend** uses `config/firebase_credentials.json` (service account). Its `project_id` is the backend project.
- The **frontend** uses `.env` values (`FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_DATABASE_URL`, etc.) returned by `/firebase-config`.

Custom tokens are valid only for the **same** project the client is initialized with. If they differ, Firebase returns 400.

## Fix: use one project everywhere

**Option A – Use the same project as your .env (recommended if you already use this project in the app)**

1. Open [Firebase Console](https://console.firebase.google.com/) and select the project that matches your `.env` (e.g. `dreamschat-14575`).
2. Go to **Project settings** (gear) → **Service accounts** → **Generate new private key**.
3. Replace the contents of `config/firebase_credentials.json` with this new JSON (or put the file path in `FIREBASE_CREDENTIALS` in `.env` if your app reads it).
4. Restart the app. Backend will create users and tokens for the same project the frontend uses; login and custom token will work.

**Option B – Use the same project as your credentials file**

1. In Firebase Console, open the project that matches `project_id` in `config/firebase_credentials.json` (e.g. `dreams-chat-66883`).
2. Get the **Web app config**: Project settings → General → Your apps → Web app (or add one) → copy `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
3. Set **all** `FIREBASE_*` in `.env` from that project:  
   `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.
4. Restart the app. Frontend and backend will both use the same project.

After this, **400 on signInWithCustomToken** should stop, and **signInWithPassword** will work for users created by the backend (same project).
