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
                                    <h4>Language</h4>
                                </div>
                                <div class="card-body pb-0">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <div class="row align-items-center g-3">
                                                <div class="col-lg-6 col-sm-4">
                                                    <h6>Language<span id="language-name"></span></h6>
                                                </div>
                                                <div class="col-lg-6 col-sm-8">
                                                    <div class="d-flex align-items-center justify-content-sm-end">
                                                        <a href="{{ route('admin.language') }}"
                                                            class="btn btn-sm btn-primary d-inline-flex align-items-center me-3">
                                                            <i class="ti ti-arrow-left me-2"></i>
                                                            Back to Translations
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body p-0" id="keywords-list">
                                            <div class="table-responsive">

                                                <table class="table" id="keywords-table">
                                                    <thead class="thead-light">
                                                        <tr>
                                                            <th>Modules</th>
                                                            <th>Keywords</th>
                                                            <th>Translation</th>
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

    <!-- Modal for Adding Keywords -->
    <div class="modal" tabindex="-1" id="keywordModal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Enter Keyword</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input type="text" id="keywordInput" class="form-control" placeholder="Enter a keyword">
                    <div id="languagesDiv">
                        <!-- Dynamically populated languages checkboxes will go here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="saveKeywordBtn">Save Keyword</button>
                </div>
            </div>
        </div>
    </div>
<!-- Modal for editing keyword and translation -->
<div id="editModal" class="modal fade" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editModalLabel">Edit Keyword</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="editKeyword">Keyword</label>
                    <input type="text" class="form-control" id="editKeyword" placeholder="Enter keyword">
                </div>
                <div class="form-group">
                    <label for="editTranslation">Translation</label>
                    <input type="text" class="form-control" id="editTranslation" placeholder="Enter translation">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="saveChanges">Save changes</button>
            </div>
        </div>
    </div>
</div>
<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-labelledby="deleteConfirmationModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="deleteConfirmationModalLabel">Confirm Deletion</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          Are you sure you want to delete this keyword?
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
        </div>
      </div>
    </div>
  </div>
  
    <!-- /Page Wrapper -->
    <script type="module" src="{{ asset('assets/js/firebase/firebaseLanguageWeb.js') }}" crossorigin="anonymous"></script>
@endsection
