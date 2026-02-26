<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class EncryptionService
{
    public function encryptData($data)
    {
        // Define the nonce and key
        $nonce = hex2bin("c88529b087036c035be110e0fa5b6b63041ede30e2e69e90");
        $key = hex2bin("89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6");

        // Validate nonce length
        if (strlen($nonce) !== SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new \Exception('Invalid nonce length during encryption.');
        }

        // Encrypt the data
        $ciphertext = sodium_crypto_secretbox($data, $nonce, $key);

        // Combine nonce and ciphertext
        $combined = $nonce . $ciphertext;

        // Encode combined data in base64
        $encoded = base64_encode($combined);


        return $encoded;
    }



    // Decrypt the data
    public function decryptData($encryptedData)
    {

        // Decode the base64 encoded encrypted data
        $decoded = base64_decode($encryptedData);

        // Check if base64 decoding succeeded
        if ($decoded === false) {
            throw new \Exception('Base64 decoding failed.');
        }

        // Ensure the decoded data is at least as long as the nonce
        if (strlen($decoded) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new \Exception('Decoded data is too short to contain a nonce.');
        }

        // Define the key
        $key = hex2bin("89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6");

        // Extract the nonce (first 24 bytes)
        $extracted_nonce = mb_substr($decoded, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES, '8bit');


        // Validate extracted nonce length
        if (strlen($extracted_nonce) !== SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            throw new \Exception('Invalid nonce length during decryption.');
        }

        // Extract the ciphertext (remaining bytes)
        $extracted_ciphertext = mb_substr($decoded, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES, null, '8bit');

        // Decrypt the data
        $data = sodium_crypto_secretbox_open($extracted_ciphertext, $extracted_nonce, $key);

        // Check if decryption succeeded
        if ($data === false) {
            throw new \Exception('Decryption failed. Invalid ciphertext or nonce.');
        }

        return $data;
    }
}
