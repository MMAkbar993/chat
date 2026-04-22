<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('ops:health-check', function () {
    $this->info('DreamChat operational health check');
    $this->newLine();

    $cacheDriver = config('cache.default');
    $sessionDriver = config('session.driver');
    $queueDriver = config('queue.default');

    $this->line('Cache driver: ' . $cacheDriver);
    $this->line('Session driver: ' . $sessionDriver);
    $this->line('Queue driver: ' . $queueDriver);

    try {
        DB::connection()->getPdo();
        $this->info('Database connection: OK');
    } catch (\Throwable $e) {
        $this->error('Database connection failed: ' . $e->getMessage());
    }

    if ($queueDriver === 'sync') {
        $this->warn('Queue driver is sync. Use database/redis + worker for production.');
    }
    if ($cacheDriver === 'file') {
        $this->warn('Cache driver is file. Redis is recommended for higher traffic.');
    }
    if ($sessionDriver === 'file') {
        $this->warn('Session driver is file. Redis is recommended for better concurrency.');
    }
})->purpose('Quick production readiness checks');
