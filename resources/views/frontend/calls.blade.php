@extends('frontend.layout')

@section('content')
    <!-- content -->
    <div class="content main_content">

        @includeIf('frontend.partials.sidebar')

        <div id="spa-page-content">
            @includeIf('frontend.partials.chat-content')
        </div>

    </div>
    <!-- /Content -->

    <div id="spa-page-modals">
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
                    <form action="{{ route('all-calls') }}">
                        <div class="block-wrap text-center mb-3">
                            <span class="user-icon mb-3 mx-auto bg-transparent-info">
                                <i class="ti ti-user-off text-info"></i>
                            </span>
                            <p class="text-grya-9">{{ __('Blocked contacts will no longer be able to call you or send you messages.')}}</p>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal"
                                    aria-label="Close">{{ __('Cancel')}}</a>
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

    <!-- New Chat -->
    <div class="modal fade" id="new-chat">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">{{ __('New Chat')}}</h4>
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
                        <h6 class="mb-3 fw-medium fs-16">{{ __('Contacts')}}</h6>
                        <div class="contact-scroll contact-select mb-3" id="main-container">

                        </div>
                        <div id="noChatMatchesModalMessage" style="display: none;">{{ __('No matches found.')}}</div>
                        <div class="row g-3">
                            <div class="col-12">
                                <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">{{ __('Cancel')}}</a>
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

    <!--Group Voice Call -->
    <div class="modal fade" id="group_voice">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header justify-content-center border-0">
                    <span
                        class="model-icon bg-primary d-flex justify-content-center align-items-center rounded-circle me-2">
                        <i class="ti ti-phone-call"></i>
                    </span>
                    <h4 class="modal-title">{{ __('Audio Calling...')}}</h4>
                </div>
                <div class="modal-body pb-0">
                    <div class="card bg-light mb-0">
                        <div class="card-body d-flex justify-content-center">
                            <div>
                                <div class="d-flex justify-content-center avatar-group mb-2">
                                    <a href="#" class=" ">
                                        <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                    <a href="#" class="">
                                        <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                    <a href="#" class="">
                                        <img src="assets/img/profiles/avatar-05.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                    <a href="#" class="">
                                        <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                </div>
                                <h6 class="fs-14">Edward Lietz, Aariyan Jose, Federico Wells, +1</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer justify-content-center border-0">
                    <a href=""
                        class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2"
                        data-bs-toggle="modal" data-bs-target="#voice_attend">
                        <i class="ti ti-phone fs-20"></i>
                    </a>
                    <a href="javascript:void(0);" data-bs-dismiss="modal"
                        class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center">
                        <i class="ti ti-phone-off fs-20"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
    <!-- /Group Voice Call -->

    <!-- Voice Call attend -->
    <div class="modal voice-call fade" id="voice_attend">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header d-flex border-0 pb-0">
                    <div class="card bg-transparent-dark flex-fill border mb-3">
                        <div class="card-body d-flex justify-content-between p-3 flex-wrap row-gap-3">
                            <div class="d-flex align-items-center">
                                <span class="avatar avatar-lg online me-2">
                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                        alt="user">
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
                                <a href=""
                                    class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white"
                                    data-bs-toggle="modal" data-bs-target="#voice_group">
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
                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                        alt="user">
                                </span>

                            </div>
                            <div class="d-flex align-items-end justify-content-end">
                                <span
                                    class="call-span border border-2 border-primary d-flex justify-content-center align-items-center rounded">
                                    <span class="avatar avatar-xl bg-soft-primary rounded-circle p-2">
                                        <img src="assets/img/profiles/avatar-17.jpg" class="rounded-circle"
                                            alt="user">
                                    </span>
                                </span>
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
    <!-- /Voice Call attend -->

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
                                            <a href="javascript:void(0);"
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
                                                <img src="assets/img/profiles/avatar-17.jpg" class="rounded-circle"
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
                                                    <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                                        alt="user">
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
                                                    <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle"
                                                        alt="user">
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
                                                    <img src="assets/img/profiles/avatar-02.jpg" class="rounded-circle"
                                                        alt="user">
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
                                                    <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                                        alt="user">
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
                                        <div class="card-body">
                                            <div class="d-flex justify-content-center align-items-center">
                                                <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                                    <img src="assets/img/profiles/avatar-05.jpg" class="rounded-circle"
                                                        alt="user">
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

    <div class="modal fade" id="start-video-call">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header d-flex border-0 pb-0">
                    <div class="card bg-transparent-dark flex-fill border">
                        <div class="card-body d-flex justify-content-between">
                            <div class="d-flex align-items-center">
                                <span class="avatar avatar-lg online me-2">
                                    <img src="assets/img/profiles/avatar-05.jpg" class="rounded-circle"
                                        alt="user">
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
                                <a href="javascript:void(0);"
                                    class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white"
                                    data-bs-toggle="modal" data-bs-target="#video_group">
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
                            <div
                                class="bg-soft-primary mx-auto default-profile rounded-circle align-items-center justify-content-center">
                                <span class="avatar  avatar-lg rounded-circle bg-primary ">RG</span>
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
                                            <a href="javascript:void(0);"
                                                class="user-add bg-primary rounded d-flex justify-content-center align-items-center text-white">
                                                <i class="ti ti-user-plus"></i>
                                            </a>
                                        </div>
                                        <div class="row justify-content-center">
                                            <div class="layout-tab d-flex justify-content-center ">
                                                <div class="nav nav-pills inner-tab " id="pills-tab3" role="tablist">
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
                                        <img src="assets/img/video/video-member-01.jpg" alt="user-image">
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
                                        <img src="assets/img/video/video-member-02.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-6 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/video/video-member-03.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-4 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/video/video-member-05.jpg" alt="user-image">
                                    </div>
                                </div>
                                <div class="col-md-4 d-flex">
                                    <div class="video-call-view br-8 overflow-hidden flex-fill">
                                        <img src="assets/img/video/video-member-04.jpg" alt="user-image">
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
                        <div class="call-controll-block d-flex align-items-center justify-content-center rounded-pill">
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

    <!--Group Video Call -->
    <div class="modal fade" id="group_video">
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
                                <div class="d-flex justify-content-center avatar-group mb-2">
                                    <a href="#" class=" ">
                                        <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                    <a href="#" class="">
                                        <img src="assets/img/profiles/avatar-01.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                    <a href="#" class="">
                                        <img src="assets/img/profiles/avatar-05.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                    <a href="#" class="">
                                        <img src="assets/img/profiles/avatar-03.jpg" class="rounded-circle"
                                            alt="user">
                                    </a>
                                </div>
                                <h6 class="fs-14">Edward Lietz, Aariyan Jose, Federico Wells, +1</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer justify-content-center border-0">
                    <a href=""
                        class="voice-icon btn btn-success rounded-circle d-flex justify-content-center align-items-center me-2">
                        <i class="ti ti-phone fs-20"></i>
                    </a>
                    <a href=""
                        class="voice-icon btn btn-danger rounded-circle d-flex justify-content-center align-items-center">
                        <i class="ti ti-phone-off fs-20"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
    <!-- /Group Video Call -->
    </div>

@endsection
