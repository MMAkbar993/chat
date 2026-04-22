<?php

namespace App\Services;

use App\Services\RtcTokenBuilder2;

class AgoraService
{
    protected $appId;
    protected $appCertificate;

    public function __construct()
    {
        $this->appId = "e33cca3d1b4d433088d7e91702a12b66";
        $this->appCertificate = "ccbbfcd514d54b1aa9eff8bb67587e9c";
    }

    public function generateToken($channelName, $uid, $role)
    {
        $expireTimeInSeconds = 3600 * 24; // Token expiry set to 24 hour
        $currentTimestamp = now()->timestamp;
        $privilegeExpiredTs = $currentTimestamp + $expireTimeInSeconds;

        // Generate the token
        return RtcTokenBuilder2::buildTokenWithUid(
            $this->appId,
            $this->appCertificate,
            $channelName,
            $uid,
            $role,
            $privilegeExpiredTs,
            $privilegeExpiredTs,
            $privilegeExpiredTs,
            $privilegeExpiredTs
        );
    }
}
