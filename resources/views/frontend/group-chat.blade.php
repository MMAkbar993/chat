@extends('frontend.layout')

@php
    try { $callsProvider = config('calls.provider', 'meet'); } catch (\Throwable $e) { $callsProvider = 'meet'; }
@endphp

@section('content')
<style>
/* Sidebar group three-dot dropdown */
#group-list .chat-list {
    position: relative;
}
#group-list .chat-list .chat-drop {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 2;
}
#group-list .chat-list:hover .chat-drop {
    opacity: 1;
}
#group-list .chat-list .chat-drop .group-sidebar-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: #6c757d;
    text-decoration: none;
}
#group-list .chat-list .chat-drop .group-sidebar-dots:hover {
    background: rgba(0,0,0,0.08);
    color: #333;
}
.group-sidebar-dropdown {
    min-width: 200px;
    border-radius: 8px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
}
.group-sidebar-dropdown .dropdown-item {
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 4px;
}
.group-sidebar-dropdown .dropdown-item:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
}
/* Right-click context menu */
#group-context-menu {
    min-width: 200px;
    border-radius: 8px;
    border: 1px solid rgba(0,0,0,0.1);
}
#group-context-menu .dropdown-item {
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 4px;
}
#group-context-menu .dropdown-item:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
}
.group-archived {
    opacity: 0.6;
}
.group-archived:hover {
    opacity: 1;
}
.edited-label {
    display: block;
    margin-bottom: 2px;
}
.unread-badge {
    font-size: 10px !important;
    line-height: 1;
}
/* Header overlapping member avatars */
#header-member-avatars-wrap {
    margin-left: auto;
    margin-right: 8px;
    flex-shrink: 0;
}
#header-member-avatars-wrap .header-member-stack {
    display: flex;
    align-items: center;
}
#header-member-avatars-wrap .header-member-stack .hm-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #fff;
    margin-left: -10px;
    object-fit: cover;
    background: #e9ecef;
    flex-shrink: 0;
}
#header-member-avatars-wrap .header-member-stack .hm-avatar:first-child {
    margin-left: 0;
}
#header-member-avatars-wrap .hm-count-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #fff;
    margin-left: -10px;
    background: #6338f6;
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.darkmode #header-member-avatars-wrap .header-member-stack .hm-avatar,
.darkmode #header-member-avatars-wrap .hm-count-badge {
    border-color: #0D0D0D;
}
</style>

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
                <div class="d-flex align-items-center gap-2" id="header-member-avatars-wrap" style="display:none !important;"></div>
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
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#mute-notification"><i class="ti ti-bell-off me-2"></i>{{ __('Mute Notification')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#msg-disapper"><i class="ti ti-clock me-2"></i>{{ __('Disappearing Message')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#clear-group-chat"><i class="ti ti-clear-all me-2"></i>{{ __('Clear Message')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#delete-group"><i class="ti ti-trash me-2"></i>{{ __('Delete Group')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#report-group"><i class="ti ti-flag me-2"></i>{{ __('Report')}}</a></li>
                                <li><a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#block-user"><i class="ti ti-ban me-2"></i>{{ __('Block')}}</a></li>
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
    <div class="chat-offcanvas offcanvas offcanvas-end contact-profile-offcanvas" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="contact-profile">
        <div class="offcanvas-header border-0 pb-0">
            <h4 class="offcanvas-title fw-semibold mb-0">{{ __('Group Info')}}</h4>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"><i class="ti ti-x"></i></button>
        </div>
        <div class="offcanvas-body p-0">
            <div class="chat-contact-info contact-info-sidebar">
                <div class="profile-content px-3 pb-3">

                    {{-- Identity --}}
                    <div class="contact-profile-info text-center pt-2">
                        <div class="avatar avatar-xxl online mb-3 mx-auto">
                            <img id="group-avatar" src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" class="rounded-circle" alt="img">
                        </div>
                        <div id="group-icon-edit-wrap" class="mb-2 d-none">
                            <label for="group-icon-upload" class="btn btn-sm btn-outline-primary">
                                <i class="ti ti-camera me-1"></i>{{ __('Change Icon') }}
                            </label>
                            <input type="file" id="group-icon-upload" class="d-none" accept="image/*">
                        </div>
                        <h4 class="fw-semibold mb-0" id="group-profile-name"></h4>
                        <p id="group-profile-participant-count" class="text-muted small mb-0 mt-1">—</p>
                    </div>

                    {{-- Quick actions: Audio, Video, Chat, Search --}}
                    <div class="contact-action-grid mb-4">
                        <a href="javascript:void(0);" class="contact-action-tile" id="group-profile-audio-btn" title="{{ __('Audio') }}">
                            <i class="ti ti-phone"></i>
                            <span>{{ __('Audio') }}</span>
                        </a>
                        <a href="javascript:void(0);" class="contact-action-tile" id="group-profile-video-btn" title="{{ __('Video') }}">
                            <i class="ti ti-video"></i>
                            <span>{{ __('Video') }}</span>
                        </a>
                        <a href="javascript:void(0);" class="contact-action-tile" id="group-profile-chat-btn" title="{{ __('Chat') }}">
                            <i class="ti ti-message"></i>
                            <span>{{ __('Chat') }}</span>
                        </a>
                        <a href="javascript:void(0);" class="contact-action-tile" id="group-profile-search-btn" title="{{ __('Search') }}">
                            <i class="ti ti-search"></i>
                            <span>{{ __('Search') }}</span>
                        </a>
                    </div>

                    {{-- Profile Info --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Profile Info')}}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body">
                                <div class="d-flex profile-info-content justify-content-between align-items-center border-bottom pb-3 mb-3">
                                    <div>
                                        <h6 class="fs-14">{{ __('Group Description')}}</h6>
                                        <p class="fs-16 mb-0" id="group-info-about">—</p>
                                    </div>
                                    <div class="profile-icon text-muted"><i class="ti ti-pencil"></i></div>
                                </div>
                                <p class="fs-12 mb-0" id="group-date">Group created by </p>
                            </div>
                        </div>
                    </div>

                    {{-- Social Profiles --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Social Profiles') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body py-3">
                                <div class="social-icon d-flex align-items-center flex-wrap gap-3 justify-content-start">
                                    <a href="javascript:void(0);" class="contact-social-link" aria-label="Facebook"><i class="ti ti-brand-facebook"></i></a>
                                    <a href="javascript:void(0);" class="contact-social-link" aria-label="Twitter"><i class="ti ti-brand-twitter"></i></a>
                                    <a href="javascript:void(0);" class="contact-social-link" aria-label="Instagram"><i class="ti ti-brand-instagram"></i></a>
                                    <a href="javascript:void(0);" class="contact-social-link" aria-label="LinkedIn"><i class="ti ti-brand-linkedin"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Media Details --}}
                    <div class="content-wrapper mb-3">
                        <h5 class="sub-title mb-2">{{ __('Media Details') }}</h5>
                        <div class="card contact-info-card border-0">
                            <div class="card-body list-group list-group-flush profile-item p-0">

                                {{-- Photos --}}
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between group-media-row" data-media-target="group-media-collapse-photos">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-photo text-primary"></i><span>{{ __('Photos') }}</span></div>
                                    <span class="link-icon media-chevron"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <div class="collapse" id="group-media-collapse-photos">
                                    <div class="pb-2">
                                        <div class="media-loading text-center py-2 d-none"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>
                                        <div class="media-empty text-muted small text-center py-2 d-none">{{ __('No photos found.') }}</div>
                                        <div class="row g-1 media-photos-grid"></div>
                                    </div>
                                </div>

                                {{-- Videos --}}
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between group-media-row" data-media-target="group-media-collapse-videos">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-video text-primary"></i><span>{{ __('Videos') }}</span></div>
                                    <span class="link-icon media-chevron"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <div class="collapse" id="group-media-collapse-videos">
                                    <div class="pb-2">
                                        <div class="media-loading text-center py-2 d-none"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>
                                        <div class="media-empty text-muted small text-center py-2 d-none">{{ __('No videos found.') }}</div>
                                        <div class="row g-1 media-videos-grid"></div>
                                    </div>
                                </div>

                                {{-- Links --}}
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between group-media-row" data-media-target="group-media-collapse-links">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-link text-primary"></i><span>{{ __('Links') }}</span></div>
                                    <span class="link-icon media-chevron"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <div class="collapse" id="group-media-collapse-links">
                                    <div class="pb-2">
                                        <div class="media-loading text-center py-2 d-none"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>
                                        <div class="media-empty text-muted small text-center py-2 d-none">{{ __('No links found.') }}</div>
                                        <div class="list-group list-group-flush media-links-list"></div>
                                    </div>
                                </div>

                                {{-- Documents --}}
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between group-media-row" data-media-target="group-media-collapse-docs">
                                    <div class="d-flex align-items-center gap-2"><i class="ti ti-file-text text-primary"></i><span>{{ __('Documents') }}</span></div>
                                    <span class="link-icon media-chevron"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <div class="collapse" id="group-media-collapse-docs">
                                    <div class="pb-2">
                                        <div class="media-loading text-center py-2 d-none"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>
                                        <div class="media-empty text-muted small text-center py-2 d-none">{{ __('No documents found.') }}</div>
                                        <div class="list-group list-group-flush media-docs-list"></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {{-- Others (Favorites) --}}
                    <div class="content-wrapper other-info mb-3">
                        <h5 class="sub-title mb-2">{{ __('Others') }}</h5>
                        <div class="card contact-info-card border-0 mb-0">
                            <div class="card-body list-group profile-item p-0">

                                {{-- Favorites --}}
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between group-others-row" id="group-open-favourites">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-bookmark text-primary"></i>
                                        <span class="fw-medium">{{ __('Favorites') }}</span>
                                        <span class="badge bg-danger rounded-pill ms-1 d-none" id="group-favourites-badge">0</span>
                                    </div>
                                    <span class="link-icon group-fav-chevron"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <div class="collapse border-top border-light" id="group-collapse-favourites">
                                    <div class="py-2">
                                        <div class="others-loading text-center py-2 d-none"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>
                                        <div class="others-empty text-muted small text-center py-2 d-none">{{ __('No saved messages in this group.') }}</div>
                                        <div id="group-favourites-list"></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {{-- Encryption --}}
                    <div class="content-wrapper other-info mb-3">
                        <div class="card contact-info-card border-0 mb-0">
                            <div class="card-body list-group profile-item p-0">
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#group-encryption-info">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="ti ti-lock text-primary"></i>
                                        <span class="fw-medium">{{ __('Encryption') }}</span>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {{-- Group Settings: all options in Group Info (no second offcanvas) --}}
                    <div class="content-wrapper other-info mb-3" id="group-info-settings-section">
                        <h5 class="sub-title mb-2">{{ __('Group Settings') }}</h5>
                        <div class="card contact-info-card border-0 mb-0">
                            <div class="card-body list-group profile-item p-0">
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#edit-group">
                                    <div class="profile-info flex-grow-1 pe-2">
                                        <h6 class="fs-16 mb-1">{{ __('Edit Group Settings') }}</h6>
                                        <p class="text-muted small mb-0">{{ __('All Participants') }}</p>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>

                                <div class="accordion accordion-flush chat-accordion list-group-item border-0 px-0 py-2" id="send-settings-group-info">
                                    <div class="accordion-item w-100 border-0">
                                        <h2 class="accordion-header">
                                            <button type="button" class="accordion-button py-2 collapsed shadow-none bg-transparent" data-bs-toggle="collapse" data-bs-target="#send-privacy-group-info" aria-expanded="false" aria-controls="send-privacy-group-info">
                                                {{ __('Send Messages') }}
                                            </button>
                                        </h2>
                                        <p class="fs-14 text-muted mb-0 ps-3">{{ __('All Participants') }}</p>
                                        <div id="send-privacy-group-info" class="accordion-collapse collapse" data-bs-parent="#send-settings-group-info">
                                            <div class="accordion-body px-3 pt-2 pb-3">
                                                <div class="form-check mb-3">
                                                    <input class="form-check-input" type="radio" name="group_send_messages" id="group-send-all" checked>
                                                    <label class="form-check-label" for="group-send-all">{{ __('All Participants') }}</label>
                                                </div>
                                                <div class="form-check mb-3">
                                                    <input class="form-check-input" type="radio" name="group_send_messages" id="group-send-admins-only">
                                                    <label class="form-check-label" for="group-send-admins-only">{{ __('Only Admins') }}</label>
                                                </div>
                                                <button type="button" class="btn btn-primary w-100">{{ __('Save Changes') }}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#approve-participants">
                                    <div class="profile-info flex-grow-1 pe-2">
                                        <h6 class="fs-16 mb-1">{{ __('Approve New Participants') }}</h6>
                                        <p class="text-muted small mb-0">{{ __('Off') }}</p>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#edit-admin">
                                    <div class="profile-info flex-grow-1 pe-2">
                                        <h6 class="fs-16 mb-0">{{ __('Edit Group Admins') }}</h6>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>

                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#mute-notification">
                                    <div class="profile-info flex-grow-1 pe-2">
                                        <h6 class="fs-16 mb-1"><i class="ti ti-bell-off me-2 text-warning"></i>{{ __('Mute Notifications') }}</h6>
                                        <p class="text-muted small mb-0">{{ __('Mute alerts for this group') }}</p>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                                <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#msg-disapper">
                                    <div class="profile-info flex-grow-1 pe-2">
                                        <h6 class="fs-16 mb-1"><i class="ti ti-clock me-2 text-info"></i>{{ __('Disappearing Messages') }}</h6>
                                        <p class="text-muted small mb-0">{{ __('Timer for new messages in this group') }}</p>
                                    </div>
                                    <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {{-- Group Participants --}}
                    <div class="content-wrapper other-info mb-3">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <h5 class="sub-title mb-0" id="group-participants-heading">{{ __('Participants')}}</h5>
                            <div class="d-flex align-items-center gap-2">
                                <a href="javascript:void(0);" class="text-muted" id="group-participants-search-toggle"><i class="ti ti-search"></i></a>
                                <a href="javascript:void(0);" class="text-muted" data-bs-toggle="modal" data-bs-target="#group-add-new" title="{{ __('Add Members') }}"><i class="ti ti-user-plus"></i></a>
                            </div>
                        </div>
                        <div class="mb-2 d-none" id="group-participants-search-wrap">
                            <input type="text" class="form-control form-control-sm" id="group-participants-search" placeholder="{{ __('Search participants...') }}">
                        </div>
                        <div class="card contact-info-card border-0">
                            <div class="card-body p-0">
                                <div id="members-container">
                                </div>
                                <div class="text-center py-2 d-none" id="group-view-all-members">
                                    <a href="javascript:void(0);" class="small fw-medium text-primary" id="group-view-all-link">
                                        {{ __('View All') }} <span id="group-view-all-count"></span> &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {{-- Bottom actions: Exit Group & Report User --}}
                <div class="content-wrapper other-info mb-0 px-3 pb-3">
                    <div class="card contact-info-card border-0 mb-0">
                        <div class="card-body list-group profile-item p-0">
                            <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#group-logout">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="ti ti-logout-2 text-danger"></i>
                                    <span class="fw-medium">{{ __('Exit Group')}}</span>
                                </div>
                                <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                            </a>
                            <a href="javascript:void(0);" class="list-group-item list-group-item-action border-0 px-0 py-3 d-flex align-items-center justify-content-between" data-bs-toggle="modal" data-bs-target="#report-group">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="ti ti-flag text-danger"></i>
                                    <span class="fw-medium">{{ __('Report User')}}</span>
                                </div>
                                <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
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

<!-- Block Group -->
<div class="modal fade" id="block-user">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Block Group')}}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-info">
                            <i class="ti ti-ban text-info"></i>
                        </span>
                        <p class="text-grya-9">{{ __('Blocking this group will remove you from the group. You will no longer receive messages from this group.')}}</p>
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
<!-- /Block Group -->

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
                        <p class="text-grya-9 mb-3">If you block this contact and clear the chat, all messages, images, videos and documents will be permanently deleted from Connect.</p>
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

{{-- Group call UI is shared with 1:1 chat via frontend.partials.popups:
     active/incoming video (#video_group_new, #video-call-new-group)
     and active/incoming audio (#audio_group_new, #audio-call-new-group). --}}




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

    </div>
</div>

<!-- Group Sidebar Right-Click Context Menu -->
<div id="group-context-menu" class="dropdown-menu p-2 shadow" style="display:none;position:fixed;z-index:9999;">
    <a href="#" class="dropdown-item" data-ctx-action="archive"><i class="ti ti-archive me-2"></i>{{ __('Archive Group') }}</a>
    <a href="#" class="dropdown-item" data-ctx-action="mute"><i class="ti ti-bell-off me-2"></i>{{ __('Mute Notification') }}</a>
    <a href="#" class="dropdown-item" data-ctx-action="exit"><i class="ti ti-logout-2 me-2"></i>{{ __('Exit Group') }}</a>
    <a href="#" class="dropdown-item" data-ctx-action="pin"><i class="ti ti-pin me-2"></i>{{ __('Pin Group') }}</a>
    <a href="#" class="dropdown-item" data-ctx-action="unread"><i class="ti ti-mail me-2"></i>{{ __('Mark as Unread') }}</a>
</div>

<!-- /Content -->

<div id="spa-page-modals">
{{-- Modals must live here (not inside #spa-page-content): nested stacking + docked Group Info offcanvas caused double black backdrops. --}}

<!-- Approve New Participants -->
<div class="modal fade" id="approve-participants" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Approve New Participants') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false">
                    <div class="block-wrap mb-3">
                        <p class="text-gray-9">
                            {{ __('When turned on, admins must approve anyone who wants to join this group.') }}
                        </p>
                    </div>
                    <div class="mb-3">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_approve_join" id="approve1" checked>
                            <label class="form-check-label" for="approve1">Off</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_approve_join" id="approve2">
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

<!-- Edit Group Settings (who can edit subject / icon / description) -->
<div class="modal fade" id="edit-group" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Edit Group Settings') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false">
                    <div class="block-wrap mb-3">
                        <p class="text-gray-9">
                            {{ __('Choose who can change this group\'s subject, icon, and description. They can also edit the disappearing message timer and keep or unkeep messages.') }}
                        </p>
                    </div>
                    <div class="mb-3">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_edit_who" id="edit1" checked>
                            <label class="form-check-label" for="edit1">All Participants</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_edit_who" id="edit2">
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

<!-- Edit Group Admins -->
<div class="modal fade" id="edit-admin" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Edit Group Admins') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="edit-admin-form" action="{{ route('group-chat')}}" onsubmit="return false">
                    <div class="search-wrap contact-search mb-3">
                        <div class="input-group">
                            <input type="text" id="edit-admin-search" class="form-control" placeholder="{{ __('Search')}}" autocomplete="off">
                            <a href="javascript:void(0);" class="input-group-text"><i class="ti ti-search"></i></a>
                        </div>
                    </div>
                    <h6 class="mb-3 fw-medium fs-16">{{ __('Members') }}</h6>
                    <div id="edit-admin-members-list" class="contact-scroll contact-select mb-3"></div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="submit" class="btn btn-primary w-100" id="edit-admin-save-btn">{{ __('Save') }}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Exit Group -->
<div class="modal fade" id="group-logout" data-bs-backdrop="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Exit Group') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-logout-2 text-danger"></i>
                        </span>
                        <div class="d-flex justify-content-center align-items-center">
                            <i class="ti ti-info-square-rounded me-1 fs-16"></i>
                            <p class="text-gray-9">
                                {{ __('Only group admins will be notified that you left the group.') }}
                            </p>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100" id="confirm-exit">{{ __('Exit Group') }}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Report Group -->
<div class="modal fade" id="report-group" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Report Group') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form onsubmit="return false">
                    <div class="block-wrap text-center mb-3">
                        <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                            <i class="ti ti-thumb-down text-danger"></i>
                        </span>
                        <div class="d-flex justify-content-center align-items-center mb-3">
                            <p class="text-gray-9">
                                {{ __('If you block this group and clear the chat, all messages, images, videos and documents will be permanently deleted.') }}
                            </p>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="contact">
                            </div>
                            <p class="text-gray-9">{{ __('Block Group and Clear Chat') }}</p>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
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

<div class="modal fade" id="clear-group-chat" data-bs-backdrop="false" tabindex="-1" aria-hidden="true">
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
                        <p class="text-grya-9">{{ __('This will permanently delete all messages from this chat.')}}</p>
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

<!-- Delete Group (header menu) -->
<div class="modal fade" id="delete-group" data-bs-backdrop="false" tabindex="-1" aria-hidden="true">
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
                        <p class="text-grya-9">{{ __('This will permanently delete all messages, images, videos and documents in this chat.')}}</p>
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

<!-- Mute (group) -->
<div class="modal fade" id="mute-notification" data-bs-backdrop="true">
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
                <form id="group-mute-notification-form" onsubmit="return false">
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
                            <button type="button" class="btn btn-primary w-100" id="group-mute-save-btn">{{ __('Mute')}}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Group encryption info -->
<div class="modal fade" id="group-encryption-info" tabindex="-1" aria-hidden="true" data-bs-backdrop="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Encryption') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x"></i></button>
            </div>
            <div class="modal-body">
                <p class="text-muted mb-0">{{ __('Group text messages are encrypted before they are stored. Media and metadata may still be visible to your server or storage provider depending on your setup.') }}</p>
            </div>
            <div class="modal-footer border-0 pt-0">
                <button type="button" class="btn btn-primary w-100" data-bs-dismiss="modal">{{ __('OK') }}</button>
            </div>
        </div>
    </div>
</div>

<!-- Disappearing Messages (group) -->
<div class="modal fade" id="msg-disapper" data-bs-backdrop="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Disappearing Messages</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="group-msg-disappear-form" onsubmit="return false">
                    <div class="block-wrap mb-3">
                        <p class="text-gray-9">
                            For more privacy and storage, all new messages will disappear from this chat for everyone after the selected duration, except when kept. Anyone in the chat can change this setting.
                        </p>
                    </div>
                    <div class="mb-3">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_disappear" id="disappear1" value="86400000">
                            <label class="form-check-label" for="disappear1">24 Hours</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_disappear" id="disappear2" value="604800000">
                            <label class="form-check-label" for="disappear2">7 Days</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_disappear" id="disappear3" value="7776000000">
                            <label class="form-check-label" for="disappear3">90 Days</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="radio" name="group_disappear" id="disappear4" value="0" checked>
                            <label class="form-check-label" for="disappear4">Off</label>
                        </div>
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-primary w-100" id="group-disappear-save-btn">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

{{-- New / Add Group modals --}}
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
                        <div class="col-lg-12">
                            <label class="form-label">{{ __('Group Type')}}</label>
                            <div class="d-flex align-items-center gap-4 mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="group-type" id="group-type-public" value="public" checked>
                                    <label class="form-check-label" for="group-type-public">{{ __('Public')}}</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="group-type" id="group-type-private" value="private">
                                    <label class="form-check-label" for="group-type-private">{{ __('Private')}}</label>
                                </div>
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

<!-- Add Members to Existing Group Modal -->
<div class="modal fade" id="group-add-new">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Add Members') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="contact-scroll contact-select mb-3" id="contact-list-container"></div>
                <div class="row g-3">
                    <div class="col-6">
                        <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal">{{ __('Cancel') }}</a>
                    </div>
                    <div class="col-6">
                        <button type="button" class="btn btn-primary w-100" id="select-add-group">{{ __('Add') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Add Members to Existing Group Modal -->

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
<!-- Message Info Modal -->
<div class="modal fade" id="group-message-info" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Message Info') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x"></i></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <div class="card border-0 bg-light p-3">
                        <div id="msg-info-content" class="mb-2"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="ti ti-user text-primary"></i>
                            <span class="fw-medium">{{ __('Sender') }}</span>
                        </div>
                        <p id="msg-info-sender" class="text-muted mb-0">—</p>
                    </div>
                    <div class="col-6">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="ti ti-clock text-primary"></i>
                            <span class="fw-medium">{{ __('Sent At') }}</span>
                        </div>
                        <p id="msg-info-time" class="text-muted mb-0">—</p>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-6">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="ti ti-checks text-success"></i>
                            <span class="fw-medium">{{ __('Status') }}</span>
                        </div>
                        <p id="msg-info-status" class="text-muted mb-0">—</p>
                    </div>
                    <div class="col-6">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="ti ti-file-text text-primary"></i>
                            <span class="fw-medium">{{ __('Type') }}</span>
                        </div>
                        <p id="msg-info-type" class="text-muted mb-0">—</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0 pt-0">
                <button type="button" class="btn btn-primary w-100" data-bs-dismiss="modal">{{ __('Close') }}</button>
            </div>
        </div>
    </div>
</div>

<!-- Edit Message Modal -->
<div class="modal fade" id="group-edit-message" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Edit Message') }}</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"><i class="ti ti-x"></i></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="edit-msg-key" value="">
                <input type="hidden" id="edit-msg-group-id" value="">
                <div class="mb-3">
                    <label class="form-label">{{ __('Message') }}</label>
                    <textarea id="edit-msg-text" class="form-control" rows="3"></textarea>
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal">{{ __('Cancel') }}</a>
                    </div>
                    <div class="col-6">
                        <button type="button" class="btn btn-primary w-100" id="save-edit-msg-btn">{{ __('Save') }}</button>
                    </div>
                </div>
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
