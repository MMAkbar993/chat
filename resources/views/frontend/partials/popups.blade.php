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
                <form action="{{ route('all-calls') }}">
                    <div class="search-wrap contact-search mb-3">
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="{{ __('Search')}}">
                            <a href="javascript:void(0);" class="input-group-text"><i class="ti ti-search"></i></a>
                        </div>
                    </div>
                    <h6 class="mb-3 fw-medium fs-16">{{ __('Contacts')}}</h6>
                    <div class="contact-scroll contact-select mb-3">
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                        alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Edward Lietz</h6>
                                    <p>App Developer</p>
                                </div>
                            </div>
                            <div class="d-inline-flex">
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle me-2"
                                    data-bs-toggle="modal" data-bs-target="#voice_call"><span><i
                                            class="ti ti-phone"></i></span></a>
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle"
                                    data-bs-toggle="modal" data-bs-target="#video-call"><span><i
                                            class="ti ti-video"></i></span></a>
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-02.jpg" class="rounded-circle"
                                        alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Sarika Jain</h6>
                                    <p>UI/UX Designer</p>
                                </div>
                            </div>
                            <div class="d-inline-flex">
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle me-2"
                                    data-bs-toggle="modal" data-bs-target="#voice_call"><span><i
                                            class="ti ti-phone"></i></span></a>
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle"
                                    data-bs-toggle="modal" data-bs-target="#video-call"><span><i
                                            class="ti ti-video"></i></span></a>
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                        alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Clyde Smith</h6>
                                    <p>Web Developer</p>
                                </div>
                            </div>
                            <div class="d-inline-flex">
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle me-2"
                                    data-bs-toggle="modal" data-bs-target="#voice_call"><span><i
                                            class="ti ti-phone"></i></span></a>
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle"
                                    data-bs-toggle="modal" data-bs-target="#video-call"><span><i
                                            class="ti ti-video"></i></span></a>
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-04.jpg" class="rounded-circle"
                                        alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Carla Jenkins</h6>
                                    <p>Business Analyst</p>
                                </div>
                            </div>
                            <div class="d-inline-flex">
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle me-2"
                                    data-bs-toggle="modal" data-bs-target="#voice_call"><span><i
                                            class="ti ti-phone"></i></span></a>
                                <a href=""
                                    class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle"
                                    data-bs-toggle="modal" data-bs-target="#video-call"><span><i
                                            class="ti ti-video"></i></span></a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Add Call -->


<!-- Video Call -->
<div class="modal fade" id="video-call" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0">
                <span
                    class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-video"></i>
                </span>
                <h4 class="modal-title">{{ __('Video Calling...')}}</h4>
            </div>
            <div class="modal-body pb-0">
                <div class="card bg-light mb-0">
                    <div class="card-body d-flex justify-content-center">
                        <div>
                            <span class="avatar avatar-xxl">
                                <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                    alt="user">
                            </span>
                            <h6 class="fs-14">Edward Lietz</h6>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0">
                <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#start-video-call"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2">
                    <i class="ti ti-phone fs-20"></i>
                </a>
                <a href="javascript:void(0);"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    data-bs-dismiss="modal" aria-label="close">
                    <i class="ti ti-phone-off fs-20"></i>
                </a>
            </div>
        </div>
    </div>
</div>
<!-- /Video Call -->

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
                                            <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                                alt="">
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

<div class="modal fade" id="video-call-new">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0">
                <span
                    class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-phone-call"></i>
                </span>
                <h4 class="modal-title" id="videoCallModalLabel">{{ __('Video Calling...')}}</h4>
            </div>
            <div class="modal-body pb-0">
                <div class="card bg-light mb-0">
                    <div class="card-body calling-name d-flex justify-content-center">
                        <div>
                            <span class="avatar avatar-new avatar-xxl">
                                <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                    alt="user">
                            </span>
                            <h6 class="fs-14">Loading...</h6>
                        </div>

                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0">
                <a href="javascript:void(0);" id="join"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2">
                    <i class="ti ti-phone fs-20"></i>
                </a>
                <a href="javascript:void(0);" id="decline"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    data-bs-dismiss="modal" aria-label="close">
                    <i class="ti ti-phone-off fs-20"></i>
                </a>
            </div>
        </div>
    </div>
</div>
<!-- Video Group Call Modal -->
<!-- Group Video Call Modal -->
<div class="modal fade" id="video_group_new" tabindex="-1" aria-labelledby="videoGroupModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="videoGroupModalLabel">{{ __('Group Video Call')}}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6 d-flex ">
                        <!-- Local Video -->
                        <div id="local-player" class="player video-call-view br-8 overflow-hidden flex-fill">
                            <!-- Local video stream will be shown here -->
                        </div>
                    </div>
                    <div class="col-md-6 d-flex">
                        <!-- Remote Videos -->
                        <div id="remote-playerlist" class="player row row-gap-4 flex-fill">
                            <!-- Remote video players will be appended here dynamically -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
                <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                    <a href="javascript:void(0);" id="mute-group-btn" class="call-controll mute-bt d-flex align-items-center justify-content-center">
                        <i class="ti ti-microphone"></i>
                    </a>
                    <a href="javascript:void(0);" id="leave-group-video1" data-bs-dismiss="modal" class="call-controll call-decline d-flex align-items-center justify-content-center">
                        <i class="ti ti-phone"></i>
                    </a>
                    <a href="javascript:void(0);" id="video-group-btn" class="call-controll mute-video d-flex align-items-center justify-content-center">
                        <i class="ti ti-video"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>


<!-- /Video Call group -->


<div class="modal fade" id="video-call-new-group" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0">
                <span
                    class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-phone-call"></i>
                </span>
                <h4 class="modal-title" id="videoCallModalLabel">{{ __('Video Calling...')}}</h4>
            </div>
            <div class="modal-body pb-0">
                <div class="card bg-light mb-0">
                    <div class="card-body calling-name-group d-flex justify-content-center">
                        <div class="d-flex flex-column align-items-center justify-content-center overflow-hidden">
                            <span class="avatar avatar-new-group avatar-new avatar-xxl">
                                <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                    alt="user">
                            </span>
                            <h6 class="fs-14">{{ __('Group Calling')}}</h6>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0">
                <a href="javascript:void(0);" id="join-group"
                    class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2">
                    <i class="ti ti-phone fs-20"></i>
                </a>
                <a href="javascript:void(0);" id="decline-group"
                    class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
                    data-bs-dismiss="modal" aria-label="close">
                    <i class="ti ti-phone-off fs-20"></i>
                </a>
            </div>
        </div>
    </div>
</div>
<!-- Voice Call group -->
<div class="modal voice-call fade" id="audio_group_new">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="card bg-transparent-dark flex-fill border mb-3">
                    <div class="card-body d-flex justify-content-between p-3">

                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <div class="tab-content dashboard-tab">

                    <div class="tab-pane fade active show" id="pills-group" role="tabpanel" aria-labelledby="pills-group-tab">
                        <div class="row">
                            <div class="col-md-6" id="local-user-details">
                                <div class="card audio-crd bg-transparent-dark border border-primary pt-4">
                                    <div class="modal-bgimg">
                                        <span class="modal-bg1">
                                            <img src="assets/img/bg/bg-02.png" class="img-fluid" alt="bg">
                                        </span>
                                        <span class="modal-bg2">
                                            <img src="assets/img/bg/bg-03.png" class="img-fluid" alt="bg">
                                        </span>
                                    </div>
                                    <div class="card-body ">

                                        <div class="d-flex justify-content-center align-items-center">
                                            <!-- This is where the local user's avatar and name will be shown -->
                                            <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                <img src="" id="local-user-avatar" class="rounded-circle" alt="local user">
                                            </span>
                                            <div class="d-flex audio-group-m-name align-items-end justify-content-end">
                                                <span class="badge badge-info" id="local-user-name">{{ __('Local User')}}</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6" id="remote-users-container">
                                <!-- Remote users will display here -->
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
                <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                    <a href="javascript:void(0);" id="mute-audio-group-btn" class="call-controll mute-bt d-flex align-items-center justify-content-center">
                        <i class="ti ti-microphone"></i>
                    </a>
                    <a href="javascript:void(0);" data-bs-dismiss="modal" id="leave-group-audio" class="call-controll call-decline d-flex align-items-center justify-content-center">
                        <i class="ti ti-phone"></i>
                    </a>

                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Voice Call group -->

<div class="modal fade" id="audio-call-new-group">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0">
                <span class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-phone-call"></i>
                </span>
                <h4 class="modal-title">{{ __('Audio Calling...')}}</h4>
            </div>
            <div class="modal-body pb-0">
                <div class="card bg-light mb-0">
                    <div class="card-body d-flex calling-audio-group justify-content-center">
                        <div class="d-flex align-items-center justify-content-center flex-column overflow-hidden">
                            <span class="avatar avatar-new-audio-group avatar-xxl">
                                <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="user">
                            </span>
                            <h6 class="fs-14 audio-name">Edward Lietz</h6>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0">
                <a href="javascript:void(0);" class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2" id="join-audio-group">
                    <i class="ti ti-phone fs-20"></i>
                </a>
                <a href="javascript:void(0);" class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center" data-bs-dismiss="modal" aria-label="close">
                    <i class="ti ti-phone-off fs-20"></i>
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


<div class="modal fade" id="view-status" style="display: none;" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Status Viewed</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="my-status.html">
                    <div class="contact-scroll contact-select">
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Edward Lietz</h6>
                                    <p>App Developer</p>
                                </div>
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-02.jpg" class="rounded-circle" alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Sarika Jain</h6>
                                    <p>UI/UX Designer</p>
                                </div>
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between active">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle" alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Clyde Smith</h6>
                                    <p>Web Developer</p>
                                </div>
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-04.jpg" class="rounded-circle" alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Carla Jenkins</h6>
                                    <p>Business Analyst</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>