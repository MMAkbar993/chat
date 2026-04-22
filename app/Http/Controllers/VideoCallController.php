<?php

namespace App\Http\Controllers;

use App\Services\RtcTokenBuilder2;
use Illuminate\Http\Request;

class VideoCallController extends Controller
{
    protected function getAgoraCredentials(): array
    {
        $appId = config('calls.agora.app_id') ?: env('AGORA_APP_ID');
        $appCertificate = config('calls.agora.app_certificate') ?: env('AGORA_APP_CERTIFICATE');
        return [$appId, $appCertificate];
    }

    /**
     * Generate Agora RTC token for the given channel and uid.
     * Request: channel_name (or channelName), uid.
     * Response: token (single token for client.join).
     */
    public function generateToken(Request $request)
    {
        [$appId, $appCertificate] = $this->getAgoraCredentials();
        $channelName = $request->input('channel_name') ?: $request->input('channelName');
        $uid = $request->uid;

        if (!$appId || !$appCertificate) {
            return response()->json(['error' => 'AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in .env when using Agora calls.'], 400);
        }

        if (!$channelName || $uid === null || $uid === '') {
            return response()->json(['error' => 'channel_name and uid are required.'], 400);
        }

        $tokenExpirationInSeconds = 3600 * 24;
        $privilegeExpirationInSeconds = 3600 * 24;

        try {
            // Support both string (Firebase UID) and numeric uid for Agora token
            $uidStr = is_string($uid) ? $uid : (string) (int) $uid;
            $token = RtcTokenBuilder2::buildTokenWithUserAccount(
                $appId,
                $appCertificate,
                $channelName,
                $uidStr,
                RtcTokenBuilder2::ROLE_PUBLISHER,
                $tokenExpirationInSeconds,
                $privilegeExpirationInSeconds
            );
            return response()->json(['token' => $token], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate token. ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate Agora RTC token for a user joining an existing call (same as generateToken).
     */
    public function generateJoinerToken(Request $request)
    {
        return $this->generateToken($request);
    }

    /**
     * Stub for start-call (e.g. server-side call logging). Returns success.
     */
    public function startCall(Request $request)
    {
        return response()->json(['success' => true], 200);
    }

    /**
     * Stub for check-incoming-call. Returns no active call by default.
     */
    public function checkIncomingCall(Request $request)
    {
        return response()->json(['has_call' => false], 200);
    }
}
