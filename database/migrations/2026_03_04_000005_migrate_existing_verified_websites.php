<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $verified = DB::table('user_websites')
            ->whereNotNull('verified_at')
            ->orderBy('verified_at')
            ->get();

        foreach ($verified as $uw) {
            $domain = $this->normalizeDomain($uw->url);
            $existing = DB::table('websites')->where('domain', $domain)->first();

            if (!$existing) {
                DB::table('websites')->insert([
                    'domain' => $domain,
                    'admin_user_id' => $uw->user_id,
                    'verified_at' => $uw->verified_at,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $websiteId = (int) DB::getPdo()->lastInsertId();
                $relationshipType = 'owner';
            } else {
                $websiteId = $existing->id;
                $relationshipType = 'representative';
                DB::table('website_representatives')->insert([
                    'website_id' => $websiteId,
                    'user_id' => $uw->user_id,
                    'status' => 'approved',
                    'requested_at' => $uw->verified_at,
                    'decided_at' => $uw->verified_at,
                    'decided_by' => $existing->admin_user_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('user_websites')
                ->where('id', $uw->id)
                ->update([
                    'website_id' => $websiteId,
                    'relationship_type' => $relationshipType,
                ]);
        }
    }

    public function down(): void
    {
        // No rollback needed - website_id can remain
    }

    private function normalizeDomain(string $url): string
    {
        $url = trim($url);
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        $parsed = parse_url($url);
        return strtolower($parsed['host'] ?? '');
    }
};
