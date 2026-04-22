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
    <script>
        (function() {
            const chatUrl = @json($chatUrl);
            window.location.href = chatUrl || '/chat';
        })();
    </script>
</body>
</html>
