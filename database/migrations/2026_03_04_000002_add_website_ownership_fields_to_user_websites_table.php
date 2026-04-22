<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_websites', function (Blueprint $table) {
            $table->unsignedBigInteger('website_id')->nullable()->after('user_id');
            $table->enum('relationship_type', ['owner', 'representative'])->default('owner')->after('verified_at');
        });

        Schema::table('user_websites', function (Blueprint $table) {
            $table->foreign('website_id')->references('id')->on('websites')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_websites', function (Blueprint $table) {
            $table->dropForeign(['website_id']);
            $table->dropColumn(['website_id', 'relationship_type']);
        });
    }
};
