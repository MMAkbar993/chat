{{-- Active Agora 1:1 call UI (#remote-playerlist, #video-container). Incoming ring uses #video-call in popups.blade.php. --}}
<div class="modal fade" id="start-video-call-container" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="user-video-head">
                    <div class="">
                        <div class="d-flex align-items-center">
                            <span class="avatar avatar-video avatar-lg online me-2">
                                <img src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" class="rounded-circle" alt="user">
                            </span>
                            <div class="user-name">
                            </div>
                            <span class="badge border border-primary text-primary badge-sm ms-5">
                                <div class="call-duration" id="local-call-timer">00:00:00</div>
                            </span>
                            <span class="d-none" id="video-call-timer-display">00:00:00</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <div class="row video-group">
                    <div id="remote-playerlist" class="remote-player-container">
                    </div>
                    <div id="video-container" class="mini-video-view active br-8 position-absolute">
                        <div class="bg-soft-primary mx-auto default-profile rounded-circle align-items-center justify-content-center">
                            <span class="avatar avatar-lg rounded-circle bg-primary">You</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer justify-content-center border-0 pt-0">
                    <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                        <a href="javascript:void(0);" id="mute-call" class="call-controll mute-call-btn">
                            <i class="ti ti-microphone"></i>
                        </a>
                        <a href="javascript:void(0);" id="leave-video-call" class="call-controll call-decline">
                            <i class="ti ti-phone"></i>
                        </a>
                        <a href="javascript:void(0);" id="video-mute-call" class="call-controll video-call-btn">
                            <i class="ti ti-video"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
