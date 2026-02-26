<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $message;
    /** @var array<string, mixed> */
    public array $user; // Define user array with key-value types

    /**
     * @param string $message
     * @param array<string, mixed> $user
     */
    public function __construct(string $message, array $user)
    {
        $this->message = $message;
        $this->user = $user;
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('chat');
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
