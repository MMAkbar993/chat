<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use GuzzleHttp\Client;
use GuzzleHttp\ClientInterface;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\App;

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
    }
}
