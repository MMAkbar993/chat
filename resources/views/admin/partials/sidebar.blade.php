<!-- Sidebar -->
<div class="sidebar" id="sidebar">
    <div class="sidebar-inner slimscroll">
        <div id="sidebar-menu" class="sidebar-menu d-flex flex-column">
            <ul class="menu-top">
                <li class=" @if (request()->routeIs('admin.index')) active @endif">
                    <a href="{{ Route('admin.index') }}"><i class="ti ti-layout-dashboard"></i><span>Dashboard</span></a>
                </li>

                <li class="submenu">
                    <a href="{{ Route('admin.users') }}" class=" @if (request()->routeIs('admin.users')) active @endif"><i
                            class="ti ti-user"></i><span>Users</span><span class="menu-arrow"></span></a>
                    <ul>
                        <li>
                            <a href="{{ Route('admin.users') }}"
                                class=" @if (request()->routeIs('admin.users')) active @endif"><i
                                    class="ti ti-point-filled me-2"></i>Users List</a>
                        </li>
                        <li>
                            <a href="{{ Route('admin.block-user') }}"
                                class=" @if (request()->routeIs('admin.block-user')) active @endif"><i
                                    class="ti ti-point-filled me-2"></i>Blocked
                                Users</a>
                        </li>

                    </ul>
                </li>
                <li class=" @if (request()->routeIs('admin.group')) active @endif">
                    <a href="{{ Route('admin.group') }}"><i class="ti ti-users-group"></i><span>Group
                        </span></a>
                </li>
                <li class=" @if (request()->routeIs('admin.chat')) active @endif">
                    <a href="{{ Route('admin.chat') }}"><i class="ti ti-message-circle"></i><span>Chat</span></a>
                </li>
                <li class=" @if (request()->routeIs('admin.call')) active @endif">
                    <a href="{{ Route('admin.call') }}"><i class="ti ti-phone-call"></i><span>Calls</span></a>
                </li>
                <li class=" @if (request()->routeIs('admin.status')) active @endif">
                    <a href="{{ Route('admin.status') }}"><i class="ti ti-circle-dot"></i><span>Status</span></a>
                </li>
                <li
                    class=" @if (request()->routeIs('admin.profile-settings')) active
            @elseif (request()->routeIs('admin.app-settings')) active 
            @elseif (request()->routeIs('admin.system-settings')) active 
            @elseif (request()->routeIs('admin.language')) active
            @elseif (request()->routeIs('admin.add-language')) active 
            @elseif (request()->routeIs('admin.language-web')) active 
            @elseif (request()->routeIs('admin.gdpr')) active
            @elseif (request()->routeIs('admin.change-password')) active 
            @elseif (request()->routeIs('admin.basic-settings')) active @endif">
                    <a href="{{ Route('admin.profile-settings') }}"><i
                            class="ti ti-settings"></i><span>Settings</span></a>
                </li>

            </ul>
        </div>
    </div>
</div>
<!-- /Sidebar -->
