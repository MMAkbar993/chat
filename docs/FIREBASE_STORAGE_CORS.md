# Firebase Storage CORS Setup

Profile photo uploads (and any direct browser uploads to Firebase Storage) can be blocked by CORS when your app runs on a different origin (e.g. `https://connectar.online`) than Firebase Storage (`https://firebasestorage.googleapis.com`).

## Error you may see

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'https://connectar.online' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

This means the **Firebase Storage bucket does not allow your origin** (or CORS was never applied). You must apply the CORS config to the bucket with `gsutil` (see below).

## Fix: Configure CORS on your Firebase Storage bucket

**You must run the `gsutil cors set` command below.** The CORS config file in this project is only applied when you run that command; Firebase does not read it automatically.

1. **Install Google Cloud SDK** (includes `gsutil`) if you don't have it:
   - https://cloud.google.com/sdk/docs/install

2. **Authenticate and set project**:
   ```bash
   gcloud auth login
   gcloud config set project dreamschat-14575
   ```

3. **Apply CORS to your Storage bucket**  
   From your **project root** (where `config/firebase-storage-cors.json` exists), run **one** of these (bucket name depends on your Firebase project):

   **If your bucket is the default Firebase Storage bucket**, try the name shown in Firebase Console → Storage (top of the page). It is usually one of:
   ```bash
   gsutil cors set config/firebase-storage-cors.json gs://dreamschat-14575.firebasestorage.app
   ```
   or (older projects):
   ```bash
   gsutil cors set config/firebase-storage-cors.json gs://dreamschat-14575.appspot.com
   ```

4. **Verify**:
   ```bash
   gsutil cors get gs://dreamschat-14575.firebasestorage.app
   ```
   (or use `.appspot.com` if that’s your bucket). You should see the same origins and methods as in `config/firebase-storage-cors.json`.

5. **Retry** the profile image upload from `https://connectar.online`. Clear cache or use a private window if needed.

## Production (connectar.online)

The file `config/firebase-storage-cors.json` already includes `https://connectar.online` and `https://www.connectar.online`. After any change to that file, run:

```bash
gsutil cors set config/firebase-storage-cors.json gs://dreamschat-14575.firebasestorage.app
```

## CORS file contents (reference)

The `config/firebase-storage-cors.json` file allows:

- **Origins:** `http://127.0.0.1:8000`, `http://localhost:8000`, `http://localhost`, `https://connectar.online`, `https://www.connectar.online`.
- **Methods:** GET, HEAD, PUT, POST, DELETE, OPTIONS (OPTIONS is required for CORS preflight).
- **Response headers:** Content-Type, Authorization, etc.

To add another origin (e.g. another domain), edit the `origin` array in `config/firebase-storage-cors.json`, then run `gsutil cors set ...` again.
