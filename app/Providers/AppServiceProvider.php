<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use GuzzleHttp\Client;
use GuzzleHttp\ClientInterface;
use Kreait\Firebase\JWT\Action\VerifyIdToken\Handler as VerifyIdTokenHandler;
use Kreait\Firebase\JWT\Action\VerifyIdToken\WithLcobucciJWT;
use Kreait\Firebase\JWT\GooglePublicKeys;
//use Kreait\Firebase\JWT\Action\FetchGooglePublicKeys\FetchGooglePublicKeys; // Correct implementation to fetch keys
use Kreait\Firebase\JWT\Action\FetchGooglePublicKeys\Handler as FetchGooglePublicKeysHandler; 
use Lcobucci\JWT\Signer\Rsa\Sha256;
use Psr\Clock\ClockInterface;
use Symfony\Component\Clock\NativeClock;
use Google\Auth\SignBlobInterface;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\App;
class AppServiceProvider extends ServiceProvider
{
    
    public function register(): void
{
    $this->app->bind(ClientInterface::class, function ($app) {
        return new Client();
    });

    $this->app->bind(ClockInterface::class, function ($app) {
        return new NativeClock();
    });

    $this->app->bind(SignBlobInterface::class, function ($app) {
        $credentialsPath = storage_path('firebase/firebase_credentials.json');
        return new ServiceAccountCredentials('https://www.googleapis.com/auth/firebase', $credentialsPath);
    });

    $this->app->bind(VerifyIdTokenHandler::class, function ($app) {
        $projectId = config('firebase.frontend.project_id');

        // Create a Guzzle client for HTTP requests
        
        $client = new Client();

        // Create the FetchGooglePublicKeys action
        $fetchGooglePublicKeys = new FetchGooglePublicKeysHandler($client);

        // Use the FetchGooglePublicKeys action to retrieve the public keys
        $googlePublicKeys = new GooglePublicKeys($fetchGooglePublicKeys);

        // Instantiate the RSA signer
        $signer = new Sha256();

        // Get the clock instance for time-sensitive validation
        $clock = $app->make(ClockInterface::class);

        // Set an optional leeway (seconds of tolerance for token expiration)
        $leewayInSeconds = 60;

        // Returning WithLcobucciJWT with required dependencies
        return new WithLcobucciJWT($projectId, $googlePublicKeys, $clock, $leewayInSeconds);
    });
}
    
    

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $language = session('language', 'en'); // Default to 'en' if not set

        // Set the application's locale
        App::setLocale($language);
        // Load installer module if enabled
        $modulesStatus = json_decode(File::get(base_path('modules_statuses.json')), true);

        if (isset($modulesStatus['installer']) && $modulesStatus['installer']) {
            $this->loadRoutesFrom(base_path('Modules/Installer/routes/web.php'));
        }
    }
}
