<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewFriendRequestEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $userName;
    public string $friendRequestLink;

    public function __construct(string $firstName, string $userName, string $friendRequestLink)
    {
        $this->firstName = $firstName;
        $this->userName = $userName;
        $this->friendRequestLink = $friendRequestLink;
    }

    public function build()
    {
        return $this->markdown('emails.new-friend-request')
            ->subject('You Have a New Connection Request');
    }
}
