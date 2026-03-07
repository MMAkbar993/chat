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

        // Register community Socialite providers (Twitch, LinkedIn, Instagram)
        Event::listen(SocialiteWasCalled::class, \SocialiteProviders\Twitch\TwitchExtendSocialite::class);
        Event::listen(SocialiteWasCalled::class, \SocialiteProviders\LinkedIn\LinkedInExtendSocialite::class);
        if (class_exists(\SocialiteProviders\Instagram\InstagramExtendSocialite::class)) {
            Event::listen(SocialiteWasCalled::class, \SocialiteProviders\Instagram\InstagramExtendSocialite::class);
        }

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
    }
}
