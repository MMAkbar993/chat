@extends('frontend.layout')

@php
    try { $callsProvider = config('calls.provider', 'meet'); } catch (\Throwable $e) { $callsProvider = 'meet'; }
@endphp

@section('content')

<!-- content -->
<div class="content main_content">

    @includeIf('frontend.partials.sidebar')

    <div id="spa-page-content">
    @includeIf('frontend.partials.chat-content')

    <!-- Chat -->
    <div class="chat chat-messages show" id="middle" style="display: none;">
        <div>
            <div class="chat-header">
                <div class="user-details">
                    <div class="d-xl-none">
                        <a class="text-muted chat-close me-2" href="#">
                            <i class="fas fa-arrow-left"></i>
                        </a>
                    </div>
                    <div class="avatar avatar-lg online flex-shrink-0">
                        <img src="assets/img/profiles/avatar-03.jpg" id="group_image" class="rounded-circle" alt="image">
                    </div>
                    <div class="ms-2 overflow-hidden">
                        <h6 id="group-name">{{ __('Select a group') }}</h6>
                        <input type="hidden" id="group_id" value="">
                        <p id="group-member-count" class="last-seen text-truncate">—
                            <!-- <span class="text-success">24 Online</span> -->
                        </p>
                    </div>
                </div>
                <div class="chat-options">
                    <ul>

                        <li>
                            <a href="javascript:void(0)" class="btn chat-search-btn" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Search">
                                <i class="ti ti-search"></i>
                            </a>
                        </li>
                        @if($callsProvider === 'meet')
                        <li data-bs-toggle="tooltip" data-bs-placement="bottom" title="Start Google Meet">
                            <a href="https://meet.google.com/new" target="_blank" class="btn" id="google-meet-btn-group">
                                <img src="{{ asset('assets/img/icons/google-meet.svg') }}" alt="Google Meet" class="google-meet-icon">
                            </a>
                        </li>
                        @endif
                        <li data-bs-toggle="tooltip" data-bs-placement="bottom" title="Video Call">
                            <a href="javascript:void(0)" class="btn" id="video-call-new-btn-group">
                                <i class="ti ti-video"></i>
                            </a>
                        </li>
                        <li data-bs-toggle="tooltip" data-bs-placement="bottom" title="Voice Call">
                            <a href="javascript:void(0)" class="btn" id="audio-new-btn-group">
                                <i class="ti ti-phone"></i>
                            </a>
                        </li>
                        <li title="Group Info" data-bs-toggle="tooltip" data-bs-placement="bottom">
                            <a href="javascript:void(0)" class="btn" data-bs-toggle="offcanvas" data-bs-target="#contact-profile" id="groupcontactInfoButton">
                                <i class="ti ti-info-circle"></i>
                            </a>
                        </li>
                        <li>
                            <a class="btn no-bg" href="#" data-bs-toggle="dropdown">
                                <i class="ti ti-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end p-3">
                                <li><a href="#" class="dropdown-item" id="close-group-btn"><i class="ti ti-x me-2"></i>{{ __('Close Group')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#clear-group-chat"><i class="ti ti-clear-all me-2"></i>{{ __('Clear Message')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#delete-group"><i class="ti ti-trash me-2"></i>{{ __('Delete Group')}}</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <!-- Chat Search -->
                <div class="chat-search search-wrap contact-search">
                    <form>
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="{{ __('Search Contacts')}}">
                            <span class="input-group-text"><i class="ti ti-search"></i></span>
                        </div>
                    </form>
                </div>
                <!-- /Chat Search -->
            </div>
            <div class="chat-body chat-page-group" id="group-area">
                <div class="messages" id="chat-messages">
                </div>
            </div>
        </div>
        <div class="chat-footer">
            <form class="footer-form" id="message-form">
                <div class="chats reply-chat reply-div" id="reply-div">
                    <div class="chat-content">
                        <div class="chat-profile-name">
                            <h6 id="replyUser">
                                <i class="ti ti-circle-filled fs-7 mx-2"></i>
                                <span class="chat-time" id="replytime"></span>
                                <span class="msg-read success"><i class="ti ti-checks"></i></span>
                            </h6>
                        </div>
                        <div class="chat-info">
                            <div class="message-content" id="replyContent"></div>
                        </div>
                    </div>
                    <a href="#" class="close-replay" id="closeReply"><i class="ti ti-x"></i></a>
                </div>

                <div class="chat-footer-wrap d-inline">
                    <div id="message-preview" class="message-preview"></div>
                    <div class="chat-footer-content d-flex align-items-center">
                        <div class="form-item">
                            <a href="#" class="action-circle" data-bs-toggle="modal" data-bs-target="#record_audio"><i class="ti ti-microphone"></i></a>
                        </div>
                        <div class="form-wrap">
                            <input type="text" id="message-input" class="form-control" placeholder="{{ __('Type Your Message') }}">
                        </div>
                        <div class="form-item emoj-action-foot">
                            <a href="javascript:void(0);" id="emoji-button" class="action-circle">
                                <i class="ti ti-mood-smile"></i>
                            </a>
                        </div>
                        <div class="form-item emoj-action-foot d-none">
                            <a href="javascript:void(0);" id="location-button" class="action-circle">
                                <i class="ti ti-location"></i>
                            </a>
                        </div>
                        @if($callsProvider === 'meet')
                        <div class="form-item emoj-action-foot">
                            <a href="javascript:void(0);" id="send-meet-link-btn" class="action-circle" title="Send Google Meet link">
                                <img src="{{ asset('assets/img/icons/google-meet.svg') }}" alt="Google Meet" class="google-meet-icon">
                            </a>
                        </div>
                        @endif
                        <div id="emoji-picker" style="display: none;">
                            <ul id="emoji-list"></ul>
                        </div>
                        <div class="form-item dropdown">
                            <a href="javascript:void(0);" class="action-circle" data-bs-toggle="dropdown" aria-expanded="false" title="{{ __('Attachments') }}">
                                <i class="ti ti-plus"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end p-2">
                                <li><a class="dropdown-item" href="javascript:void(0);" id="attach-camera"><i class="ti ti-camera me-2"></i>{{ __('Camera') }}</a></li>
                                <li><a class="dropdown-item" href="javascript:void(0);" id="attach-gallery"><i class="ti ti-photo me-2"></i>{{ __('Gallery') }}</a></li>
                                <li><a class="dropdown-item" href="javascript:void(0);" id="attach-audio"><i class="ti ti-music me-2"></i>{{ __('Audio') }}</a></li>
                                <li><a class="dropdown-item" href="javascript:void(0);" id="attach-file"><i class="ti ti-file me-2"></i>{{ __('File') }}</a></li>
                            </ul>
                            <input type="file" class="d-none" name="files" id="files">
                            <input type="file" class="d-none" id="files-camera" accept="image/*" capture="environment">
                        </div>
                        <div>
                            <button class="btn btn-primary" id="send-button" type="submit">
                                <i class="ti ti-send"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
    <!-- /Chat -->

    <!-- Group Info -->
    <div class="chat-offcanvas offcanvas offcanvas-end" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="contact-profile">
        <div class="offcanvas-header">
            <h4 class="offcanvas-title">{{ __('Group Info')}}</h4>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"><i class="ti ti-x"></i></button>
        </div>
        <div class="offcanvas-body">
            <div class="chat-contact-info">
                <div class="profile-content">
                    <div class="contact-profile-info">
                        <div class="avatar avatar-xxl online mb-2">
                            <img id="group-avatar" src="assets/img/profiles/avatar-03.jpg" class="rounded-circle" alt="img">
                        </div>
                        <div id="group-icon-edit-wrap" class="mb-2 d-none">
                            <label for="group-icon-upload" class="btn btn-sm btn-outline-primary">
                                <i class="ti ti-camera me-1"></i>{{ __('Change Icon') }}
                            </label>
                            <input type="file" id="group-icon-upload" class="d-none" accept="image/*">
                        </div>
                        <h6 id="group-profile-name"></h6>
                        <p id="group-profile-participant-count" class="text-muted">—</p>
                    </div>
                    <div class="content-wrapper">
                        <h5 class="sub-title">{{ __('Profile Info')}}</h5>
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex profile-info-content justify-content-between align-items-center border-bottom pb-3 mb-3">
                                    <div>
                                        <h6 class="fs-14">{{ __('Group Description')}}</h6>
                                        <p class="fs-16" id="group-info-about">—</p>
                                    </div>
                                </div>
                                <p class="fs-12" id="group-date">Group created by </p>
                            </div>
                        </div>
                    </div>
                    <div class="content-wrapper other-info">
                        <div class="d-flex align-items-center justify-content-between">
                            <h5 class="sub-title">{{ __('Group Participants')}}</h5>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div id="members-container">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-wrapper other-info mb-0">
                    <div class="card mb-0">
                        <div class="card-body list-group profile-item">
                            <a href="javascript:void(0);" class="list-group-item" data-bs-toggle="modal" data-bs-target="#group-logout">
                                <div class="profile-info">
                                    <h6><i class="ti ti-logout-2 me-2 text-danger"></i>{{ __('Exit Group')}}</h6>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Group Info -->

<!-- Invite -->
<div class="modal fade" id="invite">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Invite Others')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="#">
                    <div class="row">
                        <div class="col-lg-12">
                            <label class="form-label">{{ __('Email Address or Phone Number')}}</label>
                            <div class="input-icon mb-3 position-relative">
                                <input type="text" value="" class="form-control">
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <label class="form-label">{{ __('Invitation Message')}}</label>
                            <textarea class="form-control mb-3"></textarea>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#new-chat">{{ __('Send Invitation')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Invite -->

<!-- Mute -->
<div class="modal fade" id="mute-notification">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">
                    {{ __('Mute Notifications')}}
                </h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('chat')}}">
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute1">
                        <label class="form-check-label" for="mute1">30 Minutes</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute2">
                        <label class="form-check-label" for="mute2">1 Hour</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute3">
                        <label class="form-check-label" for="mute3">1 Day</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute4">
                        <label class="form-check-label" for="mute4">1 Week</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute5">
                        <label class="form-check-label" for="mute5">1 Month</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute6">
                        <label class="form-check-label" for="mute6">1 Year</label>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" name="mute" id="mute7">
                        <label class="form-check-label" for="mute7">Always</label>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">{{ __('Mute')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Mute -->

<!-- Disapperaing Message -->
<div class="modal fade" id="msg-disapper">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Disappearing Messages</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('group-chat')}}">
                    <div class="block-wrap mb-3">
                        <p class="text-gray-9">
                            For more privacy and storage, all new messages will disappear from this chat for everyone after the selected duration, except when kept. Anyone in the chat can change this setting.
                        </p>
                    </div>
                    <div class="mb-3">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="disappear1">
                            <label class="form-check-label" for="disappear1">24 Hours</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="disappear2">
                            <label class="form-check-label" for="disappear2">7 Days</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="disappear3">
                            <label class="form-check-label" for="disappear3">90 Days</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="disappear4">
                            <label class="form-check-label" for="disappear4">Off</label>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Disapperaing Message -->

<!-- Group Settings -->
<div class="chat-offcanvas offcanvas offcanvas-end" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="group-settings">
    <div class="offcanvas-header">
        <h4 class="offcanvas-title">Group Settings</h4>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"><i class="ti ti-x"></i></button>
    </div>
    <div class="offcanvas-body">
        <div class="chat-contact-info">
            <div class="profile-content">
                <div class="content-wrapper other-info">
                    <div class="card">
                        <div class="card-body list-group profile-item">
                            <a href="javascript:void(0);" class="list-group-item" data-bs-toggle="modal" data-bs-target="#edit-group">
                                <div class="profile-info">
                                    <h6 class="fs-16">Edit Group Settings</h6>
                                    <p>All Participants</p>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </div>
                            </a>

                            <div class="accordion accordion-flush chat-accordion list-group-item" id="send-settings">
                                <div class="accordion-item w-100">
                                    <h2 class="accordion-header">
                                        <a href="#" class="accordion-button py-0 collapsed" data-bs-toggle="collapse" data-bs-target="#send-privacy" aria-expanded="false" aria-controls="send-privacy">
                                            Send Messages
                                        </a>
                                    </h2>
                                    <p class="fs-16 p-0 mb-0">All Participants</p>
                                    <div id="send-privacy" class="accordion-collapse collapse" data-bs-parent="#send-settings">
                                        <div class="accordion-body p-0 pt-3">
                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="radio" name="mute" id="participant" checked>
                                                <label class="form-check-label" for="participant">All Participants</label>
                                            </div>
                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="radio" name="mute" id="admin">
                                                <label class="form-check-label" for="admin">Only Admins</label>
                                            </div>
                                            <a href="#" class="btn btn-primary w-100">Save Changes</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href="javascript:void(0);" class="list-group-item" data-bs-toggle="modal" data-bs-target="#approve-participants">
                                <div class="profile-info">
                                    <h6 class="fs-16">Approve New Participants</h6>
                                    <p>Off</p>
                                </div>
                                <div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </div>
                            </a>
                            <a href="javascript:void(0);" class="list-group-item" data-bs-toggle="modal" data-bs-target="#edit-admin">
                                <div class="profile-info">
                                    <h6 class="fs-16">Edit Group Admins</h6>
                                </div>
                                <div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Group Settings -->

<!-- Edit Group Settings -->
<div class="modal fade" id="approve-participants">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Edit Group Settings</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('group-chat')}}">
                    <div class="block-wrap mb-3">
                        <p class="text-gray-9">
                            When turned on, admins must approve anyone who wants to join this group.
                        </p>
                    </div>
                    <div class="mb-3">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="approve1" checked>
                            <label class="form-check-label" for="approve1">Off</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="approve2">
                            <label class="form-check-label" for="approve2">On</label>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Edit Group Settings -->

<!-- Block User -->
<div class="modal fade" id="block-user">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Block User')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('chat')}}">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-info">
                            <i class="ti ti-user-off text-info"></i>
                        </span>
                        <p class="text-grya-9">{{ __('Blocked contacts will no longer be able to call you or send you messages.')}}</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">{{ __('Block')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Block User -->

<!-- Report User -->
<div class="modal fade" id="report-user">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Report User</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('chat')}}">
                    <div class="block-wrap mb-3">
                        <p class="text-grya-9 mb-3">If you block this contact and clear the chat, messages will only be removed from this device and your devices on the newer versions of DreamsChat</p>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="mute" id="report">
                            <label class="form-check-label" for="report">Report User</label>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Report</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Report User -->

<!-- Delete Chat -->
<div class="modal fade" id="delete-group" data-bs-backdrop="false">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Delete Chat')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-trash text-danger"></i>
                        </span>
                        <p class="text-grya-9">{{ __('Clearing or deleting entire chats will only remove messages from this device and your devices on the newer versions of DreamsChat.')}}</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100" id="deleteGroupBtn">{{ __('Delete')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Delete Chat -->



{{-- Group call UI is shared with 1:1 chat via frontend.partials.popups:
     active/incoming video (#video_group_new, #video-call-new-group)
     and active/incoming audio (#audio_group_new, #audio-call-new-group). --}}




<!-- Edit Group Settings -->
<div class="modal fade" id="edit-group">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Edit Group Settings</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('group-chat')}}">
                    <div class="block-wrap mb-3">
                        <p class="text-gray-9">
                            Choose who can change this group's subject, icon, and description. They can also edit the disappearing message timer and keep or unkeep messages.
                        </p>
                    </div>
                    <div class="mb-3">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="edit1" checked>
                            <label class="form-check-label" for="edit1">All Participants</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="mute" id="edit2">
                            <label class="form-check-label" for="edit2">Only Admins</label>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Edit Group Settings -->

<!-- Edit Group Admins -->
<div class="modal fade" id="edit-admin">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Edit Group Admins</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('group-chat')}}">
                    <div class="search-wrap contact-search mb-3">
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="{{ __('Search')}}">
                            <a href="javascript:void(0);" class="input-group-text"><i class="ti ti-search"></i></a>
                        </div>
                    </div>
                    <h6 class="mb-3 fw-medium fs-16">Contacts</h6>
                    <div class="contact-scroll contact-select mb-3">
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle" alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Aaryian Jose</h6>
                                    <p>App Developer</p>
                                </div>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="contact">
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
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="contact">
                            </div>
                        </div>
                        <div class="contact-user d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle" alt="image">
                                </div>
                                <div class="ms-2">
                                    <h6>Clyde Smith</h6>
                                    <p>Web Developer</p>
                                </div>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="contact">
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
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="contact">
                            </div>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Edit Group Admins -->

<!-- New Chat -->
<div class="modal fade" id="new-chat">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">New Chat</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false">
                    <div class="search-wrap contact-search mb-3">
                        <div class="input-group">
                            <input type="text" id="chatcontactSearchInput" class="form-control" placeholder="{{ __('Search')}}">
                            <a href="javascript:void(0);" class="input-group-text"><i class="ti ti-search"></i></a>
                        </div>
                    </div>
                    <h6 class="mb-3 fw-medium fs-16">Contacts</h6>
                    <div class="contact-scroll contact-select mb-3" id="main-container">

                    </div>
                    <div id="noChatMatchesModalMessage" style="display: none;">No matches found.</div>
                    <div class="row g-3">
                        <div class="col-12">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <!-- <div class="col-6">      
                                                <button type="submit" class="btn btn-primary w-100">Start Chat</button>
                                            </div>  -->
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /New Chat -->

<!-- Add Contact -->
<div class="modal fade" id="add-contact">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Add Contact</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="#">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">First Name</label>
                                <div class="input-icon position-relative">
                                    <input type="text" class="form-control">
                                    <span class="input-icon-addon">
                                        <i class="ti ti-user"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Last Name</label>
                                <div class="input-icon position-relative">
                                    <input type="text" class="form-control">
                                    <span class="input-icon-addon">
                                        <i class="ti ti-user"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <div class="input-icon position-relative">
                                    <input type="text" class="form-control">
                                    <span class="input-icon-addon">
                                        <i class="ti ti-mail"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <div class="input-icon position-relative">
                                    <input type="text" class="form-control">
                                    <span class="input-icon-addon">
                                        <i class="ti ti-phone"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Date of Birth</label>
                                <div class="input-icon position-relative">
                                    <input type="text" class="form-control">
                                    <span class="input-icon-addon">
                                        <i class="ti ti-calendar-event"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="mb-3">
                                <label class="form-label">Website Address</label>
                                <div class="input-icon position-relative">
                                    <input type="text" class="form-control">
                                    <span class="input-icon-addon">
                                        <i class="ti ti-globe"></i>
                                    </span>
                                </div>
                            </div>
                            <div class="card border">
                                <div class="card-header border-bottom">
                                    <h6>Social Information</h6>
                                </div>
                                <div class="card-body pb-1">
                                    <div class="row align-items-center">
                                        <div class="col-md-4">
                                            <label class="form-label text-default fw-normal mb-3">Facebook</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-brand-facebook"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label text-default fw-normal mb-3">Twitter</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-brand-twitter"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-labe text-default fw-normall mb-3">Instagram</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-brand-instagram"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label text-default fw-normal mb-3">Linked in</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-brand-linkedin"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label text-default fw-normal mb-3">YouTube</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-brand-youtube"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label text-default fw-normal mb-3">Kick</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-device-gamepad-2"></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label text-default fw-normal mb-3">Twitch</label>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="input-icon position-relative mb-3">
                                                <input type="text" class="form-control">
                                                <span class="input-icon-addon">
                                                    <i class="ti ti-brand-twitch"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Add Contact</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Add Contact -->

<!--Group Voice Call -->
<div class="modal fade" id="group_voice">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0">
                <span class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-phone-call"></i>
                </span>
                <h4 class="modal-title">Audio Calling...</h4>
            </div>
            <div class="modal-body pb-0">
                <div class="card bg-light mb-0">
                    <div class="card-body d-flex justify-content-center">
                        <div>
                            <div class="d-flex justify-content-center avatar-group mb-2">
                                <a href="#" class=" ">
                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="user">
                                </a>
                                <a href="#" class="">
                                    <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle" alt="user">
                                </a>
                                <a href="#" class="">
                                    <img src="assets/img/profiles/avatar-05.jpg" class="rounded-circle" alt="user">
                                </a>
                                <a href="#" class="">
                                    <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle" alt="user">
                                </a>
                            </div>
                            <h6 class="fs-14">Edward Lietz, Aariyan Jose, Federico Wells, +1</h6>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0">
                <a href="" class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2" data-bs-toggle="modal" data-bs-target="#voice_attend"><span>
                        <i class="ti ti-phone fs-20"></i>
                    </span></a>
                <a href="javascript:void(0);" data-bs-dismiss="modal" class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"><span>
                        <i class="ti ti-phone-off fs-20"></i>
                    </span></a>
            </div>
        </div>
    </div>
</div>
<!-- /Group Voice Call -->

<!-- Contact Detail (dynamic; was static theme demo) -->
@includeIf('frontend.partials.contact-details-modal', ['contactDetailSimpleMenu' => true])
<!-- /Contact Detail -->

<!-- Logout -->
<div class="modal fade" id="group-logout" data-bs-backdrop="false">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Logout</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('group-chat')}}">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-logout-2 text-danger"></i>
                        </span>
                        <div class="d-flex justify-content-center align-items-center">
                            <i class="ti ti-info-square-rounded me-1 fs-16"></i>
                            <p class="text-gray-9">

                                Only group admins will be notified that you left the group.
                            </p>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="confirm-exit">Exit Group</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Logout -->

<!-- Report Group -->
<div class="modal fade" id="report-group">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Report Wilbur Martinez</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form action="{{ route('group-chat')}}">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-thumb-down text-danger"></i>
                        </span>
                        <div class="d-flex justify-content-center align-items-center mb-3   ">
                            <p class="text-gray-9">
                                If you block this contact and clear the chat, messages will only be removed from this device and your devices on the newer versions of DreamsChat
                            </p>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="contact">
                            </div>
                            <p class="text-gray-9">Block Contact and Clear Chat</p>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">Report</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Report Group -->

<div class="modal fade" id="clear-group-chat" data-bs-backdrop="false">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Clear Message')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-trash text-danger"></i>
                        </span>
                        <p class="text-grya-9">{{ __('Clearing entire  messages from this device and your devices on the newer versions of DreamsChat.')}}</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100" id="clear-group-btn">{{ __('Delete')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

    </div>
</div>
<!-- /Content -->

<div id="spa-page-modals">
{{-- New / Add Group modals: must live here (not inside #spa-page-content) so Bootstrap’s body backdrop stacks below the dialog --}}
<!-- New Group Modal -->
<div class="modal fade" id="new-group">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('New Group')}}</h4>
                <button type="button" class="btn-close" id="group-add-cancle-btn" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="group-form">
                    <div class="d-flex justify-content-center align-items-center">
                        <label for="avatar-upload" class="set-pro avatar avatar-xxl rounded-circle mb-3 p-1">
                            <img id="avatar-preview"
                                src="{{ asset('assets/img/profiles/avatar-03.jpg') }}"
                                data-default-avatar="{{ asset('assets/img/profiles/avatar-03.jpg') }}"
                                class="rounded-circle" alt="user">
                            <span class="add avatar avatar-sm d-flex justify-content-center align-items-center">
                                <i class="ti ti-plus rounded-circle d-flex justify-content-center align-items-center"></i>
                            </span>
                        </label>
                        <input type="file" id="avatar-upload" style="display: none;" accept="image/*">
                    </div>
                    <div class="row">
                        <div class="col-lg-12">
                            <label class="form-label">{{ __('Group Name')}}</label>
                            <div class="input-icon mb-3 position-relative">
                                <input type="text" id="group-names" class="form-control" placeholder="{{ __('Group Name')}}">
                                <span class="icon-addon">
                                    <i class="ti ti-users-group"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-lg-12">
                            <label class="form-label">{{ __('About')}}</label>
                            <div class="input-icon mb-3 position-relative">
                                <input type="text" id="group-about" class="form-control" placeholder="{{ __('About')}}">
                                <span class="icon-addon">
                                    <i class="ti ti-info-octagon"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" id="cancle-btn-group" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#add-group">{{ __('Next')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /New Group Modal -->

<!-- Add Group Modal -->
<div class="modal fade" id="add-group">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Add Members')}}</h4>
                <button type="button" class="btn-close" id="canlce-btn-search" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false" id="add-members-form">
                    <div class="search-wrap contact-search mb-3">
                        <div class="input-group">
                            <input type="text" id="groupcontactSearchInput" class="form-control" placeholder="{{ __('Search')}}">
                            <a href="javascript:void(0);" class="input-group-text"><i class="ti ti-search"></i></a>
                        </div>
                    </div>
                    <h6 class="mb-3 fw-medium fs-16">{{ __('Contacts')}}</h6>
                    <div class="contact-scroll contact-select mb-3" id="users-list"></div>
                    <div id="noGroupMatchesModalMessage" style="display: none;">{{ __('No matches found.')}}</div> <!-- User list will be displayed here -->
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#new-group">{{ __('Previous')}}</a>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100" id="start-group">{{ __('Start Group')}}</button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Add Group Modal -->

<div class="modal fade" id="forward-modal" tabindex="-1" aria-labelledby="forwardModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="forwardModalLabel">Forward Message To</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"
                    aria-label="Close"><i
                        class="ti ti-x me-2"></i></button>
            </div>
            <div class="modal-body">
                <div class="user-list">
                    <!-- Dynamically filled with user checkboxes -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal"
                    aria-label="Close">Cancel</button>
                <button type="button" class="btn btn-primary" id="send-forward">Send</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="message-delete">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">
                    {{ __('Delete Chat') }}
                </h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="delete-chat-form">
                    <!-- Hidden input to store the messageId -->
                    <input type="hidden" id="message-to-delete" value="">
                    <input type="hidden" id="group-id" name="group-id">
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="radio" value="for-me" name="delete-chat" id="delete-for-me" checked>
                        <label class="form-check-label" for="delete-for-me">Delete For Me</label>
                    </div>
                    <div class="form-check mb-3" id="delete-for-everyone-group">
                        <input class="form-check-input" type="radio" value="for-everyone" name="delete-chat" id="delete-for-everyone">
                        <label class="form-check-label" for="delete-for-everyone">Delete For Everyone</label>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                aria-label="Close">{{ __('Cancel') }}</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100">{{ __('Delete') }}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

{{-- Voice message recording: same UI/flow as 1:1 chat (firebaseChat.js). Group audio/video call modals live in frontend.partials.popups. --}}
<div class="modal fade" id="record_audio">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ __('Voice Message') }}</h5>
                <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="fas fa-times close_icon"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <div class="center-align">
                        <p id="voice-record-timer" class="text-center mb-2 fw-semibold text-muted" aria-live="polite">0:00</p>
                        <audio controls id="audio" preload="metadata"></audio>
                        <br>
                        <button type="button" class="btn btn-warning btn-sm" id="startRecording">{{ __('Start') }}</button>
                        <button type="button" class="btn btn-dark btn-sm" id="stopRecording" disabled>{{ __('Stop') }}</button>
                        <button type="button" class="btn btn-info btn-sm" id="send_voice" disabled>{{ __('Send') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>

@if($callsProvider === 'meet')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var meetBtn = document.getElementById('send-meet-link-btn');
    if (meetBtn) {
        meetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var msgInput = document.getElementById('message-input');
            if (msgInput) {
                msgInput.value = 'https://meet.google.com/new';
                msgInput.focus();
                msgInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }
});
</script>
@endif
@endsection
