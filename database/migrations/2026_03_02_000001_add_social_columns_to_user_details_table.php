<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_details', function (Blueprint $table) {
            $table->string('instagram')->nullable()->after('youtube');
            $table->string('kick')->nullable()->after('instagram');
            $table->string('twitch')->nullable()->after('kick');
        });
    }

    public function down(): void
    {
        Schema::table('user_details', function (Blueprint $table) {
            $table->dropColumn(['instagram', 'kick', 'twitch']);
        });
    }
};
