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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->index('user_id');
            $table->string('system_settings_name');
            $table->string('application_key');
            $table->string('authnticate_domain')->nullable();
            $table->string('database_url')->nullable();
            $table->string('project_id')->nullable();
            $table->string('storage_bucket')->nullable();
            $table->string('message_id')->nullable();
            $table->string('application_id')->nullable();
            $table->tinyInteger('active_status')->default(1)->comment('1 - Active, 0 - Inactive');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
