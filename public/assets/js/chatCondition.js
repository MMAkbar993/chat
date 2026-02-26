// Choose which service to use: Firebase or Pusher
function sendMessage(senderId, receiverId, message) {
    if (typeof firebase !== 'undefined') {
        sendFirebaseMessage(senderId, receiverId, message);
    } else if (typeof Pusher !== 'undefined') {
        sendPusherMessage(senderId, receiverId, message);
    } else {
        console.error("No chat service available");
    }
}
