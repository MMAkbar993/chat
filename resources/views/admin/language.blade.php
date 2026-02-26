@extends('admin.layout')

@section('content')
<!-- Page Wrapper -->
<div class="page-wrapper">
    <div class="content container-fluid">
        <!-- Page Header -->
        <div class="d-md-flex d-block align-items-center justify-content-between mb-4">
            <div class="my-auto">
                <h4 class="page-title mb-1">Language</h4>
                <nav>
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item">
                            <a href="{{ route('admin.index') }}"><i class="ti ti-home text-primary"></i></a>
                        </li>
                        <li class="breadcrumb-item"><a href="javascript:void(0);">System Settings</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Language</li>
                    </ol>
                </nav>
            </div>
        </div>
        <!-- Page Header -->

        <!-- Profile Settings -->
        <div class="card setting-card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="card d-inline-flex setting-header mb-3">
                            <div class="card-body d-flex align-items-center flex-wrap row-gap-2 p-0">
                                <a href="{{ route('admin.profile-settings') }}" class="ps-3"><i
                                        class="ti ti-settings-cog me-2"></i>General Settings</a>
                                <a href="{{ route('admin.app-settings') }}"><i class="ti ti-apps me-2"></i>App
                                    Settings</a>
                                <a href="{{ route('admin.system-settings') }}" class="active"><i
                                        class="ti ti-device-ipad-horizontal-cog me-2"></i>System Settings</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row gx-3">
                    <div class="col-xl-3 col-md-4">
                        <div class="card mb-3 mb-md-0">
                            <div class="card-body setting-sidebar">
                                <div class="d-flex">
                                    <a href="{{ route('admin.system-settings') }}" class="rounded flex-fill"><i
                                            class="ti ti-mail-cog me-2"></i>System Settings</a>
                                </div>
                                <div class="d-flex">
                                    <a href="{{ route('admin.language') }}" class="active rounded flex-fill"><i
                                            class="ti ti-language me-2"></i>Language</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-9 col-md-8">
                        <div class="card setting-content mb-0">
                            <div class="card-header px-0 mx-3">
                                <div class="row g-3 align-items-center">
                                    <div class="col-md-6 col-sm-4">
                                        <h4>Language</h4>
                                    </div>
                                    <div class="col-md-6 col-sm-8">
                                        <div
                                            class="d-flex justify-content-sm-end align-items-center flex-wrap row-gap-2">

                                            <a href="#" class="btn btn-primary me-3" data-bs-toggle="modal"
                                                data-bs-target="#addLanguageModal">Add Language</a>
                                            <a href="#" class="btn btn-primary me-3" data-bs-toggle="modal"
                                                data-bs-target="#keywordModal">
                                                Add Keyword</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body pb-0">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <div class="row align-items-center g-3">
                                            <div class="col-sm-8">
                                                <h6>Language List</h6>
                                            </div>
                                            <div class="col-sm-4">
                                                <div class="position-relative search-input">
                                                    <input type="text" class="form-control" placeholder="Search">
                                                    <div class="search-addon">
                                                        <span><i class="ti ti-search"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body p-0">
                                        <div class="table-responsive">
                                            <table class="table">
                                                <thead class="thead-light">
                                                    <tr>
                                                        <th class="no-sort">
                                                            <div class="form-check form-check-md">
                                                                <input class="form-check-input" type="checkbox"
                                                                    id="select-all">
                                                            </div>
                                                        </th>
                                                        <th>Language</th>
                                                        <th>Code</th>
                                                        <th>RTL</th>
                                                        <th>Default </th>
                                                        <th>Total</th>
                                                        <th>Done</th>
                                                        <th>Status</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- /Profile Settings -->
    </div>
</div>
<!-- /Page Wrapper -->

<!-- Delete Language Confirmation Modal -->
<div class="modal fade" id="deleteLanguageConfirmationModal" tabindex="-1"
    aria-labelledby="deleteLanguageConfirmationModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="deleteLanguageConfirmationModalLabel">Confirm Language Deletion</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                Are you sure you want to delete this language? This action cannot be undone.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmLanguageDeleteBtn">Delete</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="editLanguageModal" tabindex="-1" aria-labelledby="editLanguageModalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editLanguageModalLabel">Edit Language</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addLanguageForm">
                    <div class="mb-3">
                        <label for="editlanguageName" class="form-label">Language Name</label>
                        <input type="text" class="form-control" id="editlanguageName" required>
                    </div>
                    <div class="mb-3">
                        <label for="editlanguageCode" class="form-label">Language Code</label>
                        <input type="text" class="form-control" id="editlanguageCode" required>
                    </div>
                    <div class="mb-3">
                        <label for="editrtlStatus" class="form-label">RTL</label>
                        <input type="checkbox" class="form-check-input" id="editrtlStatus">
                    </div>
                    <div class="mb-3">
                        <label for="editdefaultStatus" class="form-label">Default</label>
                        <input type="checkbox" class="form-check-input" id="editdefaultStatus">
                    </div>
                </form>
                <div class="row g-3">
                    <div class="col-6">
                        <a href="#" class="btn btn-outline-primary w-100"
                            data-bs-dismiss="modal">{{ __('Cancel') }}</a>
                    </div>
                    <div class="col-6">
                        <button type="submit" class="btn btn-primary w-100"
                            id="editLanguageBtn">{{ __('Save') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="addLanguageModal" tabindex="-1" aria-labelledby="addLanguageModalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addLanguageModalLabel">Add New Language</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addLanguageForm">
                    <div class="mb-3">
                        <label for="languageName" class="form-label">Language Name</label>
                        <input type="text" class="form-control" id="languageName" required>
                    </div>
                    <div class="mb-3">
                        <label for="languageCode" class="form-label">Language Code</label>
                        <input type="text" class="form-control" id="languageCode" required>
                    </div>
                    <div class="mb-3">
                        <label for="rtlStatus" class="form-label">RTL</label>
                        <input type="checkbox" class="form-check-input" id="rtlStatus">
                    </div>
                    <div class="mb-3">
                        <label for="defaultStatus" class="form-label">Default</label>
                        <input type="checkbox" class="form-check-input" id="defaultStatus">
                    </div>
                </form>
                <div class="row g-3">
                    <div class="col-6">
                        <a href="#" class="btn btn-outline-primary w-100"
                            data-bs-dismiss="modal">{{ __('Cancel') }}</a>
                    </div>
                    <div class="col-6">
                        <button type="submit" class="btn btn-primary w-100"
                            id="saveLanguageBtn">{{ __('Save') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal" tabindex="-1" id="keywordModal" tabindex="-1" aria-labelledby="keywordModal"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="keywordModal">Enter Keyword</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    <i class="ti ti-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <label for="">Module Name</label>
                <input type="text" id="moduleInput" class="form-control mb-3" placeholder="Enter a Module">
                <label for="">Keyword</label>
                <input type="text" id="keywordInput" class="form-control mb-3" placeholder="Enter a keyword">
                <div class="row g-3">
                    <div class="col-6">
                        <a href="#" class="btn btn-outline-primary w-100"
                            data-bs-dismiss="modal">{{ __('Cancel') }}</a>
                    </div>
                    <div class="col-6">
                        <button type="submit" class="btn btn-primary w-100"
                            id="saveKeywordBtn">{{ __('Save') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Dynamically pass the URLs to JavaScript
    const webRoute = "{{ route('admin.language-web') }}";
    const adminRoute = "{{ route('admin.language-admin') }}";
</script>
<script type="module" src="{{ asset('assets/js/firebase/firebaseLanguage.js') }}" crossorigin="anonymous"></script>
@endsection