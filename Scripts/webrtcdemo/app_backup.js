﻿var WebRtcDemo = WebRtcDemo || {};

// todo:
//  cleanup: proper module loading
//  cleanup: promises to clear up some of the async chaining
//  feature: multiple chat partners

WebRtcDemo.App = (function (viewModel, connectionManager, whiteBoard) {
    var _mediaStream,
        _hub,

        _connect = function (username, onSuccess, onFailure) {
            // Set Up SignalR Signaler
            var hub = $.connection.webRtcHub;
            //   $.support.cors = true;
            //   $.connection.hub.url = '/signalr/hubs';
            $.connection.hub.start()
                .done(function () {
                    console.log('connected to SignalR hub... connection id: ' + _hub.connection.id);

                    // Tell the hub what our username is
                    hub.server.join(username);

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
            // Show warning if WebRTC support is not detected
            if (webrtcDetectedBrowser == null) {
                console.log('Your browser doesnt appear to support WebRTC.');

            }

            // Then proceed to the next step, gathering username
            _getUsername();
        },

        _getUsername = function () {
            username = $("#hdnUserName").val();

            alertify.alert("Your name is " + username, function (e) {

                // proceed to next step, get media access and start up our connection
                _startSession(username);
            }, '');


        },

        _startSession = function (username) {
            viewModel.Username(username); // Set the selected username in the UI
            viewModel.Loading(true); // Turn on the loading indicator
            whiteBoard.initBoard();

            // Ask the user for permissions to access the webcam and mic
            getUserMedia(
                {
                    // Permissions to request
                    video: true,
                    audio: true
                },
                function (stream) { // succcess callback gives us a media stream
                    $('.instructions').hide();

                    // Now we have everything we need for interaction, so fire up SignalR
                    _connect(username, function (hub) {
                        // tell the viewmodel our conn id, so we can be treated like the special person we are.
                        viewModel.MyConnectionId(hub.connection.id);

                        // Initialize our client signal manager, giving it a signaler (the SignalR hub) and some callbacks
                        console.log('initializing connection manager');
                        connectionManager.initialize(hub.server, _callbacks.onReadyForStream, _callbacks.onStreamAdded, _callbacks.onStreamRemoved);

                        // Store off the stream reference so we can share it later
                        _mediaStream = stream;

                        // Load the stream into a video element so it starts playing in the UI
                        console.log('playing my local video feed');
                        var videoElement = document.querySelector('.video.mine');
                        attachMediaStream(videoElement, _mediaStream);

                        // Hook up the UI
                        _attachUiHandlers();

                        viewModel.Loading(false);
                    }, function (event) {
                        alertify.alert('<h4>Failed SignalR Connection</h4> We were not able to connect you to the signaling server.<br/><br/>Error: ' + JSON.stringify(event));
                        viewModel.Loading(false);
                    });
                },
                function (error) { // error callback
                    alertify.alert('<h4>Failed to get hardware access!</h4> Do you have another browser type open and using your cam/mic?<br/><br/>You were not connected to the server, because I didn\'t code to make browsers without media access work well. <br/><br/>Actual Error: ' + JSON.stringify(error));
                    viewModel.Loading(false);
                }
            );
        },

        _attachUiHandlers = function () {
            // Add click handler to users in the "Users" pane
            $('.user').live('click', function () {
                // Find the target user's SignalR client id
                var targetConnectionId = $(this).attr('data-cid');
                var chatWindow = $("#divChatWindow").clone(true);
                //$(chatWindow).css('display', 'block');
                $(chatWindow).attr('chatToId', $(this).attr('title'));

                // Make sure we are in a state where we can make a call
                if (viewModel.Mode() !== 'idle') {
                    alertify.error('Sorry, you are already in a call.  Conferencing is not yet implemented.');
                    return;
                }

                // Then make sure we aren't calling ourselves.
                if (targetConnectionId != viewModel.MyConnectionId()) {
                    // Initiate a call
                    _hub.server.callUser(targetConnectionId);

                    // UI in calling mode
                    viewModel.Mode('calling');
                } else {
                    alertify.error("Ah, nope.  Can't call yourself.");
                }
            });

            // add handler for show video
            $('.show_video').click(function () {

                $('#div_video').css('display', 'block');
                $('#divChatWindow').css('display', 'none');

            });


            // add handler for show video
            $('.show_im').click(function () {

                $('#div_video').css('display', 'none');
                $('#divChatWindow').css('display', 'block');

            });


            // Add handler for the hangup button
            $('.hangup').click(function () {
                // Only allow hangup if we are not idle
                if (viewModel.Mode() != 'idle') {
                    _hub.server.hangUp();
                    connectionManager.closeAllConnections();
                    $('#calltool').css('display', 'none');
                    $('#contacts').css('display', 'block');

                    $('#divChatWindow').css('display', 'none');

                    viewModel.Mode('idle');
                }
            });

            $("#btnChatSend").click(function () {

                strChatText = $('#msg', $(this).parent()).val();
                if (strChatText != '') {
                    var strGroupName = $(this).parent().attr('groupname');
                    console.log('grp is :' + strGroupName);

                    if (typeof strGroupName !== 'undefined' && strGroupName !== false) {
                        _hub.server.send($("#hdnUserName").val() + ':' + strChatText, $(this).parent().attr('groupname'));
                    }


                    $('.ChatText', $(this).parent()).find('ul').append(strChatText);
                    $('#msg', $(this).parent()).val('');
                }

            });

        },

        _setupHubCallbacks = function (hub) {
            // Hub Callback: Incoming Call
            hub.client.incomingCall = function (callingUser) {
                console.log('incoming call from: ' + JSON.stringify(callingUser));

                // Ask if we want to talk
                alertify.confirm(callingUser.Username + ' is calling.  Do you want to chat?', function (e) {
                    if (e) {
                        // I want to chat
                        hub.server.answerCall(true, callingUser.ConnectionId);

                        // So lets go into call mode on the UI
                        viewModel.Mode('incall');
                    } else {
                        // Go away, I don't want to chat with you
                        hub.server.answerCall(false, callingUser.ConnectionId);
                    }
                });
            };

            // Hub Callback: Call Accepted
            hub.client.callAccepted = function (acceptingUser, targetUser) {
                console.log('call accepted from: ' + JSON.stringify(acceptingUser) + '.  Initiating WebRTC call and offering my stream up...');
                hub.server.createGroup(acceptingUser, targetUser);

                // Callee accepted our call, let's send them an offer with our video stream
                connectionManager.initiateOffer(acceptingUser, _mediaStream);

                // Set UI into call mode
                viewModel.Mode('incall');
            };

            // Hub Callback: Call Declined
            hub.client.callDeclined = function (decliningConnectionId, reason) {
                console.log('call declined from: ' + decliningConnectionId);

                // Let the user know that the callee declined to talk
                alertify.error(reason);

                // Back to an idle UI
                viewModel.Mode('idle');
            };

            // Hub Callback: Call Ended
            hub.client.callEnded = function (connectionId, reason) {
                console.log('call with ' + connectionId + ' has ended: ' + reason);
                $('#divChatWindow').css('display', 'none');
                $('#calltool').css('display', 'none');
                $("#contacts").css('display', 'block');

                // Let the user know why the server says the call is over
                alertify.error(reason);

                // Close the WebRTC connection
                connectionManager.closeConnection(connectionId);

                // Set the UI back into idle mode
                viewModel.Mode('idle');
            };

            // Hub Callback: Update User List
            hub.client.updateUserList = function (userList) {
                viewModel.setUsers(userList);
            };

            // Hub Callback: WebRTC Signal Received
            hub.client.receiveSignal = function (callingUser, data) {
                connectionManager.newSignal(callingUser.ConnectionId, data);
            };



            //set chat window
            hub.client.setChatWindow = function (strGroupName, strChatTo) {

                $('div[chatToId=' + strChatTo + ']').attr('groupname', strGroupName);
                $('div[chatToId=' + strChatTo + ']').css('display', 'block');
                var chatWindow = $("#divChatWindow").clone(true);
                $("#divChatWindow").css('display', 'block');
                $("#divChatWindow").attr('groupname', strGroupName);
                $("#hdngrpName").val(strGroupName);
                whiteBoard.joinHub(hub, strGroupName);
                console.log('grp is :' + strGroupName);
                $("#calltool").css('display', 'block');
                $("#contacts").css('display', 'none');



            };
            //handle draw
            hub.client.handleDraw = function (message, sessnId, name) {
                console.log(name + ' is drawing');
                whiteBoard.handleDraw(message, sessnId, name);


            };
            // Declare a function on the chat hub so the server can invoke it
            hub.client.addMessage = function (message, groupName) {
                if ($('div[groupname=' + groupName + ']').length == 0) {
                    var chatWindow = $("#divChatWindow").clone(true);
                    $(chatWindow).css('display', 'block');
                    $(chatWindow).attr('groupname', groupName);
                }
                $('#messages').append('<LI>' + message + '');

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
                var otherVideo = document.querySelector('.video.partner');
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
        start: _start, // Starts the UI process
        getStream: function () { // Temp hack for the connection manager to reach back in here for a stream
            return _mediaStream;
        }
    };
})(WebRtcDemo.ViewModel, WebRtcDemo.ConnectionManager, WebRtcDemo.WhiteBoard);

// Kick off the app
WebRtcDemo.App.start();