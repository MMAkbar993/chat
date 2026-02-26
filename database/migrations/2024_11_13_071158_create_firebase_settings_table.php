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
        Schema::create('firebase_settings', function (Blueprint $table) {
            $table->id();
            $table->string('application_key');
            $table->string('authnticate_domain');
            $table->string('database_url');
            $table->string('project_id');
            $table->string('storage_bucket');
            $table->string('message_id');
            $table->string('application_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firebase_settings');
    }
};
