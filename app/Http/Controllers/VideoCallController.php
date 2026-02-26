<?php

namespace App\Http\Controllers;

use App\Services\RtcTokenBuilder2;
use Illuminate\Http\Request;

class VideoCallController extends Controller
{
    public function generateToken(Request $request)
    {
        // Get environment variables
        $appId = env('AGORA_APP_ID');
        $appCertificate = env('AGORA_APP_CERTIFICATE');

        // Example channel name and UID
        $channelName = "7d72365eb983485397e3e3f9d460bdda";
        $uid = $request->uid;
        $uidStr = (string) $uid;
        $tokenExpirationInSeconds = 3600 * 24;
        $privilegeExpirationInSeconds = 3600 * 24;
        $joinChannelPrivilegeExpireInSeconds = 3600 * 24;
        $pubAudioPrivilegeExpireInSeconds = 3600 * 24;
        $pubVideoPrivilegeExpireInSeconds = 3600 * 24;
        $pubDataStreamPrivilegeExpireInSeconds = 3600 * 24;

        if (!$appId || !$appCertificate) {
            return response()->json(['error' => 'AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables are required.'], 400);
        }

        try {
            // Token with UID
            $tokenWithUid = RtcTokenBuilder2::buildTokenWithUid($appId, $appCertificate, $channelName, $uid, RtcTokenBuilder2::ROLE_PUBLISHER, $tokenExpirationInSeconds, $privilegeExpirationInSeconds);

            // Token with User Account
            $tokenWithUserAccount = RtcTokenBuilder2::buildTokenWithUserAccount($appId, $appCertificate, $channelName, $uidStr, RtcTokenBuilder2::ROLE_PUBLISHER, $tokenExpirationInSeconds, $privilegeExpirationInSeconds);

            // Token with UID and Privileges
            $tokenWithPrivileges = RtcTokenBuilder2::buildTokenWithUidAndPrivilege($appId, $appCertificate, $channelName, $uid, $tokenExpirationInSeconds, $joinChannelPrivilegeExpireInSeconds, $pubAudioPrivilegeExpireInSeconds, $pubVideoPrivilegeExpireInSeconds, $pubDataStreamPrivilegeExpireInSeconds);

            // Token with User Account and Privileges
            $tokenWithUserAccountAndPrivileges = RtcTokenBuilder2::buildTokenWithUserAccountAndPrivilege($appId, $appCertificate, $channelName, $uidStr, $tokenExpirationInSeconds, $joinChannelPrivilegeExpireInSeconds, $pubAudioPrivilegeExpireInSeconds, $pubVideoPrivilegeExpireInSeconds, $pubDataStreamPrivilegeExpireInSeconds);

            // Token with RTM
            $tokenWithRTM = RtcTokenBuilder2::buildTokenWithRtm($appId, $appCertificate, $channelName, $uidStr, RtcTokenBuilder2::ROLE_PUBLISHER, $tokenExpirationInSeconds, $privilegeExpirationInSeconds);

            return response()->json([
                'token_with_uid' => $tokenWithUid,
                'token_with_user_account' => $tokenWithUserAccount,
                'token_with_privileges' => $tokenWithPrivileges,
                'token_with_user_account_privileges' => $tokenWithUserAccountAndPrivileges,
                'token_with_rtm' => $tokenWithRTM
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate token. ' . $e->getMessage()], 500);
        }
    }
}
