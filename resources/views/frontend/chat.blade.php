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
                    <div class="avatar avatar-lg flex-shrink-0">
                        <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="image">
                    </div>
                                                    <div class="ms-2 overflow-hidden">
                                                        <div class="d-flex align-items-center gap-1">
                                                            <h6></h6>
                                                        </div>
                                                        <span class="last-seen"></span>
                                                    </div>
                </div>
                <div class="chat-options">
                    <ul>
                        <li>
                            <a href="javascript:void(0)" class="btn chat-search-btn" data-bs-toggle="tooltip"
                                data-bs-placement="bottom" title="Search">
                                <i class="ti ti-search"></i>
                            </a>
                        </li>
                        @if($callsProvider === 'meet')
                        <li data-bs-toggle="tooltip" data-bs-placement="bottom" title="Start Google Meet">
                            <a href="https://meet.google.com/new" target="_blank" class="btn" id="google-meet-btn">
                                <img src="{{ asset('assets/img/icons/google-meet.svg') }}" alt="Google Meet" class="google-meet-icon">
                            </a>
                        </li>
                        @endif
                        <li data-bs-toggle="tooltip" data-bs-placement="bottom" title="Video Call">
                            <a href="javascript:void(0)" class="btn" id="video-call-new-btn">
                                <i class="ti ti-video"></i>
                            </a>
                        </li>
                        <li data-bs-toggle="tooltip" data-bs-placement="bottom" title="Voice Call">
                            <a href="javascript:void(0)" class="btn" id="audio-call-btn">
                                <i class="ti ti-phone"></i>
                            </a>
                        </li>
                        <li title="Contact Info" data-bs-toggle="tooltip" data-bs-placement="bottom">
                            <a href="javascript:void(0)" class="btn" data-bs-toggle="offcanvas"
                                data-bs-target="#contact-profile" id="contactInfoButton">
                                <i class="ti ti-info-circle"></i>
                            </a>
                        </li>
                        <li>
                            <a class="btn no-bg" href="javascript:void(0);" data-bs-toggle="dropdown" aria-expanded="false" aria-label="{{ __('More options') }}">
                                <i class="ti ti-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end chat-header-more-dropdown py-2">
                                <li><a href="javascript:void(0);" class="dropdown-item" id="close-chat-btn"><i
                                            class="ti ti-x me-2"></i>{{ __('Close Chat') }}</a></li>
                                <li><a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                                        data-bs-target="#mute-notification"><i
                                            class="ti ti-bell-off me-2"></i>{{ __('Mute Notification') }}</a></li>
                                <li><a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                                        data-bs-target="#disappearing-message-chat"><i
                                            class="ti ti-clock me-2"></i>{{ __('Disappearing Message') }}</a></li>
                                <li><a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                                        data-bs-target="#clear-user-chat"><i
                                            class="ti ti-list me-2"></i>{{ __('Clear Message') }}</a></li>
                                <li><a href="javascript:void(0);" class="dropdown-item text-danger" data-bs-toggle="modal"
                                        data-bs-target="#delete-user-chat"><i
                                            class="ti ti-trash me-2"></i>{{ __('Delete Chat') }}</a></li>
                                <li><a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                                        data-bs-target="#report-user"><i
                                            class="ti ti-thumb-down me-2"></i>{{ __('Report') }}</a></li>
                                <li><a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal"
                                        data-bs-target="#block-user" id="blockUserDropdownBtn"><i
                                            class="ti ti-ban me-2"></i>{{ __('Block') }}</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <!-- Chat Search -->
                <div class="chat-search search-wrap contact-search">
                    <form>
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="{{ __('Search Contacts') }}">
                            <span class="input-group-text"><i class="ti ti-search"></i></span>
                        </div>
                    </form>
                </div>
                <!-- /Chat Search -->
            </div>
            <div class="chat-body chat-page-group slimscroll" id="chat-area">
                <div class="messages" id="chat-box">

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
                                <span class="msg-read success">
                                    <i class="ti ti-checks"></i>
                                </span>
                            </h6>
                        </div>
                        <div class="chat-info">
                            <div class="message-content" id="replyContent">
                                <!-- Reply content will be dynamically rendered here -->
                            </div>
                        </div>
                    </div>
                    <a href="#" class="close-replay" id="closeReply">
                        <i class="ti ti-x"></i>
                    </a>
                </div>


                <div class="chat-footer-wrap d-inline">
                    <div id="message-preview" class="message-preview"></div>
                    <div class="chat-footer-content d-flex align-items-center">
                        <!-- Microphone Icon (for future audio recording feature) -->
                        <div class="form-item">
                            <a href="#" class="action-circle" data-bs-toggle="modal" data-bs-target="#record_audio"><i class="ti ti-microphone"></i></a>
                        </div>


                        <!-- Message Input -->
                        <div class="form-wrap">

                            <input type="text" id="message-input" class="form-control"
                                placeholder="{{ __('Type Your Message') }}">
                        </div>

                        <div class="form-item emoj-action-foot">
                            <a href="javascript:void(0);" id="emoji-button" class="action-circle">
                                <i class="ti ti-mood-smile"></i>
                            </a>
                        </div>
                        <div class="form-item emoj-action-foot">
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
                        <!-- Emoji Picker Dropdown -->
                        <div id="emoji-picker" style="display: none;">
                            <ul id="emoji-list"></ul>
                        </div>


                        <!-- File Upload -->
                        <div class="form-item position-relative d-flex align-items-center justify-content-center">
                            <a href="#" class="action-circle file-action position-absolute">
                                <i class="ti ti-folder"></i>
                            </a>
                            <input type="file" class="open-file position-relative" name="files" id="files">
                        </div>

                        <!-- Send Button -->
                        <div>
                            <button class="btn btn-primary" id="send-button">
                                <i class="ti ti-send"></i>
                            </button>
                        </div>
                    </div>

                </div>

                <!-- Added message preview area for file uploads -->


            </form>
        </div>
    </div>
    <!-- /Chat -->

    <!-- Contact Info -->
    <div class="chat-offcanvas offcanvas offcanvas-end contact-profile-offcanvas" data-bs-scroll="true" data-bs-backdrop="false"
        tabindex="-1" id="contact-profile" aria-labelledby="chatUserMoreLabel">
        <div class="offcanvas-header border-0 pb-0">
            <h4 class="offcanvas-title fw-semibold mb-0" id="chatUserMoreLabel">{{ __('Contact Info') }}</h4>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"><i
                    class="ti ti-x"></i></button>
        </div>
        <div class="offcanvas-body p-0">
            <div class="chat-contact-info contact-info-sidebar">
                <div class="profile-content px-3 pb-4">
                    {{-- Identity --}}
                    <div class="contact-profile-info text-center pt-2">
                        <div class="avatar avatar-xxl online mb-3 mx-auto contact-panel-avatar-wrap">
                            <img id="contact-avatar" src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" class="rounded-circle"
                                alt="">
                        </div>
                        <div class="d-flex align-items-center justify-content-center gap-1 flex-wrap">
                            <h4 class="contact-panel-name mb-0 fw-semibold" id="contact-full-name"></h4>
                            <span class="contact-kyc-badge badge verified-badge badge-xs" style="display:none;" title="{{ __('ID Verified') }}">{{ __('Verified') }}</span>
                        </div>
                        <p class="contact-panel-last-seen text-muted small mb-0 mt-2" id="contact-last-seen"></p>
                    </div>

                    {{-- Quick actions: Audio, Video, Chat, Search --}}
                    <div class="contact-action-grid mb-4">
                        <a href="javascript:void(0);" class="contact-action-tile" id="contact-profile-audio-btn" title="{{ __('Audio') }}">
                            <i class="ti ti-phone"></i>
                            <span>{{ __('Audio') }}</span>
                        </a>
                        <a href="javascript:void(0);" class="contact-action-tile" id="contact-profile-video-btn" title="{{ __('Video') }}">
                            <i class="ti ti-video"></i>
                            <span>{{ __('Video') }}</span>
                        </a>
                        <a href="javascript:void(0);" class="contact-action-tile" id="contact-profile-chat-btn" title="{{ __('Chat') }}">
                            <i class="ti ti-message"></i>
                            <span>{{ __('Chat') }}</span>
                        </a>
                        <a href="javascript:void(0);" class="contact-action-tile" id="contact-profile-search-btn" title="{{ __('Search') }}">
                            <i class="ti ti-search"></i>
                            <span>{{ __('Search') }}</span>
                        </a>
                    </div>

                    {{-- Profile Info: Name, Email, Phone + extra rows --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Profile Info') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body p-0">
                                <ul class="list-group list-group-flush profile-item contact-profile-rows">
                                    <li class="list-group-item border-0 px-0 py-3">
                                        <div class="profile-info flex-grow-1 pe-2">
                                            <h6 class="contact-field-label mb-1">{{ __('Name') }}</h6>
                                            <p class="contact-field-value mb-0 d-flex align-items-center flex-wrap gap-1" id="contact-name">
                                                <span id="contact-name-text"></span>
                                                <span class="contact-kyc-badge badge verified-badge badge-xs" style="display:none;" title="{{ __('ID Verified') }}">{{ __('Verified') }}</span>
                                            </p>
                                        </div>
                                        <div class="profile-icon text-muted"><i class="ti ti-user"></i></div>
                                    </li>
                                    <li class="list-group-item border-0 px-0 py-3 d-none" aria-hidden="true">
                                        <div class="profile-info flex-grow-1 pe-2">
                                            <h6 class="contact-field-label mb-1">{{ __('Email Address') }}</h6>
                                            <p class="contact-field-value mb-0" id="contact-email">—</p>
                                        </div>
                                        <div class="profile-icon text-muted"><i class="ti ti-mail"></i></div>
                                    </li>
                                    <li class="list-group-item border-0 px-0 py-3 d-none" aria-hidden="true">
                                        <div class="profile-info flex-grow-1 pe-2">
                                            <h6 class="contact-field-label mb-1">{{ __('Phone') }}</h6>
                                            <p class="contact-field-value mb-0" id="contact-phone">—</p>
                                        </div>
                                        <div class="profile-icon text-muted"><i class="ti ti-phone"></i></div>
                                    </li>
                                    <li class="list-group-item border-0 px-0 py-3">
                                        <div class="profile-info flex-grow-1 pe-2">
                                            <h6 class="contact-field-label mb-1">{{ __('Location') }}</h6>
                                            <p class="contact-field-value mb-0" id="contact-location">—</p>
                                        </div>
                                        <div class="profile-icon text-muted"><i class="ti ti-map-pin"></i></div>
                                    </li>
                                    <li class="list-group-item border-0 px-0 py-3">
                                        <div class="profile-info flex-grow-1 pe-2">
                                            <h6 class="contact-field-label mb-1">{{ __('Website') }}</h6>
                                            <p class="contact-field-value mb-0" id="contact-website">—</p>
                                        </div>
                                        <div class="profile-icon text-muted"><i class="ti ti-world"></i></div>
                                    </li>
                                    <li class="list-group-item border-0 px-0 py-3">
                                        <div class="profile-info flex-grow-1 pe-2">
                                            <h6 class="contact-field-label mb-1">{{ __('Join Date') }}</h6>
                                            <p class="contact-field-value mb-0" id="contact-join-date">—</p>
                                        </div>
                                        <div class="profile-icon text-muted"><i class="ti ti-calendar-event"></i></div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {{-- Bio --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Bio') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body d-flex align-items-start justify-content-between gap-2 py-3">
                                <p class="contact-field-value mb-0 flex-grow-1" id="contact-bio">—</p>
                                <div class="profile-icon text-muted flex-shrink-0"><i class="ti ti-user"></i></div>
                            </div>
                        </div>
                    </div>

                    {{-- Social --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Social Profiles') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body py-3">
                                <div class="social-icon d-flex align-items-center flex-wrap gap-3 justify-content-start">
                                    <a id="facebook-link" href="javascript:void(0);" class="contact-social-link" aria-label="Facebook"><i class="ti ti-brand-facebook"></i></a>
                                    <a id="twitter-link" href="javascript:void(0);" class="contact-social-link" aria-label="Twitter"><i class="ti ti-brand-twitter"></i></a>
                                    <a id="instagram-link" href="javascript:void(0);" class="contact-social-link" aria-label="Instagram"><i class="ti ti-brand-instagram"></i></a>
                                    <a id="linkedin-link" href="javascript:void(0);" class="contact-social-link" aria-label="LinkedIn"><i class="ti ti-brand-linkedin"></i></a>
                                    <span class="contact-social-verified badge verified-badge badge-xs ms-1" style="display:none;" title="{{ __('Verified') }}">{{ __('Verified') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Media --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Media Details') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body list-group list-group-flush profile-item p-0">
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between contact-media-row" id="contact-media-photos">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-photo text-primary"></i><span>{{ __('Photos') }}</span></div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between contact-media-row" id="contact-media-videos">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-video text-primary"></i><span>{{ __('Videos') }}</span></div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between contact-media-row" id="contact-media-links">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-link text-primary"></i><span>{{ __('Links') }}</span></div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between contact-media-row" id="contact-media-docs">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-file-text text-primary"></i><span>{{ __('Documents') }}</span></div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {{-- Common groups --}}
                    <div id="common-groups-container" class="content-wrapper other-info mb-3">
                        <h5 class="sub-title mb-2" id="common-groups-heading">{{ __('Common Groups') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body list-group profile-item p-3" id="common-groups-list">
                            </div>
                        </div>
                        <div class="text-center mt-2 mb-1">
                            <a href="{{ route('group-chat') }}" class="small fw-medium contact-more-groups-link">{{ __('More Groups') }} →</a>
                        </div>
                    </div>

                    {{-- Others --}}
                    <div class="content-wrapper other-info mb-0">
                        <h5 class="sub-title mb-2">{{ __('Others') }}</h5>
                        <div class="card contact-info-card border-0 mb-0">
                            <div class="card-body list-group profile-item p-0">
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" id="contact-open-favourites">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-bookmark text-primary"></i>
                                        <span class="fw-medium">{{ __('Favorites') }}</span>
                                        <span class="badge bg-danger rounded-pill ms-1 d-none" id="contact-favourites-badge">0</span>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#mute-notification">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-bell-off text-warning"></i>
                                        <span class="fw-medium">{{ __('Mute Notifications') }}</span>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" id="blockedUserDropdownBtn">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-user-off text-info"></i>
                                        <span class="fw-medium" id="blockUserLabel">{{ __('Block Users') }}</span>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#report-user">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-flag text-info"></i>
                                        <span class="fw-medium">{{ __('Report Users') }}</span>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#delete-user-chat">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-trash text-danger"></i>
                                        <span class="fw-medium text-danger">{{ __('Delete Chat') }}</span>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                            </div>
                        </div>
                        <div id="block-message" style="display: none;" class="notification mt-2">
                            {{ __('You blocked this contact. Tap to unblock.') }}
                        </div>
                        <div id="unblock-message" style="display: none;" class="notification mt-2">
                            {{ __('You unblocked this contact.') }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- /Contact Info -->

    <!-- Favourites Info -->
    <div class="chat-offcanvas fav-canvas offcanvas offcanvas-end" data-bs-scroll="true" data-bs-backdrop="false"
        tabindex="-1" id="contact-favourite">
        <div class="offcanvas-header">
            <h4 class="offcanvas-title"><a href="javascript:void(0);" data-bs-toggle="offcanvas"
                    data-bs-target="#contact-profile" data-bs-dismiss="offcanvas"><i
                        class="ti ti-arrow-left me-2"></i></a>{{ __('Favourites') }}</h4>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"><i
                    class="ti ti-x"></i></button>
        </div>
        <div class="offcanvas-body">
            <div class="favourite-chats">
                <div class="text-end mb-4">
                    <a href="javascript:void(0);" class="btn btn-light"><i
                            class="ti ti-heart-minus me-2"></i>{{ __('Mark all Unfavourite') }}</a>
                </div>
                <div class="chats">
                    <div class="chat-avatar">
                        <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="image">
                    </div>
                    <div class="chat-content">
                        <div class="chat-profile-name">
                            <h6><i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">02:39
                                    PM</span><span class="msg-read success"><i class="ti ti-checks"></i></span></h6>
                        </div>
                        <div class="chat-info">
                            <div class="message-content">
                                Thanks!!!, I ll Update you Once i check the Examples
                            </div>
                            <div class="chat-actions">
                                <a class="#" href="#" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end p-3">
                                    <li><a class="dropdown-item" href="#"><i
                                                class="ti ti-heart me-2"></i>Unfavourite</a></li>
                                    <li><a class="dropdown-item" href="#"><i
                                                class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </div>
                        <p>Saved on 23 Septemer 2024</p>
                    </div>
                </div>
                <div class="chats">
                    <div class="chat-avatar">
                        <img src="assets/img/profiles/avatar-04.jpg" class="rounded-circle" alt="image">
                    </div>
                    <div class="chat-content">
                        <div class="chat-profile-name">
                            <h6>Carla Jenkins<i class="ti ti-circle-filled fs-7 mx-2"></i><span
                                    class="chat-time">02:45 PM</span><span class="msg-read success"><i
                                        class="ti ti-checks"></i></span></h6>
                        </div>
                        <div class="chat-info">
                            <div class="message-content bg-transparent p-0">
                                <div class="message-audio">
                                    <audio controls>
                                        <source src="assets/sounds/notification_sound.mp3" type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            </div>
                            <div class="chat-actions">
                                <a class="#" href="#" data-bs-toggle="dropdown">
                                    <i class="ti ti-dots-vertical"></i>
                                </a>
                                <ul class="dropdown-menu dropdown-menu-end p-3">
                                    <li><a class="dropdown-item" href="#"><i
                                                class="ti ti-heart me-2"></i>Unfavourite</a></li>
                                    <li><a class="dropdown-item" href="#"><i
                                                class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </div>
                        <p>Saved on 26 Septemer 2024</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- /Favourites Info -->

    <!-- Mute -->
    <div class="modal fade" id="mute-notification">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">
                        {{ __('Mute Notifications') }}
                    </h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}">
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
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100">{{ __('Mute') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Mute -->

    <!-- Disappearing messages (private chat — UI parity with DreamsChat) -->
    <div class="modal fade" id="disappearing-message-chat" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Disappearing Messages') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="{{ __('Close') }}">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}" method="get">
                        <div class="block-wrap mb-3">
                            <p class="text-muted small mb-0">
                                {{ __('For more privacy and storage, new messages can disappear after the duration you choose. This is a display preference on this device.') }}
                            </p>
                        </div>
                        <div class="mb-3">
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="disappear_duration" id="dm-chat-24h">
                                <label class="form-check-label" for="dm-chat-24h">{{ __('24 Hours') }}</label>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="disappear_duration" id="dm-chat-7d">
                                <label class="form-check-label" for="dm-chat-7d">{{ __('7 Days') }}</label>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="disappear_duration" id="dm-chat-90d">
                                <label class="form-check-label" for="dm-chat-90d">{{ __('90 Days') }}</label>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="disappear_duration" id="dm-chat-off" checked>
                                <label class="form-check-label" for="dm-chat-off">{{ __('Off') }}</label>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <button type="button" class="btn btn-outline-primary w-100" data-bs-dismiss="modal">{{ __('Cancel') }}</button>
                            </div>
                            <div class="col-6">
                                <button type="button" class="btn btn-primary w-100" data-bs-dismiss="modal">{{ __('Save') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Disappearing messages -->

    <!-- Delete -->
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
                        <input type="hidden" id="room-id" name="room-id">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" value="for-me" name="delete-chat" id="delete-for-me" checked>
                            <label class="form-check-label" for="delete-for-me">Delete For Me</label>
                        </div>
                        <div class="form-check mb-3" id="delete-for-everyone">
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

    <!-- /Delete -->
    <!-- Block User -->
    <div class="modal fade" id="block-user">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Block User') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}">
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-info">
                                <i class="ti ti-user-off text-info"></i>
                            </span>
                            <p class="text-grya-9">
                                {{ __('Blocked contacts will no longer be able to call you or send you messages.') }}
                            </p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100"
                                    id="confirmBlockUserBtn">{{ __('Block') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="blocked-user">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Block User') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-info">
                                <i class="ti ti-user-off text-info"></i>
                            </span>
                            <p class="text-grya-9">
                                {{ __('Blocked contacts will no longer be able to call you or send you messages.') }}
                            </p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100"
                                    id="confirmBlockedUserBtn">{{ __('Block') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Block User -->
    <!-- Unblock User Modal -->
    <div class="modal fade" id="unblock-user" tabindex="-1" aria-labelledby="unblockUserLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Unblock User') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>{{ __('Are you sure you want to unblock this user?') }}</p>
                    <div class="row g-3">
                        <div class="col-6">
                            <button type="button" class="btn btn-outline-primary w-100"
                                data-bs-dismiss="modal">{{ __('Cancel') }}</button>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100"
                                id="confirmUnblockUserBtn">{{ __('Unblock') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Report User -->
    <div class="modal fade" id="report-user">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Report User') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}">
                        <div class="block-wrap mb-3">
                            <p class="text-grya-9 mb-3">
                                {{ __('If you block this contact and clear the chat, messages will only be removed from this device and your devices on the newer versions of DreamsChat') }}
                            </p>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="mute" id="report">
                                <label class="form-check-label" for="report">{{ __('Report User') }}</label>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100">{{ __('Report') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Report User -->

    <!-- Delete Chat -->
    <div class="modal fade" id="delete-user-chat">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Delete Chat') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}">
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                                <i class="ti ti-trash text-danger"></i>
                            </span>
                            <p class="text-grya-9">
                                {{ __('Clearing or deleting entire chats will only remove messages from this device and your devices on the newer versions of DreamsChat.') }}
                            </p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100"
                                    id="deleteChatBtn">{{ __('Delete') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Delete Chat -->

    <!-- clear Chat -->
    <div class="modal fade" id="clear-user-chat">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Clear Message') }}</h4>
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
                            <p class="text-grya-9">
                                {{ __('Clearing entire  messages from this device and your devices on the newer versions of DreamsChat.') }}
                            </p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100"
                                    id="clearChatBtn">{{ __('Delete') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /clear Chat -->

    <!-- New Chat -->
    <div class="modal fade" id="new-chat">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('New Chat') }}</h4>
                    <button type="button" class="btn-close" id="cancelsearch" data-bs-dismiss="modal"
                        aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form onsubmit="return false">
                        <div class="search-wrap contact-search mb-3">
                            <div class="input-group">
                                <input type="text" id="chatcontactSearchInput" class="form-control"
                                    placeholder="{{ __('Search') }}">
                                <a href="javascript:void(0);" class="input-group-text"><i
                                        class="ti ti-search"></i></a>
                            </div>
                        </div>
                        <h6 class="mb-3 fw-medium fs-16">{{ __('Contacts') }}</h6>
                        <div class="contact-scroll contact-select mb-3" id="main-container">

                        </div>
                        <div id="noChatMatchesModalMessage" style="display: none;">{{ __('No matches found.') }}
                        </div>
                        <div class="row g-3">
                            <div class="col-12">
                                <a href="#" class="btn btn-outline-primary w-100" id="cancelsearchbutton"
                                    data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
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
                    <h4 class="modal-title">{{ __('Add Contact') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">{{ __('First Name') }}</label>
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
                                    <label class="form-label">{{ __('Last Name') }}</label>
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
                                    <label class="form-label">{{ __('Email') }}</label>
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
                                    <label class="form-label">{{ __('Phone') }}</label>
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
                                    <label class="form-label">{{ __('Date of Birth') }}</label>
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
                                    <label class="form-label">{{ __('Website Address') }}</label>
                                    <div class="input-icon position-relative">
                                        <input type="text" class="form-control">
                                        <span class="input-icon-addon">
                                            <i class="ti ti-globe"></i>
                                        </span>
                                    </div>
                                </div>
                                <div class="card border">
                                    <div class="card-header border-bottom">
                                        <h6>{{ __('Social Information') }}</h6>
                                    </div>
                                    <div class="card-body pb-1">
                                        <div class="row align-items-center">
                                            <div class="col-md-4">
                                                <label
                                                    class="form-label text-default fw-normal mb-3">{{ __('Facebook') }}</label>
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
                                                <label
                                                    class="form-label text-default fw-normal mb-3">{{ __('Twitter') }}</label>
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
                                                <label
                                                    class="form-labe text-default fw-normall mb-3">{{ __('Instagram') }}</label>
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
                                                <label
                                                    class="form-label text-default fw-normal mb-3">{{ __('LinkedIn') }}</label>
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
                                                <label
                                                    class="form-label text-default fw-normal mb-3">{{ __('YouTube') }}</label>
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
                                                <label
                                                    class="form-label text-default fw-normal mb-3">{{ __('Kick') }}</label>
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
                                                <label
                                                    class="form-label text-default fw-normal mb-3">{{ __('Twitch') }}</label>
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
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel') }}</a>
                            </div>
                            <div class="col-6">
                                <button type="submit" class="btn btn-primary w-100">{{ __('Add Contact') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Add Contact -->

    <!-- Contact Detail -->
    <div class="modal fade" id="contact-details">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Contact Detail') }}</h4>
                    <div class="d-flex align-items-center">
                        <div class="dropdown me-2">
                            <a class="d-block" href="#" data-bs-toggle="dropdown">
                                <i class="ti ti-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end p-3">
                                <li><a class="dropdown-item" href="#"><i
                                            class="ti ti-share-3 me-2"></i>{{ __('Share') }}</a></li>
                                <li><a class="dropdown-item" href="#"><i
                                            class="ti ti-edit me-2"></i>{{ __('Edit') }}</a></li>
                                <li><a class="dropdown-item" href="#" data-bs-toggle="modal"
                                        data-bs-target="#block-user"><i
                                            class="ti ti-ban me-2"></i>{{ __('Block') }}</a></li>
                                <li><a class="dropdown-item" href="#"><i
                                            class="ti ti-trash me-2"></i>{{ __('Delete') }}</a></li>
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
                                        <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle"
                                            alt="img">
                                    </span>
                                    <div class="ms-2">
                                        <h6>Aaryian Jose</h6>
                                        <p>App Developer</p>
                                    </div>
                                </div>
                                <div class="contact-actions d-flex align-items-center mb-3">
                                    <a href="{{ route('chat') }}" class="me-2"><i class="ti ti-message"></i></a>
                                    <a href="javascript:void(0);" class="me-2" data-bs-toggle="modal"
                                        data-bs-target="#voice_call"><i class="ti ti-phone"></i></a>
                                    <a href="javascript:void(0);" class="me-2"><i class="ti ti-video"></i></a>
                                    @if($callsProvider === 'meet')
                                    <a href="https://meet.google.com/new" target="_blank" class="me-2" title="Start Google Meet"><img src="{{ asset('assets/img/icons/google-meet.svg') }}" alt="Google Meet" class="google-meet-icon"></a>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card border mb-3">
                        <div class="card-header border-bottom">
                            <h6>{{ __('Personal Information') }}</h6>
                            <p class="text-muted small mb-0 mt-1">{{ __('Website verified via meta tag or approved for company representation') }}</p>
                        </div>
                        <div class="card-body pb-1">
                            <div class="mb-2">
                                <div class="row align-items-center">
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-clock-hour-4 me-1"></i>Local Time</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">10:00 AM</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-calendar-event me-1"></i>Date of Birth</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">22 July 2024</h6>
                                    </div>
                                    <div class="col-sm-6 d-none">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-phone me-1"></i>Phone Number</p>
                                    </div>
                                    <div class="col-sm-6 d-none">
                                        <h6 class="fw-medium fs-14 mb-2">+20-482-038-29</h6>
                                    </div>
                                    <div class="col-sm-6 d-none">
                                        <p class="mb-2 d-flex align-items-center"><i class="ti ti-mail me-1"></i>Email
                                        </p>
                                    </div>
                                    <div class="col-sm-6 d-none">
                                        <h6 class="fw-medium fs-14 mb-2">aariyan@example.com</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-globe me-1"></i>Website Address</p>
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
                            <h6>{{ __('Social Information') }}</h6>
                            <p class="text-muted small mb-0 mt-1">{{ __('All social profiles are verified via OAuth unless otherwise stated.') }}</p>
                        </div>
                        <div class="card-body pb-1">
                            <div class="mb-2">
                                <div class="row align-items-center">
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-brand-facebook me-1"></i>Facebook</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">www.facebook.com</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-brand-twitter me-1"></i>Twitter</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">www.twitter.com</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-brand-instagram me-1"></i>Instagram</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">www.instagram.com</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-brand-linkedin me-1"></i>Linkedin</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">www.linkedin.com</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-brand-youtube me-1"></i>YouTube</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2">www.youtube.com</h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-device-gamepad-2 me-1"></i>Kick</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2" data-field="kick"></h6>
                                    </div>
                                    <div class="col-sm-6">
                                        <p class="mb-2 d-flex align-items-center"><i
                                                class="ti ti-brand-twitch me-1"></i>Twitch</p>
                                    </div>
                                    <div class="col-sm-6">
                                        <h6 class="fw-medium fs-14 mb-2" data-field="twitch"></h6>
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





    <!-- Voice Call group -->
    <div class="modal fade" id="voice_group" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header d-flex border-0 pb-0">
                    <div class="card bg-transparent-dark flex-fill border mb-3">
                        <div class="card-body d-flex justify-content-between p-3">
                            <div class="row justify-content-between flex-fill row-gap-3">
                                <div class="col-lg-5">
                                    <div class="d-flex justify-content-between align-items-center flex-wrap row-gap-2">
                                        <h3>Weekly Report Call</h3>

                                    </div>
                                </div>
                                <div class="col-lg-4">
                                    <div class="d-flex justify-content-start align-items-center">
                                        <span class="badge border border-primary  text-primary badge-sm me-3">
                                            <i class="ti ti-point-filled"></i>
                                            01:15:25
                                        </span>
                                        <a href="javascript:void(0);" data-bs-toggle="modal"
                                            class="badge badge-danger badge-sm">Leave</a>
                                    </div>
                                </div>
                                <div class="col-lg-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex">
                                            <span
                                                class="user-add bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                                                6
                                            </span>
                                            <a href=""
                                                class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white">
                                                <i class="ti ti-user-plus"></i>
                                            </a>
                                        </div>
                                        <div class="row justify-content-center">
                                            <div class="layout-tab d-flex justify-content-center ">
                                                <div class="nav nav-pills inner-tab " id="pills-tab2" role="tablist">
                                                    <div class="nav-item me-0" role="presentation">
                                                        <a href="#"
                                                            class="nav-link bg-white text-gray p-0 fs-16 me-2"
                                                            id="pills-single1-tab" data-bs-toggle="pill"
                                                            data-bs-target="#pills-single1" role="tab"
                                                            aria-controls="pills-single1" aria-selected="false"
                                                            tabindex="-1">
                                                            <i class="ti ti-square"></i>
                                                        </a>
                                                    </div>
                                                    <div class="nav-item" role="presentation">
                                                        <a href="#"
                                                            class="nav-link active bg-white text-gray p-0 fs-16"
                                                            id="pills-group1-tab" data-bs-toggle="pill"
                                                            data-bs-target="#pills-group1" role="tab"
                                                            aria-controls="pills-group1" aria-selected="false"
                                                            tabindex="-1">
                                                            <i class="ti ti-layout-grid"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-body border-0 pt-0">
                    <div class="tab-content dashboard-tab">
                        <div class="tab-pane fade" id="pills-single1" role="tabpanel"
                            aria-labelledby="pills-single1-tab">
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
                                    <div class="single-img d-flex justify-content-center align-items-center">
                                        <span class=" avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                            <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                                alt="user">
                                        </span>
                                    </div>
                                    <div class="d-flex align-items-end justify-content-end">
                                        <span
                                            class="call-span border border-2 border-primary d-flex justify-content-center align-items-center rounded">
                                            <span class="avatar avatar-xxl bg-soft-primary rounded-circle p-2">
                                                <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                                    alt="user">
                                            </span>
                                        </span>
                                    </div>
                                </div>

                            </div>

                        </div>
                        <div class="tab-pane fade active show" id="pills-group1" role="tabpanel"
                            aria-labelledby="pills-group1-tab">
                            <div class="row">
                                <div class="col-md-6">
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
                                                <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                    <img src="assets/img/profiles/avatar-06.jpg"
                                                        class="rounded-circle" alt="user">
                                                </span>
                                            </div>
                                            <div class="d-flex align-items-end justify-content-end">
                                                <span class="badge badge-info">Edwin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card audio-crd bg-transparent-dark border pt-4">
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
                                                <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                    <img src="assets/img/profiles/avatar-01.jpg"
                                                        class="rounded-circle" alt="user">
                                                </span>
                                            </div>
                                            <div class="d-flex align-items-end justify-content-end">
                                                <span class="badge badge-info">Edwin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card audio-crd bg-transparent-dark border pt-4">
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
                                                <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                    <img src="assets/img/profiles/avatar-02.jpg"
                                                        class="rounded-circle" alt="user">
                                                </span>
                                            </div>
                                            <div class="d-flex align-items-end justify-content-end">
                                                <span class="badge badge-info">Edwin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card audio-crd bg-transparent-dark border pt-4">
                                        <div class="modal-bgimg">
                                            <span class="modal-bg1">
                                                <img src="assets/img/bg/bg-02.png" class="img-fluid"
                                                    alt="bg">
                                            </span>
                                            <span class="modal-bg2">
                                                <img src="assets/img/bg/bg-03.png" class="img-fluid"
                                                    alt="bg">
                                            </span>
                                        </div>
                                        <div class="card-body ">
                                            <div class="d-flex justify-content-center align-items-center">
                                                <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                    <img src="assets/img/profiles/avatar-03.jpg"
                                                        class="rounded-circle" alt="user">
                                                </span>
                                            </div>
                                            <div class="d-flex align-items-end justify-content-end">
                                                <span class="badge badge-info">Edwin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card audio-crd bg-transparent-dark border pt-4">
                                        <div class="modal-bgimg">
                                            <span class="modal-bg1">
                                                <img src="assets/img/bg/bg-02.png" class="img-fluid"
                                                    alt="bg">
                                            </span>
                                            <span class="modal-bg2">
                                                <img src="assets/img/bg/bg-03.png" class="img-fluid"
                                                    alt="bg">
                                            </span>
                                        </div>
                                        <div class="card-body">
                                            <div class="d-flex justify-content-center align-items-center">
                                                <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                    <img src="assets/img/profiles/avatar-05.jpg"
                                                        class="rounded-circle" alt="user">
                                                </span>
                                            </div>
                                            <div class="d-flex align-items-end justify-content-end">
                                                <span class="badge badge-info">Edwin</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer justify-content-center border-0 pt-0">
                    <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                        <a href="javascript:void(0);"
                            class="call-controll mute-bt d-flex align-items-center justify-content-center">
                            <i class="ti ti-microphone"></i>
                        </a>
                        <a href="javascript:void(0);"
                            class="call-controll d-flex align-items-center justify-content-center">
                            <i class="ti ti-volume"></i>
                        </a>
                        <a href="javascript:void(0);" data-bs-dismiss="modal"
                            class="call-controll call-decline d-flex align-items-center justify-content-center">
                            <i class="ti ti-phone"></i>
                        </a>
                        <a href="javascript:void(0);"
                            class="call-controll d-flex align-items-center justify-content-center">
                            <i class="ti ti-maximize"></i>
                        </a>
                        <a href="javascript:void(0);"
                            class="call-controll d-flex align-items-center justify-content-center">
                            <i class="ti ti-dots"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- /Voice Call group -->



    <!-- Video Call group -->
    <div class="modal fade" id="video_group" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header d-flex border-0 pb-0">
                    <div class="card bg-transparent-dark flex-fill border mb-3">
                        <div class="card-body d-flex justify-content-between p-3">
                            <div class="row justify-content-between flex-fill row-gap-3">
                                <div class="col-lg-5 col-sm-12">
                                    <div class="d-flex justify-content-between align-items-center row-gap-2">
                                        <h3>Weekly Report Call</h3>

                                    </div>
                                </div>
                                <div class="col-lg-5 col-sm-12">
                                    <div class="d-flex justify-content-start align-items-center">
                                        <span class="badge border border-primary  text-primary badge-sm me-3">
                                            <i class="ti ti-point-filled"></i>
                                            01:15:25
                                        </span>
                                        <a href="javascript:void(0);" data-bs-toggle="modal"
                                            class="badge badge-danger badge-sm">Leave</a>
                                    </div>
                                </div>
                                <div class="col-lg-2 col-sm-12">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex">
                                            <span
                                                class="user-add bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                                                6
                                            </span>
                                            <a href=""
                                                class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white">
                                                <i class="ti ti-user-plus"></i>
                                            </a>
                                        </div>
                                        <div class="row justify-content-center">
                                            <div class="layout-tab d-flex justify-content-center ">
                                                <div class="nav nav-pills inner-tab " id="pills-tab3"
                                                    role="tablist">
                                                    <div class="nav-item me-0" role="presentation">
                                                        <a href="#"
                                                            class="nav-link bg-white text-gray p-0 fs-16 me-2"
                                                            id="pills-single2-tab" data-bs-toggle="pill"
                                                            data-bs-target="#pills-single2" role="tab"
                                                            aria-controls="pills-single2" aria-selected="false"
                                                            tabindex="-1">
                                                            <i class="ti ti-square"></i>
                                                        </a>
                                                    </div>
                                                    <div class="nav-item" role="presentation">
                                                        <a href="#"
                                                            class="nav-link active bg-white text-gray p-0 fs-16"
                                                            id="pills-group2-tab" data-bs-toggle="pill"
                                                            data-bs-target="#pills-group2" role="tab"
                                                            aria-controls="pills-group2" aria-selected="false"
                                                            tabindex="-1">
                                                            <i class="ti ti-layout-grid"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-body border-0 pt-0">
                    <div class="tab-content dashboard-tab">
                        <div class="tab-pane fade" id="pills-single2" role="tabpanel"
                            aria-labelledby="pills-single2-tab">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="video-call-view br-8 overflow-hidden position-relative">
                                        <img src="assets/img/profiles/avatar-03.jpg" alt="user-image">
                                        <div class="mini-video-view active br-8 overflow-hidden position-absolute">
                                            <img src="assets/img/video/user-image.jpg" alt="">
                                            <div
                                                class="bg-soft-primary mx-auto default-profile rounded-circle align-items-center justify-content-center">
                                                <span class="avatar  avatar-lg rounded-circle bg-primary ">RG</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="tab-pane fade active show" id="pills-group2" role="tabpanel"
                            aria-labelledby="pills-group2-tab">
                            <div class="row row-gap-4">
                                <div class="col-md-6 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/profiles/avatar-03.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-6 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/profiles/avatar-03.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-4 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/profiles/avatar-03.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-4 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/profiles/avatar-03.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-4 d-flex">
                                    <div
                                        class="video-call-view br-8 overflow-hidden default-mode d-flex align-items-center  flex-fill">
                                        <div
                                            class="bg-soft-primary mx-auto default-profile rounded-circle d-flex align-items-center justify-content-center">
                                            <span class="avatar  avatar-lg rounded-circle bg-primary ">RG</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="modal-footer justify-content-center border-0">
                        <div
                            class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                            <a href="javascript:void(0);"
                                class="call-controll mute-bt d-flex align-items-center justify-content-center">
                                <i class="ti ti-microphone"></i>
                            </a>
                            <a href="javascript:void(0);"
                                class="call-controll d-flex align-items-center justify-content-center">
                                <i class="ti ti-volume"></i>
                            </a>
                            <a href="javascript:void(0);"
                                class="call-controll mute-video d-flex align-items-center justify-content-center">
                                <i class="ti ti-video"></i>
                            </a>
                            <a href="javascript:void(0);" data-bs-dismiss="modal"
                                class="call-controll call-decline d-flex align-items-center justify-content-center">
                                <i class="ti ti-phone"></i>
                            </a>
                            <a href="javascript:void(0);"
                                class="call-controll d-flex align-items-center justify-content-center">
                                <i class="ti ti-mood-smile"></i>
                            </a>
                            <a href="javascript:void(0);"
                                class="call-controll d-flex align-items-center justify-content-center">
                                <i class="ti ti-maximize"></i>
                            </a>
                            <a href="javascript:void(0);"
                                class="call-controll d-flex align-items-center justify-content-center">
                                <i class="ti ti-dots"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- /Video Call group -->

    <!-- Invite -->
    <div class="modal fade" id="invite-contact" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Invite Others') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="#" id="inviteFormChat">
                        <div class="row">
                            <div class="col-lg-12">
                                <label class="form-label">{{ __('Email Address') }}</label>
                                <div class="input-icon mb-3 position-relative">
                                    <input type="text" value="" id="inviteInput" class="form-control">
                                </div>
                            </div>
                            <!-- <div class="col-lg-12">
                                    <label class="form-label">Invitation Message</label>
                                    <textarea class="form-control mb-3"></textarea>
                                </div> -->
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <button type="button" class="btn btn-outline-primary w-100"
                                    data-bs-dismiss="modal">{{ __('Cancel') }}</button>
                            </div>
                            <div class="col-6">
                                <button class="btn btn-primary w-100" type="submit"
                                    id="sendInviteButton">{{ __('Send Invitation') }}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Invite -->

  <div class="modal fade" id="start-video-call-container">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header d-flex border-0 pb-0">
                <div class="user-video-head">
                    <div class="">
                        <div class="d-flex align-items-center">
                            <span class="avatar avatar-video avatar-lg online me-2">
                                <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle" alt="user">
                            </span>
                            <div class="user-name">
                                <!-- Remote user name will be inserted here -->
                            </div>
                            <span class="badge border border-primary text-primary badge-sm ms-5">
                                <div class="call-duration" id="local-call-timer">00:00:00</div>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-body border-0 pt-0">
                <!-- Full video view for remote user -->
                <div class="row video-group">
                    <!-- Remote video container -->
                    <div id="remote-playerlist" class="remote-player-container">
                        <!-- Remote video will be inserted here -->
                    </div>

                    <!-- Local video preview -->
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
</div>

<div id="spa-page-modals">
    <div class="modal fade" id="video_group_new" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header d-flex border-0 pb-0">

                </div>
                <div class="modal-body border-0 pt-0">
                    <div class="tab-content dashboard-tab">

                        <div class="tab-pane fade active show" id="pills-group2" role="tabpanel"
                            aria-labelledby="pills-group2-tab">
                            <div class="row row-gap-4">
                                <div class="col-md-6 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <div id="local-player" class="player video-call-view br-8 overflow-hidden">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <div id="remote-players" class="row row-gap-4"></div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                    <div class="modal-footer justify-content-center border-0">
                        <div
                            class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
                            <a href="javascript:void(0);" id="mute-group-btn"
                                class="call-controll mute-bt d-flex align-items-center justify-content-center">
                                <i class="ti ti-microphone"></i>
                            </a>

                            <a href="javascript:void(0);" id="leave-group-video" data-bs-dismiss="modal"
                                class="call-controll call-decline d-flex align-items-center justify-content-center">
                                <i class="ti ti-phone"></i>
                            </a>
                            <a href="javascript:void(0);" id="video-group-btn"
                                class="call-controll mute-video d-flex align-items-center justify-content-center">
                                <i class="ti ti-video"></i>
                            </a>

                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <div class="modal fade" id="video-call-new-group">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header justify-content-center border-0">
                    <span
                        class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                        <i class="ti ti-phone-call"></i>
                    </span>
                    <h4 class="modal-title" id="videoCallModalLabel">{{ __('Video Calling...') }}</h4>
                </div>
                <div class="modal-body pb-0">
                    <div class="card bg-light mb-0">
                        <div class="card-body calling-name-group d-flex justify-content-center">
                            <div>
                                <span class="avatar avatar-new-group avatar-xxl">
                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                        alt="user">
                                </span>
                                <h6 class="fs-14"></h6>
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




    <!-- Add Call -->
    <div class="modal fade" id="new-call">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('New Call') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form onsubmit="return false;">
                        <div class="search-wrap contact-search mb-3">
                            <div class="input-group">
                                <input type="text" class="form-control" id="searchCallcontact"
                                    placeholder="{{ __('Search') }}">
                                <a href="javascript:void(0);" class="input-group-text"><i
                                        class="ti ti-search"></i></a>
                            </div>
                        </div>
                        <h6 class="mb-3 fw-medium fs-16">{{ __('Contacts') }}</h6>
                        <div class="contact-scroll contact-select mb-3" id="user-list">

                        </div>
                        <p id="noUserMatchesMessage" style="display: none;">{{ __('No matches found') }}</p>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- /Add Call -->


    {{-- Incoming video ring modal: frontend/partials/popups.blade.php (#video-call) --}}

    <!-- Mute User -->
    <div class="modal fade" id="mute-user">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('Muted User') }}</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form action="{{ route('chat') }}">
                        <div class="link-item mb-3">
                            <input type="text" class="form-control border-0"
                                placeholder="{{ __('Search For Muted Users') }}">
                            <span class="input-group-text"><i class="ti ti-search"></i></span>
                        </div>
                        <h6 class="mb-3 fs-16">{{ __('Muted User') }}</h6>
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
                                        <a href="javascript:void(0);"
                                            class="btn btn-outline-primary">{{ __('Unmute') }}</a>
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
                                        <a href="javascript:void(0);"
                                            class="btn btn-outline-primary">{{ __('Unmute') }}</a>
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
                                        <a href="javascript:void(0);"
                                            class="btn btn-outline-primary">{{ __('Unmute') }}</a>
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
                                        <a href="javascript:void(0);"
                                            class="btn btn-outline-primary">{{ __('Unmute') }}</a>
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



    {{-- Audio call modals (voice-attend-new, audio-call-modal) are in frontend.partials.popups so they exist on all pages for incoming calls --}}
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
    <!--Voice Modal-->
    <div class="modal fade" id="record_audio">
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
                            <p id="voice-record-timer" class="text-center mb-2 fw-semibold text-muted" aria-live="polite">0:00</p>
                            <audio controls id="audio" preload="metadata"></audio>
                            <br>
                            <button type="button" class="btn btn-warning btn-sm" id="startRecording">Start</button>
                            <button type="button" class="btn btn-dark btn-sm" id="stopRecording" disabled>Stop</button>

                            <button type="button" class="btn btn-info btn-sm" id="send_voice" disabled>Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- /Voice Modal-->

    <!-- /Content -->
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
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var audioBtn = document.getElementById('contact-profile-audio-btn');
        var videoBtn = document.getElementById('contact-profile-video-btn');
        if (audioBtn && document.getElementById('audio-call-btn')) {
            audioBtn.addEventListener('click', function() { document.getElementById('audio-call-btn').click(); });
        }
        if (videoBtn && document.getElementById('video-call-new-btn')) {
            videoBtn.addEventListener('click', function() { document.getElementById('video-call-new-btn').click(); });
        }
    });
    </script>
</div>
    @endsection
