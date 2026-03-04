<?php

namespace App\Services;

use App\Models\Website;
use App\Models\UserWebsite;

class WebsiteVerificationService
{
    /**
     * Normalize URL to domain for comparison.
     * Accepts: www.example.com, example.com, https://example.com, http://example.com
     */
    public function normalizeDomain(string $url): string
    {
        $url = trim($url);
        if (empty($url)) {
            return '';
        }
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        $parsed = parse_url($url);
        $host = strtolower($parsed['host'] ?? '');
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }
        return $host;
    }

    /**
     * Normalize URL to full https URL for storage.
     */
    public function normalizeUrl(string $url): string
    {
        $domain = $this->normalizeDomain($url);
        return $domain ? 'https://' . $domain : '';
    }

    /**
     * Check if domain is already verified (has a website record with admin).
     */
    public function isDomainAlreadyVerified(string $domain): bool
    {
        return Website::where('domain', $domain)->exists();
    }

    /**
     * Get verified website for domain.
     */
    public function getVerifiedWebsite(string $domain): ?Website
    {
        return Website::where('domain', $domain)->first();
    }

    /**
     * Generate verification token in format: guv-{random}
     */
    public function generateVerificationToken(): string
    {
        return 'guv-' . strtoupper(bin2hex(random_bytes(4)));
    }
}
