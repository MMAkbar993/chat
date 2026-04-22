<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MissedMessageEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $userName;
    public string $messageLink;

    public function __construct(string $firstName, string $userName, string $messageLink)
    {
        $this->firstName = $firstName;
        $this->userName = $userName;
        $this->messageLink = $messageLink;
    }

    public function build()
    {
        return $this->markdown('emails.missed-message')
            ->subject('You Have a New Message on Connect');
    }
}
