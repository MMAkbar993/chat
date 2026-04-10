<!-- Add Call -->
<div class="modal fade" id="new-call">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('New Call')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false;">
                    <div class="search-wrap contact-search mb-3">
                        <div class="input-group">
                            <input type="text" id="newCallSearchInput" class="form-control" placeholder="{{ __('Search')}}">
                            <a href="javascript:void(0);" class="input-group-text"><i class="ti ti-search"></i></a>
                        </div>
                    </div>
                    <h6 class="mb-3 fw-medium fs-16">{{ __('Contacts')}}</h6>
                    <div class="contact-scroll contact-select mb-3" id="user-list">
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Add Call -->

{{-- Hidden triggers: firebaseChat wires outbound audio/video to #audio-call-btn / #video-call-new-btn (see chat.blade). On /calls those IDs are absent; these SPA fallbacks keep initiation working. --}}
<a href="javascript:void(0);" id="audio-call-btn-spa" class="d-none" tabindex="-1" aria-hidden="true"></a>
<a href="javascript:void(0);" id="video-call-new-btn-spa" class="d-none" tabindex="-1" aria-hidden="true"></a>

{{-- 1:1 video ring UI: outgoing = red cancel only; incoming = green answer + red decline. Active call uses #start-video-call-container. --}}
<div class="modal fade video-call-ring-modal" id="video-call" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
            <div class="modal-body text-center pt-4 pb-2 px-3">
                <span class="model-icon bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style="width:56px;height:56px;">
                    <i class="ti ti-video fs-24"></i>
                </span>
                <h5 class="modal-title mb-1" id="video-call-ring-title">{{ __('Video call')}}</h5>
                <p class="text-muted small mb-0 video-call-ring-name"></p>
                <p class="text-muted small mb-0 mt-1 video-call-ring-status" id="video-call-ring-status"></p>
                <div class="d-flex justify-content-center my-4">
                    <span class="avatar avatar-xxl video-call-ring-avatar-wrap">
                        <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback" role="img" aria-label="{{ __('User') }}"><i class="ti ti-user" aria-hidden="true"></i></span>
                    </span>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0 pb-4 gap-2 flex-nowrap">
                <a href="javascript:void(0);" id="join-video-call"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    title="{{ __('Answer') }}">
                    <i class="ti ti-video fs-22"></i>
                </a>
                <a href="javascript:void(0);" id="decline-video-call"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    data-bs-dismiss="modal" aria-label="{{ __('Decline') }}"
                    title="{{ __('Decline') }}">
                    <i class="ti ti-phone-off fs-22"></i>
                </a>
            </div>
        </div>
    </div>
</div>
<!-- /Video Call -->

@include('frontend.partials.agora-video-call-modals')

<!-- Voice Call attend (active audio call) - global so receiver can see on any page -->
<div class="modal fade" id="voice-attend-new">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="card bg-transparent-dark flex-fill border mb-3">
                    <div class="card-body d-flex justify-content-between p-3 flex-wrap row-gap-3">
                        <div class="d-flex align-items-center">
                            <span class="avatar avatar-new-audio avatar-lg online me-2">
                                <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback"><i class="ti ti-user" aria-hidden="true"></i></span>
                            </span>
                            <div class="new-name">
                                <h6>Loading...</h6>
                            </div>
                            <div class="new-name">
                                <h6>Loading...</h6>
                                <h6 id="call-timer-display" class="ms-5 ps-5">00:00:00</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <div class="card audio-crd bg-transparent-dark border">
                    <div class="modal-bgimg">
                        <span class="modal-bg1">
                            <img src="{{ asset('assets/img/bg/bg-02.png') }}" class="img-fluid" alt="bg">
                        </span>
                        <span class="modal-bg2">
                            <img src="{{ asset('assets/img/bg/bg-03.png') }}" class="img-fluid" alt="bg">
                        </span>
                    </div>
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-center align-items-center pt-5">
                            <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2 avatar-new-audio-big">
                                <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback"><i class="ti ti-user" aria-hidden="true"></i></span>
                            </span>
                        </div>
                        <div class="d-flex align-items-end justify-content-end">
                            <span class="call-span border border-2 border-primary d-flex justify-content-center align-items-center rounded">
                                <span class="avatar current-image avatar-xl bg-soft-primary rounded-circle p-2">
                                    <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback"><i class="ti ti-user" aria-hidden="true"></i></span>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
                <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                    <a href="javascript:void(0);" class="call-controll mute-bt d-flex align-items-center justify-content-center" id="mute-btn">
                        <i class="ti ti-microphone"></i>
                    </a>
                    <a href="javascript:void(0);" data-bs-dismiss="modal" class="call-controll call-decline d-flex align-items-center justify-content-center" id="end-audio-call">
                        <i class="ti ti-phone"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Voice Call attend -->

<!-- Voice Call (incoming/outgoing ring) - global so receiver sees popup on any page -->
<div class="modal fade video-call-ring-modal" id="audio-call-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
            <div class="modal-body text-center pt-4 pb-2 px-3">
                <span class="model-icon bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style="width:56px;height:56px;">
                    <i class="ti ti-phone-call fs-24"></i>
                </span>
                <h5 class="modal-title mb-1" id="audio-call-ring-title">{{ __('Audio call')}}</h5>
                <p class="text-muted small mb-0 audio-name"></p>
                <p class="text-muted small mb-0 mt-1 audio-call-ring-status" id="audio-call-ring-status"></p>
                <div class="d-flex justify-content-center my-4">
                    <span class="avatar avatar-xxl avatar-audio audio-call-ring-avatar-wrap">
                        <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback" role="img" aria-label="{{ __('User') }}"><i class="ti ti-user" aria-hidden="true"></i></span>
                    </span>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0 pb-4 gap-2 flex-nowrap">
                <a href="javascript:void(0);" id="join-audio-call"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    title="{{ __('Answer') }}">
                    <i class="ti ti-phone fs-22"></i>
                </a>
                <a href="javascript:void(0);" id="decline-audio-call"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    data-bs-dismiss="modal" aria-label="{{ __('Decline') }}"
                    title="{{ __('Decline') }}">
                    <i class="ti ti-phone-off fs-22"></i>
                </a>
            </div>
        </div>
    </div>
</div>
<!-- /Voice Call -->

<!-- Mute User -->
<div class="modal fade" id="mute-user">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Muted User')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('chat') }}">
                    <div class="link-item mb-3">
                        <input type="text" class="form-control border-0"
                            placeholder="{{ __('Search For Muted Users')}}">
                        <span class="input-group-text"><i class="ti ti-search"></i></span>
                    </div>
                    <h6 class="mb-3 fs-16">{{ __('Muted User')}}</h6>
                    <div class="mb-3">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <span class="avatar avatar-lg me-2">
                                            <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle"
                                                alt="">
                                        </span>
                                        <div>
                                            <h6>Aaryian Jose</h6>
                                            <span class="fs-14">App Developer</span>
                                        </div>
                                    </div>
                                    <a href="javascript:void(0);" class="btn btn-outline-primary">{{ __('Unmute')}}</a>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <span class="avatar avatar-lg me-2">
                                            <img src="assets/img/profiles/avatar-02.jpg" class="rounded-circle"
                                                alt="">
                                        </span>
                                        <div>
                                            <h6>Sarika Jain</h6>
                                            <span class="fs-14">UI/UX Designer</span>
                                        </div>
                                    </div>
                                    <a href="javascript:void(0);" class="btn btn-outline-primary">{{ __('Unmute')}}</a>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <span class="avatar avatar-lg me-2">
                                            <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback"><i class="ti ti-user" aria-hidden="true"></i></span>
                                        </span>
                                        <div>
                                            <h6>Clyde Smith</h6>
                                            <span class="fs-14">Web Developer</span>
                                        </div>
                                    </div>
                                    <a href="javascript:void(0);" class="btn btn-outline-primary">{{ __('Unmute')}}</a>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <span class="avatar avatar-lg me-2">
                                            <img src="assets/img/profiles/avatar-04.jpg" class="rounded-circle"
                                                alt="">
                                        </span>
                                        <div>
                                            <h6>Carla Jenkins</h6>
                                            <span class="fs-14">Business Analyst</span>
                                        </div>
                                    </div>
                                    <a href="javascript:void(0);" class="btn btn-outline-primary">{{ __('Unmute')}}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Mute User -->

<!-- Delete  Account -->
<div class="modal fade" id="delete-account">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Delete Account')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="deleteAccountForm">
                    <div class="block-wrap mb-3">
                        <h6 class="fs-16">{{ __('Are you sure you want to delete your account?')}} </h6>
                        <p class="text-grya-9">
                            {{ __('This action is irreversible and all your data will be permanently deleted.')}}
                        </p>
                    </div>
                    <div class="mb-3">
                        <ul>
                            <li class="d-flex align-items-center fs-16 mb-2">
                                <i class="ti ti-arrow-badge-right me-2 fs-20 text-primary"></i>
                                {{ __('Delete your account info and profile photo')}}
                            </li>
                            <li class="d-flex align-items-center fs-16 mb-2">
                                <i class="ti ti-arrow-badge-right me-2 fs-20 text-primary"></i>
                                {{ __('Delete you from all dreamschat groups')}}
                            </li>
                            <li class="d-flex fs-16 mb-2">
                                <i class="ti ti-arrow-badge-right me-2 fs-20 text-primary"></i>
                                {{ __('Delete your message history on this phone and your icloud backup')}}
                            </li>
                        </ul>
                    </div>
                    <div class="d-flex mb-3">
                        <div>
                            <input type="checkbox" id="confirmDeleteCheckbox" class="me-2">
                        </div>
                        <div>
                            <p class="text-grya-9">
                                {{ __('I understand that deleting my account is irreversible and all my data will be permanently deleted.')}}
                            </p>
                            <span id="checkboxError" class="text-danger fs-14" style="display: none;">{{ __('Please confirm by checking the box above.')}}</span>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="deleteButton">{{ __('Delete')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Delete Account -->

<!-- Logout -->
<div class="modal fade" id="acc-logout">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Logout')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-logout text-danger"></i>
                        </span>
                        <p class="text-grya-9">{{ __('Are you sure you want to logout?')}}</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="setting-logout-button">{{ __('Logout')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Logout -->

<div class="modal fade video-call-ring-modal" id="video-call-new" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
            <div class="modal-body text-center pt-4 pb-2 px-3">
                <span class="model-icon bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style="width:56px;height:56px;">
                    <i class="ti ti-video fs-24"></i>
                </span>
                <h5 class="modal-title mb-1" id="videoCallModalLabel">{{ __('Video call')}}</h5>
                <p class="text-muted small mb-0 calling-name"></p>
                <div class="d-flex justify-content-center my-4">
                    <span class="avatar avatar-xxl avatar-new">
                        <img src="{{ asset('assets/img/profiles/avatar-06.jpg') }}" class="rounded-circle" alt="">
                    </span>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0 pb-4 gap-2 flex-nowrap">
                <a href="javascript:void(0);" id="join"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    title="{{ __('Answer') }}">
                    <i class="ti ti-video fs-22"></i>
                </a>
                <a href="javascript:void(0);" id="decline"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    data-bs-dismiss="modal" aria-label="close"
                    title="{{ __('Decline') }}">
                    <i class="ti ti-phone-off fs-22"></i>
                </a>
            </div>
        </div>
    </div>
</div>
{{-- Group active video: same layout as 1:1 #start-video-call-container (pip local + remote grid) --}}
<div class="modal fade" id="video_group_new" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="user-video-head">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-video avatar-lg online me-2" id="group-video-head-avatar"></span>
                        <div class="user-name" id="group-video-head-name">{{ __('Group video call') }}</div>
                        <span class="badge border border-primary text-primary badge-sm ms-5">
                            <span id="group-video-call-timer" class="call-duration">00:00:00</span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <div class="row video-group">
                    <div id="group-remote-playerlist" class="remote-player-container"></div>
                    <div id="group-local-player" class="mini-video-view active br-8 position-absolute">
                        <div class="bg-soft-primary mx-auto default-profile rounded-circle align-items-center justify-content-center">
                            <span class="avatar avatar-lg rounded-circle bg-primary">You</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer justify-content-center border-0 pt-0">
                    <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                        <a href="javascript:void(0);" id="mute-group-btn" class="call-controll mute-call-btn d-flex align-items-center justify-content-center">
                            <i class="ti ti-microphone"></i>
                        </a>
                        <a href="javascript:void(0);" id="leave-group-video1" data-bs-dismiss="modal" class="call-controll call-decline d-flex align-items-center justify-content-center">
                            <i class="ti ti-phone"></i>
                        </a>
                        <a href="javascript:void(0);" id="video-group-btn" class="call-controll video-call-btn d-flex align-items-center justify-content-center">
                            <i class="ti ti-video"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{{-- Group incoming video ring: same compact UI as 1:1 #video-call --}}
<div class="modal fade video-call-ring-modal" id="video-call-new-group" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
            <div class="modal-body text-center pt-4 pb-2 px-3">
                <span class="model-icon bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style="width:56px;height:56px;">
                    <i class="ti ti-video fs-24"></i>
                </span>
                <h5 class="modal-title mb-1 group-video-ring-title">{{ __('Video call') }}</h5>
                <p class="text-muted small mb-0 group-video-call-ring-name"></p>
                <p class="text-muted small mb-0 mt-1 group-video-ring-status" id="group-video-ring-status"></p>
                <div class="d-flex justify-content-center my-4">
                    <span class="avatar avatar-xxl group-video-call-ring-avatar-wrap">
                        <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback" role="img" aria-label="{{ __('User') }}"><i class="ti ti-user" aria-hidden="true"></i></span>
                    </span>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0 pb-4 gap-2 flex-nowrap">
                <a href="javascript:void(0);" id="join-group"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    title="{{ __('Answer') }}">
                    <i class="ti ti-video fs-22"></i>
                </a>
                <a href="javascript:void(0);" id="decline-group"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    data-bs-dismiss="modal" aria-label="{{ __('Decline') }}"
                    title="{{ __('Decline') }}">
                    <i class="ti ti-phone-off fs-22"></i>
                </a>
            </div>
        </div>
    </div>
</div>

{{-- Group active audio: compact card style to match calling popup --}}
<div class="modal fade" id="audio_group_new" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0 pb-2">
                <span class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-phone-call"></i>
                </span>
                <h4 class="modal-title mb-0">{{ __('On call') }}</h4>
            </div>
            <div class="modal-body pb-0">
                <div class="card bg-light mb-0">
                    <div class="card-body d-flex justify-content-center py-3">
                        <div class="text-center">
                            <span class="avatar avatar-audio avatar-xxl mb-2" id="group-audio-head-avatar"></span>
                            <h6 class="fs-14 mb-1" id="group-audio-head-name">{{ __('Group call') }}</h6>
                            <p class="text-muted small mb-0" id="group-call-timer-display">00:00:00</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pb-4">
                <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                    <a href="javascript:void(0);" id="mute-audio-group-btn" class="call-controll mute-bt d-flex align-items-center justify-content-center">
                        <i class="ti ti-microphone"></i>
                    </a>
                    <a href="javascript:void(0);" data-bs-dismiss="modal" id="leave-group-audio" class="call-controll call-decline d-flex align-items-center justify-content-center">
                        <i class="ti ti-phone"></i>
                    </a>
                </div>
            </div>
            <div id="remote-users-container" class="d-none"></div>
        </div>
    </div>
</div>

{{-- Group audio ring: outgoing/incoming compact style (matches group video ring) --}}
<div class="modal fade video-call-ring-modal" id="audio-call-new-group" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
            <div class="modal-body text-center pt-4 pb-2 px-3">
                <span class="model-icon bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style="width:56px;height:56px;">
                    <i class="ti ti-phone-call fs-24"></i>
                </span>
                <h5 class="modal-title mb-1 group-audio-ring-title">{{ __('Audio call') }}</h5>
                <p class="text-muted small mb-0 audio-name"></p>
                <p class="text-muted small mb-0 mt-1 group-audio-ring-status" id="group-audio-ring-status"></p>
                <div class="d-flex justify-content-center my-4">
                    <span class="avatar avatar-xxl avatar-audio group-audio-call-ring-avatar-wrap">
                        <span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback" role="img" aria-label="{{ __('User') }}"><i class="ti ti-user" aria-hidden="true"></i></span>
                    </span>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0 pb-4 gap-2 flex-nowrap">
                <a href="javascript:void(0);" id="join-audio-group"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center group-audio-answer-btn"
                    style="width:56px;height:56px;"
                    title="{{ __('Answer') }}">
                    <i class="ti ti-phone fs-22"></i>
                </a>
                <a href="javascript:void(0);" id="decline-audio-group"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    style="width:56px;height:56px;"
                    data-bs-dismiss="modal" aria-label="{{ __('Decline') }}"
                    title="{{ __('Decline') }}">
                    <i class="ti ti-phone-off fs-22"></i>
                </a>
            </div>
        </div>
    </div>
</div>

<div id="delete-account-modal" style="display: none;">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Confirm Account Deletion</h4>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="email-input" class="form-label">Email Address</label>
                    <input type="email" id="email-input" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="password-input" class="form-label">Password</label>
                    <input type="password" id="password-input" class="form-control" required>
                </div>
            </div>
            <div class="modal-footer">
                <button id="confirm-deletion" class="btn btn-danger w-100">Confirm Deletion</button>
            </div>
        </div>
    </div>
</div>

