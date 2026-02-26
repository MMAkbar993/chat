<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateEncryptionKey extends Command
{
    protected $signature = 'generate:encryption-key';
    protected $description = 'Generate a Sodium encryption key';

    public function handle() : void
    {
        $key = sodium_crypto_secretbox_keygen();
        $this->info('Encryption Key: ' . base64_encode($key));
    }
}
