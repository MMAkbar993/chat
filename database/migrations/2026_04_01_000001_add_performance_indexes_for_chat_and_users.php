<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            if (! $this->hasIndex('chats', 'chats_sender_receiver_id_idx')) {
                $table->index(['sender_id', 'receiver_id', 'id'], 'chats_sender_receiver_id_idx');
            }
            if (! $this->hasIndex('chats', 'chats_receiver_sender_id_idx')) {
                $table->index(['receiver_id', 'sender_id', 'id'], 'chats_receiver_sender_id_idx');
            }
            if (! $this->hasIndex('chats', 'chats_sender_created_idx')) {
                $table->index(['sender_id', 'created_at'], 'chats_sender_created_idx');
            }
            if (! $this->hasIndex('chats', 'chats_receiver_created_idx')) {
                $table->index(['receiver_id', 'created_at'], 'chats_receiver_created_idx');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! $this->hasIndex('users', 'users_user_name_idx')) {
                $table->index('user_name', 'users_user_name_idx');
            }
            if (! $this->hasIndex('users', 'users_firebase_uid_idx')) {
                $table->index('firebase_uid', 'users_firebase_uid_idx');
            }
            if (! $this->hasIndex('users', 'users_last_login_idx')) {
                $table->index('last_login_at', 'users_last_login_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            $table->dropIndex('chats_sender_receiver_id_idx');
            $table->dropIndex('chats_receiver_sender_id_idx');
            $table->dropIndex('chats_sender_created_idx');
            $table->dropIndex('chats_receiver_created_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            if ($this->hasIndex('users', 'users_user_name_idx')) {
                $table->dropIndex('users_user_name_idx');
            }
            if ($this->hasIndex('users', 'users_firebase_uid_idx')) {
                $table->dropIndex('users_firebase_uid_idx');
            }
            if ($this->hasIndex('users', 'users_last_login_idx')) {
                $table->dropIndex('users_last_login_idx');
            }
        });
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
