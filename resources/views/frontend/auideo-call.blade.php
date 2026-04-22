@php
    use Illuminate\Support\Facades\Session;

    $session = Session::get('username');
    $lang = !empty($session['language']) ? $session['language'] : 'En';
    $ul = custom_language($session['user'], $lang);
    $caller = request()->query('caller');
@endphp

<!-- Loader -->
<div class="page-loader">
    <div class="page-loader-inner">
        <div class="loader-box">
            @php
                $filePath = asset('uploads/website/' . env('DB_COMPANY_ICON'));
                $alter_img = asset('assets/img/logo.png');
            @endphp
            @if (File::exists(public_path('uploads/website/' . env('DB_COMPANY_ICON'))))
                <img src="{{ $filePath }}" alt="Company Icon">
            @else
                <img src="{{ $alter_img }}" alt="Loader">
            @endif
        </div>
    </div>
</div>

<!-- Hidden Inputs -->
<input id="appid" value="{{ env('DB_AGORA_APIID') }}">
<input id="caller" value="{{ request()->query('caller') }}">
<input id="current_user" value="{{ $session['user'] }}">

<!-- Main Wrapper -->
<div class="main-wrapper">
    <!-- Content -->
    <div class="content main_content">
        <div class="chat video-screen" id="middle">
            <div class="chat-header">
                <div class="user-details">
                    <h5>{{ $session['user'] }}</h5>
                </div>
            </div>
            <div class="chat-body">
                <h6>{{ $ul['audio-call']['close_chat'] ?? 'Close Chat' }}</h6>
            </div>
        </div>
    </div>
</div>


