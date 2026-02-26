@extends('frontend.layout')

@section('content')
<!-- content -->
<div class="content main_content">

    @includeIf('frontend.partials.sidebar')

    <div id="spa-page-content">
    <div class="chat chat-messages show status-msg justify-content-center">
        <div class="user-status-group">
            <div class="d-xl-none">
                <a class="text-muted chat-close mb-3 d-block" href="#">
                    <i class="fas fa-arrow-left me-2"></i>Back
                </a>
            </div>
            <!-- Status-->
            <div id="welcome-container" class="welcome-content d-flex align-items-center justify-content-center">
                <div class="welcome-info text-center">
                    <div class="welcome-box bg-white d-inline-flex align-items-center">
                        <span class="avatar avatar-md me-2">
                            <img id="profileImageChat" src="assets/img/profiles/avatar-03.jpg" alt="img" class="rounded-circle">
                        </span>
                        <h6 class="title me-1">{{ __('Welcome!')}}</h6>
                        <h6 id="profile-info-chat-name"> {{ __('Loading...')}}</h6>
                    </div>
                    <p>{{ __('Choose a person to view their status.')}}</p>
                </div>
            </div>

            <div class="user-stories-box " style="display: none;">
                <div class="inner-popup">
                    <div id="carouselIndicators" class="carousel slide slider" data-bs-ride="carousel">
                        <div class="chat status-chat-footer show-chatbar">
                            <div class="chat-footer">
                                <form class="footer-form" id="status-message-form">
                                    <div class="chat-footer-wrap">
                                        <div class="form-wrap">
                                            <input type="text" id="statusMessage" class="form-control" placeholder="Type Your Message">
                                        </div>
                                        <div class="form-btn">
                                            <button type="submit" class="btn btn-primary" id="sendStatuses">
                                                <i class="ti ti-send"></i>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="status-user-blk">
                            <div class="user-details user-details-status">

                            </div>
                            <div class="status-voice-group ">
                            </div>
                        </div>
                        <ol class="carousel-indicators">

                        </ol>
                        <div class="carousel-inner status_slider" role="listbox">

                        </div>
                    </div>
                    <h5 class="text-center mt-3" id="status-footer-content"></h5>
                </div>
            </div>
            <!-- /Status -->
        </div>

    </div>
    </div>

</div>
<!-- /Content -->

<div id="spa-page-modals">
<div class="modal fade" id="statusMediaModal" tabindex="-1" aria-labelledby="statusMediaModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="statusMediaModalLabel">Status Media</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- Add Status -->
<div class="modal fade" id="new-status">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Add New Status</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="mb-4">
                    <label for="fileInput" class="form-label">Select files to upload</label>
                    <input type="file" id="fileInput" class="form-control" multiple required />
                </div>
                <div class="row g-3">
                    <div class="col-6">
                        <a href="#" class="btn btn-outline-primary w-100" data-bs-dismiss="modal" aria-label="Close">Cancel</a>
                    </div>
                    <div class="col-6">
                        <button type="button" class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#upload-file-image">Next</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Add Status -->
<!-- Status -->
<div class="modal fade" id="upload-file-image">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">Add New Status</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body chat">

                <div class="row">
                    <div class="col-md-12">
                        <div class="drag-and-drop-block status-view p-3 mb-3">
                            <div id="previewContainer"></div>

                        </div>

                    </div>

                </div>
                <div class="chat-footer">
                    <div class="footer-form">
                        <div class="chat-footer-wrap">
                            <div class="form-wrap">
                                <input type="text" id="statuscontent" class="form-control" placeholder="Type Your Message">
                            </div>
                            <div class="form-item emoj-action-foot">
                                <a href="javascript:void(0);" id="emoji-button" class="action-circle">
                                    <i class="ti ti-mood-smile"></i>
                                </a>
                            </div>

                            <!-- Emoji Picker Dropdown -->
                            <div id="emoji-picker" style="display: none;">
                                <ul id="emoji-list"></ul>
                            </div>
                            <div class="form-btn">
                                <button type="submit" class="btn btn-primary" id="sendStatus">
                                    <i class="ti ti-send"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- /Status -->
<script type="module" src="assets/js/firebase/firebaseStatus.js" crossorigin="anonymous"></script>
<script>
    const StatusUrl = "{{ route('user.status.upload') }}";
</script>
</div>
@endsection
