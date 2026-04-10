<div id="welcome-container" class="welcome-content d-flex align-items-center justify-content-center">
    <div class="welcome-info text-center">
        <div class="welcome-box bg-white d-inline-flex align-items-center gap-2">
            <span id="profileImageChat" class="avatar avatar-md flex-shrink-0"></span>
            <h6 class="title mb-0"> {{ __('Welcome!') }} <span id="profile-info-chat-name">{{ __('Loading...') }}</span></h6>
        </div>
        <p class="mt-3 mb-4">{{ __('Choose a person or group to start chat with them.') }}</p>
        <a href="javascript:void(0);" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-contact"><i class="ti ti-send me-2"></i>{{ __('Invite Contacts') }}</a>
    </div>
</div>
