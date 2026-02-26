<?php 
    $caller = request()->get('caller');
    $currentUser = request()->get('currentuser');
    $channelName = request()->get('channelname');
    $callType = request()->get('call_type');
    $receiver = request()->get('receiver');
    $cid = request()->get('cid');
 ?>
  <input id="appid" type="hidden" placeholder="enter appid" value="{{ env('AGORA_APP_ID') }}">
    <input id="channel" type="hidden" placeholder="enter channel name" value="{{$channelName}}">
    <input id="call_type" type="hidden" plceholder="enter call type" value="{{$callType}}">
    <input id="caller" type="hidden" placeholder="" value="{{$caller}}">
    <input id="receiver" type="hidden" placeholder="" value="{{$receiver}}">
    <input id="current_user" type="hidden" placeholder="" value="{{$currentUser}}">
    <input id="cid" type="hidden" placeholder="" value="{{$cid}}">
    <input type="hidden" id="total_time1" value="0">
<!-- Main Wrapper -->
<div class="main-wrapper">

    <!-- content -->
    <div class="content main_content">
      
             <!-- Chat -->
            <div class="chat video-screen" id="middle">
                <div class="chat-header">
                    <div class="user-details">
                        <div class="d-lg-none">
                            <ul class="list-inline mt-2 me-2">
                                <li class="list-inline-item">
                                    <a class="text-muted px-0 left_side" href="#" data-chat="open">
                                        <i class="fas fa-arrow-left"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <figure class="avatar ms-1" id="caller-user-image">
                            <!-- <img src="assets/img/avatar/avatar-2.jpg" class="rounded-circle" alt="image"> -->
                        </figure>
                        <div class="mt-1">
                            <h5 id="callerUerName"></h5>
                            <small class="last-seen" id="mobileNumber">
                                <!-- 555-66-666-55 -->
                            </small>
                        </div>
                    </div>
                    <div class="chat-options chat-contact-list">
                        <ul class="list-inline">
                            <li class="list-inline-item">
                                <a class="btn btn-outline-light" href="#" data-bs-toggle="dropdown">
                                    <i class="bx bx-dots-vertical-rounded" ></i>
                                </a>
                                <div class="dropdown-menu dropdown-menu-end" >
                                    <a href="#" class="dropdown-item "><span><i class="bx bx-x" ></i></span>Close Chat</a>
                                    <a href="#" class="dropdown-item"><span><i class="bx bx-volume-mute"></i></span>Mute Notification</a>
                              
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="chat-body pt-4 pb-0">
                    <div class="video-screen-inner audio-screen-inner">
                        <div class="more-icon">
                            <a href="#" class="mic-off">
                                <i class="feather-mic-off"></i>
                            </a>
                        </div>
                        <div class="audio-call-group">
                            <div>
                                <figure class="avatar" id="rece-user-image">
                                    <!-- <img src="assets/img/avatar/avatar-2.jpg" class="rounded-circle" alt="image"> -->
                                </figure>
                                <h6 id="receuserName"></h6>
                                <span><input type="text" id="total_time" value="0" class="input-transparent" disabled></span>
                                <div class="record-time d-none">
                                    <span id="hour" class="timeel hours" style="display:none">00</span>
                                    <span id="min" class="timeel minutes" style="display:none">00</span>
                                    <span id="sec" class="timeel seconds" style="display:none">00</span>
                                </div>
                            </div>
                        </div>
                        <div class="video-call-action action-calls">
                            <ul class="center-action d-flex">
                                <!-- <li>
                                    <a class="mute-bt" href="javascript:void(0);" >
                                        <i class="feather-mic"  ></i>
                                    </a>
                                </li> -->

                                <li><a href="#" class="call-mute">
                                    <span id="mic-btn-unmute" class="material-icons" style="display:none">volumeoff</span>
                                    <span id="mic-btn-mute" class="material-icons" style="display:block">volumeup</span>
                                </a></li>
                                <li><a href="#" class="call-end" id="leave"><i class="feather-phone-off"  ></i></a></li>
                                <?php if($callType == 'video') { ?>
                                    <li><a href="#" class="call-mute">
                                        <span id="video-btn-unmute" class="material-icons" style="display:none">videocam_off</span>
                                        <span id="video-btn-mute" class="material-icons" style="display:block">videocam_up</span>
                                    </a></li>
                                <?php } ?>

                                <!-- <li >
                                    <a class="mute-video" href="javascript:void(0);">
                                        <i class="feather-video"  ></i>
                                    </a>
                                </li> -->
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /Chat -->

        </div> 
        <!-- /Content -->
        
    </div>
    <!-- /Main Wrapper -->
    <form id="join-form">
        <button id="join" type="submit" class="btn btn-primary btn-sm" style="display:none">Join</button>
    </form>
    <input type="hidden" id="appid" value="{{ env('AGORA_APP_ID') }}">
    <input type="hidden" id="appId" value="{{ env('APP_URL') }}" />
    <input type="hidden" id="baseUrl" value="{{ env('APP_URL') }}" />
    <input type="hidden" id="groupcallids" value="" />
 <script src="./calls/vendor/jquery-3.4.1.min.js"></script>
      <script src="./calls/vendor/bootstrap.bundle.min.js"></script>
      <script src="./calls/AgoraRTC_N-4.14.0.js"></script>
      <script src="./calls/index.js"></script>
      
<script type="text/javascript">
    $(document).ready(function(){
        document.getElementById("join").click();
    });
</script>
  