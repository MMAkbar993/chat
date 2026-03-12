            <!-- Left Sidebar Menu -->
            <div class="sidebar-menu">
                <div class="logo">
                    <a href="{{ route('chat') }}" class="logo-normal"><img id="logo" src="{{ asset('assets/img/Icon.png') }}" alt="Logo"></a>
                </div>
                <div class="menu-wrap">
                    <div class="main-menu">
                        <ul class="nav">
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Chats"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('chat') }}"
                                    class="{{ request()->routeIs('chat', 'index') ? 'active' : '' }}">
                                    <i class="ti ti-message-2-heart"></i>
                                </a>
                            </li>
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Contacts"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('contact') }}"
                                    class="{{ request()->routeIs('contact') ? 'active' : '' }}">
                                    <i class="ti ti-user-shield"></i>
                                </a>
                            </li>
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Groups"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('group-chat') }}"
                                    class="{{ request()->routeIs('groups', 'group-chat') ? 'active' : '' }}">
                                    <i class="ti ti-users-group"></i>
                                </a>
                            </li>
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Calls"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('calls') }}"
                                    class="{{ request()->routeIs('calls', 'all-calls') ? 'active' : '' }}">
                                    <i class="ti ti-phone-call"></i>
                                </a>
                            </li>
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Profile"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('profile') }}"
                                    class="{{ request()->routeIs('profile') ? 'active' : '' }}">
                                    <i class="ti ti-user-circle"></i>
                                </a>
                            </li>
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Settings"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('settings') }}"
                                    class="{{ request()->routeIs('settings') ? 'active' : '' }}">
                                    <i class="ti ti-settings"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="profile-menu">
                        <ul>
                            <li>
                                <a href="#" id="dark-mode-toggle" class="dark-mode-toggle active">
                                    <i class="ti ti-moon"></i>
                                </a>
                                <a href="#" id="light-mode-toggle" class="dark-mode-toggle">
                                    <i class="ti ti-sun"></i>
                                </a>
                            </li>
                            <li>
                                <div class="dropdown">
                                    <a href="#" class="avatar avatar-md" data-bs-toggle="dropdown">
                                        <img id="ProfileImageSidebar" src="assets/img/profiles/avatar-03.jpg"
                                            alt="img" class="rounded-circle">
                                    </a>
                                    <div class="dropdown-menu dropdown-menu-end p-3">
                                        <a href="javascript:void(0)" class="dropdown-item" id="logout-button">{{ __('Logout') }}
                                            <i class="ti ti-logout-2 me-2"></i>
                                        </a>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- /Left Sidebar Menu -->

            <!-- sidebar group -->
            <div class="sidebar-group">

                <div class="tab-content">
                    <div class="tab-pane fade  {{ request()->routeIs('chat', 'index') ? 'active show' : '' }}"
                        id="chat-menu">

                        <!-- Chats sidebar -->
                        <div id="chats" class="sidebar-content active slimscroll">

                            <div class="slimscroll">

                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">Chats</h4>
                                        <div class="d-flex align-items-center mb-3">
                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                data-bs-target="#new-chat"
                                                class="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16 me-2" id="newChatButton"><i
                                                    class="ti ti-plus"></i></a>
                                            <div class="dropdown">
                                                <a href="javascript:void(0);" data-bs-toggle="dropdown"
                                                    class="fs-16 text-default">
                                                    <i class="ti ti-dots-vertical"></i>
                                                </a>
                                                <ul class="dropdown-menu p-3">
                                                    <li><a class="dropdown-item" href="javascript:void(0);"
                                                            data-bs-toggle="modal" data-bs-target="#invite-contact"><i
                                                                class="ti ti-send me-2"></i>{{ __('Invite Others') }}</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Chat Search -->
                                    <div class="search-wrap">
                                        <form onsubmit="return false;">
                                            <div class="input-group">
                                                <input type="text" id="chatSearchInput" class="form-control"
                                                    placeholder="{{ __('Search')}}">
                                                <span class="input-group-text"><i class="ti ti-search"></i></span>
                                            </div>
                                        </form>
                                    </div>
                                    <!-- /Chat Search -->
                                </div>

                                <!-- Online Contacts -->
                                <div class="top-online-contacts">
                                    <div class="d-flex align-items-center justify-content-between">
                                        <h5 class="mb-3">{{ __('Recent Chats') }}</h5>
                                        <div class="dropdown mb-3">
                                            <a href="#" class="text-default" data-bs-toggle="dropdown"
                                                aria-expanded="false"><i class="ti ti-dots-vertical"></i></a>
                                            <ul class="dropdown-menu dropdown-menu-end p-3">
                                                <li>
                                                    <a class="dropdown-item mb-1" href="#" id="toggleRecentChats">
                                                        <span id="toggleText">{{ __('Hide Recent') }}</span>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div id="recentChatsContainer" class="swiper-container overflow-hidden">
                                        <div class="swiper-wrapper">

                                        </div>
                                    </div>
                                </div>
                                <!-- /Online Contacts -->

                                <div class="sidebar-body chat-body" id="chatsidebar">

                                    <!-- Left Chat Title -->
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h5 class="chat-title" id="chatTitle">{{ __('All Chats') }}</h5>
                                        <div class="dropdowns">
                                            <a href="#" class="text-default fs-16 dropdown-toggle" data-bs-toggle="dropdown"
                                                aria-expanded="false"><i class="ti ti-filter"></i></a>
                                            <ul class=" dropdown-menu  p-3" id="innerTab"
                                                role="tablist">
                                                <li role="presentation">
                                                    <a class="dropdown-item active" id="all-chats-tab"
                                                        data-bs-toggle="tab" data-bs-target="#all-chats" data-title="All Chats">{{ __('All Chats') }}</a>
                                                </li>
                                                <li role="presentation">
                                                    <a class="dropdown-item" id="pinned-chats-tab"
                                                        data-bs-toggle="tab" data-bs-target="#pinned-chats" data-title="Pinned Chats">{{ __('Pinned Chats') }}</a>
                                                </li>
                                                <li role="presentation">
                                                    <a class="dropdown-item" id="archive-chats-tab"
                                                        data-bs-toggle="tab" data-bs-target="#archive-chats" data-title="Archived Chats">{{ __('Archive Chats') }}</a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <!-- /Left Chat Title -->
                                    <div class="tab-content" id="innerTabContent">
                                        <div class="tab-pane fade show active" id="all-chats" role="tabpanel"
                                            aria-labelledby="all-chats-tab">
                                            <div class="chat-users-wrap" id="chat-users-wrap">
                                                <div class="chat-list">
                                                    <a href="{{ route('chat') }}" class="chat-user-list">

                                                    </a>
                                                    <div class="chat-dropdown">
                                                        <a class="#" href="#" data-bs-toggle="dropdown">
                                                            <i class="ti ti-dots-vertical"></i>
                                                        </a>
                                                        <ul class="dropdown-menu dropdown-menu-end p-3">
                                                            <li><a class="dropdown-item" href="#"><i
                                                                        class="ti ti-box-align-right me-2"></i>{{ __('Archive Chat') }}</a></li>
                                                            <li><a class="dropdown-item" href="#"><i
                                                                        class="ti ti-heart me-2"></i>{{ __('Mark as Favourite') }}</a></li>
                                                            <li><a class="dropdown-item" href="#"><i
                                                                        class="ti ti-check me-2"></i>{{ __('Mark as Unread') }}</a>
                                                            </li>
                                                            <li><a class="dropdown-item" href="#"><i
                                                                        class="ti ti-pinned me-2"></i>{{ __('Pin Chats') }}</a>
                                                            </li>
                                                            <li><a class="dropdown-item" href="#"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#delete-chat"><i
                                                                        class="ti ti-trash me-2"></i>{{ __('Delete') }}</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="favourites-chats" role="tabpanel"
                                            aria-labelledby="favourites-chat-tab">
                                        </div>
                                        <div class="tab-pane fade" id="pinned-chats" role="tabpanel"
                                            aria-labelledby="pinned-chats-tab">
                                        </div>
                                        <div class="tab-pane fade" id="archive-chats" role="tabpanel"
                                            aria-labelledby="archive-chats-tab">
                                        </div>
                                    </div>


                                </div>

                            </div>

                        </div>
                        <!-- / Chats sidebar -->

                    </div>

                    <!-- Contact -->
                    <div class="tab-pane fade {{ request()->routeIs('contact') ? 'active show' : '' }}"
                        id="contact-menu">
                        <!-- Chats sidebar -->
                        <div class="sidebar-content active slimscroll">

                            <div class="slimscroll">

                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">{{ __('Contacts') }}</h4>
                                        <div class="d-flex align-items-center mb-3">
                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                data-bs-target="#add-contact"
                                                class="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16 me-2"><i
                                                    class="ti ti-plus"></i></a>
                                        </div>
                                    </div>

                                    <!-- Chat Search -->
                                    <div class="search-wrap">
                                        <form onsubmit="return false;">
                                            <div class="input-group">
                                                <input type="text" id="contactSearchInput" class="form-control"
                                                    placeholder="{{ __('Search Contacts')}}">
                                                <span class="input-group-text"><i class="ti ti-search"></i></span>
                                            </div>
                                        </form>
                                    </div>
                                    <!-- /Chat Search -->
                                </div>

                                <div class="sidebar-body chat-body">

                                    <!-- Left Chat Title -->
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h5>{{ __('All Contacts') }}</h5>
                                    </div>
                                    <!-- /Left Chat Title -->
                                    <div class="chat-users-wrap" id="chatContainer"></div>
                                    <div id="noMatchesMessage" style="display: none;">{{ __('No matches found.') }}</div>
                                </div>

                            </div>

                        </div>
                        <!-- / Chats sidebar -->
                    </div>
                    <!-- /Contact -->

                    <!-- Group -->
                    <div class="tab-pane fade {{ request()->routeIs('groups', 'group-chat') ? 'active show' : '' }}"
                        id="group-menu">

                        <!-- Chats sidebar -->
                        <div class="sidebar-content active slimscroll">

                            <div class="slimscroll">

                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">{{ __('Group') }}</h4>
                                        <div class="d-flex align-items-center mb-3">
                                            <a href="{{ route('group-chat') }}" id="group-add-btn" class="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16 me-2" title="{{ __('New Group') }}"><i
                                                    class="ti ti-plus"></i></a>
                                        </div>
                                    </div>

                                    <!-- Chat Search -->
                                    <div class="search-wrap">
                                        <form onsubmit="return false;">
                                            <div class="input-group">
                                                <input type="text" id="groupSearchInput" class="form-control"
                                                    placeholder="{{ __('Search')}}">
                                                <span class="input-group-text"><i class="ti ti-search"></i></span>
                                            </div>
                                        </form>
                                    </div>
                                    <!-- /Chat Search -->
                                </div>

                                <div class="sidebar-body chat-body">

                                    <!-- Left Chat Title -->
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h5>{{ __('All Groups') }}</h5>
                                    </div>
                                    <!-- /Left Chat Title -->

                                    <div class="chat-users-wrap" id="group-list">

                                    </div>
                                    <div id="noGroupMatchesMessage" style="display: none;">{{ __('No matches found.') }}</div>
                                </div>

                            </div>

                        </div>
                        <!-- / Chats sidebar -->

                    </div>
                    <!-- /Group -->

                    <!-- Profile -->
                    <div class="tab-pane fade {{ request()->routeIs('profile') ? 'active show' : '' }}"
                        id="profile-menu">
                        <!-- Profile sidebar -->
                        <div class="sidebar-content active slimscroll">
                            <div class="slimscroll">
                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">{{ __('Profile') }}</h4>
                                    </div>
                                </div>

                                <!-- Profile -->
                                <div class="profile mx-3">
                                    <div class="border-bottom text-center pb-3 mx-1">
                                        <div class="d-flex justify-content-center ">
                                            <span class="avatar avatar-xxxl online mb-4">
                                                <img id="profileImageProfile" src="assets/img/profiles/avatar-03.jpg"
                                                    class="rounded-circle" alt="user">
                                            </span>
                                        </div>
                                        <div>
                                            <h6 class="fs-16" id="profile-name">{{ __('Loading...') }}</h6>
                                            <div class="d-flex justify-content-center">
                                                <span class="fs-14 text-center"
                                                    id="profile-info-about">{{ __('Loading...') }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- /Profile -->

                                <div class="sidebar-body chat-body">

                                    <!-- Profile Info -->
                                    <h5 class="mb-2">{{ __('Profile Info') }}</h5>
                                    <div class="card">
                                        <form method="POST">
                                            @csrf
                                            <div id="user-id" style="display: none;"></div>
                                            <div class="card-body">
                                                <div
                                                    class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Name') }}</h6>
                                                        <p class="fs-16 " id="profile-info-name">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-user-circle fs-16"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Role') }}</h6>
                                                        <p class="fs-16" id="profile-info-role">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-briefcase fs-16"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Phone') }}</h6>
                                                        <p class="fs-16" id="profile-info-phone">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-phone-check fs-16"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex profile-list  profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Gender') }}</h6>
                                                        <p class="fs-16" id="profile-info-gender">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-user-star fs-16"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex profile-list profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Bio') }}</h6>
                                                        <p class="fs-16" id="profile-info-bio">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-user-check fs-16"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Location') }}</h6>
                                                        <p class="fs-16" id="profile-info-country">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-map-2 fs-16"></i></span>
                                                </div>
                                                <div
                                                    class="d-flex profile-list justify-content-between align-items-center">
                                                    <div>
                                                        <h6 class="fs-14">{{ __('Join Date') }}</h6>
                                                        <p class="fs-16" id="profile-info-join-date">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span><i class="ti ti-calendar-event fs-16"></i></span>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <!-- /Profile Info -->

                                    <!-- Social Media -->
                                    <h5 class="mb-2">{{ __('Social Media') }}</h5>
                                    @php
                                        $hasVerifiedSocial = Auth::check() && Auth::user()->socialAccounts()->where('oauth_verified', true)->exists();
                                    @endphp
                                    @if($hasVerifiedSocial)
                                        <p class="text-muted small mb-2">{{ __('Verified links are shown with a badge. Other links are displayed as provided.') }}</p>
                                    @else
                                        <p class="text-muted small mb-2">{{ __('Social links are displayed as provided and are not verified.') }}</p>
                                    @endif
                                    <div class="card">
                                        <div class="card-body">
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Facebook') }}</h6>
                                                    <p class="fs-16" id="profile-info-facebook">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-facebook fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Twitter') }}</h6>
                                                    <p class="fs-16 " id="profile-info-twitter">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-twitter fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Linkedin') }} <i class="linkedin-info-icon" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ __('LinkedIn does not allow OAuth to verify profile') }}">i</i></h6>
                                                    <p class="fs-16" id="profile-info-linkedin">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-linkedin fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Instagram') }}</h6>
                                                    <p class="fs-16" id="profile-info-instagram">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-instagram fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Youtube') }}</h6>
                                                    <p class="fs-16" id="profile-info-youtube">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-youtube fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Kick') }}</h6>
                                                    <p class="fs-16" id="profile-info-kick">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-kick fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Twitch') }}</h6>
                                                    <p class="fs-16" id="profile-info-twitch">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-twitch fs-16"></i></span>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Social Media -->

                                    <!-- Authorized Users (Company Admin) -->
                                    <h5 class="mb-2">{{ __('Authorized Users') }}</h5>
                                    <div class="card" id="authorized-users-card">
                                        <div class="card-body">
                                            <p class="text-muted fs-14" id="authorized-users-placeholder">{{ __('Manage representation requests for your verified websites.') }}</p>
                                            <div id="authorized-users-content" style="display: none;">
                                                <div id="pending-requests-list"></div>
                                                <div id="authorized-representatives-list" class="mt-3"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Authorized Users -->

                                    <!-- Deactivate -->
                                    <h5 class="mb-2">{{ __('Deactivate') }} </h5>
                                    <div class="card" id="deactivate-account-demo">
                                        <div class="card-body">
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Deactivate Account') }}</h6>
                                                    <p class="fs-16 ">{{ __('Deactivate your Account') }}</p>
                                                </div>
                                                <div
                                                    class="form-check form-switch d-flex justify-content-end align-items-center">
                                                    <input class="form-check-input" type="checkbox" role="switch"
                                                        id="deactivate-account">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Deactivate -->

                                    <!-- Logout -->
                                    <h5 class="mb-2">{{ __('Logout') }}</h5>
                                    <div class="card mb-3">
                                        <div class="card-body">
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Logout') }}</h6>
                                                    <p class="fs-16 ">{{ __('Sign out from this Device') }}</p>
                                                </div>
                                                <a href="javascript:void(0)" class="link-icon"
                                                    id="profile-logout-button">
                                                    <i class="ti ti-logout fs-16"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Logout -->

                                </div>

                            </div>

                        </div>
                        <!-- / Profile sidebar -->
                    </div>
                    <!-- /Profile -->

                    <!-- Calls -->
                    <div class="tab-pane fade {{ request()->routeIs('calls', 'all-calls') ? 'active show' : '' }}"
                        id="call-menu">
                        <div class="sidebar-content active slimscroll">

                            <div class="slimscroll">

                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">{{ __('Calls') }}</h4>
                                    </div>

                                    <!-- Chat Search -->
                                    <div class="search-wrap">
                                        <form onsubmit="return false;">
                                            <div class="input-group">
                                                <input type="text" id="searchCallInput" class="form-control"
                                                    placeholder="{{ __('Search')}}">
                                                <span class="input-group-text"><i class="ti ti-search"></i></span>
                                            </div>
                                        </form>
                                    </div>
                                    <!-- /Chat Search -->
                                </div>

                                <div class="sidebar-body chat-body" id="chatsidebar">

                                    <!-- Left Chat Title -->
                                    <div class="d-flex  align-items-center mb-3">
                                        <h5 class="chat-title2 me-2">{{ __('All Calls') }}</h5>
                                        <div class="dropdowns">
                                            <a href="#" class="text-default fs-16" data-bs-toggle="dropdown"
                                                aria-expanded="false"><i class="ti ti-chevron-down"></i></a>
                                            <ul class=" dropdown-menu dropdown-menu-end p-3" id="innerTab"
                                                role="tablist">
                                                <li role="presentation">
                                                    <a class="dropdown-item active" id="all-calls-tab"
                                                        data-bs-toggle="tab" href="#all-calls" role="tab"
                                                        aria-controls="all-calls" aria-selected="true"
                                                        onclick="changeChat2('All Calls')">{{ __('All Calls') }}</a>
                                                </li>
                                                <li role="presentation">
                                                    <a class="dropdown-item" id="audio-calls-tab"
                                                        data-bs-toggle="tab" href="#audio-calls" role="tab"
                                                        aria-controls="audio-calls" aria-selected="false"
                                                        onclick="changeChat2('Audio Calls')">{{ __('Audio Calls') }}</a>
                                                </li>
                                                <li role="presentation">
                                                    <a class="dropdown-item" id="video-calls-tab"
                                                        data-bs-toggle="tab" href="#video-calls" role="tab"
                                                        aria-controls="video-calls" aria-selected="false"
                                                        onclick="changeChat2('Video Calls')">{{ __('Video Calls') }}</a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <!-- /Left Chat Title -->
                                    <div class="tab-content" id="innerTabContent">
                                        <div class="tab-pane fade show active" id="all-calls" role="tabpanel"
                                            aria-labelledby="all-calls-tab">
                                        </div>
                                        <div class="tab-pane fade" id="audio-calls" role="tabpanel"
                                            aria-labelledby="audio-calls-tab">
                                        </div>
                                        <div class="tab-pane fade" id="video-calls" role="tabpanel"
                                            aria-labelledby="video-calls-tab">
                                        </div>
                                        <div id="noCallMatchesModalMessage" style="display: none;">{{ __('No matches found.') }}
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                    <!-- /Calls -->

                    <!-- Settings -->
                    <div class="tab-pane fade {{ request()->routeIs('settings') ? 'active show' : '' }}"
                        id="setting-menu">
                        <!-- Profile sidebar -->
                        <div class="sidebar-content active slimscroll">
                            <div class="slimscroll">
                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">{{ __('Settings') }}</h4>
                                    </div>
                                </div>

                                <div class="sidebar-body chat-body">

                                    <!-- Account setting -->
                                    <div class="content-wrapper">
                                        <h5 class="sub-title">{{ __('Account') }}</h5>
                                        <div class="chat-file">
                                            <div class="file-item">
                                                <div class="accordion accordion-flush chat-accordion"
                                                    id="account-setting">
                                                    <div class="accordion-item others">
                                                        <h2 class="accordion-header">
                                                            <a href="#" class="accordion-button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target="#chatuser-collapse"
                                                                aria-expanded="true"
                                                                aria-controls="chatuser-collapse">
                                                                <i class="ti ti-user me-2"></i>{{ __('Profile Info') }}
                                                            </a>
                                                        </h2>
                                                        <div id="chatuser-collapse"
                                                            class="accordion-collapse collapse show"
                                                            data-bs-parent="#account-setting">

                                                            <div class="accordion-body">
                                                                <div>
                                                                    <div
                                                                        class="d-flex justify-content-center align-items-center">
                                                                        <span
                                                                            class="set-pro avatar avatar-xxl rounded-circle mb-3 p-1">
                                                                            <img id="profileImage"
                                                                                src="assets/img/profiles/avatar-03.jpg"
                                                                                class="rounded-circle" alt="user">
                                                                            <span
                                                                                class="add avatar avatar-sm d-flex justify-content-center align-items-center"
                                                                                id="uploadIcon">
                                                                                <i
                                                                                    class="ti ti-plus rounded-circle d-flex justify-content-center align-items-center"></i>
                                                                            </span>
                                                                        </span>
                                                                        <!-- Hidden file input for image upload -->
                                                                        <input type="file" id="imageUpload"
                                                                            style="display: none;" accept="image/*">
                                                                    </div>

                                                                    <div class="row">
                                                                        <div class="col-lg-12" style="display: none;">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="UID" id="uid">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-user"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('First Name')}}"
                                                                                    id="firstName"
                                                                                    @if(Auth::check() && Auth::user()->isKycVerified()) readonly title="{{ __('Name cannot be changed after KYC verification') }}" @endif>
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-user"></i>
                                                                                </span>
                                                                                @if(Auth::check() && Auth::user()->isKycVerified())
                                                                                <small class="text-muted"><i class="ti ti-lock me-1"></i>{{ __('Locked (KYC Verified)') }}</small>
                                                                                @endif
                                                                                <div id="firstName_error" class="error-message text-danger"></div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Last Name')}}"
                                                                                    id="lastName"
                                                                                    @if(Auth::check() && Auth::user()->isKycVerified()) readonly title="{{ __('Name cannot be changed after KYC verification') }}" @endif>
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-user"></i>
                                                                                </span>
                                                                                @if(Auth::check() && Auth::user()->isKycVerified())
                                                                                <small class="text-muted"><i class="ti ti-lock me-1"></i>{{ __('Locked (KYC Verified)') }}</small>
                                                                                @endif
                                                                                <span id="lastName_error" class="error-message text-danger"></span>
                                                                            </div>
                                                                        </div>
                                                                        @if(Auth::check() && Auth::user()->isKycVerified())
                                                                        <div class="col-lg-12">
                                                                            <label class="form-label">{{ __('Display name on profile') }}</label>
                                                                            <div class="input-icon mb-1 position-relative">
                                                                                <select class="form-control" id="profile_display_name" name="profile_display_name">
                                                                                    <option value="full_name">{{ __('Full name') }}</option>
                                                                                    <option value="username">{{ __('Username') }}</option>
                                                                                </select>
                                                                                <span class="icon-addon"><i class="ti ti-user-circle"></i></span>
                                                                                <small class="text-muted">{{ __('Verified users can show username instead of full name for privacy.') }}</small>
                                                                            </div>
                                                                        </div>
                                                                        @endif
                                                                        <div class="col-lg-12">
                                                                            <div class="input-icon mb-1 position-relative">
                                                                                <select class="form-control" id="gender">
                                                                                    <option value="" disabled selected>{{ __('Select Gender') }}</option>
                                                                                    <option value="Male">{{ __('Male') }}</option>
                                                                                    <option value="Female">{{ __('Female') }}</option>
                                                                                    <option value="Not Prefer">{{ __('Others') }}</option>
                                                                                </select>
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-user-star"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                <input type="tel" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Mobile Number')}}"
                                                                                    id="mobile_number" maxlength="21" minlength="10">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-phone-check"></i>
                                                                                </span>
                                                                                <span id="mobile_number_error" class="error-message text-danger"></span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                @php
                                                                                    $emailLocked = false;
                                                                                @endphp
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Email')}}"
                                                                                    id="email">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-mail-heart"></i>
                                                                                </span>
                                                                                <span id="email_error" class="error-message text-danger"></span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('User Name')}}"
                                                                                    id="user_name">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-user-star"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div class="input-icon mb-1 position-relative">
                                                                                <input type="text" id="dob" class="form-control datetimepicker" placeholder="{{ __('Date of birth')}}">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-calendar-event"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-1 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Country')}}"
                                                                                    id="country">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-map-2"></i>
                                                                                </span>
                                                                                <span id="country_error" class="error-message text-danger"></span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="form-item d-flex justify-content-between mb-3">
                                                                                <textarea class="form-control" placeholder="{{ __('About')}}" rows="3" id="about"></textarea>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div class="input-icon mb-1 position-relative">
                                                                                <select class="form-control" id="primary_role">
                                                                                    <option value="" disabled selected>{{ __('Select Role') }}</option>
                                                                                    @foreach(config('registration.primary_roles', []) as $key => $label)
                                                                                    <option value="{{ $key }}">{{ __($label) }}</option>
                                                                                    @endforeach
                                                                                </select>
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-briefcase"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12" id="other_role_wrapper" style="display:none;">
                                                                            <div class="input-icon mb-1 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Specify your role')}}"
                                                                                    id="other_role_text">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-pencil"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12 d-flex">
                                                                            <a href=""
                                                                                class="btn btn-primary flex-fill"
                                                                                id="saveProfileBtn"><i
                                                                                    class="ti ti-device-floppy me-2"></i>{{ __('Save Changes') }}</a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="accordion-item others mb-3">
                                                        <h2 class="accordion-header">
                                                            <a href="#" class="accordion-button collapsed"
                                                                data-bs-toggle="collapse" data-bs-target="#website-verification-id"
                                                                aria-expanded="false" aria-controls="website-verification-id">
                                                                <i class="ti ti-world me-2"></i>{{ __('Website Verification') }}
                                                            </a>
                                                        </h2>
                                                        <div id="website-verification-id" class="accordion-collapse collapse"
                                                            data-bs-parent="#account-setting">
                                                            <div class="accordion-body">
                                                                <p class="text-muted small mb-3"><i class="ti ti-info-circle me-1"></i>{{ __('Add your website URL below. Then add the meta tag to your site’s <head> section and click Verify.') }}</p>
                                                                @if(session('website_already_approved') && session('website_already_approved_id'))
                                                                    <div class="alert alert-info alert-dismissible fade show mb-3" role="alert" id="website-already-approved-alert">
                                                                        <p class="mb-2">{{ __('This website has already been approved. Please request representation from the owner. Your name and email address will be shared.') }}</p>
                                                                        <p class="mb-2 small">{{ session('website_already_approved_domain') }}</p>
                                                                        <button type="button" class="btn btn-sm btn-primary website-request-representation-btn" data-website-id="{{ session('website_already_approved_id') }}">{{ __('Request') }}</button>
                                                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                                                    </div>
                                                                @endif
                                                                <form method="post" action="{{ route('settings.websites.add') }}" class="mb-3" id="add-website-form">
                                                                    @csrf
                                                                    <div class="input-group">
                                                                        <input type="url" name="url" class="form-control" placeholder="https://example.com" value="{{ old('url') }}" required>
                                                                        <button type="submit" class="btn btn-primary">{{ __('Add Website') }}</button>
                                                                    </div>
                                                                </form>
                                                                @php $userWebsites = Auth::check() ? Auth::user()->websites : collect(); @endphp
                                                                @if($userWebsites->count() > 0)
                                                                    <div class="list-group list-group-flush" id="website-list-group">
                                                                        @foreach($userWebsites as $w)
                                                                            <div class="border rounded mb-2 p-3 website-row" data-website-id="{{ $w->id }}">
                                                                                @if($w->isVerified())
                                                                                    <div class="d-flex align-items-center justify-content-between">
                                                                                        <a href="{{ $w->getDisplayUrl() }}" target="_blank" rel="noopener" class="text-primary website-display-url">{{ $w->getDisplayUrl() }}</a>
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger website-delete-btn" data-website-id="{{ $w->id }}" title="{{ __('Remove website') }}" aria-label="{{ __('Remove website') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    </div>
                                                                                @else
                                                                                    <div class="mb-2">
                                                                                        <a href="{{ $w->getDisplayUrl() }}" target="_blank" rel="noopener" class="text-primary website-display-url">{{ $w->getDisplayUrl() }}</a>
                                                                                    </div>
                                                                                    <small class="d-block text-muted mb-1">{{ __('Add this to your site\'s <head>:') }}</small>
                                                                                    <code class="d-block small bg-light p-2 rounded mb-2" style="word-break: break-all;">&lt;meta name="greenunimind-verification" content="{{ $w->verification_token }}" /&gt;</code>
                                                                                    <div class="d-flex align-items-center gap-2">
                                                                                        <button type="button" class="btn btn-sm btn-outline-success website-verify-btn" data-website-id="{{ $w->id }}">{{ __('Verify') }}</button>
                                                                                        <button type="button" class="btn btn-sm btn-outline-danger website-delete-btn" data-website-id="{{ $w->id }}" title="{{ __('Remove website') }}" aria-label="{{ __('Remove website') }}"><i class="ti ti-x"></i></button>
                                                                                    </div>
                                                                                @endif
                                                                            </div>
                                                                        @endforeach
                                                                    </div>
                                                                @else
                                                                    <p class="text-muted small mb-0" id="website-list-empty">{{ __('No websites added yet. Add a website above to get your verification meta tag.') }}</p>
                                                                @endif
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="accordion-item others mb-3">
                                                        <h2 class="accordion-header">
                                                            <a href="#" class="accordion-button collapsed"
                                                                data-bs-toggle="collapse" data-bs-target="#social-id"
                                                                aria-expanded="false" aria-controls="social-id">
                                                                <i class="ti ti-social me-2"></i>{{ __('Social Profiles') }}
                                                            </a>
                                                        </h2>
                                                        <div id="social-id" class="accordion-collapse collapse"
                                                            data-bs-parent="#account-setting">
                                                            <div class="accordion-body">
                                                                @if (session('error'))
                                                                    <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                                                                        {{ session('error') }}
                                                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                                                    </div>
                                                                @endif
                                                                @if (session('success'))
                                                                    <div class="alert alert-success alert-dismissible fade show mb-3" role="alert">
                                                                        {{ session('success') }}
                                                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                                                    </div>
                                                                @endif
                                                                @php
                                                                    $socialVerifiedPlatforms = Auth::check() ? Auth::user()->socialAccounts()->where('oauth_verified', true)->pluck('platform')->toArray() : [];
                                                                    $socialAccountsByPlatform = Auth::check() ? Auth::user()->socialAccounts()->where('oauth_verified', true)->get()->keyBy('platform') : collect();
                                                                    $linkedinUrl = '';
                                                                    if (Auth::check()) {
                                                                        $ud = Auth::user()->get_user_details;
                                                                        $linkedinUrl = $ud && $ud->linkedin ? e($ud->linkedin) : '';
                                                                        if ($linkedinUrl === '' && $socialAccountsByPlatform->has('linkedin')) {
                                                                            $acc = $socialAccountsByPlatform->get('linkedin');
                                                                            $linkedinUrl = ($acc && $acc->profile_url && $acc->profile_url !== 'https://www.linkedin.com/') ? e($acc->profile_url) : '';
                                                                        }
                                                                        $linkedinAcc = Auth::user()->socialAccounts()->where('platform', 'linkedin')->first();
                                                                        if ($linkedinUrl === '' && $linkedinAcc && $linkedinAcc->profile_url && $linkedinAcc->profile_url !== 'https://www.linkedin.com/') {
                                                                            $linkedinUrl = e($linkedinAcc->profile_url);
                                                                        }
                                                                    }
                                                                @endphp
                                                                <div class="chat-video">
                                                                    <div class="row">
                                                                        <div class="col-lg-12" data-platform="facebook" data-connect-url="{{ route('social.connect', 'facebook') }}">
                                                                            <div class="d-flex align-items-center justify-content-between mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center">
                                                                                    <span class="avatar avatar-sm bg-soft-primary text-primary rounded-circle me-2">
                                                                                        <i class="ti ti-brand-facebook fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('Facebook') }}</span>
                                                                                </div>
                                                                                <div class="social-profile-action">
                                                                                    @if(in_array('facebook', $socialVerifiedPlatforms))
                                                                                        @php $acc = $socialAccountsByPlatform->get('facebook'); @endphp
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="{{ $acc->id }}" title="{{ __('Remove') }}" aria-label="{{ __('Remove') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    @else
                                                                                        <a href="{{ route('social.connect', 'facebook') }}" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __('Connect') }}</a>
                                                                                    @endif
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12" data-platform="instagram" data-connect-url="{{ route('social.connect', 'instagram') }}">
                                                                            <div class="d-flex align-items-center justify-content-between mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center">
                                                                                    <span class="avatar avatar-sm bg-soft-danger text-danger rounded-circle me-2">
                                                                                        <i class="ti ti-brand-instagram fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('Instagram') }}</span>
                                                                                </div>
                                                                                <div class="social-profile-action">
                                                                                    @if(in_array('instagram', $socialVerifiedPlatforms))
                                                                                        @php $acc = $socialAccountsByPlatform->get('instagram'); @endphp
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="{{ $acc->id }}" title="{{ __('Remove') }}" aria-label="{{ __('Remove') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    @else
                                                                                        <a href="{{ route('social.connect', 'instagram') }}" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __('Connect') }}</a>
                                                                                    @endif
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12" data-platform="x" data-connect-url="{{ route('social.connect', 'x') }}">
                                                                            <div class="d-flex align-items-center justify-content-between mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center">
                                                                                    <span class="avatar avatar-sm bg-soft-info text-info rounded-circle me-2">
                                                                                        <i class="ti ti-brand-twitter fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('Twitter') }}</span>
                                                                                </div>
                                                                                <div class="social-profile-action">
                                                                                    @if(in_array('x', $socialVerifiedPlatforms))
                                                                                        @php $acc = $socialAccountsByPlatform->get('x'); @endphp
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="{{ $acc->id }}" title="{{ __('Remove') }}" aria-label="{{ __('Remove') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    @else
                                                                                        <a href="{{ route('social.connect', 'x') }}" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __('Connect') }}</a>
                                                                                    @endif
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div class="mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center mb-2">
                                                                                    <span class="avatar avatar-sm bg-soft-primary text-primary rounded-circle me-2">
                                                                                        <i class="ti ti-brand-linkedin fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('LinkedIn') }}</span>
                                                                                </div>
                                                                                <label class="form-label small mb-1">{{ __('Your LinkedIn profile URL') }} (e.g. https://www.linkedin.com/in/yourname)</label>
                                                                                <div class="input-group input-group-sm">
                                                                                    <input type="url" id="linkedin-profile-url-input" class="form-control" placeholder="https://www.linkedin.com/in/yourname" value="{{ $linkedinUrl ?? '' }}">
                                                                                    <button type="button" class="btn btn-outline-primary" id="linkedin-profile-url-save-btn">{{ __('Save') }}</button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12" data-platform="youtube" data-connect-url="{{ route('social.connect', 'youtube') }}">
                                                                            <div class="d-flex align-items-center justify-content-between mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center">
                                                                                    <span class="avatar avatar-sm bg-soft-danger text-danger rounded-circle me-2">
                                                                                        <i class="ti ti-brand-youtube fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('YouTube') }}</span>
                                                                                </div>
                                                                                <div class="social-profile-action">
                                                                                    @if(in_array('youtube', $socialVerifiedPlatforms))
                                                                                        @php $acc = $socialAccountsByPlatform->get('youtube'); @endphp
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="{{ $acc->id }}" title="{{ __('Remove') }}" aria-label="{{ __('Remove') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    @else
                                                                                        <a href="{{ route('social.connect', 'youtube') }}" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __('Connect') }}</a>
                                                                                    @endif
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12" data-platform="kick" data-connect-url="{{ route('social.connect', 'kick') }}">
                                                                            <div class="d-flex align-items-center justify-content-between mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center">
                                                                                    <span class="avatar avatar-sm bg-soft-success text-success rounded-circle me-2">
                                                                                        <i class="ti ti-device-gamepad-2 fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('Kick') }}</span>
                                                                                </div>
                                                                                <div class="social-profile-action">
                                                                                    @if(in_array('kick', $socialVerifiedPlatforms))
                                                                                        @php $acc = $socialAccountsByPlatform->get('kick'); @endphp
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="{{ $acc->id }}" title="{{ __('Remove') }}" aria-label="{{ __('Remove') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    @else
                                                                                        <a href="{{ route('social.connect', 'kick') }}" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __('Connect') }}</a>
                                                                                    @endif
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12" data-platform="twitch" data-connect-url="{{ route('social.connect', 'twitch') }}">
                                                                            <div class="d-flex align-items-center justify-content-between mb-3 border p-2 rounded">
                                                                                <div class="d-flex align-items-center">
                                                                                    <span class="avatar avatar-sm bg-soft-primary text-primary rounded-circle me-2">
                                                                                        <i class="ti ti-brand-twitch fs-18"></i>
                                                                                    </span>
                                                                                    <span class="fw-medium text-dark">{{ __('Twitch') }}</span>
                                                                                </div>
                                                                                <div class="social-profile-action">
                                                                                    @if(in_array('twitch', $socialVerifiedPlatforms))
                                                                                        @php $acc = $socialAccountsByPlatform->get('twitch'); @endphp
                                                                                        <div class="d-flex align-items-center gap-2">
                                                                                            <span class="badge verified-badge">{{ __('Verified') }}</span>
                                                                                            <button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="{{ $acc->id }}" title="{{ __('Remove') }}" aria-label="{{ __('Remove') }}"><i class="ti ti-x"></i></button>
                                                                                        </div>
                                                                                    @else
                                                                                        <a href="{{ route('social.connect', 'twitch') }}" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __('Connect') }}</a>
                                                                                    @endif
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    <script>
                                                                    document.addEventListener('DOMContentLoaded', function() {
                                                                        function showToast(msg, isError) {
                                                                            if (typeof Toastify !== 'undefined') {
                                                                                Toastify({ text: msg, duration: 3000, gravity: 'top', position: 'right', style: { background: (isError ? '#dc3545' : '#28a745') } }).showToast();
                                                                            } else { alert(msg); }
                                                                        }
                                                                        function setProfileLink(elId, url) {
                                                                            var el = document.getElementById(elId);
                                                                            if (!el) return;
                                                                            if (url && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)) {
                                                                                el.innerHTML = '';
                                                                                var a = document.createElement('a');
                                                                                a.href = url;
                                                                                a.target = '_blank';
                                                                                a.rel = 'noopener noreferrer';
                                                                                a.className = 'text-primary text-break';
                                                                                a.textContent = url.length > 50 ? url.substring(0, 47) + '\u2026' : url;
                                                                                a.title = url;
                                                                                el.appendChild(a);
                                                                            } else {
                                                                                el.textContent = url || '\u2014';
                                                                            }
                                                                        }
                                                                        var buttons = document.querySelectorAll('.social-connect-btn');
                                                                        buttons.forEach(function(btn) {
                                                                            btn.addEventListener('click', function(e) {
                                                                                e.preventDefault();
                                                                                var width = 600;
                                                                                var height = 700;
                                                                                var left = (screen.width/2)-(width/2);
                                                                                var top = (screen.height/2)-(height/2);
                                                                                window.open(this.href, 'socialLogin', 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left);
                                                                            });
                                                                        });
                                                                        document.querySelectorAll('.social-disconnect-btn').forEach(function(btn) {
                                                                            btn.setAttribute('data-bound', '1');
                                                                            btn.addEventListener('click', function() {
                                                                                var id = this.getAttribute('data-account-id');
                                                                                if (!id || !confirm('{{ __("Remove this social account? You can connect again later.") }}')) return;
                                                                                var row = this.closest('[data-platform]');
                                                                                var platform = row ? row.getAttribute('data-platform') : null;
                                                                                var connectUrl = row ? row.getAttribute('data-connect-url') : null;
                                                                                var url = '{{ url("connect/social-accounts") }}/' + id + '/disconnect';
                                                                                var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                                var opts = { method: 'POST', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }, credentials: 'same-origin' };
                                                                                fetch(url, opts).then(function(r) { return r.json().catch(function() { return null; }).then(function(d) { return { ok: r.ok, status: r.status, data: d || {}, code: d && d.code, message: d && d.message }; }); }).then(function(res) {
                                                                                    var success = res.ok && (res.code === '200' || res.code === 200) && !(res.data && res.data.error);
                                                                                    if (success) {
                                                                                        var plat = (res.data.data && res.data.data.platform) || (res.data.platform) || platform;
                                                                                        var actionCell = document.querySelector('[data-platform="' + plat + '"] .social-profile-action');
                                                                                        var connectLinkUrl = connectUrl || (row && row.getAttribute('data-connect-url')) || ('{{ url("connect") }}/' + plat);
                                                                                        if (actionCell && connectLinkUrl) {
                                                                                            actionCell.innerHTML = '<a href="' + connectLinkUrl.replace(/"/g, '&quot;') + '" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __("Connect") }}</a>';
                                                                                            var newLink = actionCell.querySelector('a.social-connect-btn');
                                                                                            if (newLink) {
                                                                                                newLink.addEventListener('click', function(e) { e.preventDefault(); var w = 600, h = 700; window.open(this.href, 'socialLogin', 'width=' + w + ',height=' + h + ',top=' + ((screen.height/2)-(h/2)) + ',left=' + ((screen.width/2)-(w/2))); });
                                                                                            }
                                                                                        }
                                                                                        if (typeof showToast === 'function') showToast(res.message || (res.data && res.data.message) || '{{ __("Account disconnected.") }}'); else alert(res.message || (res.data && res.data.message) || '{{ __("Account disconnected.") }}');
                                                                                    } else {
                                                                                        if (typeof showToast === 'function') showToast((res.message || (res.data && res.data.message)) || '{{ __("Could not remove account.") }}', true); else alert((res.message || (res.data && res.data.message)) || '{{ __("Could not remove account.") }}');
                                                                                    }
                                                                                }).catch(function() { if (typeof showToast === 'function') showToast('{{ __("Could not remove account.") }}', true); else alert('{{ __("Could not remove account.") }}'); });
                                                                            });
                                                                        });
                                                                        function attachSocialDisconnectHandlers() {
                                                                            document.querySelectorAll('.social-disconnect-btn:not([data-bound])').forEach(function(btn) {
                                                                                btn.setAttribute('data-bound', '1');
                                                                                btn.addEventListener('click', function() {
                                                                                    var id = this.getAttribute('data-account-id');
                                                                                    if (!id || !confirm('{{ __("Remove this social account? You can connect again later.") }}')) return;
                                                                                    var row = this.closest('[data-platform]');
                                                                                    var platform = row ? row.getAttribute('data-platform') : null;
                                                                                    var connectUrl = row ? row.getAttribute('data-connect-url') : null;
                                                                                    var url = '{{ url("connect/social-accounts") }}/' + id + '/disconnect';
                                                                                    var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                                    var opts = { method: 'POST', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }, credentials: 'same-origin' };
                                                                                    fetch(url, opts).then(function(r) { return r.json().catch(function() { return null; }).then(function(d) { return { ok: r.ok, status: r.status, data: d || {}, code: d && d.code, message: d && d.message }; }); }).then(function(res) {
                                                                                        var success = res.ok && (res.code === '200' || res.code === 200) && !(res.data && res.data.error);
                                                                                        if (success) {
                                                                                            var plat = (res.data.data && res.data.data.platform) || (res.data.platform) || platform;
                                                                                            var actionCell = document.querySelector('[data-platform="' + plat + '"] .social-profile-action');
                                                                                            var connectLinkUrl = connectUrl || (row && row.getAttribute('data-connect-url')) || ('{{ url("connect") }}/' + plat);
                                                                                            if (actionCell && connectLinkUrl) {
                                                                                                actionCell.innerHTML = '<a href="' + connectLinkUrl.replace(/"/g, '&quot;') + '" class="btn btn-sm btn-outline-danger text-danger social-connect-btn">{{ __("Connect") }}</a>';
                                                                                                var newLink = actionCell.querySelector('a.social-connect-btn');
                                                                                                if (newLink) {
                                                                                                    newLink.addEventListener('click', function(e) { e.preventDefault(); var w = 600, h = 700; window.open(this.href, 'socialLogin', 'width=' + w + ',height=' + h + ',top=' + ((screen.height/2)-(h/2)) + ',left=' + ((screen.width/2)-(w/2))); });
                                                                                                }
                                                                                            }
                                                                                            if (typeof showToast === 'function') showToast(res.message || (res.data && res.data.message) || '{{ __("Account disconnected.") }}'); else alert(res.message || (res.data && res.data.message) || '{{ __("Account disconnected.") }}');
                                                                                        } else {
                                                                                            if (typeof showToast === 'function') showToast((res.message || (res.data && res.data.message)) || '{{ __("Could not remove account.") }}', true); else alert((res.message || (res.data && res.data.message)) || '{{ __("Could not remove account.") }}');
                                                                                        }
                                                                                    }).catch(function() { if (typeof showToast === 'function') showToast('{{ __("Could not remove account.") }}', true); else alert('{{ __("Could not remove account.") }}'); });
                                                                                });
                                                                            });
                                                                        }
                                                                        window.addEventListener('message', function(ev) {
                                                                            if (!ev.data || !ev.data.type) return;
                                                                            // Handle successful OAuth connection
                                                                            if (ev.data.type === 'social-connected' && ev.data.platform && ev.data.accountId) {
                                                                                var actionCell = document.querySelector('[data-platform="' + ev.data.platform + '"] .social-profile-action');
                                                                                if (!actionCell) return;
                                                                                // Hide any stale error alert
                                                                                var socialSection = document.getElementById('social-id');
                                                                                if (socialSection) {
                                                                                    var errAlert = socialSection.querySelector('.alert-danger');
                                                                                    if (errAlert) errAlert.remove();
                                                                                }
                                                                                var verifiedLabel = '{{ __("Verified") }}';
                                                                                actionCell.innerHTML = '<div class="d-flex align-items-center gap-2"><span class="badge verified-badge">' + verifiedLabel + '</span><button type="button" class="btn btn-sm btn-outline-danger social-disconnect-btn" data-account-id="' + ev.data.accountId + '" title="{{ __("Remove") }}" aria-label="{{ __("Remove") }}"><i class="ti ti-x"></i></button></div>';
                                                                                attachSocialDisconnectHandlers();
                                                                                showToast('{{ __("Account connected successfully.") }}');
                                                                                return;
                                                                            }
                                                                            // Handle OAuth connection error
                                                                            if (ev.data.type === 'social-connect-error') {
                                                                                var errorMsg = ev.data.message || '{{ __("Could not connect account. Please try again.") }}';
                                                                                showToast(errorMsg, true);
                                                                            }
                                                                        });
                                                                        function attachWebsiteHandlers(scope) {
                                                                            scope = scope || document;
                                                                            scope.querySelectorAll('.website-verify-btn:not([data-website-bound])').forEach(function(btn) {
                                                                                btn.setAttribute('data-website-bound', '1');
                                                                                btn.addEventListener('click', function() {
                                                                                    var id = this.getAttribute('data-website-id');
                                                                                    if (!id) return;
                                                                                    this.disabled = true;
                                                                                    var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                                    fetch('{{ url("/settings/websites") }}/' + id + '/verify', { method: 'POST', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                        .then(function(r) { return r.json(); })
                                                                                        .then(function(res) {
                                                                                            if (res.code === '200' || res.code === 200) {
                                                                                                var row = btn.closest('.website-row');
                                                                                                if (row) {
                                                                                                    var urlEl = row.querySelector('.website-display-url');
                                                                                                    var urlHref = urlEl ? urlEl.getAttribute('href') : '';
                                                                                                    var urlText = urlEl ? urlEl.textContent : '';
                                                                                                    var websiteId = row.getAttribute('data-website-id');
                                                                                                    row.innerHTML = '<div class="d-flex align-items-center justify-content-between"><a href="' + urlHref + '" target="_blank" rel="noopener" class="text-primary website-display-url">' + urlText + '</a><div class="d-flex align-items-center gap-2"><span class="badge verified-badge"><i class="ti ti-circle-check me-1"></i>{{ __("Verified") }}</span><button type="button" class="btn btn-sm btn-outline-danger website-delete-btn" data-website-id="' + websiteId + '" title="{{ __("Remove website") }}" aria-label="{{ __("Remove website") }}"><i class="ti ti-x"></i></button></div></div>';
                                                                                                    attachWebsiteHandlers(row);
                                                                                                }
                                                                                                showToast(res.message || '{{ __("Website verified successfully!") }}');
                                                                                            } else {
                                                                                                showToast(res.message || '{{ __("Verification failed.") }}', true);
                                                                                            }
                                                                                        })
                                                                                        .catch(function() { showToast('{{ __("Verification request failed.") }}', true); })
                                                                                        .finally(function() { btn.disabled = false; });
                                                                                });
                                                                            });
                                                                            scope.querySelectorAll('.website-delete-btn:not([data-website-bound])').forEach(function(btn) {
                                                                                btn.setAttribute('data-website-bound', '1');
                                                                                btn.addEventListener('click', function() {
                                                                                    var id = this.getAttribute('data-website-id');
                                                                                    if (!id) return;
                                                                                    if (!confirm('{{ __("Remove this website?") }}')) return;
                                                                                    var row = this.closest('.website-row');
                                                                                    this.disabled = true;
                                                                                    var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                                    fetch('{{ url("/settings/websites") }}/' + id, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                        .then(function(r) { return r.json(); })
                                                                                        .then(function(res) {
                                                                                            if (res.code === '200' || res.code === 200) {
                                                                                                if (row) row.remove();
                                                                                                showToast(res.message || '{{ __("Website removed.") }}');
                                                                                                var listGroup = document.getElementById('website-list-group');
                                                                                                if (listGroup && listGroup.querySelectorAll('.website-row').length === 0) {
                                                                                                    var empty = document.getElementById('website-list-empty');
                                                                                                    if (!empty) {
                                                                                                        var p = document.createElement('p');
                                                                                                        p.id = 'website-list-empty';
                                                                                                        p.className = 'text-muted small mb-0';
                                                                                                        p.textContent = '{{ __("No websites added yet. Add a website above to get your verification meta tag.") }}';
                                                                                                        listGroup.parentNode.replaceChild(p, listGroup);
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                showToast(res.message || '{{ __("Could not remove website.") }}', true);
                                                                                                btn.disabled = false;
                                                                                            }
                                                                                        })
                                                                                        .catch(function() { showToast('{{ __("Could not remove website.") }}', true); btn.disabled = false; });
                                                                                });
                                                                            });
                                                                        }
                                                                        document.getElementById('add-website-form') && document.getElementById('add-website-form').addEventListener('submit', function(e) {
                                                                            e.preventDefault();
                                                                            var form = this;
                                                                            var urlInput = form.querySelector('input[name="url"]');
                                                                            var submitBtn = form.querySelector('button[type="submit"]');
                                                                            var url = urlInput ? urlInput.value.trim() : '';
                                                                            if (!url) return;
                                                                            var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                            if (submitBtn) submitBtn.disabled = true;
                                                                            var fd = new FormData(form);
                                                                            fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                .then(function(r) { return r.json(); })
                                                                                .then(function(res) {
                                                                                    if (submitBtn) submitBtn.disabled = false;
                                                                                    if (res.code === '200' || res.code === 200) {
                                                                                        if (res.data && res.data.website) {
                                                                                            var w = res.data.website;
                                                                                            var displayUrlRaw = w.display_url || w.url || '';
                                                                                            var displayUrlEsc = displayUrlRaw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                                                                                            var metaContent = (w.verification_token || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                                                                                            var rowHtml = '<div class="border rounded mb-2 p-3 website-row" data-website-id="' + w.id + '"><div class="mb-2"><a href="' + displayUrlEsc + '" target="_blank" rel="noopener" class="text-primary website-display-url">' + displayUrlEsc + '</a></div><small class="d-block text-muted mb-1">{{ __("Add this to your site\'s <head>:") }}</small><code class="d-block small bg-light p-2 rounded mb-2" style="word-break: break-all;">&lt;meta name="greenunimind-verification" content="' + metaContent + '" /&gt;</code><div class="d-flex align-items-center gap-2"><button type="button" class="btn btn-sm btn-outline-success website-verify-btn" data-website-id="' + w.id + '">{{ __("Verify") }}</button><button type="button" class="btn btn-sm btn-outline-danger website-delete-btn" data-website-id="' + w.id + '" title="{{ __("Remove website") }}" aria-label="{{ __("Remove website") }}"><i class="ti ti-x"></i></button></div></div>';
                                                                                            var listGroup = document.getElementById('website-list-group');
                                                                                            var emptyEl = document.getElementById('website-list-empty');
                                                                                            if (listGroup) {
                                                                                                listGroup.insertAdjacentHTML('beforeend', rowHtml);
                                                                                                attachWebsiteHandlers(listGroup);
                                                                                            } else if (emptyEl) {
                                                                                                var newList = document.createElement('div');
                                                                                                newList.id = 'website-list-group';
                                                                                                newList.className = 'list-group list-group-flush';
                                                                                                newList.innerHTML = rowHtml;
                                                                                                emptyEl.parentNode.replaceChild(newList, emptyEl);
                                                                                                attachWebsiteHandlers(newList);
                                                                                            }
                                                                                            if (urlInput) urlInput.value = '';
                                                                                            showToast(res.message || '{{ __("Website added.") }}');
                                                                                        } else if (res.data && res.data.already_approved) {
                                                                                            var alertHtml = '<div class="alert alert-info alert-dismissible fade show mb-3" role="alert" id="website-already-approved-alert"><p class="mb-2">{{ __("This website has already been approved. Please request representation from the owner. Your name and email address will be shared.") }}</p><p class="mb-2 small">' + (res.data.domain || '').replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</p><button type="button" class="btn btn-sm btn-primary website-request-representation-btn" data-website-id="' + res.data.website_id + '">{{ __("Request") }}</button><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                                                                                            var accordionBody = document.getElementById('website-verification-id');
                                                                                            if (accordionBody) {
                                                                                                var existingAlert = document.getElementById('website-already-approved-alert');
                                                                                                if (existingAlert) existingAlert.remove();
                                                                                                var formEl = document.getElementById('add-website-form');
                                                                                                if (formEl && formEl.nextElementSibling) formEl.nextElementSibling.insertAdjacentHTML('beforebegin', alertHtml);
                                                                                                else accordionBody.insertAdjacentHTML('afterbegin', alertHtml);
                                                                                                document.querySelectorAll('.website-request-representation-btn').forEach(function(btn) {
                                                                                                    if (btn.getAttribute('data-website-id') === String(res.data.website_id)) {
                                                                                                        btn.addEventListener('click', function() {
                                                                                                            var websiteId = this.getAttribute('data-website-id');
                                                                                                            if (!websiteId) return;
                                                                                                            this.disabled = true;
                                                                                                            var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                                                            fetch('{{ route("settings.websites.request-representation") }}', { method: 'POST', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin', body: JSON.stringify({ website_id: parseInt(websiteId, 10), message: '' }) }).then(function(r) { return r.json(); }).then(function(res) { if (res.code === '200' || res.code === 200) { var ae = document.getElementById('website-already-approved-alert'); if (ae) ae.remove(); showToast(res.message || '{{ __("Representation request sent.") }}'); } else { showToast(res.message || '{{ __("Could not send request.") }}', true); } }).catch(function() { showToast('{{ __("Could not send request.") }}', true); }).finally(function() { btn.disabled = false; });
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            showToast(res.message || '{{ __("This website has already been approved. Please request representation from the owner. Your name and email address will be shared.") }}');
                                                                                        } else {
                                                                                            showToast(res.message || '{{ __("Website added.") }}');
                                                                                        }
                                                                                    } else {
                                                                                        showToast(res.message || (res.data && res.data.error && res.data.error.user_message) || '{{ __("Could not add website.") }}', true);
                                                                                    }
                                                                                })
                                                                                .catch(function() { if (submitBtn) submitBtn.disabled = false; showToast('{{ __("Could not add website.") }}', true); });
                                                                        });
                                                                        attachWebsiteHandlers();
                                                                        document.querySelectorAll('.website-request-representation-btn').forEach(function(btn) {
                                                                            btn.addEventListener('click', function() {
                                                                                var websiteId = this.getAttribute('data-website-id');
                                                                                if (!websiteId) return;
                                                                                this.disabled = true;
                                                                                var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                                fetch('{{ route("settings.websites.request-representation") }}', {
                                                                                    method: 'POST',
                                                                                    headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                                                                                    credentials: 'same-origin',
                                                                                    body: JSON.stringify({ website_id: parseInt(websiteId, 10), message: '' })
                                                                                }).then(function(r) { return r.json(); }).then(function(res) {
                                                                                    if (res.code === '200' || res.code === 200) {
                                                                                        var alertEl = document.getElementById('website-already-approved-alert');
                                                                                        if (alertEl) alertEl.remove();
                                                                                        showToast(res.message || '{{ __("Representation request sent. The owner will review your request.") }}');
                                                                                    } else {
                                                                                        showToast(res.message || (res.data && res.data.error && res.data.error.user_message) || '{{ __("Could not send request.") }}', true);
                                                                                    }
                                                                                }).catch(function() { showToast('{{ __("Could not send request.") }}', true); }).finally(function() { btn.disabled = false; });
                                                                            });
                                                                        });
                                                                        function loadAuthorizedUsers() {
                                                                            var placeholder = document.getElementById('authorized-users-placeholder');
                                                                            var content = document.getElementById('authorized-users-content');
                                                                            var pendingList = document.getElementById('pending-requests-list');
                                                                            var repsList = document.getElementById('authorized-representatives-list');
                                                                            if (!pendingList || !repsList) return;
                                                                            var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                            fetch('{{ route("settings.websites.authorized-users") }}', { method: 'GET', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                .then(function(r) { return r.json(); })
                                                                                .then(function(res) {
                                                                                    if (res.code !== '200' && res.code !== 200) return;
                                                                                    var websites = res.websites || [];
                                                                                    if (websites.length === 0) { placeholder.style.display = 'block'; content.style.display = 'none'; return; }
                                                                                    placeholder.style.display = 'none';
                                                                                    content.style.display = 'block';
                                                                                    var pendingHtml = '';
                                                                                    var repsHtml = '';
                                                                                    websites.forEach(function(w) {
                                                                                        var domain = w.domain || '';
                                                                                        if (w.pending_requests && w.pending_requests.length) {
                                                                                            w.pending_requests.forEach(function(req) {
                                                                                                pendingHtml += '<div class="d-flex align-items-center justify-content-between border rounded p-2 mb-2" data-request-id="' + req.id + '"><div><span class="badge bg-warning text-dark me-2">{{ __("Request") }}</span><strong>' + (req.name || req.email || '') + '</strong><br><small class="text-muted">' + (req.email || '') + '</small>' + (req.message ? '<br><small>' + req.message + '</small>' : '') + '</div><div class="btn-group btn-group-sm"><button type="button" class="btn btn-success representation-approve-btn" data-request-id="' + req.id + '">{{ __("Approve") }}</button><button type="button" class="btn btn-outline-danger representation-deny-btn" data-request-id="' + req.id + '">{{ __("Deny") }}</button></div></div>';
                                                                                            });
                                                                                        }
                                                                                        if (w.authorized_representatives && w.authorized_representatives.length) {
                                                                                            repsHtml += '<div class="mb-2"><small class="text-muted d-block">' + domain + '</small>';
                                                                                            w.authorized_representatives.forEach(function(rep) {
                                                                                                repsHtml += '<div class="d-flex align-items-center border rounded p-2 mb-1"><span class="badge verified-badge me-2">{{ __("Verified") }}</span>' + (rep.name || rep.email || '') + ' <small class="text-muted ms-2">' + (rep.email || '') + '</small></div>';
                                                                                            });
                                                                                            repsHtml += '</div>';
                                                                                        }
                                                                                    });
                                                                                    pendingList.innerHTML = pendingHtml || '<p class="text-muted small mb-0">{{ __("No pending representation requests.") }}</p>';
                                                                                    repsList.innerHTML = repsHtml || '<p class="text-muted small mb-0">{{ __("No authorized representatives yet.") }}</p>';
                                                                                    if (pendingHtml) {
                                                                                        var pendingTitle = document.createElement('p');
                                                                                        pendingTitle.className = 'fw-medium small mb-2';
                                                                                        pendingTitle.textContent = '{{ __("Pending requests (click Approve or Deny)") }}';
                                                                                        if (pendingList.firstChild) pendingList.insertBefore(pendingTitle, pendingList.firstChild);
                                                                                    }
                                                                                    if (repsHtml) {
                                                                                        var repsTitle = document.createElement('p');
                                                                                        repsTitle.className = 'fw-medium small mb-2 mt-3';
                                                                                        repsTitle.textContent = '{{ __("Authorized representatives") }}';
                                                                                        if (repsList.firstChild) repsList.insertBefore(repsTitle, repsList.firstChild);
                                                                                    }
                                                                                    document.querySelectorAll('.representation-approve-btn').forEach(function(b) {
                                                                                        b.addEventListener('click', function() {
                                                                                            var id = this.getAttribute('data-request-id');
                                                                                            if (!id) return;
                                                                                            this.disabled = true;
                                                                                            fetch('{{ url("/settings/websites/representation") }}/' + id + '/approve', { method: 'POST', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                                .then(function(r) { return r.json(); }).then(function(res) { showToast(res.message || '{{ __("Request approved.") }}'); loadAuthorizedUsers(); }).catch(function() { showToast('{{ __("Failed.") }}', true); }).finally(function() { b.disabled = false; });
                                                                                        });
                                                                                    });
                                                                                    document.querySelectorAll('.representation-deny-btn').forEach(function(b) {
                                                                                        b.addEventListener('click', function() {
                                                                                            var id = this.getAttribute('data-request-id');
                                                                                            if (!id) return;
                                                                                            this.disabled = true;
                                                                                            fetch('{{ url("/settings/websites/representation") }}/' + id + '/deny', { method: 'POST', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                                .then(function(r) { return r.json(); }).then(function(res) { showToast(res.message || '{{ __("Request denied.") }}'); loadAuthorizedUsers(); }).catch(function() { showToast('{{ __("Failed.") }}', true); }).finally(function() { b.disabled = false; });
                                                                                        });
                                                                                    });
                                                                                });
                                                                        }
                                                                        loadAuthorizedUsers();
                                                                        document.getElementById('linkedin-profile-url-save-btn') && document.getElementById('linkedin-profile-url-save-btn').addEventListener('click', function() {
                                                                            var btn = this;
                                                                            var input = document.getElementById('linkedin-profile-url-input');
                                                                            var url = input ? input.value.trim() : '';
                                                                            btn.disabled = true;
                                                                            var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                            fetch('{{ url("connect/linkedin-profile-url") }}', {
                                                                                method: 'PUT',
                                                                                headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                                                                                credentials: 'same-origin',
                                                                                body: JSON.stringify({ profile_url: url || null })
                                                                            }).then(function(r) { return r.json(); }).then(function(res) {
                                                                                if (res.code === '200' || res.code === 200) {
                                                                                    if (typeof setProfileLink === 'function') setProfileLink('profile-info-linkedin', url || null);
                                                                                    showToast(res.message || '{{ __("Profile URL updated.") }}');
                                                                                } else {
                                                                                    showToast(res.message || '{{ __("Could not update URL.") }}', true);
                                                                                }
                                                                            }).catch(function() { showToast('{{ __("Could not update URL.") }}', true); }).finally(function() { btn.disabled = false; });
                                                                        });
                                                                        (function initChatSettings() {
                                                                            var chatBg = document.getElementById('chat-bg-images');
                                                                            var clearAllSwitch = document.getElementById('clearAllChatSwitch');
                                                                            var deleteAllSwitch = document.getElementById('deleteAllChatSwitch');
                                                                            var backupSwitch = document.getElementById('chatBackupSwitch');
                                                                            var msgNotifSwitch = document.getElementById('messagenotificationSoundSwitch');
                                                                            var notifSoundSwitch = document.getElementById('notificationSoundSwitch');
                                                                            var deleteChatModal = document.getElementById('delete-chat');
                                                                            var chatListUrl = '{{ url("/api/chat-list") }}';
                                                                            var chatPageUrl = '{{ route("chat") }}';
                                                                            var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                                                            function saveChatPref(key, value) { try { localStorage.setItem(key, value ? '1' : '0'); } catch (e) {} }
                                                                            function loadChatPref(key) { try { return localStorage.getItem(key) === '1'; } catch (e) { return false; } }
                                                                            if (chatBg) {
                                                                                chatBg.querySelectorAll('.img-wrap').forEach(function(wrap, idx) {
                                                                                    wrap.style.cursor = 'pointer';
                                                                                    wrap.addEventListener('click', function() {
                                                                                        chatBg.querySelectorAll('.img-wrap').forEach(function(w) { w.classList.remove('border', 'border-primary', 'border-2'); });
                                                                                        this.classList.add('border', 'border-primary', 'border-2');
                                                                                        var img = this.querySelector('img');
                                                                                        var src = img ? img.src : '';
                                                                                        try { localStorage.setItem('chat_background_index', String(idx)); if (src) localStorage.setItem('chat_background_url', src); } catch (e) {}
                                                                                        if (typeof showToast === 'function') showToast('{{ __("Chat background updated. It will apply on the chat page.") }}');
                                                                                    });
                                                                                });
                                                                                var savedIdx = parseInt(localStorage.getItem('chat_background_index'), 10);
                                                                                if (!isNaN(savedIdx)) {
                                                                                    var wraps = chatBg.querySelectorAll('.img-wrap');
                                                                                    if (wraps[savedIdx]) wraps[savedIdx].classList.add('border', 'border-primary', 'border-2');
                                                                                }
                                                                            }
                                                                            if (clearAllSwitch) {
                                                                                clearAllSwitch.addEventListener('change', function() {
                                                                                    if (!this.checked) return;
                                                                                    if (!confirm('{{ __("Clear all chats? Your chat list will be emptied. This cannot be undone.") }}')) { this.checked = false; return; }
                                                                                    fetch(chatListUrl, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                        .then(function(r) { return r.json(); }).then(function(res) {
                                                                                            if (typeof showToast === 'function') showToast(res.message || '{{ __("All chats cleared.") }}');
                                                                                            window.location.href = chatPageUrl;
                                                                                        }).catch(function() { if (typeof showToast === 'function') showToast('{{ __("Could not clear chats.") }}', true); clearAllSwitch.checked = false; });
                                                                                });
                                                                            }
                                                                            if (deleteAllSwitch) {
                                                                                deleteAllSwitch.addEventListener('change', function() {
                                                                                    if (this.checked && deleteChatModal) {
                                                                                        var modal = typeof bootstrap !== 'undefined' && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(deleteChatModal) : null;
                                                                                        if (modal) modal.show();
                                                                                    }
                                                                                    this.checked = false;
                                                                                });
                                                                            }
                                                                            if (deleteChatModal) {
                                                                                var form = deleteChatModal.querySelector('form');
                                                                                if (form) {
                                                                                    form.addEventListener('submit', function(e) {
                                                                                        e.preventDefault();
                                                                                        if (!confirm('{{ __("Delete all chats permanently? This cannot be undone.") }}')) return;
                                                                                        fetch(chatListUrl, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                                                                                            .then(function(r) { return r.json(); }).then(function(res) {
                                                                                                if (typeof showToast === 'function') showToast(res.message || '{{ __("All chats deleted.") }}');
                                                                                                var modal = typeof bootstrap !== 'undefined' && bootstrap.Modal ? bootstrap.Modal.getInstance(deleteChatModal) : null;
                                                                                                if (modal) modal.hide();
                                                                                                window.location.href = chatPageUrl;
                                                                                            }).catch(function() { if (typeof showToast === 'function') showToast('{{ __("Could not delete chats.") }}', true); });
                                                                                    });
                                                                                }
                                                                            }
                                                                            if (backupSwitch) {
                                                                                backupSwitch.checked = loadChatPref('chat_backup_enabled');
                                                                                backupSwitch.addEventListener('change', function() { saveChatPref('chat_backup_enabled', this.checked); if (typeof showToast === 'function') showToast(this.checked ? '{{ __("Chat backup enabled.") }}' : '{{ __("Chat backup disabled.") }}'); });
                                                                            }
                                                                            if (msgNotifSwitch) {
                                                                                msgNotifSwitch.checked = loadChatPref('message_notifications');
                                                                                msgNotifSwitch.addEventListener('change', function() { saveChatPref('message_notifications', this.checked); });
                                                                            }
                                                                            if (notifSoundSwitch) {
                                                                                notifSoundSwitch.checked = loadChatPref('notification_sound');
                                                                                notifSoundSwitch.addEventListener('change', function() { saveChatPref('notification_sound', this.checked); });
                                                                            }
                                                                        })();
                                                                    });
                                                                    </script>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Account setting -->

                                    <!-- Security setting -->
                                    <div class="content-wrapper">
                                        <h5 class="sub-title">{{ __('Security') }}</h5>
                                        <div class="chat-file">
                                            <div class="file-item">
                                                <div class="accordion accordion-flush chat-accordion"
                                                    id="pwd-setting">
                                                    <div class="accordion-item others mb-3">
                                                        <h2 class="accordion-header">
                                                            <a href="#" class="accordion-button collapsed"
                                                                data-bs-toggle="collapse" data-bs-target="#set-pwd"
                                                                aria-expanded="false" aria-controls="set-pwd">
                                                                <i class="ti ti-key me-2"></i>{{ __('Password') }}
                                                            </a>
                                                        </h2>
                                                        <div id="set-pwd" class="accordion-collapse collapse"
                                                            data-bs-parent="#pwd-setting">
                                                            <div class="accordion-body">
                                                                <div class="">
                                                                    <form id="changePasswordForm">
                                                                        <div class="row">
                                                                            <div class="col-lg-12">
                                                                                <div class="input-icon input-icon-left mb-3">
                                                                                    <input type="password"
                                                                                        class="pass-input form-control validate-input"
                                                                                        placeholder="{{ __('Old Password')}}"
                                                                                        id="password">
                                                                                    <span
                                                                                        class="ti toggle-password ti-eye-off icon-left"></span>
                                                                                    <div class="invalid-feedback"
                                                                                        id="password-error">
                                                                                        @error('password')
                                                                                        {{ $message }}
                                                                                        @enderror
                                                                                    </div>
                                                                                    <div class="valid-feedback"></div>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-lg-12">
                                                                                <div class="input-icon  input-icon-left mb-3">
                                                                                    <input type="password"
                                                                                        class="pass-inputs form-control validate-input"
                                                                                        placeholder="{{ __('New Password')}}"
                                                                                        id="new_password">
                                                                                    <span
                                                                                        class="ti toggle-passwords ti-eye-off icon-left"></span>
                                                                                    <div class="invalid-feedback"
                                                                                        id="new_password-error">
                                                                                        @error('new_password')
                                                                                        {{ $message }}
                                                                                        @enderror
                                                                                    </div>
                                                                                    <div class="mb-3 invalid-feedback" id="newpasswordErrorCharacter">
                                                                                        @error('new_password')
                                                                                        {{ $message }}
                                                                                        @enderror
                                                                                    </div>
                                                                                    <div class="valid-feedback"></div>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-lg-12">
                                                                                <div class="input-icon  input-icon-left mb-3">
                                                                                    <input type="password"
                                                                                        class="conform-pass-input form-control validate-input"
                                                                                        placeholder="{{ __('Confirmed Password')}}"
                                                                                        id="confirm_password">
                                                                                    <span
                                                                                        class="ti conform-toggle-password ti-eye-off icon-left"></span>
                                                                                    <div class="invalid-feedback"
                                                                                        id="confirm_password-error">
                                                                                        @error('confirm_password')
                                                                                        {{ $message }}
                                                                                        @enderror
                                                                                    </div>
                                                                                    <div class="mb-3 invalid-feedback" id="confirmpasswordErrorCharacter">
                                                                                        @error('confirm_password')
                                                                                        {{ $message }}
                                                                                        @enderror
                                                                                    </div>
                                                                                    <div class="valid-feedback"></div>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-lg-12 d-flex">
                                                                                <button type="submit"
                                                                                    class="btn btn-primary flex-fill"><i
                                                                                        class="ti ti-device-floppy me-2"></i>{{ __('Save Changes') }}</a>
                                                                            </div>
                                                                        </div>
                                                                    </form>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="accordion-item others mb-3">
                                                        <h2 class="accordion-header">
                                                            <a href="#" class="accordion-button collapsed"
                                                                data-bs-toggle="collapse" data-bs-target="#set-2fa"
                                                                aria-expanded="false" aria-controls="set-2fa">
                                                                <i class="ti ti-shield-lock me-2"></i>{{ __('Two-Factor Authentication') }}
                                                            </a>
                                                        </h2>
                                                        <div id="set-2fa" class="accordion-collapse collapse"
                                                            data-bs-parent="#pwd-setting">
                                                            <div class="accordion-body">
                                                                @if(Auth::check() && Auth::user()->has2faEnabled())
                                                                <div class="text-center mb-3">
                                                                    <span class="badge bg-success-transparent text-success badge-lg mb-2">
                                                                        <i class="ti ti-shield-check me-1"></i>{{ __('Enabled') }}
                                                                    </span>
                                                                    <p class="text-muted fs-14">{{ __('Your account is protected with authenticator app verification.') }}</p>
                                                                </div>
                                                                <form id="disable2faForm" method="POST" action="{{ route('2fa.disable') }}">
                                                                    @csrf
                                                                    <div class="mb-3">
                                                                        <label class="form-label">{{ __('Enter code to disable') }}</label>
                                                                        <input type="text" name="code" class="form-control text-center" placeholder="000000" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" required>
                                                                    </div>
                                                                    <button type="submit" class="btn btn-outline-danger w-100">
                                                                        <i class="ti ti-shield-off me-1"></i>{{ __('Disable 2FA') }}
                                                                    </button>
                                                                </form>
                                                                @else
                                                                <div class="text-center mb-3">
                                                                    <span class="badge bg-warning-transparent text-warning badge-lg mb-2">
                                                                        <i class="ti ti-shield-x me-1"></i>{{ __('Not Enabled') }}
                                                                    </span>
                                                                    <p class="text-muted fs-14">{{ __('Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc).') }}</p>
                                                                </div>
                                                                <a href="{{ route('2fa.setup') }}" class="btn btn-primary w-100">
                                                                    <i class="ti ti-shield-check me-1"></i>{{ __('Connect') }}
                                                                </a>
                                                                @endif
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- ReCAPTCHA container (required by Firebase Phone Auth) -->
                                                    <div id="recaptcha-container" style="display: none;"></div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Security setting -->

                                    <!-- Chat setting -->
                                    <div class="content-wrapper">
                                        <h5 class="sub-title">{{ __('Chat') }}</h5>
                                        <p class="text-muted small mb-2">{{ __('Chat preferences: background image, clear or delete all conversations, and backup.') }}</p>
                                        <div class="chat-file">
                                            <div class="file-item ">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <div class="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                                                            <h6 class="fs-14">
                                                                <a href="javascript:void(0);" data-bs-toggle="collapse" data-bs-target="#chat-bg-images" aria-expanded="false">
                                                                    <i class="ti ti-photo text-gray me-2"></i>{{ __('Background Images') }}
                                                                </a>
                                                            </h6>
                                                            <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                                                        </div>
                                                        <div id="chat-bg-images" class="collapse mb-3">
                                                            <p class="text-muted small mb-2">{{ __('Choose a background for your chat screen.') }}</p>
                                                            <div class="chat-user-photo">
                                                                <div class="chat-img contact-gallery mb-2">
                                                                    <div class="row g-2">
                                                                        <div class="col-3 col-md-2">
                                                                            <div class="img-wrap position-relative rounded overflow-hidden bg-light">
                                                                                <img src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" alt="bg" class="w-100" style="height:60px;object-fit:cover;">
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-3 col-md-2">
                                                                            <div class="img-wrap position-relative rounded overflow-hidden bg-light">
                                                                                <img src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" alt="bg" class="w-100" style="height:60px;object-fit:cover;">
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-3 col-md-2">
                                                                            <div class="img-wrap position-relative rounded overflow-hidden bg-light">
                                                                                <img src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" alt="bg" class="w-100" style="height:60px;object-fit:cover;">
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-3 col-md-2">
                                                                            <div class="img-wrap position-relative rounded overflow-hidden bg-light">
                                                                                <img src="{{ asset('assets/img/profiles/avatar-03.jpg') }}" alt="bg" class="w-100" style="height:60px;object-fit:cover;">
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                                                            <h6 class="fs-14">
                                                                <a href="javascript:void(0);" title="{{ __('Toggle to show/hide clear-all option') }}"><i class="ti ti-clear-all text-gray me-2"></i>{{ __('Clear All Chat') }}</a>
                                                            </h6>
                                                            <div class="form-check form-switch d-flex justify-content-end align-items-center">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="clearAllChatSwitch" title="{{ __('Saves your preference to clear chat list from view') }}">
                                                            </div>
                                                        </div>
                                                        <div class="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                                                            <h6 class="fs-14">
                                                                <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete-chat" title="{{ __('Opens confirmation to permanently delete all your chats') }}"><i class="ti ti-trash text-gray me-2"></i>{{ __('Delete All Chat') }}</a>
                                                            </h6>
                                                            <div class="form-check form-switch d-flex justify-content-end align-items-center">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="deleteAllChatSwitch" title="{{ __('When on, opens the delete-all confirmation modal') }}">
                                                            </div>
                                                        </div>
                                                        <div class="d-flex justify-content-between align-items-center">
                                                            <h6 class="fs-14">
                                                                <a href="javascript:void(0);"><i class="ti ti-restore text-gray me-2"></i>{{ __('Chat Backup') }}</a>
                                                            </h6>
                                                            <div class="form-check form-switch d-flex justify-content-end align-items-center">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="chatBackupSwitch">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Chat setting -->

                                    <!-- Notification setting -->
                                    <div class="content-wrapper">
                                        <h5 class="sub-title">{{ __('Notifications') }}</h5>
                                        <div class="chat-file">
                                            <div class="file-item ">
                                                <div class="card">
                                                    <div class="card-body">
                                                        <div class="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                                                            <h6 class="fs-14">
                                                                <a href=""><i class="ti ti-message text-gray me-2"></i>{{ __('Message Notifications') }}</a>
                                                            </h6>
                                                            <div class="form-check form-switch d-flex justify-content-end align-items-center">
                                                                <input class="form-check-input" type="checkbox" role="switch" id="messagenotificationSoundSwitch">
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                                                            <h6 class="fs-14">
                                                                <a href=""><i
                                                                        class="ti ti-bell-ringing text-gray me-2"></i>{{ __('Notification Sound') }}</a>
                                                            </h6>
                                                            <div
                                                                class="form-check form-switch d-flex justify-content-end align-items-center">
                                                                <input class="form-check-input" type="checkbox"
                                                                    role="switch" id="notificationSoundSwitch">
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="d-flex justify-content-between align-items-center">
                                                            <button type="button" id="notificationButton"
                                                                class="btn btn-primary">{{ __('Enable Notifications') }}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Notification setting -->

                                    <!-- Manage Device -->
                                    <div class="content-wrapper">
                                        <h5 class="sub-title">{{ __('Manage Device') }}</h5>
                                        <div class="chat-file">
                                            <div class="file-item">
                                                <div class="accordion accordion-flush chat-accordion"
                                                    id="device-setting">
                                                    <div>
                                                        <div class="accordion-item border-0">
                                                            <h2 class="accordion-header">
                                                                <a href="#" class="accordion-button collapsed"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target="#chatuser-collapse6"
                                                                    aria-expanded="false"
                                                                    aria-controls="chatuser-collapse6">
                                                                    <i class="ti ti-eye me-2"></i>{{ __('Device History') }}
                                                                </a>
                                                            </h2>
                                                            <div id="chatuser-collapse6"
                                                                class="accordion-collapse collapse"
                                                                data-bs-parent="#device-setting">
                                                                <div class="accordion-body">
                                                                    <div class="device-option" id="deviceList">
                                                                        <!-- Device history will be dynamically populated here -->
                                                                    </div>
                                                                    <div class="d-flex">
                                                                        <button id="logoutAllDevicesBtn"
                                                                            class="btn btn-primary flex-fill">

                                                                            <i class="ti ti-logout-2 me-2"></i>{{ __('Logout From All Devices') }}


                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Manage Device -->

                                    <!-- Others -->
                                    <div class="content-wrapper mb-0">
                                        <h5 class="sub-title">{{ __('Others') }}</h5>
                                        <div class="card mb-0">
                                            <div class="card-body list-group profile-item">
                                                <div class="accordion accordion-flush chat-accordion list-group-item"
                                                    id="other-term">
                                                    <div class="accordion-item w-100">
                                                        <h2 class="accordion-header">
                                                            <a href="#"
                                                                class="accordion-button py-0 collapsed"
                                                                data-bs-toggle="collapse" data-bs-target="#terms"
                                                                aria-expanded="false" aria-controls="terms">
                                                                <i class="ti ti-file-text me-2"></i>{{ __('Terms & Conditions') }}
                                                            </a>
                                                        </h2>
                                                        <div id="terms" class="accordion-collapse collapse"
                                                            data-bs-parent="#other-term">
                                                            <div class="accordion-body p-0 pt-3">
                                                                <p class="text-muted small mb-1">{{ __('For your reference. Set by the site administrator.') }}</p>
                                                                <textarea class="form-control" id="TermsText" readonly rows="6" placeholder="{{ __('Terms are set by the site administrator.')}}"></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="accordion accordion-flush chat-accordion list-group-item"
                                                    id="other-policy">
                                                    <div class="accordion-item w-100">
                                                        <h2 class="accordion-header">
                                                            <a href="#"
                                                                class="accordion-button py-0 collapsed"
                                                                data-bs-toggle="collapse" data-bs-target="#privacy"
                                                                aria-expanded="false" aria-controls="privacy">
                                                                <i class="ti ti-file-text me-2"></i>{{ __('Privacy Policy') }}
                                                            </a>
                                                        </h2>
                                                        <div id="privacy" class="accordion-collapse collapse"
                                                            data-bs-parent="#other-policy">
                                                            <div class="accordion-body p-0 pt-3">
                                                                <p class="text-muted small mb-1">{{ __('For your reference. Set by the site administrator.') }}</p>
                                                                <textarea class="form-control" id="privacyPolicyText" readonly rows="6" placeholder="{{ __('Privacy policy is set by the site administrator.')}}"></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <a href="javascript:void(0);" class="list-group-item"
                                                    data-bs-toggle="modal" data-bs-target="#block-list-user">
                                                    <div class="profile-info">
                                                        <h6><i class="ti ti-ban text-gray me-2"></i>{{ __('Blocked User') }}</h6>
                                                    </div>
                                                    <div>
                                                        <span class="link-icon"><i
                                                                class="ti ti-chevron-right"></i></span>
                                                    </div>
                                                </a>
                                                <a href="javascript:void(0);" id="delete-demo" class="list-group-item"
                                                    data-bs-toggle="modal" data-bs-target="#delete-account">
                                                    <div class="profile-info">
                                                        <h6><i class="ti ti-trash-x text-gray me-2"></i>{{ __('Delete Account') }}
                                                        </h6>
                                                    </div>
                                                    <div>
                                                        <span class="link-icon"><i
                                                                class="ti ti-chevron-right"></i></span>
                                                    </div>
                                                </a>
                                                <a href="javascript:void(0);" class="list-group-item"
                                                    data-bs-toggle="modal" data-bs-target="#acc-logout">
                                                    <div class="profile-info">
                                                        <h6><i class="ti ti-logout text-gray me-2"></i>{{ __('Logout') }}</h6>
                                                    </div>
                                                    <div>
                                                        <span class="link-icon"><i
                                                                class="ti ti-chevron-right"></i></span>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Others -->

                                </div>

                            </div>

                        </div>
                        <!-- / Chats sidebar -->
                    </div>
                    <!-- /Settings -->



                </div>
            </div>
            <!-- /Sidebar group -->



            <!-- Modal for Blocked Users -->
            <div class="modal fade" id="block-list-user" tabindex="-1" aria-labelledby="blockUserModalLabel"
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="blockUserModalLabel">{{ __('Blocked Users') }}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="search-wrap contact-search mb-3">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="{{ __('Search')}}">
                                    <a href="javascript:void(0);" class="input-group-text"><i
                                            class="ti ti-search"></i></a>
                                </div>
                            </div>
                            <h6 class="mb-3 fw-medium fs-16">{{ __('Blocked Contacts') }}</h6>
                            <div class="contact-scroll contact-select mb-3" id="blockedUserList">
                                <!-- Blocked users will be populated here -->
                            </div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <a href="#" class="btn btn-outline-primary w-100"
                                        data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {{-- Settings use Laravel/MySQL only (see script.blade.php). Firebase settings script removed. --}}
            @if(request()->routeIs('settings'))
            @endif


            <div class="modal fade" id="modalPopup" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalLabel">{{ __('Two-Step Verification') }}</h5>
                            <button type="button" class="btn-close" id="close2faButton" data-bs-dismiss="modal" aria-label="Close">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="modalBody">
                            <!-- Message will be dynamically inserted here -->
                        </div>
                        <div class="mb-3" id="phoneInputGroup" style="display: none;">
                            <input type="text" class="form-control ms-3" id="phoneInput" placeholder="+1234567890">
                        </div>
                        <div class="mb-3" id="otpInputGroup" style="display: none;">
                            <input type="text" class="form-control ms-3" id="otpInput" placeholder="Enter OTP">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary me-2" id="confirmButton">{{ __('Confirm') }}</button>
                            <button type="button" class="btn btn-outline-primary" id="cancelButton" data-bs-dismiss="modal">{{ __('Cancel') }}</button>
                        </div>
                    </div>
                </div>
            </div>


            <!-- Delete Chat -->
            <div class="modal fade" id="delete-chat">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">{{ __('Delete Chat') }}</h4>
                            <button type="button" class="btn-close" id="cancelDeleteChatButton" data-bs-dismiss="modal" aria-label="Close">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="deleteChatForm">
                                <div class="block-wrap text-center mb-3">
                                    <span class="user-icon mb-3 mx-auto bg-transparent-danger">
                                        <i class="ti ti-trash text-danger"></i>
                                    </span>
                                    <p class="text-grya-9">{{ __('Clearing or deleting entire chats will only remove messages from this device and your devices on the newer versions of DreamsChat.') }}</p>
                                </div>
                                <div class="row g-3">
                                    <div class="col-6">
                                        <a href="#" class="btn btn-outline-primary w-100" id="cancelDeleteChatBtn" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                                    </div>
                                    <div class="col-6">
                                        <button type="submit" class="btn btn-primary w-100" id="deleteAllChatBtn">{{ __('Delete') }}</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /Delete Chat -->

            <div class="modal fade" id="activeContactsModal" tabindex="-1" aria-labelledby="activeContactsModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="activeContactsModalLabel">{{ __('Active Contacts') }}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <ul id="activeContactsList" class="list-group">
                                <!-- Active contacts will be populated here -->
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Deactivation Confirmation Popup -->
            <div class="modal fade" id="deactivate-account-modal" tabindex="-1" aria-labelledby="deactivate-account-modal-label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="deactivate-account-modal-label">{{ __('Confirm Deactivation') }}</h5>
                            <button type="button" class="btn-close" id="close-deactivate" data-bs-dismiss="modal" aria-label="Close">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>{{ __('If you login within 30 days, your account will be reactivated.') }}</p>
                            <div class="row g-3">
                                <div class="col-6">
                                    <a href="#" class="btn btn-outline-primary w-100" id="cancel-deactivate" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel') }}</a>
                                </div>
                                <div class="col-6">
                                    <button type="submit" class="btn btn-primary w-100" id="confirm-deactivate">{{ __('Deactivate') }}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            @if (session('username') && isset(session('username')['user'], session('username')['name'], session('username')['username']))
            @csrf
            <input type="hidden" id="current-user-number" name="current-user-number" value="{{ e(session('username')['user']) }}" />
            <input type="hidden" id="current-user" name="current-user" value="{{ e(session('username')['name']) }}">
            <input type="hidden" id="current-username" name="current-username" value="{{ e(session('username')['username']) }}">
            @else
            @csrf
            <input type="hidden" id="current-user-number" name="current-user-number" value="" />
            <input type="hidden" id="current-user" name="current-user" value="">
            <input type="hidden" id="current-username" name="current-username" value="">
            @endif


            <script>
                const fullLogo = "{{ asset('assets/img/Icon.png') }}";
                const smallLogo = "{{ asset('assets/img/Icon.png') }}";
                const faviLogo = "{{ asset('assets/img/favicon.png') }}";
            </script>
