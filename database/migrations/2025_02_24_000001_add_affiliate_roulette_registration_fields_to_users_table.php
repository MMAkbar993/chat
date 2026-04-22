<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->nullable()->after('last_name');
            $table->string('company_name')->nullable()->after('full_name');
            $table->string('company_domain')->nullable()->after('company_name')->comment('Domain extracted from company website for email validation');
            $table->string('country', 100)->nullable()->after('company_domain');
            $table->string('primary_role', 80)->nullable()->after('country');
            $table->string('other_role_text', 255)->nullable()->after('primary_role');
            $table->timestamp('terms_accepted_at')->nullable()->after('other_role_text');
            $table->timestamp('kyc_verified_at')->nullable()->after('terms_accepted_at');
            $table->string('kyc_provider_id', 100)->nullable()->after('kyc_verified_at');
            $table->string('subscription_status', 40)->default('pending_payment')->after('kyc_provider_id');
            $table->timestamp('email_verified_at')->nullable()->after('subscription_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'full_name', 'company_name', 'company_domain', 'country',
                'primary_role', 'other_role_text', 'terms_accepted_at',
                'kyc_verified_at', 'kyc_provider_id', 'subscription_status',
                'email_verified_at',
            ]);
        });
    }
};
