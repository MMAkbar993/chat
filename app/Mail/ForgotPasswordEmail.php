<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ForgotPasswordEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $resetPasswordLink;

    public function __construct(string $firstName, string $resetPasswordLink)
    {
        $this->firstName = $firstName;
        $this->resetPasswordLink = $resetPasswordLink;
    }

    public function build()
    {
        return $this->markdown('emails.forgot-password')
            ->subject('Reset Your Connect Password');
    }
}
