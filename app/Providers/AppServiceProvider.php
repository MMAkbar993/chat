<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use GuzzleHttp\Client;
use GuzzleHttp\ClientInterface;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\App;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ClientInterface::class, function ($app) {
            return new Client();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $language = session('language', 'en');
        App::setLocale($language);
        $modulesStatus = json_decode(File::get(base_path('modules_statuses.json')), true);

        if (isset($modulesStatus['installer']) && $modulesStatus['installer']) {
            $this->loadRoutesFrom(base_path('Modules/Installer/routes/web.php'));
        }

        // Register community Socialite providers (Twitch, LinkedIn). Instagram only if class exists at runtime to avoid 500 when package is missing.
        Event::listen(SocialiteWasCalled::class, \SocialiteProviders\Twitch\TwitchExtendSocialite::class);
        Event::listen(SocialiteWasCalled::class, \SocialiteProviders\LinkedIn\LinkedInExtendSocialite::class);
        Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event) {
            if (!class_exists(\SocialiteProviders\Instagram\InstagramExtendSocialite::class)) {
                return;
            }
            try {
                $listener = $this->app->make(\SocialiteProviders\Instagram\InstagramExtendSocialite::class);
                if (method_exists($listener, 'handle')) {
                    $listener->handle($event);
                }
            } catch (\Throwable $e) {
                // Don't break other providers if Instagram fails
                report($e);
            }
        });

        // Register Kick driver manually so it works even if event order or config keys differ
        if (class_exists(\Byancode\SocialiteKick\Provider::class)) {
            $kickConfig = config('services.kick');
            if (is_array($kickConfig) && !empty($kickConfig['client_id'])) {
                \Laravel\Socialite\Facades\Socialite::extend('kick', function ($app) {
                    $manager = $app->make(\Laravel\Socialite\Contracts\Factory::class);
                    $config = config('services.kick');
                    $config['redirect'] = $config['redirect'] ?? $app->make('url')->route('social.callback', ['platform' => 'kick']);
                    return $manager->buildProvider(\Byancode\SocialiteKick\Provider::class, $config);
                });
            }
        }

        // Use LinkedIn OpenID Connect (openid, profile, email) instead of legacy r_emailaddress / r_liteprofile to avoid "unauthorized_scope_error"
        \Laravel\Socialite\Facades\Socialite::extend('linkedin', function ($app) {
            $config = config('services.linkedin');
            $config['scopes'] = ['openid', 'profile', 'email'];
            $manager = $app->make(\Laravel\Socialite\Contracts\Factory::class);
            return $manager->buildProvider(\Laravel\Socialite\Two\LinkedInOpenIdProvider::class, $config);
        });
    }
}
