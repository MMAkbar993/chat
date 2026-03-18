<?php

namespace App\Notifications;

use App\Mail\NewRepresentationRequestMail;
use App\Models\WebsiteRepresentative;
use Illuminate\Notifications\Notification;

/**
 * Synchronous delivery so server misconfig (mail, notifications table) can be caught
 * and the representation request still returns HTTP 200.
 */
class RepresentationRequestNotification extends Notification
{
    public function __construct(
        public WebsiteRepresentative $representationRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): NewRepresentationRequestMail
    {
        return new NewRepresentationRequestMail($this->representationRequest);
    }

    public function toArray(object $notifiable): array
    {
        $this->representationRequest->loadMissing(['user', 'website']);
        $requester = $this->representationRequest->user;
        $website = $this->representationRequest->website;

        return [
            'type' => 'representation_request',
            'representation_request_id' => $this->representationRequest->id,
            'website_id' => $website?->id,
            'website_domain' => $website?->domain ?? '',
            'requester_id' => $requester?->id,
            'requester_name' => $requester
                ? ($requester->full_name ?? trim(($requester->first_name ?? '') . ' ' . ($requester->last_name ?? '')))
                : '',
            'requester_email' => $requester?->email ?? '',
            'message' => 'A user is requesting to represent your company for this website.',
        ];
    }
}
