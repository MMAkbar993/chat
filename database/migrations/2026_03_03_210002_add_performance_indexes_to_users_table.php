<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!$this->hasIndex('users', 'users_subscription_status_index')) {
                $table->index('subscription_status');
            }
            if (!$this->hasIndex('users', 'users_kyc_verified_at_index')) {
                $table->index('kyc_verified_at');
            }
            if (!$this->hasIndex('users', 'users_primary_role_index')) {
                $table->index('primary_role');
            }
            if (!$this->hasIndex('users', 'users_country_index')) {
                $table->index('country');
            }
            if (!$this->hasIndex('users', 'users_last_login_at_index')) {
                $table->index('last_login_at');
            }
        });

        if (Schema::hasTable('user_subscriptions')) {
            Schema::table('user_subscriptions', function (Blueprint $table) {
                if (!$this->hasIndex('user_subscriptions', 'user_subscriptions_status_index')) {
                    $table->index('status');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['subscription_status']);
            $table->dropIndex(['kyc_verified_at']);
            $table->dropIndex(['primary_role']);
            $table->dropIndex(['country']);
            $table->dropIndex(['last_login_at']);
        });

        if (Schema::hasTable('user_subscriptions')) {
            Schema::table('user_subscriptions', function (Blueprint $table) {
                if ($this->hasIndex('user_subscriptions', 'user_subscriptions_status_index')) {
                    $table->dropIndex(['status']);
                }
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = \Illuminate\Support\Facades\DB::select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
            [$indexName]
        );
        return count($indexes) > 0;
    }
};
