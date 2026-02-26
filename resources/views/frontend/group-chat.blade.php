@extends('frontend.layout')

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
                        <h6 id="group-name">The Dream Team</h6>
                        <input type="hidden" id="group_id" value="">
                        <p id="group-member-count" class="last-seen text-truncate">0 Member
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
            <div class="chat-body chat-page-group slimscroll" id="group-area">
                <div class="messages" id="chat-messages">
                </div>
            </div>
        </div>
        <div class="chat-footer">
            <form class="footer-form" id="message-form">
                <div class="chat-footer-wrap d-inline">
                    <div id="message-preview-container" class="message-preview-container"></div>
                    <div class="chat-footer-content d-flex align-items-center">
                        <div class="form-item">
                            <a href="javascript:;" class="action-circle" data-bs-toggle="modal" data-bs-target="#record_audio_group"><i class="ti ti-microphone"></i></a>
                        </div>
                        <div class="form-wrap">
                            <div class="chats reply-chat reply-div" id="reply-div">
                                <!-- <div class="chat-avatar">
                                <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle" alt="image">
                            </div> -->
                                <div class="chat-content">
                                    <div class="chat-profile-name">
                                        <h6 id="replyUser"><i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time"
                                                id="replytime"></span><span class="msg-read success"><i
                                                    class="ti ti-checks"></i></span></h6>
                                    </div>
                                    <div class="chat-info">
                                        <div class="message-content">
                                            <div class="message-reply reply-content" id="replyContent">
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <a href="#" class="close-replay" id="closeReply">
                                    <i class="ti ti-x"></i>
                                </a>
                            </div>

                            <input type="text" id="message-input" class="form-control" placeholder="{{ __('Type Your Message')}}">
                        </div>
                        <div class="form-item emoj-action-foot">
                            <a href="javascript:void(0);" id="emoji-button" class="action-circle">
                                <i class="ti ti-mood-smile"></i>
                            </a>
                        </div>
                        <div id="emoji-picker" style="display: none;">
                            <ul id="emoji-list"></ul>
                        </div>
                        <div class="form-item position-relative d-flex align-items-center justify-content-center">
                            <a href="#" class="action-circle file-action position-absolute"><i class="ti ti-folder"></i></a>
                            <input type="file" class="open-file position-relative" name="files" id="files-new">
                        </div>

                        <div class="form-btn">
                            <button class="btn btn-primary" id="send-message" type="submit">
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
                        <h6 id="group-name"></h6>
                        <p id="group-participants">Group - 40 Participants</p>
                    </div>
                    <div class="content-wrapper">
                        <h5 class="sub-title">{{ __('Profile Info')}}</h5>
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex profile-info-content justify-content-between align-items-center border-bottom pb-3 mb-3">
                                    <div>
                                        <h6 class="fs-14">{{ __('Group Description')}}</h6>
                                        <p class="fs-16" id="group-info-about">Innovate. Create. Inspire.</p>
                                    </div>
                                </div>
                                <p class="fs-12" id="group-date">Group created by </p>
                            </div>
                        </div>
                    </div>
                    <div class="content-wrapper other-info">
                        <div class="d-flex align-items-center justify-content-between">
                            <h5 class="sub-title" id="group-participants">{{ __('Group Participants')}}</h5>
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
<div class="modal fade" id="delete-group">
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
                            <button type="submit" class="btn btn-primary w-100" id="deleteGroupBtn">{{ __('Delete')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- /Delete Chat -->



<!-- Voice Call attend -->
<div class="modal voice-call fade" id="voice_attend">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="card bg-transparent-dark flex-fill border mb-3">
                    <div class="card-body d-flex justify-content-between p-3">
                        <div class="d-flex align-items-center">
                            <span class="avatar avatar-lg online me-2">
                                <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="user">
                            </span>
                            <div>
                                <h6>Edward Lietz</h6>
                                <span>+22-555-345-11</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="badge border border-primary  text-primary badge-sm me-2">
                                <i class="ti ti-point-filled"></i>
                                01:15:25
                            </span>
                            <a href="" class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white" data-bs-toggle="modal" data-bs-target="#voice_group">
                                <i class="ti ti-user-plus"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <div class="card audio-crd bg-transparent-dark border">
                    <div class="modal-bgimg">
                        <span class="modal-bg1">
                            <img src="assets/img/bg/bg-02.png" class="img-fluid" alt="bg">
                        </span>
                        <span class="modal-bg2">
                            <img src="assets/img/bg/bg-03.png" class="img-fluid" alt="bg">
                        </span>
                    </div>
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-center align-items-center pt-5">
                            <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="user">
                            </span>

                        </div>
                        <div class="d-flex align-items-end justify-content-end">
                            <span class="call-span border border-2 border-primary d-flex justify-content-center align-items-center rounded">
                                <span class="avatar avatar-xl bg-soft-primary rounded-circle p-2">
                                    <img src="assets/img/profiles/avatar-17.jpg" class="rounded-circle" alt="user">
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
                <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                    <a href="javascript:void(0);" class="call-controll mute-bt d-flex align-items-center justify-content-center">
                        <i class="ti ti-microphone"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-volume"></i>
                    </a>
                    <a href="javascript:void(0);" data-bs-dismiss="modal" class="call-controll call-decline d-flex align-items-center justify-content-center">
                        <i class="ti ti-phone"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-maximize"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-dots"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Voice Call attend -->




<div class="modal fade" id="start-video-call">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="card bg-transparent-dark flex-fill border">
                    <div class="card-body d-flex justify-content-between">
                        <div class="d-flex align-items-center">
                            <span class="avatar avatar-lg online me-2">
                                <img src="assets/img/profiles/avatar-05.jpg" class="rounded-circle" alt="user">
                            </span>
                            <div>
                                <h6>Federico Wells</h6>
                                <span>+22-555-345-11</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="badge border border-primary  text-primary badge-sm me-2">
                                <i class="ti ti-point-filled"></i>
                                01:15:25
                            </span>
                            <a href="javascript:void(0);" class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white" data-bs-toggle="modal" data-bs-target="#video_group">
                                <i class="ti ti-user-plus"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <div class="video-call-view br-8 overflow-hidden position-relative">
                    <img src="assets/img/video/video-member-01.jpg" alt="user-image">
                    <div class="mini-video-view active br-8 overflow-hidden position-absolute">
                        <img src="assets/img/video/user-image.jpg" alt="">
                        <div class="bg-soft-primary mx-auto default-profile rounded-circle align-items-center justify-content-center">
                            <span class="avatar  avatar-lg rounded-circle bg-primary ">RG</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-center border-0 pt-0">
                <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                    <a href="javascript:void(0);" class="call-controll mute-bt d-flex align-items-center justify-content-center">
                        <i class="ti ti-microphone"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-volume"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll mute-video d-flex align-items-center justify-content-center">
                        <i class="ti ti-video"></i>
                    </a>
                    <a href="javascript:void(0);" data-bs-dismiss="modal" class="call-controll call-decline d-flex align-items-center justify-content-center">
                        <i class="ti ti-phone"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-mood-smile"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-maximize"></i>
                    </a>
                    <a href="javascript:void(0);" class="call-controll d-flex align-items-center justify-content-center">
                        <i class="ti ti-dots"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<!--Group Video Call -->
<div class="modal fade" id="group_video">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header justify-content-center border-0">
                <span class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                    <i class="ti ti-video"></i>
                </span>
                <h4 class="modal-title">Video Calling...</h4>
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
                <a href="" class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2" data-bs-toggle="modal" data-bs-target="#video_group"><span>
                        <i class="ti ti-phone fs-20"></i>
                    </span></a>
                <a href="" class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center"><span>
                        <i class="ti ti-phone-off fs-20"></i>
                    </span></a>
            </div>
        </div>
    </div>
</div>
<!-- /Group Video Call -->




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
                                src="assets/img/profiles/avatar-03.jpg"
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

<!-- Contact Detail -->
<div class="modal fade" id="contact-details">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Contact Detail</h4>
                <div class="d-flex align-items-center">
                    <div class="dropdown me-2">
                        <a class="d-block" href="#" data-bs-toggle="dropdown">
                            <i class="ti ti-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end p-3">
                            <li><a class="dropdown-item" href="#"><i class="ti ti-share-3 me-2"></i>Share</a></li>
                            <li><a class="dropdown-item" href="#"><i class="ti ti-edit me-2"></i>Edit</a></li>
                            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#block-user"><i class="ti ti-ban me-2"></i>Block</a></li>
                            <li><a class="dropdown-item" href="#"><i class="ti ti-trash me-2"></i>Delete</a></li>
                        </ul>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
            </div>
            <div class="modal-body">
                <div class="card bg-light shadow-none">
                    <div class="card-body pb-1">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center mb-3">
                                <span class="avatar avatar-lg">
                                    <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle" alt="img">
                                </span>
                                <div class="ms-2">
                                    <h6>Aaryian Jose</h6>
                                    <p>App Developer</p>
                                </div>
                            </div>
                            <div class="contact-actions d-flex align-items-center mb-3">
                                <a href="{{ route('chat')}}" class="me-2"><i class="ti ti-message"></i></a>
                                <a href="javascript:void(0);" class="me-2" data-bs-toggle="modal" data-bs-target="#voice_call"><i class="ti ti-phone"></i></a>
                                <a href="javascript:void(0);" class="me-2"><i class="ti ti-video"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card border mb-3">
                    <div class="card-header border-bottom">
                        <h6>Personal Information</h6>
                    </div>
                    <div class="card-body pb-1">
                        <div class="mb-2">
                            <div class="row align-items-center">
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-clock-hour-4 me-1"></i>Local Time</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">10:00 AM</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-calendar-event me-1"></i>Date of Birth</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">22 July 2024</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-phone me-1"></i>Phone Number</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">+20-482-038-29</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-mail me-1"></i>Email</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">aariyan@example.com</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-globe me-1"></i>Website Address</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">www.examplewebsite.com</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card border mb-0">
                    <div class="card-header border-bottom">
                        <h6>Social Information</h6>
                    </div>
                    <div class="card-body pb-1">
                        <div class="mb-2">
                            <div class="row align-items-center">
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-facebook me-1"></i>Facebook</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">www.facebook.com</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-twitter me-1"></i>Twitter</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">www.twitter.com</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-instagram me-1"></i>Instagram</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">www.instagram.com</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-linkedin me-1"></i>Linkedin</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">www.linkedin.com</h6>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-youtube me-1"></i>YouTube</p>
                                </div>
                                <div class="col-sm-6">
                                    <h6 class="fw-medium fs-14 mb-2">www.youtube.com</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Contact Detail -->

<!-- Logout -->
<div class="modal fade" id="group-logout">
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

<div class="modal fade" id="clear-group-chat">
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
                            <button type="submit" class="btn btn-primary w-100" id="clear-group-btn">{{ __('Delete')}}</button>
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
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary me-2" data-bs-dismiss="modal"
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

<!--Voice Modal-->
<div class="modal fade" id="record_audio_group">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    Voice Message
                </h5>
                <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="fas fa-times close_icon"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <div class="center-align">
                        <audio controls id="group_audio"></audio>
                        <br>
                        <button type="button" class="btn btn-warning btn-sm" id="startRecordingGroup">Start</button>
                        <button type="button" class="btn btn-dark btn-sm" id="stopRecordingGroup" disabled>Stop</button>

                        <button type="button" class="btn btn-info btn-sm" id="send_voice_group" disabled>Send</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Voice Modal-->

<!-- Voice Call group -->

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
                <a href="javascript:void(0);" class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center" data-bs-dismiss="modal" aria-label="close" id="decline-audio-group">
                    <i class="ti ti-phone-off fs-20"></i>
                </a>
            </div>
        </div>
    </div>
</div>

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
<script type="module" src="assets/js/firebase/firebaseGroupChat.js" crossorigin="anonymous"></script>
</div>
@endsection