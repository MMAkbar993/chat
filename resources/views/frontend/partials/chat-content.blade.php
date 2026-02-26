<div id="welcome-container" class="welcome-content d-flex align-items-center justify-content-center">
    <div class="welcome-info text-center">
        <div class="welcome-box bg-white d-inline-flex align-items-center">
            <span class="avatar avatar-md me-2">
                <img id="profileImageChat" src="assets/img/profiles/avatar-03.jpg" alt="img" class="rounded-circle">
            </span>
            <h6 class="title me-1">{{ __('Welcome!')}}</h6><h6 id="profile-info-chat-name"> {{ __('Loading...')}}</h6>
        </div>
        <p>{{ __('Choose a person or group to start chat with them.')}}</p>
        <a href="{{route('chat')}}" class="btn btn-primary"><i
                class="ti ti-location me-2"></i>{{ __('Chat With Contacts')}}</a>
    </div>
</div>
