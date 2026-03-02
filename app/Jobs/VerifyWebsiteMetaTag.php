<?php

namespace App\Jobs;

use App\Models\UserWebsite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VerifyWebsiteMetaTag implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(
        protected int $websiteId
    ) {}

    public function handle(): void
    {
        $website = UserWebsite::find($this->websiteId);
        if (!$website) {
            return;
        }

        $cacheKey = 'website_verify_' . $website->id;
        if (Cache::has($cacheKey)) {
            return;
        }

        try {
            $url = $this->normalizeUrl($website->url);
            $response = Http::timeout(15)
                ->withUserAgent('AffiliateRouletteBot/1.0')
                ->get($url);

            if (!$response->successful()) {
                Log::info("Website verification failed for {$url}: HTTP {$response->status()}");
                Cache::put($cacheKey, 'checked', now()->addHours(1));
                return;
            }

            $html = $response->body();
            $token = $website->verification_token;

            if ($this->findMetaTag($html, $token)) {
                $website->verified_at = now();
                $website->save();
                Log::info("Website verified: {$url} for user {$website->user_id}");
            }

            Cache::put($cacheKey, 'checked', now()->addHours(6));
        } catch (\Exception $e) {
            Log::warning("Website verification error for website #{$this->websiteId}: {$e->getMessage()}");
            Cache::put($cacheKey, 'checked', now()->addHours(1));
        }
    }

    protected function normalizeUrl(string $url): string
    {
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        return $url;
    }

    protected function findMetaTag(string $html, string $token): bool
    {
        $pattern = '/<meta\s+[^>]*name\s*=\s*["\']affiliate-roulette-verification["\'][^>]*content\s*=\s*["\']' . preg_quote($token, '/') . '["\'][^>]*\/?>/i';
        if (preg_match($pattern, $html)) {
            return true;
        }

        $patternReversed = '/<meta\s+[^>]*content\s*=\s*["\']' . preg_quote($token, '/') . '["\'][^>]*name\s*=\s*["\']affiliate-roulette-verification["\'][^>]*\/?>/i';
        return (bool) preg_match($patternReversed, $html);
    }
}
