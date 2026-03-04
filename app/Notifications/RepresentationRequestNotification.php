<?php

namespace App\Notifications;

use App\Models\WebsiteRepresentative;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RepresentationRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public WebsiteRepresentative $representationRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $requester = $this->representationRequest->user;
        $website = $this->representationRequest->website;
        $name = $requester->full_name ?? $requester->first_name . ' ' . $requester->last_name;

        return (new MailMessage)
            ->subject('Representation Request: ' . $website->domain)
            ->line("User {$name} ({$requester->email}) is requesting to represent your company.")
            ->line('Website: ' . $website->domain)
            ->action('Review Request', url('/profile?tab=authorized-users'))
            ->line('Please approve or deny this request in your profile.');
    }

    public function toArray(object $notifiable): array
    {
        $requester = $this->representationRequest->user;
        $website = $this->representationRequest->website;

        return [
            'type' => 'representation_request',
            'representation_request_id' => $this->representationRequest->id,
            'website_id' => $website->id,
            'website_domain' => $website->domain,
            'requester_id' => $requester->id,
            'requester_name' => $requester->full_name ?? $requester->first_name . ' ' . $requester->last_name,
            'requester_email' => $requester->email,
            'message' => 'User ' . ($requester->full_name ?? $requester->first_name) . ' is requesting to represent your company.',
        ];
    }
}
