            <!-- Left Sidebar Menu -->
            <div class="sidebar-menu">
                <div class="logo">
                    <a href="{{ route('chat') }}" class="logo-normal"><img id="logo" src="assets/img/logo.svg" alt="Logo"></a>
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
                            <li data-bs-toggle="tooltip" data-bs-placement="right" data-bs-original-title="Status"
                                data-bs-custom-class="tooltip-primary">
                                <a href="{{ route('user-status') }}"
                                    class="{{ request()->routeIs('status', 'my-status', 'user-status') ? 'active' : '' }}">
                                    <i class="ti ti-circle-dot"></i>
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
                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                data-bs-target="#new-group"
                                                class="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16 me-2"><i
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

                    <!-- Status -->
                    <div class="tab-pane fade  {{ request()->routeIs('status', 'my-status', 'user-status') ? 'active show' : '' }}"
                        id="status-menu">
                        <div id="chats" class="sidebar-content active slimscroll">

                            <div class="slimscroll">

                                <div class="chat-search-header">
                                    <div class="header-title d-flex align-items-center justify-content-between">
                                        <h4 class="mb-3">{{ __('Status') }}</h4>
                                        <div class="d-flex align-items-center mb-3">
                                            <a href="javascript:void(0);" data-bs-toggle="modal"
                                                data-bs-target="#new-status"
                                                class="add-icon text-white bg-primary fs-16 d-flex justify-content-center align-items-center">
                                                <i class="ti ti-plus"></i>
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Chat Search -->
                                    <div class="search-wrap">
                                        <form onsubmit="return false;">
                                            <div class="input-group">
                                                <input type="text" id="statusSearchInput" class="form-control"
                                                    placeholder="{{ __('Search Contacts')}}">
                                                <span class="input-group-text"><i class="ti ti-search"></i></span>
                                            </div>
                                        </form>
                                    </div>
                                    <!-- /Chat Search -->
                                </div>


                                <div class="sidebar-body chat-body" id="chatsidebar">
                                    <div class="status-list">
                                        <!-- Left Chat Title -->
                                        <div class="d-flex  mb-3">
                                            <h5>{{ __('My Status') }}</h5>

                                        </div>
                                        <!-- /Left Chat Title -->
                                        <div class="chat-users-wrap" id="myStatusList">
                                            <!-- My Statuses will be dynamically inserted here -->
                                        </div>
                                    </div>
                                    <div class="status-list">
                                        <!-- Left Chat Title -->
                                        <div class="d-flex  mb-3">
                                            <h5>{{ __('Recent Updates') }}</h5>

                                        </div>
                                        <!-- /Left Chat Title -->

                                        <div class="chat-users-wrap" id="recentUpdatesList">
                                            <!-- Recent Updates will be dynamically inserted here -->
                                        </div>
                                    </div>
                                    <div class="status-list">
                                        <!-- Left Chat Title -->
                                        <div class="d-flex  mb-3">
                                            <h5>{{ __('Already Seen') }}</h5>

                                        </div>
                                        <!-- /Left Chat Title -->
                                        <div class="chat-users-wrap" id="alreadySeenList">
                                        </div>
                                    </div>
                                    <div id="noStatusMatchesMessage" style="display: none;">{{ __('No matches found in statuses.') }}</div>
                                </div>

                            </div>

                        </div>
                    </div>
                    <!-- /Status -->

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
                                            @if(Auth::check() && Auth::user()->isKycVerified())
                                            <span class="badge bg-success-transparent text-success badge-xs mt-1" title="{{ __('ID Verified') }}">
                                                <i class="ti ti-shield-check me-1"></i>{{ __('ID Verified') }}
                                            </span>
                                            @endif
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
                                                    class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                    <div class="flex-grow-1">
                                                        <h6 class="fs-14">{{ __('Email Address') }}</h6>
                                                        <p class="fs-16" id="profile-info-email">{{ __('Loading...') }}</p>
                                                    </div>
                                                    <span class="email-icon"><i
                                                            class="ti ti-mail-heart fs-16"></i></span>
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
                                                    <h6 class="fs-14">{{ __('Linkedin') }}</h6>
                                                    <p class="fs-16" id="profile-info-linkedin">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-linkedin fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Google') }}</h6>
                                                    <p class="fs-16" id="profile-info-google">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-google fs-16"></i></span>
                                            </div>
                                            <div
                                                class="d-flex profile-list justify-content-between align-items-center">
                                                <div>
                                                    <h6 class="fs-14">{{ __('Youtube') }}</h6>
                                                    <p class="fs-16" id="profile-info-youtube">{{ __('Loading...') }}</p>
                                                </div>
                                                <span><i class="ti ti-brand-youtube fs-16"></i></span>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- /Social Media -->

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
                                                                                class="input-icon mb-3 position-relative">
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
                                                                                class="input-icon mb-3 position-relative">
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
                                                                                class="input-icon mb-3 position-relative">
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
                                                                        <div class="col-lg-12">
                                                                            <div class="input-icon mb-3 position-relative">
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
                                                                                class="input-icon mb-3 position-relative">
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
                                                                                class="input-icon mb-3 position-relative">
                                                                                @php
                                                                                    $emailLocked = Auth::check() && (Auth::user()->isKycVerified() || Auth::user()->email_verified_at);
                                                                                @endphp
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Email')}}"
                                                                                    id="email"
                                                                                    @if($emailLocked) readonly title="{{ __('Email cannot be changed after verification') }}" @endif>
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-mail-heart"></i>
                                                                                </span>
                                                                                @if($emailLocked)
                                                                                <small class="text-muted"><i class="ti ti-lock me-1"></i>{{ __('Locked (Verified)') }}</small>
                                                                                @endif
                                                                                <span id="email_error" class="error-message text-danger"></span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
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
                                                                            <div class="input-icon mb-3 position-relative">
                                                                                <input type="text" id="dob" class="form-control datetimepicker" placeholder="{{ __('Date of birth')}}">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-calendar-event"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
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
                                                                            <div class="input-icon mb-3 position-relative">
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
                                                                            <div class="input-icon mb-3 position-relative">
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
                                                                data-bs-toggle="collapse" data-bs-target="#social-id"
                                                                aria-expanded="false" aria-controls="social-id">
                                                                <i class="ti ti-social me-2"></i>{{ __('Social Profiles') }}
                                                            </a>
                                                        </h2>
                                                        <div id="social-id" class="accordion-collapse collapse"
                                                            data-bs-parent="#account-setting">
                                                            <div class="accordion-body">
                                                                <div class="chat-video">
                                                                    <div class="row">
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Facebook')}}"
                                                                                    id="facebook_link">
                                                                                <span class="icon-addon">
                                                                                    <i
                                                                                        class="ti ti-brand-facebook"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Google')}}"
                                                                                    id="google_link">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-brand-google"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control""
                                                                                    placeholder=" {{ __('Twitter')}}"
                                                                                    id="twitter_link">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-brand-twitter"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('LinkedIn')}}"
                                                                                    id="linkedin_link">
                                                                                <span class="icon-addon">
                                                                                    <i
                                                                                        class="ti ti-brand-linkedin"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12">
                                                                            <div
                                                                                class="input-icon mb-3 position-relative">
                                                                                <input type="text" value=""
                                                                                    class="form-control"
                                                                                    placeholder="{{ __('Youtube')}}"
                                                                                    id="youtube_link">
                                                                                <span class="icon-addon">
                                                                                    <i class="ti ti-brand-youtube"></i>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12 d-flex">
                                                                            <a href=""
                                                                                class="btn btn-primary flex-fill"
                                                                                id="saveSocialLinksBtn"><i
                                                                                    class="ti ti-device-floppy me-2"></i>{{ __('Save Changes') }}</a>
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
                                        <div class="chat-file">
                                            <div class="file-item ">
                                                <div class="accordion accordion-flush chat-accordion"
                                                    id="chat-setting">
                                                    <div class="border-0 profile-list mb-3">
                                                        <div class="accordion-item border-0 ">
                                                            <h2 class="accordion-header border-0">
                                                                <a href="#"
                                                                    class="accordion-button border-0 collapsed"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target="#chatuser-collapse4"
                                                                    aria-expanded="true"
                                                                    aria-controls="chatuser-collapse4">
                                                                    <i class="ti ti-photo me-2"></i>{{ __('Background Images') }}
                                                                </a>
                                                            </h2>
                                                            <div id="chatuser-collapse4"
                                                                class="accordion-collapse border-0 collapse "
                                                                data-bs-parent="#chat-setting">
                                                                <div class="accordion-body border-0 pb-0">
                                                                    <div class="chat-user-photo">
                                                                        <div class="chat-img contact-gallery mb-3"
                                                                            id="image-gallery">
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-01.jpg">
                                                                                <img src="assets/img/gallery/gallery-01.jpg"
                                                                                    alt="Background 1">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-02.jpg">
                                                                                <img src="assets/img/gallery/gallery-02.jpg"
                                                                                    alt="Background 2">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-03.jpg">
                                                                                <img src="assets/img/gallery/gallery-03.jpg"
                                                                                    alt="Background 3">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-04.jpg">
                                                                                <img src="assets/img/gallery/gallery-04.jpg"
                                                                                    alt="Background 4">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-05.jpg">
                                                                                <img src="assets/img/gallery/gallery-05.jpg"
                                                                                    alt="Background 5">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-06.jpg">
                                                                                <img src="assets/img/gallery/gallery-06.jpg"
                                                                                    alt="Background 6">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-07.jpg">
                                                                                <img src="assets/img/gallery/gallery-07.jpg"
                                                                                    alt="Background 7">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div class="img-wrap"
                                                                                data-image="assets/img/gallery/gallery-08.jpg">
                                                                                <img src="assets/img/gallery/gallery-08.jpg"
                                                                                    alt="Background 8">
                                                                                <div class="img-overlay-1">
                                                                                    <span
                                                                                        class="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                                                                        <i
                                                                                            class="ti ti-check d-flex justify-content-center align-items-center"></i>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-lg-12 d-flex">
                                                                            <a href="#"
                                                                                class="btn btn-primary flex-fill mb-3"
                                                                                id="image-save-button">
                                                                                <i
                                                                                    class="ti ti-device-floppy me-2"></i>{{ __('Save Changes') }}
                                                                            </a>
                                                                        </div>
                                                                        <div class="col-lg-12 d-flex">
                                                                            <a href="#"
                                                                                class="btn btn-primary flex-fill mb-3"
                                                                                id="remove-background-button">
                                                                                <i
                                                                                    class="ti ti-device-floppy me-2"></i>{{ __('Remove Background Image') }}
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
                                                            <button id="notificationButton"
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
                                                                <textarea class="form-control" id="TermsText"></textarea>
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
                                                                <textarea class="form-control" id="privacyPolicyText"></textarea>
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



            <script type="module" src="assets/js/firebase/firebaseSettings.js" crossorigin="anonymous"></script>
            <script type="module" src="assets/js/firebase/firebaseStatus.js" crossorigin="anonymous"></script>
            <script type="module" src="assets/js/firebase/firebaseCalls.js" crossorigin="anonymous"></script>
            <script type="module" src="assets/js/firebase/firebaseSidebar.js" crossorigin="anonymous"></script>
            <script type="module" src="assets/js/firebase/firebaseSidebarChangePassword.js" crossorigin="anonymous"></script>


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


            <script type="module" src="{{ asset('assets/js/firebase/firebaseUserHeader.js') }}" crossorigin="anonymous"></script>
            <script>
                const fullLogo = "{{ asset('assets/img/full-logo.png') }}";
                const smallLogo = "{{ asset('assets/img/logo-small.svg') }}";
                const faviLogo = "{{ asset('assets/img/favicon.png') }}";
            </script>