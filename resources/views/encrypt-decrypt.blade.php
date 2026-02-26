<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Libsodium Encrypted Chat</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/libsodium-wrappers/0.7.9/libsodium-wrappers.min.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
</head>
<body>
    <h1>Encrypted Chat</h1>

    <div id="chatbox">
        <!-- Messages will appear here -->
    </div>

    <input type="text" id="messageInput" placeholder="Type your message here...">
    <button onclick="sendMessage()">Send</button>

    <script>
       import * as sodium from 'libsodium-wrappers';

async function loadLibsodium() {
    await sodium.ready;
    // Now Libsodium is ready to use
    const key = sodium.from_base64('FqhS9p0+VI4E1cgXtjQpcTry1MVWlyDVWQyPratZY68=', sodium.base64_variants.ORIGINAL);
}

loadLibsodium().then(() => {
   
});


        // Initialize Firebase (replace with your own config)
        var firebaseConfig = {
            apiKey: "AIzaSyBYiaLcIIiFkdKzumpFtOj44mqujGBvSHg",
    authDomain: "dreams-chat-ef2a3.firebaseapp.com",
    databaseURL: "https://dreams-chat-ef2a3-default-rtdb.firebaseio.com",
    projectId: "dreams-chat-ef2a3",
    storageBucket: "dreams-chat-ef2a3.appspot.com",
    messagingSenderId: "796333020052",
    appId: "1:796333020052:web:94311f4f858a35ab0f7581",
        };
        firebase.initializeApp(firebaseConfig);

        // Wait for Libsodium to initialize
        let key;

        // Load Libsodium and get the key from the server or environment (this example uses a hardcoded key)
        async function loadLibsodium() {
            await sodium.ready;
            // Replace with your base64 key (or load it from a secure API call)
            key = sodium.from_base64('FqhS9p0+VI4E1cgXtjQpcTry1MVWlyDVWQyPratZY68=', sodium.base64_variants.ORIGINAL);
        }

        loadLibsodium();

        // Function to encrypt the message
        async function encryptMessage(message) {
            const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
            const ciphertext = sodium.crypto_secretbox(sodium.from_string(message), nonce, key);

            // Combine nonce and ciphertext
            const combined = new Uint8Array(nonce.length + ciphertext.length);
            combined.set(nonce);
            combined.set(ciphertext, nonce.length);

            // Base64 encode the combined result
            const encodedMessage = sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
            return encodedMessage;
        }

        // Function to decrypt the message
        async function decryptMessage(encryptedMessage) {
            const combined = sodium.from_base64(encryptedMessage, sodium.base64_variants.ORIGINAL);

            // Extract nonce and ciphertext
            const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
            const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

            const decryptedMessage = sodium.crypto_secretbox_open(ciphertext, nonce, key);

            if (!decryptedMessage) {
                throw new Error('Decryption failed.');
            }

            return sodium.to_string(decryptedMessage);
        }

        // Function to send the encrypted message to Firebase
        async function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value;

            if (message.trim() !== '') {
                const encryptedMessage = await encryptMessage(message);
                // Push encrypted message to Firebase Realtime Database
                firebase.database().ref('messages').push({
                    message: encryptedMessage,
                    timestamp: Date.now(),
                    senderId: 'user1' // Use actual sender ID in real case
                });

                messageInput.value = ''; // Clear input
            }
        }

        // Function to display decrypted messages
        firebase.database().ref('messages').on('child_added', async (snapshot) => {
            const encryptedMessage = snapshot.val().message;
            const decryptedMessage = await decryptMessage(encryptedMessage);

            const chatbox = document.getElementById('chatbox');
            const messageDiv = document.createElement('div');
            messageDiv.textContent = decryptedMessage;
            chatbox.appendChild(messageDiv);
        });
    </script>
</body>
</html>
