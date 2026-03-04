<?php

namespace App\Jobs;

use App\Models\UserWebsite;
use App\Models\Website;
use App\Services\WebsiteVerificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VerifyWebsiteMetaTag implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    private const META_TAG_NAME = 'greenunimind-verification';

    public function __construct(
        protected int $websiteId
    ) {}

    public function handle(WebsiteVerificationService $verificationService): void
    {
        $userWebsite = UserWebsite::find($this->websiteId);
        if (!$userWebsite) {
            return;
        }

        $cacheKey = 'website_verify_' . $userWebsite->id;
        if (Cache::has($cacheKey)) {
            return;
        }

        try {
            $url = $verificationService->normalizeUrl($userWebsite->url);
            $domain = $verificationService->normalizeDomain($userWebsite->url);

            if ($verificationService->isDomainAlreadyVerified($domain)) {
                Cache::put($cacheKey, 'checked', now()->addHours(1));
                return;
            }

            $response = Http::timeout(15)
                ->withUserAgent('GreenUniMind-Verification/1.0')
                ->get($url);

            if (!$response->successful()) {
                Log::info("Website verification failed for {$url}: HTTP {$response->status()}");
                Cache::put($cacheKey, 'checked', now()->addHours(1));
                return;
            }

            $html = $response->body();
            $token = $userWebsite->verification_token;

            if ($this->findMetaTag($html, $token)) {
                DB::transaction(function () use ($userWebsite, $domain) {
                    $website = Website::create([
                        'domain' => $domain,
                        'admin_user_id' => $userWebsite->user_id,
                        'verified_at' => now(),
                    ]);

                    $userWebsite->update([
                        'website_id' => $website->id,
                        'verified_at' => now(),
                        'relationship_type' => UserWebsite::RELATIONSHIP_OWNER,
                    ]);
                });
                Log::info("Website verified: {$domain} for user {$userWebsite->user_id}");
            }

            Cache::put($cacheKey, 'checked', now()->addHours(6));
        } catch (\Exception $e) {
            Log::warning("Website verification error for website #{$this->websiteId}: {$e->getMessage()}");
            Cache::put($cacheKey, 'checked', now()->addHours(1));
        }
    }

    protected function findMetaTag(string $html, string $token): bool
    {
        $pattern = '/<meta\s+[^>]*name\s*=\s*["\']' . preg_quote(self::META_TAG_NAME, '/') . '["\'][^>]*content\s*=\s*["\']' . preg_quote($token, '/') . '["\'][^>]*\/?>/i';
        if (preg_match($pattern, $html)) {
            return true;
        }

        $patternReversed = '/<meta\s+[^>]*content\s*=\s*["\']' . preg_quote($token, '/') . '["\'][^>]*name\s*=\s*["\']' . preg_quote(self::META_TAG_NAME, '/') . '["\'][^>]*\/?>/i';
        return (bool) preg_match($patternReversed, $html);
    }
}
