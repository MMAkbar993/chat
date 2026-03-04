<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('websites', function (Blueprint $table) {
            $table->id();
            $table->string('domain', 255)->unique();
            $table->unsignedBigInteger('admin_user_id');
            $table->timestamp('verified_at');
            $table->timestamps();

            $table->foreign('admin_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('domain');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('websites');
    }
};
