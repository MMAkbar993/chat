<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $loginLink;

    public function __construct(User $user)
    {
        $this->firstName = $user->first_name ?: explode(' ', $user->full_name ?? $user->user_name ?? 'User')[0];
        $this->loginLink = route('login');
    }

    public function build()
    {
        return $this->markdown('emails.welcome')
            ->subject('Welcome to Connect');
    }
}
