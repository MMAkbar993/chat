<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Show 2FA setup page with QR code.
     */
    public function setup(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('signin');
        }

        if ($user->has2faEnabled()) {
            return redirect()->route('settings')->with('info', __('2FA is already enabled.'));
        }

        $secret = $this->google2fa->generateSecretKey();
        $request->session()->put('2fa_setup_secret', $secret);

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'AffiliateRoulette'),
            $user->email,
            $secret
        );

        $qrCodeSvg = $this->generateQrSvg($qrCodeUrl);

        return view('frontend.two-factor-setup', [
            'secret' => $secret,
            'qrCodeSvg' => $qrCodeSvg,
        ]);
    }

    /**
     * Verify the TOTP code during setup and enable 2FA.
     */
    public function verifySetup(Request $request)
    {
        $request->validate(['code' => 'required|digits:6']);

        $user = Auth::user();
        $secret = $request->session()->get('2fa_setup_secret');

        if (!$secret) {
            return back()->withErrors('Session expired. Please start 2FA setup again.');
        }

        $valid = $this->google2fa->verifyKey($secret, $request->input('code'));
        if (!$valid) {
            return back()->withErrors('Invalid verification code. Please try again.');
        }

        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_enabled_at' => now(),
        ]);

        $request->session()->forget('2fa_setup_secret');
        $request->session()->put('2fa_verified', true);

        return redirect()->route('settings')->with('success', __('Two-factor authentication enabled successfully.'));
    }

    /**
     * Show the 2FA challenge form during login.
     */
    public function challenge()
    {
        return view('frontend.two-factor-challenge');
    }

    /**
     * Verify the TOTP code during login.
     */
    public function verifyChallenge(Request $request)
    {
        $request->validate(['code' => 'required|digits:6']);

        $user = Auth::user();
        if (!$user || !$user->has2faEnabled()) {
            return redirect()->route('chat');
        }

        $valid = $this->google2fa->verifyKey(
            $user->two_factor_secret,
            $request->input('code')
        );

        if (!$valid) {
            return back()->withErrors('Invalid verification code.');
        }

        $request->session()->put('2fa_verified', true);

        return redirect()->intended(route('chat'));
    }

    /**
     * Disable 2FA (requires current TOTP code).
     */
    public function disable(Request $request)
    {
        $request->validate(['code' => 'required|digits:6']);

        $user = Auth::user();
        if (!$user || !$user->has2faEnabled()) {
            return back()->withErrors('2FA is not enabled.');
        }

        $valid = $this->google2fa->verifyKey(
            $user->two_factor_secret,
            $request->input('code')
        );

        if (!$valid) {
            return back()->withErrors('Invalid verification code. 2FA was not disabled.');
        }

        $user->update([
            'two_factor_secret' => null,
            'two_factor_enabled_at' => null,
        ]);

        $request->session()->forget('2fa_verified');

        return redirect()->route('settings')->with('success', __('Two-factor authentication has been disabled.'));
    }

    protected function generateQrSvg(string $url): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);

        return $writer->writeString($url);
    }
}
