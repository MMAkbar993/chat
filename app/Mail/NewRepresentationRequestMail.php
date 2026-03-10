<?php

namespace App\Mail;

use App\Models\WebsiteRepresentative;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewRepresentationRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $userName;
    public string $websiteName;
    public string $approvalLink;

    public function __construct(WebsiteRepresentative $representationRequest)
    {
        $admin = $representationRequest->website->admin;
        $this->firstName = $admin && ($admin->first_name || $admin->full_name)
            ? ($admin->first_name ?: explode(' ', $admin->full_name ?? $admin->user_name ?? 'User')[0])
            : 'there';

        $requester = $representationRequest->user;
        $this->userName = $requester->full_name ?? trim($requester->first_name . ' ' . ($requester->last_name ?? '')) ?: $requester->user_name ?? $requester->email;

        $website = $representationRequest->website;
        $this->websiteName = $website->domain ?? 'Your website';

        $this->approvalLink = route('profile') . '?tab=authorized-users';
    }

    public function build()
    {
        return $this->markdown('emails.new-representation-request')
            ->subject('New Representation Request for Your Website');
    }
}
