
    var pusherAppKey = "{{ env('PUSHER_APP_KEY') }}";
    var pusherAppCluster = "{{ env('PUSHER_APP_CLUSTER') }}";
    var pusherEncrypted = "{{ env('PUSHER_ENCRYPTED', true) }}"; 

     // Initialize Pusher
     var pusher = new Pusher(pusherAppKey, {
        cluster: pusherAppCluster,
        encrypted: pusherEncrypted
    });

// Subscribe to chat channel
var channel = pusher.subscribe('chat-channel');

// Listen for new messages
channel.bind('message-event', function(data) {
    appendMessage(data.sender_id, data.message);
});

// Send a message via AJAX to Laravel API to trigger the Pusher event
function sendPusherMessage(senderId, receiverId, message) {
    $.ajax({
        url: '/api/send-message',  // Your Laravel API for sending messages
        method: 'POST',
        data: {
            sender_id: senderId,
            receiver_id: receiverId,
            message: message
        },
        success: function(response) {
          
        }
    });
}

// Append messages to chat window
function appendMessage(senderId, message) {
    var chatWindow = document.getElementById('chat-window');
    var messageElement = document.createElement('div');
    messageElement.innerHTML = "<b>" + senderId + ":</b> " + message;
    chatWindow.appendChild(messageElement);
}
