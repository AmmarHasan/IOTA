var WebRtcDemo = WebRtcDemo || {};

// todo:
//  cleanup: proper module loading
//  cleanup: promises to clear up some of the async chaining
//  feature: multiple chat partners
WebRtcDemo.App = (function (viewModel, connectionManager, whiteBoard) {

    var _mediaStream, _hub, audiochk = 0

    _connect = function (username, onSuccess, onFailure) {
        // Set Up SignalR Signaler
        var hub = $.connection.groupChat;

        $.connection.hub.start()
                .done(function () {
                    console.log('connected to SignalR hub... connection id: ' + _hub.connection.id);

                    hub.server.joinGroup($("#groupName").val()).done(function () { hub.server.joinChat($("#hdnUserName").val(), $("#groupName").val()); });

                    if (onSuccess) {
                        onSuccess(hub);
                    }
                })
                .fail(function (event) {
                    if (onFailure) {
                        onFailure(event);
                    }
                });

        // Setup client SignalR operations
        _setupHubCallbacks(hub);
        _hub = hub;


    },

       _start = function (hub) {

           //  whiteBoard.initBoard();

           // Show warning if WebRTC support is not detected
           if (webrtcDetectedBrowser == null) {
               console.log('Your browser doesnt appear to support WebRTC.');
               $('.browser-warning').css('display', 'block');
           }

           // Then proceed to the next step, gathering username
           _getUsername(hub);
       },
       _getUsername = function (hub) {
           username = $("#hdnUserName").val();

           alertify.alert("Your name is " + username, function (e) {

               // proceed to next step, get media access and start up our connection
               _startSession(username, hub);
           }, '');


           //_startSession(username);
       },



       _startSession = function (username, hub) {
           viewModel.Username(username); // Set the selected username in the UI
           viewModel.Loading(true); // Turn on the loading indicator
           whiteBoard.initBoard(hub);
           // Now we have everything we need for interaction, so fire up SignalR
           _connect(username, function (hub) {
               // tell the viewmodel our conn id, so we can be treated like the special person we are.
               viewModel.MyConnectionId(hub.connection.id);
               // Initialize our client signal manager, giving it a signaler (the SignalR hub) and some callbacks
               console.log('initializing connection manager');
               connectionManager.initialize(hub, $("#groupName").val());

               // Hook up the UI
               _attachUiHandlers();

               viewModel.Loading(false);
           });




       },



        _attachUiHandlers = function () {
            // Add handler for chat close button

            $('#close-chat').click(function () {
                $('#togetherjs-chat').css('display', 'none');
            });



            $("#btninvite").click(function () {

                if ($("#tags").val() != "") {
                  _hub.server.sendInvite($("#hdnUserName").val(), $("#tags").val(), $("#mms").val());

                }
            });
            $("#togetherjs-chat-input").keypress(function (event) {
                if (event.keyCode == 13) {
                    event.preventDefault();
                    $("#btnChatSend").click();
                }
            });


            $("#btnChatSend").click(function () {

                strChatText = $('#togetherjs-chat-input', $(this).parent()).val();
                if (strChatText != '') {
                    var strGroupName = $('#groupName').val();
                    console.log('grp is :' + strGroupName);

                    if (typeof strGroupName !== 'undefined' && strGroupName !== false) {
                        _hub.server.send($("#hdnUserName").val(), strChatText, strGroupName);
                    }


                    $('#togetherjs-chat-input', $(this).parent()).val('');
                }

            });


        },

        _setupHubCallbacks = function (hub) {


            //handle draw
            hub.client.handleDraw = function (drawObject, sessnId, name) {


                whiteBoard.handleDraw(drawObject, sessnId, name);


            };
            //alert that user has left
            hub.client.leavesession = function (name) {
                alertify.error(name + " has left conference.");
            }
            //alert  user that he has  left
            hub.client.lleavesession = function () {
                alertify.error("You have left conference.");
                $('#groupName').val("");
               
                 
            }

            // Hub Callback: Update User List
            hub.client.updateUserList = function (userList) {
                viewModel.setUsers(userList);
            };

            hub.client.chatJoined = function (name) {
                $("#grpmem").append("<span><i> <b>" + name + " joined. <br/></b></i></span>");
            }

            // Declare a function on the chat hub so the server can invoke it
            hub.client.addMessage = function (msg, groupName) {
                $('#messages').append('<LI>' + '<span style="float:left;font-style:italic;color:#5c1047;"><b>' + msg.name + '</b></span><span style="float:right;color:Grey;">' + msg.hour + "</span><br/>" + '<div style="text-align:left;clear:both;">' + msg.message + '</div><hr/>' + '');
                console.log(msg.message);
                if ($('#togetherjs-chat').css('display') == 'none') {
                    $("#notifier").css('display', 'block');


                }

            };


            // Hub Callback: WebRTC Signal Received
            hub.client.receiveSignal = function (signal) {

                connectionManager.newSignal(signal);
            };

            //set chat window
            hub.client.setChatWindow = function (strGroupName) {

                whiteBoard.joinHub(hub, strGroupName);
            };

            //set chat window
            hub.client.responseInvite = function (name,success) {

                $("#tags").val("");
                if(success =="success")
                    alertify.success('Invitation sent to ' + name + " successfully");
                else
                    alertify.error('Invitation was not sent to ' + name);
            };



        },
    // Connection Manager Callbacks
        _callbacks = {
            onReadyForStream: function (connection) {
                // The connection manager needs our stream
                // todo: not sure I like this
                connection.addStream(_mediaStream);
            },
            onStreamAdded: function (connection, event) {
                console.log('binding remote stream to the partner window');

                // Bind the remote stream to the partner window
                var node = document.createElement("video");
                node.autoplay = true;
                node.play();
                var otherVideo = document.querySelector('.video.partner').appendChild(node);
                attachMediaStream(otherVideo, event.stream); // from adapter.js
            },
            onStreamRemoved: function (connection, streamId) {
                // todo: proper stream removal.  right now we are only set up for one-on-one which is why this works.
                console.log('removing remote stream from partner window');

                // Clear out the partner window
                var otherVideo = document.querySelector('.video.partner');
                otherVideo.src = '';
            }
        };




    return {
        start: _start // Starts the UI process

    };
})(WebRtcDemo.ViewModel, WebRtcDemo.ConnectionManager, WebRtcDemo.WhiteBoard);

// Kick off the app
WebRtcDemo.App.start();



