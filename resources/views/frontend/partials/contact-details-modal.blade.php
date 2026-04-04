{{-- Shared Contact Detail modal: must match firebaseContact.js / laravel-data-loaders.js field hooks (data-contact-row, data-field). --}}
<div class="modal fade" id="contact-details">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">{{ __('Contact Detail')}}</h4>
                <div class="d-flex align-items-center">
                    @if(empty($contactDetailSimpleMenu))
                    <div class="dropdown me-2">
                        <a class="d-block" href="#" data-bs-toggle="dropdown">
                            <i class="ti ti-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end p-3">
                            <li>
                                <a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#edit-contact"><i class="ti ti-edit me-2"></i>{{ __('Edit')}}</a>
                            </li>
                            <li><a class="dropdown-item" href="#" id="blockContactUserDropdownBtn"><i class="ti ti-user-off me-2"></i><span id="blockContactUserLabel">{{ __('Block')}}</span></a></li>
                            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#delete-contact"><i class="ti ti-trash me-2"></i>{{ __('Delete')}}</a></li>
                        </ul>
                    </div>
                    @endif
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
            </div>
            <div class="modal-body">
                <div class="card bg-light shadow-none">
                    <div class="card-body pb-1">
                        <input type="hidden" id="contact-detail-user-id" />
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center mb-3">
                                <span class="avatar avatar-lg">
                                    <img src="" class="rounded-circle" alt="img" id="contact-detail-avatar">
                                </span>
                                <div class="ms-2">
                                    <h6 id="contact-detail-name"></h6>
                                    <p class="mb-0 small text-muted" id="contact-detail-title" style="display: none;"></p>
                                </div>
                            </div>
                            <div class="contact-actions d-flex align-items-center gap-2 mb-3">
                                <a href="javascript:void(0);" class="btn btn-sm btn-outline-primary" id="contact-detail-chat-btn" title="{{ __('Chat') }}"><i class="ti ti-message"></i></a>
                                <a href="javascript:void(0);" class="btn btn-sm btn-outline-primary" id="contact-detail-voice-btn" title="{{ __('Voice Call') }}"><i class="ti ti-phone"></i></a>
                                <a href="javascript:void(0);" class="btn btn-sm btn-outline-primary" id="contact-detail-video-btn" title="{{ __('Video Call') }}"><i class="ti ti-video"></i></a>
                                @if(config('calls.provider') === 'meet')
                                <a href="https://meet.google.com/new" target="_blank" class="btn btn-sm btn-outline-primary" title="{{ __('Google Meet') }}"><img src="{{ asset('assets/img/icons/google-meet.svg') }}" alt="Google Meet" class="google-meet-icon"></a>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card border mb-3">
                    <div class="card-header border-bottom">
                        <h6 class="mb-0">{{ __('Personal Information')}}</h6>
                        <p class="text-muted small mb-0 mt-1">{{ __('Website verified via meta tag or approved for company representation') }}</p>
                    </div>
                    <div class="card-body pb-1">
                        <div class="mb-2">
                            <div class="row align-items-center contact-detail-row" data-contact-row="local_time">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-clock-hour-4 me-1"></i>{{ __('Local Time')}}</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="local_time">—</h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="dob" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-calendar-event me-1"></i>{{ __('Date of Birth')}}</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="dob">—</h6></div>
                            </div>
                            <div class="row align-items-center d-none"><div class="col-sm-6 d-none"><p class="mb-2 d-flex align-items-center"><i class="ti ti-phone me-1"></i>{{ __('Phone Number')}}</p></div>
                                <div class="col-sm-6 d-none"><h6 class="fw-medium fs-14 mb-2" data-field="phone">—</h6></div></div>
                            <div class="row align-items-center d-none"><div class="col-sm-6 d-none"><p class="mb-2 d-flex align-items-center"><i class="ti ti-mail me-1"></i>{{ __('Email')}}</p></div>
                                <div class="col-sm-6 d-none"><h6 class="fw-medium fs-14 mb-2" data-field="email">—</h6></div></div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="website" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-world me-1"></i>{{ __('Website')}}</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="website"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="bio" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-user-check me-1"></i>{{ __('Bio')}}</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="bio"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="location" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-map-pin me-1"></i>{{ __('Location')}}</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="location"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="join_date" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-calendar me-1"></i>{{ __('Join Date')}}</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="join_date"></h6></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card border mb-0" id="contact-details-social-card">
                    <div class="card-header border-bottom">
                        <h6 class="mb-0">{{ __('Social Information')}}</h6>
                        <p class="text-muted small mb-0 mt-1">{{ __('All social profiles are verified via OAuth unless otherwise stated.') }}</p>
                    </div>
                    <div class="card-body pb-1">
                        <div class="mb-2">
                            <div class="row align-items-center contact-detail-row" data-contact-row="facebook" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-facebook me-1"></i>Facebook</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="facebook"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="twitter" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-twitter me-1"></i>Twitter</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="twitter"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="instagram" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-instagram me-1"></i>Instagram</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="instagram"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="linkedin" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-linkedin me-1"></i>LinkedIn <i class="linkedin-info-icon" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ __('LinkedIn does not allow OAuth to verify profile') }}">i</i></p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="linkedin"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="youtube" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-youtube me-1"></i>YouTube</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="youtube"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="kick" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-device-gamepad-2 me-1"></i>Kick</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="kick"></h6></div>
                            </div>
                            <div class="row align-items-center contact-detail-row" data-contact-row="twitch" style="display: none;">
                                <div class="col-sm-6"><p class="mb-2 d-flex align-items-center"><i class="ti ti-brand-twitch me-1"></i>Twitch</p></div>
                                <div class="col-sm-6"><h6 class="fw-medium fs-14 mb-2" data-field="twitch"></h6></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
