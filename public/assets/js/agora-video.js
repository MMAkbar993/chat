// Initialize Agora client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localTracks = {
    videoTrack: null,
    audioTrack: null
};
let remoteUsers = {};

// Initialize the Agora Client
async function joinAgora(appId, channel, token, uid) {
    // Join the channel
    await client.join(appId, channel, token, uid);

    // Create local video and audio tracks
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    // Play local video track
    localTracks.videoTrack.play('local-player');

    // Publish local tracks to the channel
    await client.publish([localTracks.videoTrack, localTracks.audioTrack]);
}

// Handle remote user published event
client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        const remoteVideoPlayer = document.createElement('div');
        remoteVideoPlayer.id = `player-${user.uid}`;
        remoteVideoPlayer.className = "remote-player";
        document.getElementById('remote-playerlist').append(remoteVideoPlayer);

        user.videoTrack.play(`player-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
});

// Handle remote user leaving the call
client.on('user-unpublished', user => {
    document.getElementById(`player-${user.uid}`).remove();
});
