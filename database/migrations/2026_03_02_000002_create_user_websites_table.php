<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_websites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('url');
            $table->string('verification_token', 64)->unique();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_websites');
    }
};
