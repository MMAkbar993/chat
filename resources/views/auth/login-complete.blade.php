<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Signing in...</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .loader { text-align: center; }
        .spinner { width: 40px; height: 40px; border: 3px solid #eee; border-top-color: #0d6efd; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Signing you in...</p>
    </div>
    <script type="module">
        (async function() {
            const config = @json($firebaseConfig);
            const token = @json($customToken);
            const chatUrl = @json($chatUrl);

            if (!config.apiKey || !config.projectId || !token) {
                document.body.innerHTML = '<p style="color:#c00;">Login configuration error. Please try again.</p>';
                setTimeout(() => window.location.href = '/login', 3000);
                return;
            }

            try {
                const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
                const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');

                const firebaseConfig = {
                    apiKey: config.apiKey,
                    authDomain: config.authDomain || config.projectId + '.firebaseapp.com',
                    projectId: config.projectId,
                    storageBucket: config.storageBucket || config.projectId + '.appspot.com',
                    messagingSenderId: config.messagingSenderId,
                    appId: config.appId,
                };
                if (config.databaseURL) firebaseConfig.databaseURL = config.databaseURL;

                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                await signInWithCustomToken(auth, token);
                window.location.href = chatUrl;
            } catch (err) {
                console.error(err);
                document.body.innerHTML = '<p style="color:#c00;">Sign-in failed. Please try again.</p><p><a href="/login">Back to login</a></p>';
            }
        })();
    </script>
</body>
</html>
