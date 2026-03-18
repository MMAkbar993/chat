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
        if (!$userWebsite || $userWebsite->verified_at) {
            return;
        }

        try {
            $domain = $verificationService->normalizeDomain($userWebsite->url);
            $baseUrl = $verificationService->normalizeUrl($userWebsite->url);

            if ($verificationService->isDomainAlreadyVerified($domain)) {
                return;
            }

            $token = $userWebsite->verification_token;
            $urls = array_values(array_unique(array_filter([
                $baseUrl,
                $domain ? 'https://www.' . $domain : null,
            ])));

            $metaFound = false;
            foreach ($urls as $tryUrl) {
                foreach ([
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'GreenUniMind-Verification/1.0',
                ] as $ua) {
                    try {
                        $response = Http::timeout(20)
                            ->connectTimeout(10)
                            ->withHeaders([
                                'Accept' => 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                                'Accept-Language' => 'en-US,en;q=0.9',
                            ])
                            ->withUserAgent($ua)
                            ->get($tryUrl);

                        if ($response->successful() && $this->findMetaTag($response->body(), $token)) {
                            $metaFound = true;
                            break 2;
                        }
                    } catch (\Throwable $e) {
                        Log::debug('Website verify fetch attempt', ['url' => $tryUrl, 'error' => $e->getMessage()]);
                    }
                }
            }

            if ($metaFound) {
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
            } else {
                Log::info("Website verification: meta tag not found or site unreachable for domain {$domain}");
            }
        } catch (\Exception $e) {
            Log::warning("Website verification error for website #{$this->websiteId}: {$e->getMessage()}");
        }
    }

    protected function findMetaTag(string $html, string $token): bool
    {
        $escapedName = preg_quote(self::META_TAG_NAME, '/');
        $escapedToken = preg_quote($token, '/');
        $patterns = [
            '/<meta\s+[^>]*name\s*=\s*["\']' . $escapedName . '["\'][^>]*content\s*=\s*["\']' . $escapedToken . '["\'][^>]*>/i',
            '/<meta\s+[^>]*content\s*=\s*["\']' . $escapedToken . '["\'][^>]*name\s*=\s*["\']' . $escapedName . '["\'][^>]*>/i',
        ];
        foreach ($patterns as $p) {
            if (preg_match($p, $html)) {
                return true;
            }
        }

        if (class_exists(\DOMDocument::class)) {
            libxml_use_internal_errors(true);
            $dom = new \DOMDocument();
            $wrapped = '<?xml encoding="UTF-8">' . $html;
            if (@$dom->loadHTML($wrapped, LIBXML_NOERROR | LIBXML_NOWARNING)) {
                foreach ($dom->getElementsByTagName('meta') as $meta) {
                    $name = strtolower(trim($meta->getAttribute('name')));
                    if ($name === self::META_TAG_NAME && trim($meta->getAttribute('content')) === $token) {
                        libxml_clear_errors();
                        return true;
                    }
                }
            }
            libxml_clear_errors();
        }

        return false;
    }
}
