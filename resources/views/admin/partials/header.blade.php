<!-- Header -->
<div class="header">

    <!-- Logo -->
    <div class="header-left active">
        <a href="{{ Route('admin.index') }}" class="logo logo-normal">
            <img id="full-logo" src="{{ asset('assets/img/white-logo.jpg') }}" alt="Logo">
        </a>
        <a href="{{ Route('admin.index') }}" class="logo-small">
            <img id="small-logo" src="{{ asset('assets/img/white-logo.jpg') }}" alt="Logo">
        </a>
    </div>
    <!-- /Logo -->

    <a id="mobile_btn" class="mobile_btn" href="javascript:void(0);sidebar">
        <span class="bar-icon">
            <span></span>
            <span></span>
            <span></span>
        </span>
    </a>

    <div class="header-user">
        <div class="nav user-menu">

            <!-- Search -->
            <div class="nav-item nav-search-inputs me-auto">
                <div class="top-nav-search">
                    <a href="javascript:void(0);" class="responsive-search">
                        <i class="fa fa-search"></i>
                    </a>
                    <div class="d-flex align-items-center">
                        <a id="toggle_btn" href="javascript:void(0);" class="me-2">
                            <i class="ti ti-menu-2"></i>
                        </a>
                    </div>
                </div>
            </div>
            <!-- /Search -->

            <div class="d-flex align-items-center">
                <div class="provider-head-links ">
                    <div class="dark-mode">
                        <a href="javascript:void(0);" id="dark-mode-toggle" class="dark-mode-toggle header-icon">
                            <i class="fa-regular fa-moon"></i>
                        </a>
                        <a href="javascript:void(0);" id="light-mode-toggle" class="dark-mode-toggle header-icon">
                            <i class="ti ti-sun-filled"></i>
                        </a>
                    </div>
                </div>
                <div class="dropdown">
                    <div class="dropdown-menu dropdown-menu-right p-3">
                        <a href="javascript:void(0);" class="dropdown-item active d-flex align-items-center">
                            <img class="me-2 rounded-pill" src="{{ asset('assets/img/flag/flag-01.png') }}"
                                alt="Img" height="22" width="22"> English
                        </a>
                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center">
                            <img class="me-2 rounded-pill" src="{{ asset('assets/img/flag/flag-02.png') }}"
                                alt="Img" height="22" width="22"> French
                        </a>
                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center">
                            <img class="me-2 rounded-pill" src="{{ asset('assets/img/flag/flag-03.png') }}"
                                alt="Img" height="22" width="22"> Spanish
                        </a>
                        <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center">
                            <img class="me-2 rounded-pill" src="{{ asset('assets/img/flag/flag-04.png') }}"
                                alt="Img" height="22" width="22"> German
                        </a>
                    </div>
                </div>

                <div class="dropdown">
                    <a href="javascript:void(0);" data-bs-toggle="dropdown">
                        <div class="booking-user d-flex align-items-center">
                            <input type="text" value="" class="form-control" placeholder="UID"
                                id="user-id" style="display: none">
                            <span class="user-img me-2">
                                <img id="profileImageAdmin" src="{{ asset('assets/img/profiles/avatar-03.jpg') }}"
                                    alt="user">
                            </span>
                            <div>
                                <h6 class="fs-14 fw-medium" id="profile-first-name">Loading...</h6>
                                <span class="text-primary fs-12" id="profile-info-role">Loading...</span>
                            </div>
                        </div>
                    </a>
                    <ul class="dropdown-menu p-2">
                        <li>
                            <a class="dropdown-item d-flex align-items-center" href="javascript:void(0);" id="admin-logout-btn">
                                <i class="ti ti-logout me-1"></i>Logout
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    </div>

    <!-- Mobile Menu -->
    <div class="dropdown mobile-user-menu">
        <a href="javascript:void(0);" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"
            aria-expanded="false"><i class="fa fa-ellipsis-v"></i></a>
        <div class="dropdown-menu dropdown-menu-end">
            <a class="dropdown-item" href="#">My Profile</a>
            <a class="dropdown-item" href="{{ Route('admin.profile-settings') }}">Settings</a>
            <a class="dropdown-item" href="{{ Route('admin.login') }}">Logout</a>
        </div>
    </div>
    <!-- /Mobile Menu -->

</div>
<!-- /Header -->
<script type="module" src="{{ asset('assets/js/firebase/firebaseHeader.js') }}" crossorigin="anonymous"></script>
<script>
    const fullLogo = "{{ asset('assets/img/full-logo.png') }}";
    const smallLogo = "{{ asset('assets/img/logo-small.svg') }}";
    const faviLogo = "{{ asset('assets/img/favicon.png') }}";
</script>
