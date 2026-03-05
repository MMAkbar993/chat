<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\File;

class CheckInstaller
{
    public function handle($request, Closure $next)
    {
        $path = base_path('modules_statuses.json');
        if (!File::exists($path)) {
            return $next($request);
        }
        // Load the status of the installer module
        $modulesStatus = json_decode(File::get($path), true);
       
        // If the installer is enabled, redirect to the installer route
        if (isset($modulesStatus['Installer']) && $modulesStatus['Installer']) {
           
            return redirect()->route('setup.verify');
        }

        // Proceed if the installer is disabled
        return $next($request);
    }
}
