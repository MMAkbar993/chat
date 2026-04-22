import { initializeFirebase } from './firebase-user.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence, 
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    get,
    onValue,
    update,
    remove,
    set,
    onDisconnect,
    child,
    query, orderByChild, equalTo, onChildChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import {
    getFirestore,
    collection,
    getDocs,
    where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"; // Use this URL for Firestore
initializeFirebase(function (app, auth, database,storage) {
const secretKey = "89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6";

let currentUser = null; // Define the current user here
let selectedUserId = null; // Store the selected user ID
let currentUserId = null;


// Set session persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        
        // Auth state listener
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                currentUserId = user.uid;
                if (window.location.pathname === "/login") {
                    // Redirect to chat if they try to visit the login page while logged in
                    window.location.href = "/chat";
                }
            } else {
                if (window.location.pathname !== "/login") {
                    // Redirect to login if trying to access any other route
                    window.location.href = "/login";
                }
            }
        });
    })
    .catch((error) => {
       
    });



(function($) {
    "use strict";

    var baseUrl = $("#baseUrl").val();
    var currentuser = $('#current-user-number').val();
    // Initializes and creates emoji set from sprite sheet
    window.emojiPicker = new EmojiPicker({
        emojiable_selector: '[data-emojiable=true]',
        assetsPath: baseUrl + 'assets/img',
        popupButtonClasses: 'fa fa-smile-o'
    });

    // Finds all elements with `emojiable_selector` and converts them to rich emoji input fields
    // You may want to delay this step if you have dynamically created input fields that appear later in the loading process
    // It can be called as many times as necessary; previously converted input fields will not be converted again
    window.emojiPicker.discover();
    
    firebase.database().ref('data/users/' + currentuser).update({
        osType: "web"
    });
    firebase.database().ref("data/users/" + currentuser).once('value', function(snapshot) {
        if (snapshot.val().adminblock == true) {
            window.location.href = "logout";
        }
        if (snapshot.val().wallpaper) {
            //change chat wallpaper
            $("#middle").css('background-image', 'url('+snapshot.val().wallpaper+')');
        }
        else {
            $("#middle").css('background-image', '');
        }
    });
    $('#chat_messages , .emoji-wysiwyg-editor').on("keypress", function(e) {
        $('#chat_messages').val($('.emoji-wysiwyg-editor').html());
        var to_user = $("#to_user").val();

        firebase.database().ref('data/users/' + currentuser).update({
            typing: to_user
        });
        if (e.keyCode == 13) {
            sendMessage();
            return false; // prevent the button click from happening
        }
    });
    $('#chat_messages , .emoji-wysiwyg-editor').on("focusout", function(e) {
        firebase.database().ref('data/users/' + currentuser).update({
            typing: ''
        });
    });

    firebase.database().ref("data/contacts/" + currentuser).orderByChild("firstName").once('value', function(snapshot) {
        if(snapshot.val()) {
            snapshot.forEach(function(childSnapshot) {
                if(childSnapshot.val().isBlocked == undefined || childSnapshot.val().isBlocked == false) {
                    firebase.database().ref("data/users/" + childSnapshot.key).once('value', function(userSnapshot) {
                        if(userSnapshot.val() != null) {
                            var name = childSnapshot.val().firstName+' '+ childSnapshot.val().lastName;
                            $('<li class="user-list-item contact-user-list-item"><a href="javascript:;"><input type="hidden" id="email" value="'+childSnapshot.val().email+'"><div class="avatar"><img src="assets/img/user-placeholder.jpg" class="rounded-circle" alt="image"></div><div class="users-list-body"><div><h5>'+ name +'</h5><p>Active on ' + secondsToString(userSnapshot.val().timeStamp) + '</p></div></div><div class="notify-check parti-notify-check"><div class="form-check d-flex align-items-center justify-content-start ps-0"><label class="custom-check mt-0 mb-0"><input type="checkbox" name="mobileNumber[]" id="mobileNumber" value="'+childSnapshot.val().mobilenumber+'"><span class="checkmark"></span></label></div></div></a></li>').appendTo($('.contact-user-list'));
                        }
                    });
                }
            }); 
        } else {
            $('.empty-users-body').hide();
            $('.empty-users').removeClass('d-none');
        }
        
    });

    /*firebase.database().ref("data/users/").once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            if(childSnapshot.val().isDelted == undefined || snapshot.val().isDelted == false) {
                if(childSnapshot.val().id != currentuser) {
                    var name = childSnapshot.val().firstName+' '+ childSnapshot.val().lastName;
                    if(childSnapshot.val().firstName != undefined && childSnapshot.val().lastName != undefined) {
                        $('<li class="user-list-item contact-user-list-item"><a href="javascript:;"><input type="hidden" id="email" value="'+childSnapshot.val().email+'"><div class="avatar"><img src="assets/img/user-placeholder.jpg" class="rounded-circle" alt="image"></div><div class="users-list-body"><div><h5>'+ name +'</h5><p>Active on ' + secondsToString(childSnapshot.val().timeStamp) + '</p></div></div><div class="notify-check parti-notify-check"><div class="form-check d-flex align-items-center justify-content-start ps-0"><label class="custom-check mt-0 mb-0"><input type="checkbox" name="mobileNumber[]" id="mobileNumber" value="'+childSnapshot.val().id+'"><span class="checkmark"></span></label></div></div></a></li>').appendTo($('.contact-user-list'));
                    }
                }
            }
        }); 
    });*/



    window.onload = function() {
        var currentUser = $("#current-user-number").val();
        var baseUrl = $("#baseUrl").val();
        firebase.database().ref("data/users/" + currentUser).once('value', function(snapshot) {
            var userName = snapshot.val().firstName +' '+ snapshot.val().lastName;
            var name = (userName)?userName:'--';
            var userStatus = (snapshot.val().status)?snapshot.val().status:'--';
            var userDob = (snapshot.val().dob)?snapshot.val().dob:'DD MM YYYY';
            var userGender = (snapshot.val().gender)?snapshot.val().gender:'--';
            var userCountry = (snapshot.val().countryName)?snapshot.val().countryName:'--';
            var userImage = (snapshot.val().image)?snapshot.val().image: baseUrl+'assets/img/user-placeholder.jpg';

            $("#current-user-name").text(name);
            $("#current-user-status").text(userStatus);
            $("#current-user-dob").text(userDob);
            $("#current-user-gender").text(userGender);
            $("#current-user-country").text(userCountry);
            $("#current-user-profile").attr("src", userImage);
            $("#current-user-profile-left").attr("src", userImage);
        });

        if (envData.DB_INTERFACE_THEME == 'light'){
            $('body').removeClass('darkmode');  
        } else {
            $('body').addClass('darkmode');
        }
        var userList = $('.user-list-item').length;
        if(userList == 0) {
            /*$('#add-new-user').css('display', 'block');
            $('.chat-messages').css('display', 'none');*/
            $('.top-online-contacts').css('display', 'none');
            //$('.chat_sidebar').css('display', 'none');
       } else {
            //$('#add-new-user').css('display', 'none');
            //$('.chat-messages').css('display', 'block');
            $('.top-online-contacts').css('display', 'block');
            //$('.chat_sidebar').css('display', 'block');
        }
        setTimeout(removeLoader, 2500);
 
        function removeLoader(){
        $( "#page-loader" ).fadeOut(2500, function() {
            $( "#page-loader" ).hide(); 
        });
        }
        function removeLoaderSoon() {
            $("#page-loader").hide();
        }
        function starLoader() {
            $("#page-loader").show();
            $("#page-loader").fadeIn(); 
        }
        
        $('.fa-smile').on('click', function() {
            $(".emoji-menu").toggle();
        });
        $('.bx-smile').on('click', function() {
            $(".emoji-menu").toggle();
        });
        $(".user-list-item").remove();
        var i = 0;
        var currentuser = $('#current-user-number').val();
        var d = new Date();
        var n = d.getTime();
        firebase.database().ref('data/users/' + currentuser).update({
            timeStamp: n
        });
        $('.close_profile').trigger('click');
        //New Code
        firebase.database().ref("data/chats").on("child_added", function(snapshot) 
        {
            var string = snapshot.key;
            if (1) 
            {
                var imageval = baseUrl + 'assets/img/user-placeholder.jpg';;
                var substring = currentuser.slice(1);
                var substring1 = "roup";
                var username = '';
                if (string.indexOf(substring) !== -1 && string.indexOf(substring1) !== 1)
                {
                    var touser = string.replace(currentuser, "").replace("-", "");
            var usersRef = firebase.database().ref("data/users/" + touser);
            var contactsRef = firebase
              .database()
              .ref("data/contacts/" + currentuser + "/" + touser);

            usersRef.once("value", function (snapshot) {
              if (snapshot.val() != null) {
                if (
                  snapshot.val().isDeleted == null ||
                  snapshot.val().isDeleted == false
                ) {
                  if (snapshot.val() != null) {
                    // Check if user is in contacts and use the first name if available
                    contactsRef.once("value", function (contactSnapshot) {
                      if (
                        contactSnapshot.val() != null &&
                        contactSnapshot.val().firstName != undefined
                      ) {
                        username = contactSnapshot.val().firstName;
                      } else {
                        if (
                          snapshot.val().id == "" ||
                          snapshot.val().id == undefined
                        ) {
                          username = touser;
                        } else {
                          username = snapshot.val().id;
                        }
                      }

                      if (
                        snapshot.val().image == "" ||
                        snapshot.val().image == undefined
                      ) {
                        imageval = baseUrl + "assets/img/user-placeholder.jpg";
                      } else {
                        imageval = snapshot.val().image;
                      }

                      if (snapshot.val().online == true) {
                        var online_status = "avatar-online";
                      } else {
                        var online_status = "avatar-offline";
                      }

                      var to_div_time = touser.replace("+", "");
                      var divid = string.replace(/[.*+?^${}()|[\]\\]/g, "");
                      var msgcounttext = "";
                      var solochat = "";
                      firebase
                        .database()
                        .ref("data/users/" + currentuser)
                        .once("value", function (snapshot) {
                          if (snapshot.val()) {
                            var blockids = snapshot.val().blockedUsersIds;
                            if (blockids) {
                              if (jQuery.inArray(touser, blockids) !== -1) {
                                $("#liimg_" + to_div_time).attr(
                                  "src",
                                  baseUrl + "assets/img/user-placeholder.jpg"
                                );
                                $(".avimg_" + to_div_time).removeClass(
                                  online_status
                                );
                                $("#userlogin_time" + to_div_time).hide();
                                $("#userstatu_" + to_div_time).hide();
                              }
                            }
                            solochat = snapshot.val().solochat;
                            //get
                          }
                        });

                      var notlist = [];
                      //check solo chat
                      if (solochat) {
                        $.each(solochat, function (key, value) {
                          var time = new Date(parseInt(value.timeStamp));
                          //add one minute
                          time.setMinutes(time.getMinutes() + 1);
                          var timeStamp = time.getTime();
                          if (value.phoneNo == touser) {
                            firebase
                              .database()
                              .ref("data/chats/" + string)
                              .orderByChild("date")
                              .limitToLast(1)
                              .once("value", function (lchatshot) {
                                lchatshot.forEach(function (childSnapshot) {
                                  var childData = childSnapshot.val();
                                  if (timeStamp > childData.date) {
                                    notlist.push(string);
                                  }
                                });
                              });
                          }
                        });
                      }

                      if (notlist.indexOf(string) === -1) {
                        if ($("#sendclick_" + divid).length == 0) {
                          //$(".swiper-wrapper").empty();
                          //Online Users
                          if (snapshot.val().online == true) {
                            $(
                              '<div class="swiper-slide"><div class="top-contacts-box"><div class="profile-img online"><img src="' +
                                imageval +
                                '" alt=""></div></div></div>'
                            ).appendTo(".swiper-wrapper");
                          }

                          //user list
                          if (snapshot.val() != null) {
                            if (snapshot.val().status != null) {
                              var status = snapshot.val().status;
                            } else {
                              var status = "Hey! I am Available Now!!";
                            }
                          } else {
                            var status = "Hey! I am Available Now!!";
                          }

                          var reads = "";
                          var lastMsgName = "";

                          firebase
                            .database()
                            .ref("data/chats/" + string)
                            .orderByChild("date")
                            .limitToLast(1)
                            .once("value", function (lchatshot) {
                              if (lchatshot.exists()) {
                                lchatshot.forEach(function (childSnapshot) {
                                  if (childSnapshot.val().attachmentType != 3) {
                                    lastMsgName = childSnapshot.val().body;
                                  } else {
                                    lastMsgName =
                                      '<i class="bx bx-microphone me-1"></i>Audio';
                                  }

                                  if (childSnapshot.val().attachmentType == 2) {
                                    lastMsgName =
                                      '<i class="feather-image ms-1 me-1"></i>Photo';
                                  }

                                  if (childSnapshot.val().attachmentType == 1) {
                                    lastMsgName =
                                      '<i class="feather-video ms-1 me-1"></i>Video';
                                  }

                                  if (
                                    childSnapshot.val().body != undefined &&
                                    childSnapshot.val().attachmentType != 6
                                  ) {
                                    lastMsgName = "";
                                  }
                                  if (
                                    childSnapshot.val().body == undefined &&
                                    childSnapshot.val().attachmentType ==
                                      undefined
                                  ) {
                                    lastMsgName = "";
                                  }
                                  if (
                                    childSnapshot.val().delivered == false &&
                                    childSnapshot.val().readMsg == false
                                  ) {
                                    var msgStatus =
                                      '<div class="chat-pin"><i class="bx bx-check"></i></div>';
                                  } else if (
                                    childSnapshot.val().delivered == true &&
                                    childSnapshot.val().readMsg == false
                                  ) {
                                    var msgStatus =
                                      '<div class="chat-pin"><i class="bx bx-check-double"></i></div>';
                                  } else if (
                                    childSnapshot.val().delivered == true &&
                                    childSnapshot.val().readMsg == true
                                  ) {
                                    var msgStatus =
                                      '<div class="chat-pin"><i class="bx bx-check-double check"></i></div>';
                                  } else if (
                                    childSnapshot.val().delivered ==
                                      undefined &&
                                    childSnapshot.val().readMsg == undefined
                                  ) {
                                    var msgStatus = "";
                                  } else {
                                    var msgStatus =
                                      '<div class="chat-pin"><i class="bx bx-check"></i></div>';
                                  }

                                  firebase
                                    .database()
                                    .ref("data/chats/" + string)
                                    .once("value", function (gsnapshot) {
                                      var unreadMsgCounts = 0;
                                      gsnapshot.forEach(function (
                                        gchildSnapshot
                                      ) {
                                        if (
                                          gchildSnapshot.val().senderId ==
                                            touser &&
                                          gchildSnapshot.val().readMsg === false
                                        ) {
                                          unreadMsgCounts++;
                                        }
                                      });
                                      var msgTime = secondsToString(
                                        childSnapshot.val().date
                                      );
                                      if (unreadMsgCounts == 0) {
                                        var msgDetails = msgStatus;
                                      } else {
                                        var msgDetails =
                                          '<div class="new-message-count">' +
                                          unreadMsgCounts +
                                          "</div>";
                                      }
                                      $(
                                        '<li id="sendclick_' +
                                          divid +
                                          '" class="user-list-item"><a href="#" onclick="showchathistory(\'' +
                                          string +
                                          "','" +
                                          currentuser +
                                          "','" +
                                          touser +
                                          "', '" +
                                          username +
                                          '\',false);"><div class="avatar ' +
                                          online_status +
                                          '" ><img src="' +
                                          imageval +
                                          '" class="rounded-circle" alt="image"></div><div class="users-list-body"><div><h5 class="capitalize-first-letter">' +
                                          username +
                                          '</h5><p class="lastmsg_' +
                                          divid +
                                          '">' +
                                          lastMsgName +
                                          '</p></div><div class="last-chat-time lastmsgtime_' +
                                          divid +
                                          '"><small class="text-muted" id="lastmsgtime_' +
                                          divid +
                                          '">' +
                                          msgTime +
                                          "</small>" +
                                          msgDetails +
                                          "</div></div></li>"
                                      ).appendTo($(".recent-user-list"));
                                      if (i == 0) {
                                        //showchathistoryfirst(string, currentuser, touser, username, true);
                                      }
                                      i++;
                                    });
                                });
                              } else {
                                console.log(snapshot.val().date);

                                var msgTime = snapshot.val().date
                                  ? secondsToString(snapshot.val().date)
                                  : "";
                                var reads = "";
                                var lastMsgName = "";
                                //var unreadMsgCounts = 0;
                                var unreadMsgCounts =
                                  '<div class="last-chat-time lastmsgtime_' +
                                  divid +
                                  '"><small class="text-muted">' +
                                  msgTime +
                                  "</small></div>";

                                $(
                                  '<li id="sendclick_' +
                                    divid +
                                    '" class="user-list-item"><a href="#" onclick="showchathistory(\'' +
                                    string +
                                    "','" +
                                    currentuser +
                                    "','" +
                                    touser +
                                    "', '" +
                                    username +
                                    '\',false);"><div class="avatar ' +
                                    online_status +
                                    '" ><img src="' +
                                    imageval +
                                    '" class="rounded-circle" alt="image"></div><div class="users-list-body"><div><h5 class="capitalize-first-letter">' +
                                    username +
                                    '</h5><p class="lastmsg_' +
                                    divid +
                                    '">' +
                                    lastMsgName +
                                    "</p></div>" +
                                    unreadMsgCounts +
                                    "</div></li>"
                                ).appendTo($(".recent-user-list"));
                              }
                            });
                        }
                      }
                      if (i == 1) {
                        $(".status_update").remove();
                        $(".dream_profile_menu").trigger("click");
                        showchathistory(
                          string,
                          currentuser,
                          touser,
                          username,
                          true
                        );
                      }
                    });
                  } else {
                    username = touser;
                    var online_status = "avatar-offline";
                  }
                }
              }
            });
                } 
                /*else {
                   $('.chat_sidebar').hide();
                   $('.chat-messages').empty();
                   $('<div class="status-right"><div class="empty-dark-img"><img src="assets/img/empty-img-dark.png" alt="Image"></div><div class="select-message-box"><h4>Select Message</h4><p>To see your existing conversation or share a link below to start new</p><a href="javascript:;" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#new-chat"><i class="bx bx-plus me-1"></i>Add New Message</a></div></div>').appendTo($('.chat-messages'));
                }*/
            }
        });

        firebase.database().ref("data/chats").on("child_removed", function(snapshot) {
            var string = snapshot.key;
            var divid = string.replace(/[.*+?^${}()|[\]\\]/g, "");
            $('#sendclick_' + divid).remove();
        });
    }
    //New User Search
   /* $("#search-contacts-user").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        $(".contact-user-list li").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });*/

    $("#search-contacts-user").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        var $contactList = $(".contact-user-list");
        var $searchResults = $contactList.find("li");

        $searchResults.filter(function() {
            var shouldShow = $(this).text().toLowerCase().indexOf(value) > -1;
            $(this).toggle(shouldShow);
        });

        // Check if there are visible search results
        var anyVisible = $searchResults.is(":visible");
        // Hide the target element if there are no visible results
        if (!anyVisible) {
            $('#add-new-friend').addClass('disabled'); // Replace with the ID of the element to hide
        } else {
            $('#add-new-friend').removeClass('disabled'); // Replace with the ID of the element to hide
        }
    });

    //Chat Details Search
    $("#chat-search").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        $(".recent-user-list li").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });

    //Forward User List Search
    $("#search-contacts").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        $(".forward-message-users-list .recent-block-group").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });


    $("#show_timer").hide();
    $("#chat_cal").show();
    var d = new Date();
    var n = d.getTime();
    firebase.database().ref('data/users/' + currentuser).update({
        timeStamp: n
    });
    /*** After successful authentication, show user interface ***/
    var showUI = function() {}
    var currentuser = $('#current-user-number').val();
    var phonenumber = currentuser.slice(1);

    function insertcalldetails(from, to, stext, isVideo) {
        var d = new Date();
        var n = d.getTime();
        var from = '+' + from;
        var to = '+' + to;
        var myRef = firebase.database().ref("data/calls/" + from).push();
        myRef.set({
            "callerId": to,
            "callerImg": "",
            "callerName": to,
            "currentMills": n,
            "inOrOut": stext,
            "isVideo": isVideo,
            "userId": from,
            "id": myRef.key
        });
        showcallhistory(from, to);
        return myRef.key;
    }
    firebase.database().ref("data/call_flag").on("child_added", function(snapshot) {
        if (currentuser == '+' + snapshot.val().to) {
            if (snapshot.val().isVideo == true) {
                $("#videodiv").show();
                $("#mode_of_call").val("video");
            } else {
                $("#videodiv").hide();
                $("#mode_of_call").val("voice");
            }
        }
    });
    /*** Create audio elements for progresstone and incoming sound */
    const audioProgress = document.createElement('audio');
    const audioRingTone = document.createElement('audio');
    const audioIncoming = document.createElement('audio');
    const videoIncoming = document.getElementById('videoincoming');
    const videoOutgoing = document.getElementById('videooutgoing');
    /*** Define listener for managing calls ***/
    var to = $("#to_call_user").val();
    /*** Log out user ***/
    $('button#logOut').on('click', function(event) {
        event.preventDefault();
        clearError();
        //Remember to destroy / unset the session info you may have stored
        delete localStorage[sessionName];
        //Allow re-login
        $('button#loginUser').attr('disabled', false);
        $('button#createUser').attr('disabled', false);
        //Reload page.
        window.location.reload();
    });
    var handleError = function(error) {
        //$('#voice_call').modal("hide");	
        firebase.database().ref("data/call_flag").remove();
    }
    //file attachment 
    //var obj = $("#drop-zone");
    var obj = $("#drop-zone-status");
    obj.on('dragenter', function(e) {
        e.stopPropagation();
        e.preventDefault();
        // $(this).css('border', '2px solid #0B85A1');
    });
    obj.on('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
    obj.on('drop', function(e) {
        //  $(this).css('border', '2px dotted #0B85A1');
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files;
        var valflag = validateFile(files);
        if (valflag) {
            handleFileUpload(files, obj);
        } else {
            toastr.warning("Select Only valid File!");
        }
        //We need to send dropped files to Server
    });
    $(document).on('dragenter', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(document).on('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        // obj.css('border', '2px dotted #0B85A1');
    });
    $(document).on('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
    // automatically submit the form on file select
    //$('#drop-zone-file').on('change', function(e) {
    $('#send-attachement').on('click', function(e) {
        var files = $('#user-status')[0].files;
        if(files) {
            var valflag = validateFile(files);
            if (valflag) {
                handleFileUpload(files, obj);
            } else {
                toastr.warning("Select Only valid File!");
            }
        } else {
            toastr.warning("Please select an attachment!");
        }
    });
    
})(jQuery);

"use strict";

function phoneNumberValid(phoneNumber) {
    var pattern = /^\+[0-9\s\-\(\)]+$/;
    return phoneNumber.search(pattern) !== -1;
}

function addFriend() {
    
    //var country_code = $("#newfriend").intlTelInput("getSelectedCountryData").dialCode;
    var currentuser = $("#current-user-number").val();
    //var frienduser = $("#newfriend").val();
    var frienduser = $('#mobileNumber:checked').val();
    var d = new Date();
    var n = d.getTime();
    //alert(frienduser); return false; 
    if (!frienduser) 
    {
        toastr.warning("Please select atleast one contact user!");
    }
    else if (currentuser == frienduser) {
        toastr.warning("You cannot enter your number!");
    }
    else 
    {
        if (!phoneNumberValid(frienduser)) 
        {
            toastr.warning("Please Enter Vaild Number!");
        } 
        else 
        {
            //check user available in dreamchat
            firebase.database().ref("data/users").orderByChild('id').equalTo(frienduser).once('value', function(checkusershot) 
            {
                if (checkusershot.exists()) 
                {
                    var userId = currentuser + '-' + frienduser;
                    var usersRef = firebase.database().ref("data/chats/");
                    usersRef.once('value', function(snapshot) {
                        if (snapshot.child(userId).exists() == false) 
                        {
                            var userIdrReverse = frienduser + '-' + currentuser;
                            usersRef.once('value', function(snapshot) {
                                if (snapshot.child(userIdrReverse).exists() == false) {
                                    var addNewChat = firebase.database().ref("data/chats/" + userId).push();
                                    addNewChat.set({
                                        "date": n
                                    });
                                    toastr.success("This Contact Added Successfully!");
                                    //window.location.href = baseUrl+'single_chat/'+encodeURIComponent(frienduser);
                                    window.location.href = baseUrl+'home';
                                } else {
                                    if (snapshot.child(userIdrReverse).val()!=true) {
                                        toastr.warning("This Contact Already Exists");
                                    }
                                    else {
                                        //window.location.href = baseUrl+'single_chat/'+encodeURIComponent(frienduser);
                                        window.location.href = baseUrl+'home';
                                    }
                                }
                            });
                        } 
                        else 
                        {
                            toastr.warning("Already This Contact Added!");
                        }
                    });
                    $('#chat-new').modal('hide');
                    $("#newfriend").val('');
                    //
                }
                else
                {
                    toastr.warning("Sorry there is no user available");
                }
            });
            
        }
    }
}

function showchathistoryfirst(combination, from, to, username, intflag) {
    $("#user_groupdiv").attr('class', '');
    var main_div_group = to.replace('+', '');
    $("#user_groupdiv").addClass("messages main_" + main_div_group);
    $('#from_user').val(from);
    $('#to_user').val(to);
    $('#username').val(username);
    $('#combination_user').val(combination);
    $(".chats").remove();
    $('#selected_usertime').text("");
    var messagecnt = 0;
    firebase.database().ref("data/chats/" + combination).on("child_added", function(snapshot) 
    {
        firebase.database().ref('data/chats/' + combination + '/' + snapshot.key).update({
            id: snapshot.key
        });
        /*if (snapshot.val().body && snapshot.val().attachmentType == 6) {
            var msgdisplay = snapshot.val().body;
        } else if(snapshot.val().attachmentType != 2) {
                var msgdisplay =  '<a href="' + snapshot.val().attachment.url + '" download target="_blank"></a>';
        } else {
            var msgdisplay = '<img src="'+snapshot.val().attachment.url+'" alt="" style=width:100px; height:100px;>';
        }*/

        if (snapshot.val().body && snapshot.val().attachmentType == 9) {
                if(snapshot.val().isurl && snapshot.val().isurl == true) {
                    var messageUrl = snapshot.val().body;

                    msgdisplay = '<a href = "'+messageUrl+'" target="_blank">'+messageUrl;
                    if(snapshot.val().urlImageurl != "") { 
                        msgdisplay += '<br><img src="'+snapshot.val().urlImageurl+'" alt="" style=width:100px; height:100px;>';
                    }
                    if(snapshot.val().urlTitle != "" || snapshot.val().urlDescription != "") { 
                        var urlDescriptions = (snapshot.val().urlTitle)?snapshot.val().urlTitle:snapshot.val().urlDescription;
                        msgdisplay += '<br><h7 class="card-title">'+snapshot.val().urlTitle+'</h7>';
                    }
                    msgdisplay += '</a>';
                } else {
                    msgdisplay = snapshot.val().body;
                }
            }  else if (snapshot.val().body && snapshot.val().attachmentType == 6) {
                if(snapshot.val().isForward == true) {
                    msgdisplay = '<div class="message-content reply-getcontent"><div class="forward-msg"><i class="bx bx-share me-1"></i>Forwarded</div>'+ snapshot.val().body +'</div>';
                } else if(snapshot.val().isReply == true) {
                    var replyMsg = snapshot.val().replyContent;
                    var splitMsg = replyMsg.split(',');
                    var replyContent = splitMsg[0];
                    var user = splitMsg[1];
                    msgdisplay = '<div class="message-content reply-getcontent"><div class="replay-msg mb-1">'+ replyContent +'</div>'+ snapshot.val().body +'</div>';
                } else {
                    msgdisplay = snapshot.val().body;
                }
            } else if(snapshot.val().attachmentType == 1 || snapshot.val().attachmentType == 5) {
                msgdisplay = '<div class="file-download d-flex align-items-center mb-0"><div class="file-type d-flex align-items-center justify-content-center me-2"><i class="bx bxs-file-doc"></i></div><div class="file-details"><span class="file-name">'+snapshot.val().attachment.name+'</span><ul><li>'+snapshot.val().attachment.bytesCount+' bytes</li><li><a target="_blank" href="'+snapshot.val().attachment.url+'">Download</a></li></ul></div></div>';
            } else if(snapshot.val().attachmentType == 3) {
                //msgdisplay = '<div class="chat-voice-group"><ul><li><a href="' + snapshot.val().attachment.url + '" target="_blank"><span><img src="assets/img/icon/play-01.svg" alt="image"></span></a></li><li><img src="assets/img/voice.svg" alt="image"></li></ul></div>';
                msgdisplay = '<audio id="audioPlayer" controls><source src="' + snapshot.val().attachment.url + '" type="audio/mp3">Audion Play</audio>';
            } else {
                if(snapshot.val().attachment != undefined){
                    msgdisplay = '<div class="download-col"><ul class="nav mb-0"><li><div class="image-download-col"><a href="' + snapshot.val().attachment.url + '" data-fancybox="gallery" class="fancybox" download target="_blank"><img src="'+snapshot.val().attachment.url+'" alt=""></a></div></ul></div>';
                }
            }
        if (snapshot.val().statusUrl) {
            var statuscontent = "<img src='" + snapshot.val().statusUrl + "' style='width:45px;height:45px' /><br>";
        } else {
            var statuscontent = '';
        }
        if (snapshot.val().delivered == false && snapshot.val().readMsg == false) {
            messagecnt++;
            var tickimg = 'single-tick.png';
        } else if(snapshot.val().delivered == true && snapshot.val().readMsg == false) {
            var tickimg = 'grey-tick.png';
        } else if (snapshot.val().delivered == true && snapshot.val().readMsg == true) {
            
            var tickimg = 'double-tick.png';
        } else {
           var tickimg = 'single-tick.png';
        }

        if (snapshot.val().delete != from) {
            if (snapshot.val().senderId == from) {
                $('<div class="chats chats-right"><div class="chat-content"><div class="message-content 1">' + statuscontent + msgdisplay + '<div class="chat_dropdown"><a href="#" data-toggle="dropdown" aria-expanded="false"><i class="fas fa-ellipsis-v ellipse_header"></i></a><div class="dropdown-menu dropdown-menu-right header_drop_icon" style=""><a class="dropdown-item" data-keyboard="false" onclick="deleteselectedchat(\'' + snapshot.val().id + '\', \'me\')">Delete For Me</a><a href="#" class="dropdown-item" onclick="deleteselectedchat(\'' + snapshot.val().id + '\', \'all\')">Delete For All</a></div></div></div><div class="chat-time"><div><div class="time">' + secondsToString(snapshot.val().date) + ' <i><img id="' + snapshot.key + 'img" src="assets/img/' + tickimg + '" alt=""></i></div></div></div></div></div>').appendTo($('.main_' + main_div_group)).addClass('new');
                $('.message-input').val(null);
            } else {
                if (snapshot.val().blocked == false) {
                    if (snapshot.val().senderId == $('#to_user').val()) {
                        var toid = snapshot.val().senderId;
                        var divid = toid.replace(/[.*+?^${}()|[\]\\]/g, "");
                        var usersRef = firebase.database().ref("data/users/" + toid);
                        usersRef.once('value', function(usersnapshot) {
                            var imagevalusr = baseUrl + 'assets/img/user-placeholder.jpg';
                            if (usersnapshot.val() != null) {
                                if (usersnapshot.val().image != "" && usersnapshot.val().image != "undefined") {
                                    imagevalusr = usersnapshot.val().image;
                                }
                                $('#img_pro_' + divid + snapshot.key).attr('src', imagevalusr);
                            }
                        });
                        firebase.database().ref('data/chats/' + combination + '/' + snapshot.key).update({
                            readMsg: true
                        });
                        $('<div class="chats"><div class="chat-avatar"><img id="img_pro_' + divid + snapshot.key + '"  src="' + baseUrl + 'assets/img/user-placeholder.jpg" class="rounded-circle dreams_chat" alt="image"></div><div class="chat-content"><div class="message-content 2">' + statuscontent + msgdisplay + '<div class="chat_dropdown"><a href="#" data-toggle="dropdown" aria-expanded="false"><i class="fas fa-ellipsis-v ellipse_header"></i></a><div class="dropdown-menu dropdown-menu-right header_drop_icon" style=""><a class="dropdown-item" data-keyboard="false" onclick="deleteselectedchat(\'' + snapshot.val().id + '\', \'me\')">Delete For Me</a><a class="dropdown-item" data-keyboard="false" onclick="confirmreportcheck()">Report<input type="checkbox" class="smsg" msgtype="received" value="'+snapshot.val().id+'" style="display:none;"/></a></div></div></div><div class="chat-time"><div><div class="time">' + secondsToString(snapshot.val().date) + '</div></div></div></div><div class="chat-action-btns"><ul><li><a href="#" class="share-msg" title="Share"><i class="fas fa-share"></i></a></li><li><a href="#" class="edit-msg"><i class="fas fa-edit"></i></a></li><li><a href="#" class="del-msg"><i class="fas fa-trash-alt"></i></a></li></ul></div></div>').appendTo($('.main_' + main_div_group)).addClass('new');
                    }
                }
            }
        }
        firebase.database().ref('data/chats/' + combination + '/' + snapshot.key).on("child_changed", function(snapshotc) {
            if (snapshotc.key == 'readMsg' && snapshotc.val() == true) {
                $('#' + snapshot.key + 'img').attr("src", "assets/img/double-tick.png");
            }
        });
    });

    firebase.database().ref("data/users/" + to).on("child_changed", function(snapshot) {
        if (snapshot.key == 'typing' && snapshot.val() == currentuser) {
            var to_div_time = to.replace('+', '');
            $('.time_cls' + to_div_time).text('typing...');
        } else {
            var to_div_time = to.replace('+', '');
            $('.time_cls' + to_div_time).text($('#userlogin_time' + to_div_time).text());
        }
    });
    firebase.database().ref("data/users/" + to).on("child_changed", function(snapshot) {
        if (snapshot.key == 'typing' && snapshot.val() == currentuser) {
            var to_div_time = to.replace('+', '');
            $('.time_cls' + to_div_time).text('typing...');
        } else {
            var to_div_time = to.replace('+', '');
            $('.time_cls' + to_div_time).text($('#userlogin_time' + to_div_time).text());
        }
    });
    //$('.chat-body').mCustomScrollbar({theme:'dark'}).mCustomScrollbar("scrollTo","bottom",{scrollInertia:0});
    //$('.chat-body').mCustomScrollbar().mCustomScrollbar("scrollTo","bottom",{scrollInertia:0});
    //scrollOnBottom();
}

function clearChat() {
    $('#clear-chat').modal('show');
}
function clearUserChat() {
    var combination = $('#combination_user').val();
    var currentuser = $('#current-user-number').val();
    var from = $('#from_user').val();
    var to = $('#to_user').val();
    var username = $('#username').val();
    var adaRef = firebase.database().ref("data/chats/" + combination);
    adaRef.once("value", function(snapshot) {
        snapshot.forEach(function(child) {
            if (child.val().delete == "") {
                child.ref.update({
                    delete: currentuser
                });
            } else {
                if (child.val().delete != "") {
                    firebase.database().ref("data/chats/" + combination + '/' + child.key).remove();
                }
            }
        });
        showchathistory(combination, from, to, username);
        $('#clear-chat').modal('hide');
        $('#delete-chat').hide();
        toastr.success("Chat Deleted Successfully!");
        setTimeout(function() {
            window.location.reload();
          }, 2000);

    });
    var chatRef = firebase.database().ref("data/chats/");
    chatRef.once('value', function(snapshot) {
        if (snapshot.child(combination).exists() != true) {
            firebase.database().ref("data/chats/" + combination).set(true);
        }
    });

}

function blockUserModal() {
    $('#block-user').modal('show');
    var toUserName = $('#selected_username').text();
    $('#block-user-name').text('Block '+toUserName);

}

function block_chat() {
    var combination = $("#combination_user").val();
    var from = $("#from_user").val();
    var to = $("#to_user").val();
    var username = $("#username").val();
    var blockedusername = $(".profile-name").text();
    var block_ids = [];
    
    firebase.database().ref("data/users/" + from).once("value", function (snapshot) {
      if (snapshot.val()) {
        if (snapshot.val().blockedUsersIds) {
          block_ids = snapshot.val().blockedUsersIds;
        }
        
        if (block_ids.includes(to)) {
          toastr.error("This user is already blocked.");
          return;
        }
        
        block_ids.push(to);
        
        firebase.database().ref("data/users/" + from).update({
          blockedUsersIds: block_ids,
        });
  
        showchathistory(combination, from, to, username);
        $("#block-user").modal("hide");
        toastr.success("You have blocked the user successfully!");
      }
    });
  }

function unblock_chat() {
    swal({
        title: "Unblock Confirmation",
        text: "Are you sure want to unblock this user?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    }).then((willDelete) => {
        if (willDelete) {
            var combination = $('#combination_user').val();
            var from = $('#from_user').val();
            var to = $('#to_user').val();
            var username = $('#username').val();
            var block_ids = [];
            firebase.database().ref("data/users/" + from).once('value', function(snapshot) {
                if (snapshot.val()) {
                    if (snapshot.val().blockedUsersIds) {
                        block_ids = snapshot.val().blockedUsersIds;
                    }
                    block_ids.pop(to);
                    firebase.database().ref('data/users/' + from).update({
                        blockedUsersIds: block_ids
                    });
                    showchathistory(combination, from, to, username);
                    toastr.success("You have Unblocked Successfully!!");
                }
            });
        }
    });
}

$(document).on('click','.users-list-body div',function(){
    $("#drop-zone-file").val(''); 
    $('.chat_form').empty();
});

function showchathistory(combination, from, to, username, intflag) {
    $('.chat-messages').removeClass('d-none');
    $('.fav-title').removeClass('d-none');
    $('.recent-chats').removeClass('d-none');
    $('#home-sidebar').removeClass('d-none');
    $('.status-middle-bar').remove();
    //$('#add-new-user').css('display', 'none');
    //$('.chat-messages').css('display', 'block');
    var currentuser = $('#current-user-number').val();
    var currentUserName = $('#current-user').val();
    if ($(window).width() < 992) {
        $(document).on('click','.user-list-item',function(){
            $('.left-sidebar').addClass('hide-left-sidebar');
            $('.right-sidebar').addClass('hide-right-sidebar');
            $('.chat').addClass('show-chatbar');
            $('.chat').removeClass('hide-chatbar');

        });
        $('.right-sidebar').removeClass('show-right-sidebar');
        $('.right-sidebar').addClass('hide-right-sidebar');
        $('.chat').removeClass('hide-chatbar');
        // $('.chat').addClass('show-chatbar');
    }
    $('.right-sidebar').addClass('hide-right-sidebar');
    $("#user_groupdiv").attr('class', '');
    $("#sidebar_blockid").attr('class', '');
    $("#sidebar_muteid").attr('class', '');
    $("#selected_usertime").attr('class', '');
    $('#selected_userimage').attr('class', '');
    $('#sidestatus').attr('class', '');
    var main_div_group = to.replace('+', '');
    $("#user_groupdiv").addClass("messages main_" + main_div_group);
    $('#from_user').val(from);
    $('#to_user').val(to);
    $('#username').val(username);
    $('#combination_user').val(combination);
    $(".chats").remove();
    $(".media-image").remove();
    $('#selected_usertime').text("");

    //Shared Media - Documents Tab
    $('#media').empty();
    $('#media').hide();
    $('#nav-home-tab').hide();

    //Shared Media - Link Tab
    $('#link').empty();
    $('#link').hide();
    $('#nav-profile-tab1').hide();

    //Shared Media - Video Tab
    $('#attachment-documents').empty();
    $('#attachment-documents').hide();
    $('#nav-profile-tab2').hide();

    //Shared Media - Images Tab
    $('#side_media_list').empty();
    $('#side_media_list').hide();
    $('#nav-profile-tab3').hide();

    //Shared Media - All Tabs
    $('.share-media').hide();
    
    var d = new Date();
    var n = d.getTime();

    firebase.database().ref("data/chats/" + combination).once('value', function(snapshot) {
       
        $(".chats").remove();
        $(".media-image").remove();
        snapshot.forEach(function(childSnapshot) {
           
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            var msgdisplay = ''; 
            var forwardMsg = '';
            var replyMsg = '';

            if (childSnapshot.val().body && childSnapshot.val().attachmentType == 9) {
                if(childSnapshot.val().isurl && childSnapshot.val().isurl == true) {
                    var messageUrl = childSnapshot.val().body;

                    msgdisplay = '<a href = "'+messageUrl+'" target="_blank">'+messageUrl;
                    if(childSnapshot.val().urlImageurl != "") { 
                        msgdisplay += '<br><img src="'+childSnapshot.val().urlImageurl+'" alt="" style=width:100px; height:100px;>';
                    }
                    if(childSnapshot.val().urlTitle != "" || childSnapshot.val().urlDescription != "") { 
                        var urlDescriptions = (childSnapshot.val().urlTitle)?childSnapshot.val().urlTitle:childSnapshot.val().urlDescription;
                        msgdisplay += '<br><h7 class="card-title">'+childSnapshot.val().urlTitle+'</h7>';
                    }
                    msgdisplay += '</a>';
                } else {
                    msgdisplay = childSnapshot.val().body;
                }
            }  else if (childSnapshot.val().body && childSnapshot.val().attachmentType == 6) {
                if(childSnapshot.val().isForward == true) {
                    msgdisplay = '<div class="message-content reply-getcontent"><div class="forward-msg"><i class="bx bx-share me-1"></i>Forwarded</div>'+ childSnapshot.val().body +'</div>';
                } else if(childSnapshot.val().isReply == true) {
                    var replyMsg = childSnapshot.val().replyContent;
                    var splitMsg = replyMsg.split(',');
                    var replyContent = splitMsg[0];
                    var user = splitMsg[1];
                    msgdisplay = '<div class="message-content reply-getcontent"><div class="replay-msg mb-1">'+ replyContent +'</div>'+ childSnapshot.val().body +'</div>';
                } else {
                    msgdisplay = childSnapshot.val().body;
                }
            } else if(childSnapshot.val().attachmentType == 1) { 
                msgdisplay = '<video id="videoPlayer" controls><source src="' + childSnapshot.val().attachment.url + '" type="video/mp4">Video Play</video>';
            } else if(childSnapshot.val().attachmentType == 5) {
                msgdisplay = '<div class="file-download d-flex align-items-center mb-0"><div class="file-type d-flex align-items-center justify-content-center me-2"><i class="bx bxs-file-doc"></i></div><div class="file-details"><span class="file-name">'+childSnapshot.val().attachment.name+'</span><ul><li>'+childSnapshot.val().attachment.bytesCount+' bytes</li><li><a target="_blank" href="'+childSnapshot.val().attachment.url+'">Download</a></li></ul></div></div>';
            } else if(childSnapshot.val().attachmentType == 3) {
                msgdisplay = '<audio id="audioPlayer" controls><source src="' + childSnapshot.val().attachment.url + '" type="audio/mp3">Audion Play</audio>';
            }  else if(childSnapshot.val().attachmentType == 0) {
                if(childSnapshot.val().attachment != undefined) {
                    msgdisplay = msgdisplay = childSnapshot.val().attachment.name;
                }
            } else if(childSnapshot.val().attachmentType == 4) {
                var data = childSnapshot.val().attachment.data;
                var locationData = JSON.parse(data)
                var latitude = locationData.latitude;
                var longitude = locationData.longitude;
                var googleMapsUrl = "https://www.google.com/maps?q=" + latitude + "," + longitude;
                msgdisplay = '<a href="' + googleMapsUrl + '" download target="_blank">Current Location</a>';
            } else {
                if(childSnapshot.val().attachment != undefined){
                    msgdisplay = '<div class="download-col"><ul class="nav mb-0"><li><div class="image-download-col"><a href="' + childSnapshot.val().attachment.url + '" data-fancybox="gallery" class="fancybox" download target="_blank"><img src="'+childSnapshot.val().attachment.url+'" alt=""></a></div></ul></div>';
                }
            }
            if (childSnapshot.val().statusUrl) {
                var statuscontent = "<img src='" + childSnapshot.val().statusUrl + "' style='width:45px;height:45px' /><br>";
            } else {
                var statuscontent = '';
            }
            if (childSnapshot.val().delivered == false && childSnapshot.val().readMsg == false) {
                var messageStatus = '<div class="chat-pin"><i class="bx bx-check"></i></div>';
            } else if(childSnapshot.val().delivered == true && childSnapshot.val().readMsg == false) {
                var messageStatus = '<div class="chat-pin"><i class="bx bx-check-double"></i></div>';
            } else if (childSnapshot.val().delivered == true && childSnapshot.val().readMsg == true) {
                var messageStatus = '<div class="chat-pin"><i class="bx bx-check-double check"></i></div>';
            } else {
               var messageStatus = '<div class="chat-pin"><i class="bx bx-check"></i></div>';
            }
            if (intflag == false && childSnapshot.val().senderId == $('#to_user').val()) {
                firebase.database().ref('data/chats/' + combination + '/' + childSnapshot.key).update({
                    readMsg: true,
                    delivered: true,
                    //deliveredTime: n,
                    //readTime: n
                });
            }

            if(childSnapshot.val().date == 0) {
                var dateWithTime = '<div class="chat-line"><span class="chat-date">Today, July 24</span></div>';
            } else {
                var dateWithTime = '';
            }

            if (childSnapshot.val().delete != from) {
                if(childSnapshot.val().attachmentType != undefined) {
                   if(childSnapshot.val().attachmentType == 6) {
                        var forwardMsgName = childSnapshot.val().body;
                        var forwardMsgBytes = '';
                        var forwardMsgUrl = '';
                        var forwardMsgType = childSnapshot.val().attachmentType;
                    } else {
                        if(childSnapshot.val().attachment != undefined) {
                            var forwardMsgName = childSnapshot.val().attachment.name;
                            var forwardMsgBytes = childSnapshot.val().attachment.bytesCount;
                            var forwardMsgUrl = childSnapshot.val().attachment.url;
                            var forwardMsgType = childSnapshot.val().attachmentType;
                        } else {
                            var forwardMsgName = childSnapshot.val().body;
                            var forwardMsgBytes = '';
                            var forwardMsgUrl = '';
                            var forwardMsgType = childSnapshot.val().attachmentType;
                        }
                        
                    } 
                } else {
                    var forwardMsgName = '';
                    var forwardMsgBytes = '';
                    var forwardMsgUrl = '';
                    var forwardMsgType = '';
                }

                var sentTime = secondsToString(childSnapshot.val().date);
                var deliveredTime = (childSnapshot.val().deliveredTime)?secondsToString(childSnapshot.val().deliveredTime):'--';
                var readTime = (childSnapshot.val().readTime)?secondsToString(childSnapshot.val().readTime):'--';

                if (childSnapshot.val().senderId == from) {
                    $(''+dateWithTime+'<div class="chats chats-right"><div class="chat-avatar"><img id="img_pro_' + divid + childSnapshot.key + '" src="assets/img/user-placeholder.jpg" class="rounded-circle dreams_chat" alt="image"></div><div class="chat-content"><div class="chat-profile-name"><h6 class="capitalize-first-letter">'+ currentUserName +'<span>' + secondsToString(childSnapshot.val().date) + '</span></h6><div class="chat-action-btns ms-3"><div class="chat-action-col"><a class="#" href="#" data-bs-toggle="dropdown"><i class="bx bx-dots-horizontal-rounded"></i></a><div class="dropdown-menu chat-drop-menu dropdown-menu-end" ><a href="#" class="dropdown-item message-info-left" onclick="msgInfo(\''+ sentTime +'\', \''+ deliveredTime +'\', \''+ readTime +'\',);"><span><i class="bx bx-info-circle"></i></span>Message Info </a><a href="#" class="dropdown-item reply-button" onclick="replyMessages(\''+forwardMsgType+'\', \''+forwardMsgName+'\',\''+forwardMsgBytes+'\',\''+forwardMsgUrl+'\', \''+childSnapshot.val().senderId+'\')";><span><i class="bx bx-share"></i></span>Reply</a><a href="#" class="dropdown-item" onclick="forwardMessages(\''+forwardMsgType+'\',\''+forwardMsgName+'\',\''+forwardMsgBytes+'\',\''+forwardMsgUrl+'\')";><span><i class="bx bx-reply"></i></span>Forward</a><a href="#" class="dropdown-item" onclick="deletechat(\'' + childSnapshot.val().id + '\', \'me\')"><span><i class="bx bx-trash"></i></span>Delete</a></div></div></div></div><div class="message-content mb-2">'+ statuscontent + (typeof msgdisplay === 'object' ? JSON.stringify(msgdisplay) : msgdisplay) + messageStatus + '</div></div></div>').appendTo($('.main_' + main_div_group)).addClass('new');
                        var usersRef = firebase.database().ref("data/users/" + from);
                        usersRef.once('value', function(usersnapshot) {
                            var imagevalusr = baseUrl + 'assets/img/user-placeholder.jpg';
                            if (usersnapshot.val() != null) {
                                if (usersnapshot.val().image != "" && usersnapshot.val().image != undefined) {
                                    imagevalusr = usersnapshot.val().image;
                                }
                                $('#img_pro_' + divid + childSnapshot.key).attr('src', imagevalusr);
                            }
                        });
                    $('.message-input').val(null);
                } else {
                    if (childSnapshot.val().blocked == false) {
                        var current_user = $('#sidephone').text();
                        var toUserName = $('#selected_username').text(username);
                       var toid = childSnapshot.val().senderId;
                        //if(current_user == toid) {
                        //
                        //if(childSnapshot.val().senderId == $('#to_user').val() && currentuser == from) {
                            var divid = toid.replace(/[.*+?^${}()|[\]\\]/g, "");
                            var appendata = ''+dateWithTime+'<div class="chats"><div class="chat-avatar"><img id="img_pro_' + divid + childSnapshot.key + '" src="assets/img/user-placeholder.jpg" class="rounded-circle dreams_chat" alt="image"></div><div class="chat-content"><div class="chat-profile-name"><h6 class="receiverName capitalize-first-letter"></h6><span>' + secondsToString(childSnapshot.val().date) + '</span><div class="chat-action-btns ms-3"><div class="chat-action-col"><a class="#" href="#" data-bs-toggle="dropdown"><i class="bx bx-dots-horizontal-rounded"></i></a><div class="dropdown-menu chat-drop-menu dropdown-menu-end" ><a href="#" class="dropdown-item message-info-left" onclick="msgInfo(\''+ sentTime +'\', \''+ deliveredTime +'\', \''+ readTime +'\',);"><span><i class="bx bx-info-circle"></i></span>Message Info </a><a href="#" class="dropdown-item reply-button" onclick="replyMessages(\''+forwardMsgType+'\', \''+forwardMsgName+'\',\''+forwardMsgBytes+'\',\''+forwardMsgUrl+'\',\''+childSnapshot.val().body+'\',\'' + toUserName + '\')";><span><i class="bx bx-share"></i></span>Reply</a><a href="#" class="dropdown-item" onclick="forwardMessages(\''+forwardMsgType+'\',\''+forwardMsgName+'\',\''+forwardMsgBytes+'\',\''+forwardMsgUrl+'\')";><span><i class="bx bx-reply"></i></span>Forward</a><a href="#" class="dropdown-item" onclick="confirmreport(\'' + childSnapshot.val().id + '\')"><span><i class="bx bx-dislike"></i></span>Report</a><a href="#" class="dropdown-item" onclick="deletechat(\'' + childSnapshot.val().id + '\', \'others\')"><span><i class="bx bx-trash"></i></span>Delete</a></div></div></div></div><span class="forward-messages"><div class="message-content mb-2">'+ statuscontent + (typeof msgdisplay === 'object' ? JSON.stringify(msgdisplay) : msgdisplay) + forwardMsg + replyMsg +'</div></span></div></div>';
                            $(appendata).appendTo($('.main_' + main_div_group)).addClass('new');
                            var usersRef = firebase.database().ref("data/users/" + toid);
                            usersRef.once('value', function(usersnapshot) {
                                var imagevalusr = baseUrl + 'assets/img/user-placeholder.jpg';
                                var receiverName = '';
                                if (usersnapshot.val() != null) {
                                    if (usersnapshot.val().image != "" && usersnapshot.val().image != undefined) {
                                        imagevalusr = usersnapshot.val().image;
                                    }
                                    $('#img_pro_' + divid + childSnapshot.key).attr('src', imagevalusr);
                                    if(usersnapshot.val().firstName != '' || usersnapshot.val().firstName != undefined) {
                                        receiverName = usersnapshot.val().firstName;
                                    }
                                    
                                    $('.receiverName').text(receiverName);
                                }
                            });
                        //}
                    }
                }
            //} 
                //Shared Images
                if (childSnapshot.val().attachment != undefined && childSnapshot.val().attachmentType == 2 && childSnapshot.val().blocked == false) {
                    $('.share-media').show();
                    $('#side_media_list').show();
                    $('#nav-home-tab').show();
                    $('<li><a href="' + childSnapshot.val().attachment.url + '" data-fancybox="gallery" class="fancybox"><img src="' + childSnapshot.val().attachment.url + '" alt=""></a></li>').appendTo($('#side_media_list'));
                }
                //Shared Documents
                if (childSnapshot.val().attachment != undefined && childSnapshot.val().attachmentType == 5 && childSnapshot.val().blocked == false) {
                    $('.share-media').show();
                    $('#media').show();
                    $('#nav-profile-tab2').show();
                    var attachmentFile = childSnapshot.val().attachment.url;
                    

                    // Extract the file name
                    var fileName = attachmentFile.substring(attachmentFile.lastIndexOf('/') + 1);

                    // Split the file name by dot (.) to get the file extension
                    var fileExtension = fileName.split('.').pop();
                    var fileMatch = fileExtension.match(/(.+)\?(.+)/);
                    
                    if(fileMatch[1] == 'doc' || fileMatch[1] == 'docx') {
                        var fileType = '<i class="bx bxs-file-doc"></i>';
                    } else if(fileMatch[1] == 'pdf') {
                        var fileType = '<i class="bx bxs-file-pdf"></i>';
                    } else if(fileMatch[1] == 'txt') {
                        var fileType = '<i class="bx bxs-file"></i>';
                    } else {
                        var fileType = '<i class="bx bxs-file-doc"></i>';
                    }
                    
                    $('<div class="media-file"><div class="media-doc-blk"><span>'+ fileType +'</span><div class="document-detail"><h6>'+childSnapshot.val().attachment.name+'</h6><ul><li>'+secondsToString(childSnapshot.val().date)+'</li><li>'+childSnapshot.val().attachment.bytesCount +' bytes</li></ul></div></div><div class="media-download"><a href="'+ childSnapshot.val().attachment.url +'" download target="_blank"><i class="bx bx-download"></i></a></div>').appendTo($('#media'));
                }

                //Shared Links
                if (childSnapshot.val().attachmentType == 9 && childSnapshot.val().blocked == false) {
                    $('.share-media').show();
                    $('#link').show();
                    $('#nav-profile-tab3').show();
                    if(childSnapshot.val().isurl && childSnapshot.val().isurl == true) {
                        $('<div class="media-link-grp mb-0"><div class="link-img"><a href="'+ childSnapshot.val().body +'"><img src="'+ childSnapshot.val().urlImageurl +'" alt="Img" style="height: 30px; width: 60px;"></a></div><div class="media-link-detail"><h6><a href="'+ childSnapshot.val().body +'">'+ childSnapshot.val().urlTitle +'</a></h6><span><a href="javascript:;">'+ childSnapshot.val().body +'</a></span></div></div>').appendTo($('#link'));
                    } 
                }

                //Shared Videos
                if (childSnapshot.val().attachment != undefined && childSnapshot.val().attachmentType == 1 && childSnapshot.val().blocked == false) {
                    $('.share-media').show();
                    $('#attachment-documents').show();
                    $('#nav-profile-tab1').show();
                    $('<li><a href="'+ childSnapshot.val().attachment.url +'" data-fancybox class="fancybox" target="_blank"><img src="assets/img/media/media-01.jpg" alt="img"><span><i class="bx bx-play-circle"></i></span></a></li>').appendTo($('#attachment-documents'));
                }
            }
        });
        var numItems = $('.media-image').length;
        $('#sidemedia_count').text($("#lbl_media").val()+' (' + numItems + ')');
    });
    var to_div_time = to.replace('+', '');
    $('#selected_usertime').addClass("text-muted mb-2 time_cls" + to_div_time);
    $('#sidebar_blockid').addClass("block-user mt-1 block_cls" + to_div_time);
    $('#sidebar_muteid').addClass("mute-user mt-1 mute_cls" + to_div_time);
    $('#sidestatus').addClass("text-muted text-center mt-1 status_cls" + to_div_time);
    $('#selected_userimage').addClass("avatar ml-1 pimg_cls" + to_div_time);
    $('#selected_username').text(username);
    //rightside profile
    $('.profile-name').text(username);
    $('#sidephone').text(to);
    $('#sidestatus').text('');
    firebase.database().ref("data/users/" + to).once('value', function(snapshot) {
        var imageval = baseUrl + 'assets/img/user-placeholder.jpg';
        if (snapshot.val() && to == $('#to_user').val()) {
            $(".status_cls" + to_div_time).text(snapshot.val().status);
            $("#sideemail").text(snapshot.val().email);
            if (snapshot.val().image && snapshot.val().image != "" && snapshot.val().image != undefined) {
                imageval = snapshot.val().image;
            }
            $('#selected_usertime').text(secondsToString(snapshot.val().timeStamp));
            $('#liimg_' + to_div_time).attr('src', imageval);
            $('.pimg_cls' + to_div_time).html('<img src="' + imageval + '" class="rounded-circle" alt="image">');
            $('#sideprofileimg').html($('.pimg_cls' + to_div_time).html());
        } else {
            $('.pimg_cls' + to_div_time).html('<img src="' + imageval + '" class="rounded-circle" alt="image">');
            $('#sideprofileimg').html($('.pimg_cls' + to_div_time).html());
        }
    });
    $(".time_cls" + to_div_time).show();
    $(".status_cls" + to_div_time).show();
    $("#userlogin_time" + to_div_time).show();
    $("#userstatu_" + to_div_time).show();
    firebase.database().ref("data/users/" + from).once('value', function(snapshot) {
        if (snapshot.val()) {
            var blockids = snapshot.val().blockedUsersIds;
            var muteids = snapshot.val().mutedUsersIds;
            $(".block_cls" + to_div_time).html('<a href="#" class="block_link" onclick="block_chat()"><i class="fas fa-ban mr-2 text-muted"></i>'+$("#lbl_block").val()+'</a>');

            $(".mute_cls" + to_div_time).html('<a href="#" class="mute_link" onclick="mute_user()"><i class="fas fa-bell mr-2 text-muted"></i><span>'+$("#lbl_mute").val()+'</span></a>');

            if (muteids) {
                if (jQuery.inArray(to, muteids) !== -1) {
                    $(".mute_cls" + to_div_time).html('<a href="#" class="unmute_link" onclick="unmute_user()"><i class="fas fa-bell-slash mr-2 text-muted"></i><span>'+$("#lbl_unmute").val()+'</span></a>');
                }
            }
            if (blockids) {
                if (jQuery.inArray(to, blockids) !== -1) {
                    $(".block_cls" + to_div_time).html('<a href="#" class="unblock_link" onclick="unblock_chat()"><i class="fas fa-unlock mr-2 text-muted"></i>'+$("#lbl_unblock").val()+'</a>');
                    var imageval = baseUrl + 'assets/img/user-placeholder.jpg';
                    $('.pimg_cls' + to_div_time).html('<img src="' + imageval + '" class="rounded-circle" alt="image">');
                    $('#liimg_' + to_div_time).attr('src', imageval);
                    $('#sideprofileimg').html($('.pimg_cls' + to_div_time).html());
                    $(".time_cls" + to_div_time).hide();
                    $(".status_cls" + to_div_time).hide();
                    $("#userlogin_time" + to_div_time).hide();
                    $("#userstatu_" + to_div_time).hide();
                }
            }
        }
    });
    //scrollOnBottom();
}
var hr = 0;
var min = 0;
var sec = 0;
var cycle = '';
function calltimerdiv() {
    sec = parseInt(sec);
    min = parseInt(min);
    hr = parseInt(hr);

    var hour = document.getElementById("hours_id");
    var mint = document.getElementById("minutes_id");
    var secd = document.getElementById("seconds_id");

    sec = sec + 1;

    if (sec == 60) {
        min = min + 1;
        sec = 0;
    }
    if (min == 60) {
        hr = hr + 1;
        min = 0;
        sec = 0;
    }

    if (sec < 10 || sec == 0) {
        sec = '0' + sec;
    }
    if (min < 10 || min == 0) {
        min = '0' + min;
    }
    if (hr < 10 || hr == 0) {
        hr = '0' + hr;
    }
    hour.innerHTML = hr;
    mint.innerHTML = min;
    secd.innerHTML = sec;
    var call_duration = document.getElementById("call_duration");
    if (call_duration) {
        call_duration.value = hr+':'+min+':'+sec;
    }
    cycle = setTimeout(calltimerdiv, 1000);
}

function deletechat(chatKey, msgType) {
    $("#delete-message").modal('show');
    if (msgType === 'others') {
        $('input[name="deleteType[]"][value="all"]').parent().hide();
    } else {
        // If it's not 'others', show the checkbox
        $('input[name="deleteType[]"][value="all"]').parent().show();
    }
    $('#deleteMsgKey').val(chatKey);
}
function setcalltimerzero() {
    var hr = 0;
    var min = 0;
    var sec = 0;
    var cycle = '';
}
function setTime() {
    ++totalSeconds;
    $("#seconds_id").text(pad(totalSeconds % 60));
    $("#minutes_id").text(pad(parseInt(totalSeconds / 60)));
}

function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}

function secondsToString(millis) {

    var currentDate = new Date();
    var timestampDate = new Date(millis);

    var formattedDate = formatDate(timestampDate);
    var todayDate = formatDate(currentDate);

    var todaysDate = new Date(todayDate);
    var pastDate = new Date(formattedDate);

    var date1 = todaysDate.getTime();
    var date2 = pastDate.getTime();

    // Compare the current date with the timestamp date
    if (date1 > date2) {
        var formattedDate = formatDateWithCustomFormat(timestampDate);
        var strOut = formattedDate;
    } else if (date1 < date2) {
        var formattedDate = formatDateWithCustomFormat(timestampDate);
        var strOut = formattedDate;
    } else {
        var data = new Date(parseInt(millis));
        var data1 = data.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
        var strOut = data1;
    }

    return strOut;
}

 function formatDate(date) {
      var day = date.getDate();
      var month = date.getMonth() + 1; // Months are 0-based
      var year = date.getFullYear();

      // Add leading zeros if needed
      if (day < 10) day = '0' + day;
      if (month < 10) month = '0' + month;

      return month + '-' + day + '-' + year;
    }

function formatDateWithCustomFormat(date) {
      var months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      var day = date.getDate();
      var monthIndex = date.getMonth();
      var year = date.getFullYear();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // Handle midnight (12:00) as 12 AM
      minutes = minutes < 10 ? "0" + minutes : minutes;

      return (
        day + "-" + months[monthIndex] + "-" + year + " " +
        hours + ":" + minutes + " " + ampm
      );
    }

function timeToDayConversion(millis) {
    var fltYearDays = 356.2425;
    var intMonthSeconds = (fltYearDays / 12) * 86400;
    var intSecondsDifference = Math.floor(((new Date()).getTime() / 1000) - millis / 1000);
    var strOut = '',
        blFuture = intSecondsDifference < 0;
    if (intSecondsDifference < 60) {
        if (!blFuture &&
            intSecondsDifference < 10) {
            return 'Just now';
        } else {
            return blFuture ? 'In a moment' : 'A moment ago';
        }
    } else if (intSecondsDifference < 120) {
        return (blFuture) ? 'In an minute' : 'A minute ago';
    } else if (intSecondsDifference < 3600) {
        strOut = Math.floor(intSecondsDifference / 60) + ' minutes';
    } else if (intSecondsDifference < 7200) {
        return (blFuture) ? 'In an hour' : 'An hour ago';
    } else if (intSecondsDifference < 86400) {
        strOut = Math.floor(intSecondsDifference / 3600) + ' hours';
    } else if (intSecondsDifference < 172800) {
        return (blFuture) ? 'Tomorrow' : 'Yesterday';
    } else if (intSecondsDifference < intMonthSeconds) {
        strOut = Math.floor(intSecondsDifference / 86400) + ' days';
    } else if (intSecondsDifference < intMonthSeconds * 2) {
        return (blFuture) ? 'In a month' : 'A month ago';
    } else if (intSecondsDifference < fltYearDays * 86400) {
        strOut = Math.floor(intSecondsDifference / intMonthSeconds) + ' months';
    } else if (intSecondsDifference < fltYearDays * 86400 * 2) {
        return (blFuture) ? 'In a year' : 'A year ago';
    } else {
        strOut = Math.floor(intSecondsDifference / (fltYearDays * 86400)) + ' years';
    }
    return (blFuture) ? 'In ' + strOut : strOut + ' ago';
}

function thumbnailPreviewImg(messageUrl) {
    var getData = '';
    $.ajax({
        async: false,
        url: 'home/initializeDom',
        type: 'POST',
        data: {url: messageUrl},
        dataType: 'json',
        success: function (response) {
            getData = response;
        }
    });
    return getData;
}

function sendMessage() {
    
    var no_of_unblock_link = $('.unblock_link').length;
    if (no_of_unblock_link) {
        toastr.success("Unblock User to Send Message!");
        return false;
    }
    //var message = $("#chat_messages").val();
    var message = document.getElementById("chat_messages").value;
    var thumbnailImg = '';
    var previewTitle = '';
    var previewImages = '';
    var previewOgImages = '';
    var previewDescription = '';
    const isValidUrl = urlString=> {
        var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
        '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
      return !!urlPattern.test(urlString);
    }

    if(isValidUrl(message) == true) {
        var isurl = true; //Link
        var attachmentType = 9; //Link
        thumbnailImg = thumbnailPreviewImg(message);
        previewTitle = (thumbnailImg.title)?thumbnailImg.title:'';
        previewOgImages = thumbnailImg.ogimage;
        previewImages = thumbnailImg.images;
        previewDescription = (thumbnailImg.description)?thumbnailImg.description:'';
    } else {
        var isurl = false; //Normal Message
        var attachmentType = 6;
    }

    if (message == '') {
        toastr.warning("Type Message...!");
        return false;
    }
    var from = $("#from_user").val();
    var to = $("#to_user").val();
    var combination = $("#combination_user").val();
    var username = $("#username").val();
    var d = new Date();
    var n = d.getTime();
    var blocked = false;
    var readmsg = false;

    $('#last_message').val(message);
    $('#last_message_time').val(n);
    //alert(username);  

    //return false;
     firebase.database().ref("data/users/" + from).once('value', function(usersnapshot) {
        if (usersnapshot.val()) {
            if (usersnapshot.val().blockedUsersIds) {
                blockids = usersnapshot.val().blockedUsersIds;
                if (jQuery.inArray(to, blockids) !== -1) {
                    toastr.warning("Unblock User to Send Message!");
                    return false;
                    blocked = true;
                    readmsg = false;
                     return false;
                }
            } else {}
        }
    
    
    firebase.database().ref("data/users/" + to).once('value', function(usersnapshot) {
        if (usersnapshot.val()) {
            if (usersnapshot.val().blockedUsersIds) {
                blockids = usersnapshot.val().blockedUsersIds;
                if (jQuery.inArray(from, blockids) !== -1) {
                    toastr.warning("Unblock User to Send Message!");
                    return false;
                    blocked = true;
                    readmsg = false;
                }
            } else {}
        }
   
//var newRef1 = firebase.database().ref("data/chats/" + combination).push();

        var myRef = firebase.database().ref("data/chats/" + combination).push(); 
        myRef.set({
        
            "attachmentType": attachmentType,
            "blocked": blocked,
            "body": message,
            "date": n,
            "delete": "",
            "delivered": false,
            "id": myRef.key,
            "readMsg": readmsg,
            "recipientId": to,
            "replyId": "0",
            "selected": false,
            "senderId": from,
            "senderName": username,
            "sent": true,
            "isForward": false,
            "isReply": false,
            "replyContent": "",
            "isurl": isurl,
            "urlDescription": previewDescription,
            "urlImageurl": (previewOgImages) ? previewOgImages : previewImages,
            "urlTitle": previewTitle,
            "deliveredTime": "",
            "readTime": ""
        });

        if(usersnapshot.val().online == true) {
            firebase.database().ref('data/chats/' + combination + '/' + myRef.key).update({
                delivered: true,
                deliveredTime: n
            });
        }
        var check_mute = 0;
        firebase.database().ref("data/users/" + from).once('value', function(usersnapshot) {
            var muteids = usersnapshot.val().mutedUsersIds;
            if (muteids) {
                if (jQuery.inArray(to, muteids) !== -1) {
                    check_mute = 1;
                }
            }
        });

        var lastMsgName = '';
        if (attachmentType != 3) {
            lastMsgName = $('#last_message').val();
        } else {
            lastMsgName = '<i class="bx bx-microphone me-1"></i>Audio';
        }

        if(attachmentType == 2) {
            lastMsgName = '<i class="feather-image ms-1 me-1"></i>Photo';
        }
        var divid = combination.replace(/[.*+?^${}()|[\]\\]/g, ""); 
        $(".lastmsg_"+divid).text(lastMsgName);

        var showtime = secondsToString(n);
        $('.lastmsgtime_' + divid).text(showtime);

        //check muted user
        if (check_mute == 0) {
            firebase.database().ref("data/users/" + to).once('value', function(usersnapshot) {
                if (usersnapshot.val().deviceToken) {
                    $.ajax({
                        url: 'home/usernotification',
                        type: 'POST',
                        data: {
                            deviceToken: usersnapshot.val().deviceToken,body:message,to:to,osType:usersnapshot.val().osType,attachimg:message,from:from,attachmentType:'text'
                        },
                        success: function(data) {
                        }
                    });
                }
                    
            });
        }
        var j = 0;
        $('#chat_messages').val("");
        $('.emoji-wysiwyg-editor').html("");
        return false;
    });
    });
}

function validateFile(files) {
    var allowedExtension = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'mpg', 'mov', 'wmv', 'rm', '3g2', '3gp', 'm2v', 'm4v', 'wav', 'aif', 'mp3', 'mp4', 'mid', 'doc', 'pdf', 'docx', 'xls', 'xlsx', 'csv'];
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileExtension = file.name.split('.').pop().toLowerCase();
        if (jQuery.inArray(fileExtension, allowedExtension) === -1) {
            return false;
        }
    }
    return true;
}

function handleFileUpload(files, obj) {
    for (var i = 0; i < files.length; i++) {
        var fd = new FormData();
        fd.append('file', files[i]);
        fireBaseImageUpload({
            'file': files[i],
            'path': '/Dreamchat'
        }, function(data) {
            if (!data.error) {
                if (data.progress) {
                    // progress update to view here
                }
                if (data.downloadURL) {
                    // update done
                    // download URL here "data.downloadURL"
                }
            } else {
            }
        });
        $("#drop-zone-file").val('');
    }
};

function fireBaseImageUpload(parameters, callBackData) {
    // expected parameters to start storage upload
    var file = parameters.file;
    var path = parameters.path;
    var name;
    //just some error check
    if (!file) {
        callBackData({
            error: 'file required to interact with Firebase storage'
        });
    }
    if (!path) {
        callBackData({
            error: 'Node name required to interact with Firebase storage'
        });
    }
    var metaData = {
        'contentType': file.type
    };
    var arr = file.name.split('.');
    var fileSize = (file.size); // get clean file size (function below)
    var fileType = file.type;
    var fileExt = file.name.split('.').pop().toLowerCase();
    var n = (+new Date()) + '-' + file.name;
    // generate random string to identify each upload instance
    name = generateRandomString(12); //(location function below)
    //var fullPath = path + '/' + name + '.' + arr.slice(-1)[0];
    var checktypeflag = getFileType(fileType, fileExt);
    var subpath = '';
    var atttype = '';
    if (checktypeflag == 1) {
        subpath = '/Video';
        atttype = 'Video';
    } else if (checktypeflag == 2) {
        subpath = '/Image';
        atttype = 'Image';
    } else if (checktypeflag == 3) {
        subpath = '/Audio';
        atttype = 'Audio';
    } else if (checktypeflag == 5) {
        subpath = '/Document';
        atttype = 'Document';
    } else if (checktypeflag == 8) {
        subpath = '/Recording';
        atttype = 'Recording';
    }
    var fullPath = path + subpath + '/' + n;
    var uploadFile = storageRef.child(fullPath).put(file, metaData);
    // first instance identifier
    callBackData({
        id: name,
        fileSize: fileSize,
        fileType: fileType,
        fileName: n
    });
    uploadFile.on('state_changed', function(snapshot) {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progress = Math.floor(progress);
        callBackData({
            progress: progress,
            element: name,
            fileSize: fileSize,
            fileType: fileType,
            fileName: n
        });
    }, function(error) {
        callBackData({
            error: error
        });
    }, function() {
        var downloadURL = uploadFile.snapshot.downloadURL;
        if (checktypeflag != 'other') {
            sendAttacheMessage(checktypeflag, downloadURL, n, fileSize,atttype);
        }
        callBackData({
            downloadURL: downloadURL,
            element: name,
            fileSize: fileSize,
            fileType: fileType,
            fileName: n
        });
    });
}

function sendAttacheMessage(checktypeflag, downloadURL, name, fileSize,atttype) {
    var no_of_unblock_link = $('.unblock_link').length;
    if (no_of_unblock_link) {
        toastr.warning("Unblock User to Send Message!");
        return false;
    }
    var from = document.getElementById("from_user").value;
    var to = document.getElementById("to_user").value;
    var combination = document.getElementById("combination_user").value;
    var d = new Date();
    var n = d.getTime();
    var blocked = false;
    var readmsg = false;
    firebase.database().ref("data/users/" + to).once('value', function(usersnapshot) {
        if (usersnapshot.val()) {
            if (usersnapshot.val().blockedUsersIds) {
                blockids = usersnapshot.val().blockedUsersIds;
                if (jQuery.inArray(from, blockids) !== -1) {
                    toastr.warning("Unblock User to Send Message!");
                    return false;
                    blocked = true;
                    readmsg = false;
                }
            } else {}
        }
    
var myRef1 = firebase.database().ref("data/chats/" + combination).push(); 
    myRef1.set({
        "attachment": {
            "bytesCount": fileSize,
            "name": name,
            "url": downloadURL
        },
        "attachmentType": checktypeflag,
        "blocked": blocked,
        "date": n,
        "delete": "",
        "delivered": true,
        "id": myRef1.key,
        "readMsg": readmsg,
        "recipientId": to,
        "replyId": "0",
        "selected": false,
        "senderId": from,
        "senderName": from,
        "sent": true,
        "statusUrl": ""
    });
    
    firebase.database().ref("data/users/" + to).once('value', function(usersnapshot) {
        
        $.ajax({
                url: 'home/usernotification',
                type: 'POST',
                data: {
                    deviceToken: usersnapshot.val().deviceToken,body:atttype,to:to,osType:usersnapshot.val().osType,attachimg:downloadURL,from:from,attachmentType:checktypeflag
                },
                success: function(data) {
                }
            });
            
       
    });
    
    
    $('#drag_files').modal('hide');
    $("#drop-zone-filesss").val('');
    $("#previewImage").remove();
    return false;
    });
}

function getFileType(fileType, fileExt) {
    var iallowedExtension = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
    var vallowedExtension = ['mpg', 'mov', 'wmv', 'rm', '3g2', '3gp', 'm2v', 'm4v', 'mp4'];
    var aallowedExtension = ['wav', 'aif', 'mp3', 'mid'];
    var dallowedExtension = ['doc', 'pdf', 'docx', 'xls', 'xlsx', 'csv'];
    if (jQuery.inArray(fileExt, iallowedExtension) !== -1)
        return 2;
    if (jQuery.inArray(fileExt, vallowedExtension) !== -1)
        return 1;
    if (jQuery.inArray(fileExt, aallowedExtension) !== -1)
        return 3;
    if (jQuery.inArray(fileExt, dallowedExtension) !== -1)
        return 5;
    return 'other';
}

function generateRandomString(length) {
    var chars = "abcdefghijklmnopqrstuvwxyz";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Byte';
    var k = 1000;
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
function scrollOnBottom() {
    var messageBody = document.querySelector('#mCSB_2_container');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    $(".chat-body").mCustomScrollbar("update");
    $('.chat-body').mCustomScrollbar().mCustomScrollbar("scrollTo","bottom",{scrollInertia:0});

    /*$(".chat-body").mCustomScrollbar("update");
    $('.chat-body').mCustomScrollbar("scrollTo", "bottom", {scrollEasing:"easeOut"});*/
}
//Default scrolling on bottom by Thamayanthi.V
function scrollOnBottom1() {
    var offset = $('.chat-time div:last-child').last().offset();
    if (offset != undefined) {
        if(offset != '') {
            var y_pos = offset.top;
            //var x_pos = offset.left;
        } else {
             var y_pos = 0;
        }
        
        $("#mCSB_1_container").css("top", 0);
        $("#mCSB_2_container").css("top", y_pos);
        $("#mCSB_3_container").css("top", 0);
    }
}
function deleteselectedchat() {
    var chat_id = $('#deleteMsgKey').val();
    var deleteMsgType = $('#deleteType:checked').val();
    var checkedCount = $('#deleteType:checked').length;

    if(checkedCount == 0) {
        toastr.warning("Kindly Select Anyone Delete Type");
        return false;
    }
    if(checkedCount == 2) {
        var delete_type = 'all';
    } else {
        var delete_type = deleteMsgType;
    }

    swal({
        title: "Delete Confirmation",
        text: "Are you sure want to delete this?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    }).then((willDelete) => {
        if (willDelete) {
            var combination = $('#combination_user').val();
            var currentuser = $('#current-user-number').val();
            var from = $('#from_user').val();
            var to = $('#to_user').val();
            var username = $('#username').val();
            $("#delete-message").modal('hide');
            var adaRef = firebase.database().ref("data/chats/" + combination + "/" + chat_id);
            if (delete_type == 'me') {
                adaRef.once("value", function(snapshot) {     
                    if (snapshot.key) {
                        if (snapshot.val().delete=='') {
                            adaRef.update({
                                delete: currentuser
                            });
                        }
                        else {
                            firebase.database().ref("data/chats/" + combination + '/' + chat_id).remove();
                        }
                    }
                });
            }
            else {
                firebase.database().ref("data/chats/" + combination + '/' + chat_id).remove();
            }
            showchathistory(combination, from, to, username);
            var chatRef = firebase.database().ref("data/chats/");
            chatRef.once('value', function(snapshot) {
                if (snapshot.child(combination).exists() != true) {
                    firebase.database().ref("data/chats/" + combination).set(true);
                }
            });
        }
    });
}


function mute_user() {
    var combination = $('#combination_user').val();
    var from = $('#from_user').val();
    var to = $('#to_user').val();
    var username = $('#username').val();

    var mute_ids = [];
    firebase.database().ref("data/users/" + from).once('value', function(snapshot) {
        if (snapshot.val()) {
            if (snapshot.val().mutedUsersIds) {
                mute_ids = snapshot.val().mutedUsersIds;
            }
            mute_ids.push(to);
            firebase.database().ref('data/users/' + from).update({
                mutedUsersIds: mute_ids
            });
            showchathistory(combination, from, to, username);
            toastr.success("You have Muted Successfully!");
        }
    });
}
function unmute_user() {
    var combination = $('#combination_user').val();
    var from = $('#from_user').val();
    var to = $('#to_user').val();
    var username = $('#username').val();
    var mute_ids = [];
    firebase.database().ref("data/users/" + from).once('value', function(snapshot) {
        if (snapshot.val()) {
            if (snapshot.val().mutedUsersIds) {
                mute_ids = snapshot.val().mutedUsersIds;
            }
            mute_ids.pop(to);
            firebase.database().ref('data/users/' + from).update({
                mutedUsersIds: mute_ids
            });
            showchathistory(combination, from, to, username);
            toastr.success("You have Unmuted Successfully!");
        }
    });
}
//when checkbox checked
$(document).on('click','.smsg',function(){
    //get count of selected
    var selected = $(".smsg:checked").length;
    if (selected > 0) {
        //show buttons
        $(".useractions").css("display","block");
    }
    else {
        $(".useractions").css("display","none");
    }
    
});
function checkabuse() {
    //get selected msgs
    var selected = $(".smsg:checked").length;
    if (selected > 0) {
        //confirmation modal
        $("#modal-report").modal('show');
    }
    else {
        toastr.warning("Select messages!");
    }
}
function confirmreportcheck() {
    $('.smsg').prop("checked", true);
    confirmreport();
}

function confirmreport(chatKey) {
    var currentuser = $("#from_user").val();
    var to_user = $("#to_user").val();
    var combination_user = $("#combination_user").val();
    var d = new Date();
    var n = d.getTime();
    var myRef = firebase.database().ref("data/report").push();
    myRef.set({
      chatPath: combination_user,
      id: myRef.key,
      messageId: chatKey,
      reportBy: currentuser,
      reportUser: to_user,
      timeStamp: n,
    });
    $("#report-user").modal("hide");
    toastr.success("Message Reported Successfully");
    setTimeout(function () {
      window.location.reload();
    }, 2000); // Adjust the delay as needed
  }
//Recorder

let recorder;
let context;
let audio = document.querySelector('audio');
let startBtn = document.getElementById('startRecording');
let stopBtn = document.getElementById('stopRecording');
let send_voice = document.getElementById('send_voice');
window.URL = window.URL || window.webkitURL;

/** 
 * Detecte the correct AudioContext for the browser 
 * */
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

let onFail = function(e) {
    alert('Error '+e);
    console.log('Rejected!', e);
};

let onSuccess = function(s) {
    let tracks = s.getTracks();
    startBtn.setAttribute('disabled', true);
    send_voice.setAttribute('disabled', true);
    stopBtn.removeAttribute('disabled');
    context = new AudioContext();
    let mediaStreamSource = context.createMediaStreamSource(s);
    recorder = new Recorder(mediaStreamSource);
    recorder.record();

    stopBtn.addEventListener('click', ()=>{
        stopBtn.setAttribute('disabled', true);
        startBtn.removeAttribute('disabled');
        send_voice.removeAttribute('disabled');
        recorder.stop();
        tracks.forEach(track => track.stop());
        recorder.exportWAV(function(s) {
            audio.src = window.URL.createObjectURL(s);
            const blobFile = new File([s], 'file' + Date.now() + '.wav', {type:"audio/wav"});
        });
    });

    send_voice.addEventListener('click', ()=>{
        stopBtn.setAttribute('disabled', true);
        startBtn.setAttribute('disabled', true);
        tracks.forEach(track => track.stop());

        recorder.exportWAV(function(s) {
            const blobFile = new File([s], 'file' + Date.now() + '.wav', {type:"audio/wav"});
            voiceupload(blobFile, '');
            $("#record_audio").modal('hide');
            audio.removeAttribute('src');
        });
    });
}

startBtn.addEventListener('click', ()=>{
    navigator.mediaDevices.getUserMedia({audio: true}).then(onSuccess).catch(onFail);
});

function voiceupload(files) {
    var fd = new FormData();
    fd.append('file', files);
    fireBaseImageUpload({
        'file': files,
        'path': '/Dreamchat'
    }, function(data) {
        if (!data.error) {
            if (data.progress) {
                // progress update to view here
            }
            if (data.downloadURL) {
                // update done
                return data.downloadURL;
            }
        } else {
        }
    });
}

//change chats
firebase.database().ref("data/chats").on("child_changed", function(snapshot) {

    /*var d = new Date();
    var n = d.getTime();
    var lastMsg = $('#last_message').val();
    var lastMsgTime = $('#last_message_time').val();
    var attachmentType = 6;
    var lastMsgName = '';
    if (attachmentType != 3) {
        lastMsgName = $('#last_message').val();
    } else {
        lastMsgName = '<i class="bx bx-microphone me-1"></i>Audio';
    }

    if(attachmentType == 2) {
        lastMsgName = '<i class="feather-image ms-1 me-1"></i>Photo';
    }
    var divid = snapshot.key.replace(/[.*+?^${}()|[\]\\]/g, ""); 
    lastMsgElement = $("p[class*='lastmsg_917788996655-919988556633']");
    lastMsgElement.text(lastMsg);
    var showtime = secondsToString(n);
    $('.lastmsgtime_' + divid).text(showtime);*/


    //change the lists
    var splituser = snapshot.key.split('-');
    var existuser = splituser[0];
    var fromuser = splituser[1];
    var currentuser = $('#current-user-number').val();
    var current_fromuser = $('#from_user').val();
    var current_touser = $("#to_user").val();
    var string = snapshot.key;
    var chat = snapshot.val();
    
    var current_touser = $("#to_user").val();
    var touser = '';
    if (string.startsWith(currentuser+"-") == true) 
    {
        touser = string.replace(currentuser+"-", '');
    }
    if (string.endsWith("-"+currentuser) == true) 
    {
        touser = string.replace("-"+currentuser, '');
    }
    if (chat!=true && (existuser == current_fromuser || fromuser == current_fromuser) && (existuser == current_touser || fromuser == current_touser)) {
        showlist(string, currentuser, touser, current_touser);
    }
});

function showlist(combination, currentuser, showfirst, current_touser) {
    var solochat = '';
    var currentuser = $('#current-user-number').val();
    firebase.database().ref("data/users/" + currentuser).once('value', function(snapshot)
    {
        if (snapshot.val().solochat) {
            solochat = snapshot.val().solochat;
        }
    });
    firebase.database().ref("data/chats").once('value', function(chatsnapshot) {
        var string = chatsnapshot.key;
        var chats = chatsnapshot.val();
        var substring = currentuser.slice(1);
        var substring1 = "roup";
        msgcounttext = '';
        chatsnapshot.forEach(function(childSnapshot) {
            var childkey = childSnapshot.key;
            var imageval = baseUrl + 'assets/img/user-placeholder.jpg';
            //New Code
            if (childkey.indexOf(substring) !== -1 && childkey.indexOf(substring1) !== 1)
            {
                if (childSnapshot.val().delivered == false && childSnapshot.val().readMsg == false) {
                    msgcounttext++;
                }  
                if(childSnapshot.val().delivered == true && childSnapshot.val().readMsg == false) {
                    msgcounttext++;
                }
                var touser = childkey.replace(currentuser, '').replace('-', '');
                var usersRef = firebase.database().ref("data/users/"+touser);
                usersRef.once('value', function(snapshot) {
                    if (snapshot.val().username == null || snapshot.val().username == undefined) 
                    {
                        username = touser;
                    }
                    else {
                        username = snapshot.val().username;
                    }
                    if (snapshot.val().image != "") {
                        imageval = snapshot.val().image;
                    }
                    if (snapshot.val().online == true) {
                        var online_status = 'avatar-online';
                    } else {
                        var online_status = 'avatar-offline';
                    }
                    var to_div_time = touser.replace('+', '');
                    var divid = childkey.replace(/[.*+?^${}()|[\]\\]/g, "");
                    //var msgcounttext = '';
                    var solochat = '';
                    firebase.database().ref("data/users/" + currentuser).once('value', function(snapshot) {
                        if (snapshot.val()) {
                            var blockids = snapshot.val().blockedUsersIds;
                            if (blockids) {
                                if (jQuery.inArray(touser, blockids) !== -1) {
                                    $('#liimg_' + to_div_time).attr('src', baseUrl + 'assets/img/user-placeholder.jpg');
                                    $(".avimg_" + to_div_time).removeClass(online_status);
                                    $("#userlogin_time" + to_div_time).hide();
                                    $("#userstatu_" + to_div_time).hide();
                                }
                            }
                            solochat = snapshot.val().solochat;
                            //get
                        }
                    });
                    var notlist = [];
                    //check solo chat
                    if (solochat) {
                        $.each( solochat, function( key, value ) {
                            var time = new Date(parseInt(value.timeStamp));
                            //add one minute
                            time.setMinutes( time.getMinutes() + 1 );
                            var timeStamp = time.getTime();
                            if (value.phoneNo == touser) {

                                firebase.database().ref("data/chats/"+childkey).orderByChild('date').limitToLast(1).once("value", function(lchatshot) {
                                    lchatshot.forEach(function(childSnapshot) {
                                        var childData = childSnapshot.val();
                                        if (timeStamp > childData.date) {
                                            notlist.push(childkey);
                                        }
                                    }); 
                                });
                            }
                        });
                    }

                    if(notlist.indexOf(string) === -1 )  {
                        if($('#sendclick_' + divid).length == 0) {
                            //user list
                            if(snapshot.val().status != null) {
                                var userStatus = snapshot.val().status;
                            } else {
                                var userStatus = "Hey! I am Available Now!!";
                            }
                            /*$('<li class="user-list-item"><a href="chat.html" ><div class="avatar avatar-online"><img src="assets/img/avatar/avatar-1.jpg" class="rounded-circle" alt="image"></div><div class="users-list-body"><div><h5>Horace Keene</h5><p>Have you called them?</p></div><div class="last-chat-time"><small class="text-muted">Just Now</small><div class="new-message-count">11</div></div></div></a></li>').appendTo($('.user-list'));*/ 
                        }
                    }
                });

            }
            //New Code
        });
    });
    //get username
    if(current_touser!='')
    {
        firebase.database().ref("data/users/" + current_touser).once('value', function(snapshot)
        {
            //$("#user_groupdiv").html('');
            showchathistory(combination, currentuser, current_touser, snapshot.val().username, false);
        });
    }

    setInterval(function(){
        var from_user = $('#from_user').val();
        var to_user = $('#to_user').val();
        var username = $('#username').val();
        var combination_user = $('#combination_user').val();
        showchathistory(combination_user, from_user, to_user, username);
    }, 60000);
}

function onetoonenew(type) {
    var currentuser = $("#current-user-number").val();
    var touser = $("#to_user").val();
    var caller = currentuser.replace(' ', '');
    var receiver = touser.replace(' ', '');
    // channelname
    var channel_name = makeid(10);
    var calllink = 'user_type=onetoone&call_type=' + type + '&channelname=' + channel_name + '&caller=' + caller + '&receiver=' + receiver + '&group=&currentuser=' + currentuser;
    var title = (type == 'audio') ? 'Audio' : 'Video';
    var isVideo = (type == 'audio') ? false : true;
    var d = new Date();
    var n = d.getTime();
    var blocked = false;
    var readmsg = false;
    // insert in call for caller
    var callid = pushcalldetails(currentuser, touser, 'OUT', isVideo);

    firebase.database().ref("data/users/" + currentuser).once('value', function (snapshot) {
        if (snapshot.val().blockedUsersIds && snapshot.val().blockedUsersIds.indexOf(touser) >= 0) {
            toastr.warning("Blocked this user.!");
        } else {
            firebase.database().ref("data/users/" + touser).once('value', function (snapshot) {
                if (snapshot.val().blockedUsersIds && snapshot.val().blockedUsersIds.indexOf(currentuser) >= 0) {
                    toastr.warning("Blocked this user.!");
                } else {
                    if (snapshot.val().call_status == undefined || snapshot.val().call_status == true) {
                        firebase.database().ref('data/users/' + currentuser).update({ call_status: false });
                        // go for the call
                        firebase.database().ref('data/users/' + touser).update({ call_status: false, incomingcall: calllink });
                        if (currentuser != '' && touser != '') {
                            // callpushnotification(currentuser, touser, channel_name, title, '');
                        }
                        // open url
                        var href;
                        if (title == 'Audio') {
                            href = baseUrl + 'audio-call?' + calllink + '&cid=' + callid;
                        } else {
                            href = baseUrl + 'video-call?' + calllink + '&cid=' + callid;
                        }
                        var callWindow = window.open(href, '_blank');
                        
                        // Change call status to true when the call window is closed
                        callWindow.onbeforeunload = function () {
                            firebase.database().ref('data/users/' + currentuser).update({ call_status: true });
                            firebase.database().ref('data/users/' + touser).update({ call_status: true });
                        };
                    } else {
                        // show the receiver is busy
                        $('#busy_pop_up').modal('show');
                        if (snapshot.val().image != '') {
                            $("#busy-username-img").html('<img alt="User Image" src="' + snapshot.val().image + '" class="call-avatar">');
                        }
                        $("#busy_user").text(snapshot.val().username);
                        $("#busy_calllink").val(calllink);
                    }
                }
            });
        }
    });
}

function makeid(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

function forwardMessages(msgType, message,attachmentBytes,attachmentUrl) {
    $("#forward-message .forward-message-users-list").empty();
    var currentuser = $('#current-user-number').val();
    //Groups List
    firebase.database().ref("data/groups").on("child_added", function(snapshot) {
        var string = snapshot.key;
        var substring = currentuser;
        var userIds = snapshot.val().userIds;
        if (typeof snapshot.val().grpExitUserIds !== undefined && snapshot.val().grpExitUserIds !== '') {
            var grpExitUserIds = snapshot.val().grpExitUserIds;
        } else {
            var grpExitUserIds = [];
        }

        if (typeof userIds !== 'undefined') {
            var usercount = userIds.length;
            if (snapshot.val().image != "" && snapshot.val().image != undefined) {
                var imageval = snapshot.val().image;
            } else {
                var imageval = baseUrl + 'assets/img/user-placeholder.jpg';
            }
            var userdetails = [];
            var divid = string.replace(/[.*+?^${}()|[\]\\]/g, "");
            if ($.inArray(currentuser, userIds) !== -1 && $.inArray(currentuser, grpExitUserIds) === -1) {
                $('<div class="recent-block-group"><div class="user-block-profile"><div class="avatar"><img src="'+ imageval +'" class="rounded-circle" alt="image"></div><div class="block-user-name" ><input type="hidden" name="selectedMessage" id="selectedMessage" value="'+ message +'"><input type="hidden" name="msgType" id="msgType" value="'+ msgType +'"><input type="hidden" name="attachmentBytes" id="attachmentBytes" value="'+ attachmentBytes +'"><input type="hidden" name="attachmentUrl" id="attachmentUrl" value="'+ attachmentUrl +'"><input type="hidden" name="group-user-ids" id="group-user-ids" value="'+ snapshot.val().userIds +'"><h6 class="forward-user-name" id="forward-user-name">'+ snapshot.val().name +'</h6><span>'+ snapshot.val().status +'</span></span></div></div><div class="notify-check mb-0 checkbox-container"><div class="form-check d-flex align-items-center justify-content-start ps-0"><label class="custom-check mt-0 mb-0"><input type="checkbox" name="forward-user-number[]" id="forward-user-number" value="'+ snapshot.val().id +'" class="position-relative"><span class="checkmark"></span></label></div></div></div').appendTo($('.forward-message-users-list'));
            }
        }
    });

    //Contact Users List
    firebase.database().ref("data/contacts/" + currentuser).orderByChild("firstName").once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            if(childSnapshot.val().isBlocked == undefined || childSnapshot.val().isBlocked == false) {
                firebase.database().ref("data/users/" + childSnapshot.key).once('value', function(userSnapshot) {
                    var name = childSnapshot.val().firstName+' '+ childSnapshot.val().lastName;
                    if (userSnapshot.val().image != "" && userSnapshot.val().image != undefined) {
                        var imageval = userSnapshot.val().image;
                    } else {
                        var imageval = baseUrl + 'assets/img/user-placeholder.jpg';
                    }

                    $('<div class="recent-block-group"><div class="user-block-profile"><div class="avatar"><img src="'+ imageval +'" class="rounded-circle" alt="image"></div><div class="block-user-name" ><input type="hidden" name="selectedMessage" id="selectedMessage" value="'+ message +'"><input type="hidden" name="msgType" id="msgType" value="'+ msgType +'"><input type="hidden" name="attachmentBytes" id="attachmentBytes" value="'+ attachmentBytes +'"><input type="hidden" name="attachmentUrl" id="attachmentUrl" value="'+ attachmentUrl +'"><input type="hidden" name="group-user-ids" id="group-user-ids" value=""><h6 class="forward-user-name" id="forward-user-name">'+ name +'</h6><span>'+ userSnapshot.val().status +'</span></div></div><div class="notify-check mb-0 checkbox-container"><div class="form-check d-flex align-items-center justify-content-start ps-0"><label class="custom-check mt-0 mb-0"><input type="checkbox" name="forward-user-number[]" id="forward-user-number" value="'+ userSnapshot.val().id +'" class="position-relative"><span class="checkmark"></span></label></div></div></div').appendTo($('.forward-message-users-list'));
                });
            }
        }); 
    });

    $("#forward-message").modal('show');
}

function sendForwardMessages() {
    var from = $("#from_user").val();
    var to =  $('#forward-user-number:checked').val();
    var selectedIDs = [];
    selectedIDs = $('#forward-user-number:checked').map(function() {
        return $(this).val();
    }).get();

    var msgType = $("#msgType").val();
    var attachmentBytes = $("#attachmentBytes").val();
    var attachmentUrl = $("#attachmentUrl").val();
    var attachmentName = $("#selectedMessage").val();

    if(msgType == 6) {
        var message = $("#selectedMessage").val();
    } else {
        var message = "";
    }

    var d = new Date();
    var n = d.getTime();
    var blocked = false;
    var readmsg = false;
    var selectedUserIds = $('#group-user-ids').val();

    selectedIDs.forEach(function(toUser) {
        var toUserNumber = toUser.split('_');
        var combinations = "";
        if(toUserNumber[0] == "group") {
            var combinations = toUser;
            $("#combinationUsers").val(combinations);
        } else {
            var chatRef = firebase.database().ref("data/chats/");
            chatRef.once('value', function(snapshot) {
                var combination1 = toUser + '-' + from;
                var combination2 = from + '-' + toUser;
                if (snapshot.child(combination1).exists() == true) {
                    var combinations = combination1;
                    $("#combinationUsers").val(combination1); 
                } else {
                    if (snapshot.child(combination2).exists() == true) {
                       var combinations = combination2; 
                       $("#combinationUsers").val(combination2); 
                    }
                }
            });
           
        }
        var combination = $("#combinationUsers").val();
        firebase.database().ref("data/users/" + toUser).once('value', function(usersnapshot) {
            if (usersnapshot.val()) {
                if (usersnapshot.val().blockedUsersIds) {
                    blockids = usersnapshot.val().blockedUsersIds;
                    if (jQuery.inArray(from, blockids) !== -1) {
                        toastr.warning("Unblock User to Send Message!");
                        return false;
                        blocked = true;
                        readmsg = false;
                    }
                } else {}
            }
            
            var existUsers = [];
            var userIds = selectedUserIds.split(',');
            userIds.forEach(function(entry) {
                existUsers.push(entry);
            });

            var myRef = firebase.database().ref("data/chats/" + combination).push(); 
            myRef.set({
                
                "attachmentType": msgType,
                "blocked": blocked,
                "body": message,
                "date": n,
                "delete": "",
                "delivered": false,
                "id": myRef.key,
                "readMsg": readmsg,
                "recipientId": to,
                "replyId": "0",
                "selected": false,
                "senderId": from,
                "senderName": from,
                "sent": true,
                "isForward": true,
                "isReply": false,
                "replyContent": "",
                "userIds": existUsers
            });

            if(msgType != 6) {
                firebase.database().ref("data/chats/" + combination + "/" + myRef.key).update({
                    attachment: {
                        "bytesCount": attachmentBytes,
                        "name": attachmentName,
                        "url": attachmentUrl
                    },
                });
            }
            var check_mute = 0;
            firebase.database().ref("data/users/" + from).once('value', function(usersnapshot) {
                var muteids = usersnapshot.val().mutedUsersIds;
                if (muteids) {
                    if (jQuery.inArray(to, muteids) !== -1) {
                        check_mute = 1;
                    }
                }
            });
            //check muted user
            if(toUserNumber[0] == "group") {
                if (check_mute == 0) {
                    firebase.database().ref("data/users/" + toUser).once('value', function(usersnapshot) {
                        if (usersnapshot.val().deviceToken != undefined || usersnapshot.val().deviceToken != null) {
                            $.ajax({
                                url: 'home/usernotification',
                                type: 'POST',
                                data: {
                                    deviceToken: usersnapshot.val().deviceToken,body:message,to:toUser,osType:usersnapshot.val().osType,attachimg:message,from:from,attachmentType:'text'
                                },
                                success: function(data) {
                                }
                            });
                        }
                            
                    });
                }
            }
            var j = 0;
            $('#forward-message').modal('hide');
            $('#forward-message').html("");
           // $('.emoji-wysiwyg-editor').html("");
            return false;
        });
    });
}

function msgInfo(sent, delivered, read) {
    var chat_bar = $('.chat').width();

    $('.right_sidebar_info').addClass('show-right-sidebar');
    $('.right_sidebar_info').removeClass('hide-right-sidebar');
    $('.right-side-contact').addClass('hide-right-sidebar');
    $('.right-side-contact').removeClass('show-right-sidebar');
    $('.right_side_star').addClass('hide-right-sidebar');
    $('.right_side_star').removeClass('show-right-sidebar');
    if ( $(window).width() > 991 && $(window).width() < 1201) {
        $(".chat:not(.right_sidebar_info .chat)").css('margin-left', - chat_bar);
    }
    if ($(window).width() < 992) {
        $('.chat:not(.right_sidebar_info .chat)').addClass('hide-chatbar');
    }

    $("#sent-time").text(sent);
    $("#delivered-time").text(delivered);
    $("#read-time").text(read);
} 

function replyMessages(msgType, message, attachmentBytes, attachmentUrl, selectedUser) {
    var currentuser = $('#current-user-number').val();
    var otherUser = $('#to_user').val();
    // console.log("selectedMessage :",message);
    // console.log("selectedUser :",selectedUser);
    // console.log("msgType:",msgType);
    // console.log("attachmentBytes:",attachmentBytes);
    // console.log("attachmentUrl: ",attachmentUrl);
    $('.reply-msg-div').removeClass("d-none");
    $('.reply-msg-div').addClass("d-flex");

    if (msgType == 6) { 
        $('.reply-content').text(message);   // Use .text() to set content
    } else{
        displayImage(attachmentUrl);
    }
    // $('.reply-content').text(message);  // Use .text() to set content

    $('.send-btn').attr('onclick', 'sendReplyMsgs()');

    firebase.database().ref("data/contacts/" + currentuser + '/' + otherUser).once('value').then(function(usersnapshot) {
        var userName, userImage;

        if (selectedUser == currentuser) {
            userName = "you";
            userImage = baseUrl + 'assets/img/user-placeholder.jpg';
        } else {
            var userData = usersnapshot.val();
            if (userData) {
                userName = userData.firstName || 'Unknown';
                userImage = userData.image ? userData.image : baseUrl + 'assets/img/user-placeholder.jpg';
            } else {
                userName = 'Unknown';
                userImage = baseUrl + 'assets/img/user-placeholder.jpg';
            }
        }

        $('#reply-avatar').attr('src', userImage);
        $('#reply-user-name').text(userName);
        $('#replymsgType').val(msgType);
        $('#replyattachmentBytes').val(attachmentBytes);
        $('#replyattachmentUrl').val(attachmentUrl);
    }).catch(function(error) {
        console.error("Error fetching user data: ", error);
    });
}
function displayImage(imageUrl) {
    // Create a new image element
    var imgElement = $('<img>');

    // Set the source attribute
    imgElement.attr('src', imageUrl);

    // Set the width and height using CSS
    imgElement.css({
        'max-width': '70px',
        'max-height': '50px'
    });

    // Append the image element to the container where you want to display the image
    $('.reply-content').append(imgElement);
}
function sendReplyMsgs() {
    var from = $("#from_user").val();
    var to = $("#to_user").val();
    var combination = $("#combination_user").val();
    var selectedMessage = $(".reply-content").html();
    var selectedUser = $("#reply-user-name").text();
    var selectedUserImage = $("#reply-avatar").attr("src");
    //var combinationsss = $('#combination_user').val();
    var message = $("#chat_messages").val();
    if (message == "") {
      toastr.warning("Chat Message is Empty!");
      return false;
    }
    
    var d = new Date();
    var n = d.getTime();
    var blocked = false;
    var readmsg = false;
  
    var msgType = $("#replymsgType").val();
    var attachmentBytes = $("#replyattachmentBytes").val();
    var attachmentUrl = $("#replyattachmentUrl").val();
    var attachmentName = $(".reply-content").val();
  
     /* console.log("selectedMessage :",selectedMessage);
      console.log("selectedUser :",selectedUser);
      console.log("selectedUserImage :",selectedUserImage);
      console.log("attachmentBytes :",attachmentBytes);
      console.log("attachmentUrl :",attachmentUrl);
      console.log("combinationsss :",combinationsss);
      return false;
      var chatRef = firebase.database().ref("data/chats/");
      chatRef.once('value', function(snapshot) {
          var combination1 = toUser + '-' + from;
          var combination2 = from + '-' + toUser;
          if (snapshot.child(combination1).exists() == true) {
              var combinations = combination1;
              $("#combinationReplyUsers").val(combination1); 
          } else {
              if (snapshot.child(combination2).exists() == true) {
                 var combinations = combination2; 
                 $("#combinationReplyUsers").val(combination2); 
              }
          }
      });*/
  
    firebase
      .database()
      .ref("data/users/" + to)
      .once("value", function (usersnapshot) {
        if (usersnapshot.val()) {
          if (usersnapshot.val().blockedUsersIds) {
            blockids = usersnapshot.val().blockedUsersIds;
            if (jQuery.inArray(from, blockids) !== -1) {
              toastr.warning("Unblock User to Send Message!");
              blocked = true;
              readmsg = false;
            }
          } else {
          }
        } 
  
        //var newRef1 = firebase.database().ref("data/chats/" + combination).push();
        //var combination = $("#combinationReplyUsers").val();
        var myRef = firebase
          .database()
          .ref("data/chats/" + combination)
          .push();
          myRef.set({
            "attachmentType": 6,
            "blocked": blocked,
            "body": message,
            "date": n,
            "delete": "", 
            "delivered": false,
            "id": myRef.key,
            "readMsg": readmsg,
            "recipientId": to,
            "replyId": "0",
            "selected": false,
            "senderId": from,
            "senderName": from,
            "sent": true,
            "isForward": false,
            "isReply": true,
            "replyContent": selectedMessage,
            "replyUser": selectedUser,
            "replyUserImg": selectedUserImage,
            "deliveredTime": "",
            "readTime": ""
        });
  
        if (msgType != 6) {
          firebase
            .database()
            .ref("data/chats/" + combination + "/" + myRef.key)
            .update({
              attachment: {
                bytesCount: attachmentBytes,
                name: attachmentName,
                url: attachmentUrl,
              },
            });
        }
  
        if (usersnapshot.val().online == true) {
          firebase
            .database()
            .ref("data/chats/" + combination + "/" + myRef.key)
            .update({
              delivered: true,
              deliveredTime: n,
            });
        }
        var check_mute = 0;
        firebase
          .database()
          .ref("data/users/" + from)
          .once("value", function (usersnapshot) {
            var muteids = usersnapshot.val().mutedUsersIds;
            if (muteids) {
              if (jQuery.inArray(to, muteids) !== -1) {
                check_mute = 1;
              }
            }
          });
        //check muted user
        if (check_mute == 0) {
          firebase
            .database()
            .ref("data/users/" + to)
            .once("value", function (usersnapshot) {
              if (usersnapshot.val().deviceToken) {
                $.ajax({
                  url: "home/usernotification",
                  type: "POST",
                  data: {
                    deviceToken: usersnapshot.val().deviceToken,
                    body: message,
                    to: to,
                    osType: usersnapshot.val().osType,
                    attachimg: message,
                    from: from,
                    attachmentType: "text",
                  },
                  success: function (data) {},
                });
              }
            });
        }
        // console.log(message);
  
        var j = 0;
        $(".reply-msg-div").addClass("d-none");
        $(".reply-msg-div").removeClass("d-flex");
        $(".reply-content").html("");
        $(".send-btn").attr("onclick", "sendMessage()");
        $("#forward-message").modal("hide");
        $(".emoji-wysiwyg-editor").html("");
        return false;
      });
  }  


$(document).ready(function() {
  // Listen for changes in the file input
  $('#drop-zone-filesss').change(function() {
    var input = this;

    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function(e) {
        // Display the preview image
        $('#imagePreview').css('display', 'block');
        $('#previewImage').attr('src', e.target.result);
      };

      // Read the selected file as a data URL
      reader.readAsDataURL(input.files[0]);
    }
  });
});

document.getElementById('user-status').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('image-preview');
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});
  
});