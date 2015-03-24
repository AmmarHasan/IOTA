var WebRtcDemo = WebRtcDemo || {};

/************************************************
ConnectionManager.js

Implements WebRTC connectivity for sharing video
streams, and surfaces functionality to the rest
of the app.

WebRTC API has been normalized using 'adapter.js'

************************************************/
WebRtcDemo.ConnectionManager = (function () {
    var connection;
    var _signaler, grp;
    //global stuff
    var channels = {};
    var currentUserUUID = Math.round(Math.random() * 60535) + 5000;
    // Initialize the ConnectionManager with a signaler and callbacks to handle events
    _initialize = function (signaler, grpp) {
        _signaler = signaler;
        console.log('Signaler :' + _signaler.connection.id);


        grp = grpp;
        console.log('Grp :' + grp);
        // Hook up the UI
        _startconference();
    };
    _startconference = function () {
        connection = new RTCMultiConnection();

        connection.session = {
            audio: true,
            video: true
        };
        connection.openSignalingChannel = function (config) {
            var channel = config.channel || this.channel;
            channels[channel] = config;

            if (config.onopen) setTimeout(config.onopen, 1000);

            return {
                send: function (message) {
                    _signaler.server.sendSignal(JSON.stringify({ sender: currentUserUUID, channel: channel, message: message }), grp);
                },
                channel: channel
            };
        };


        //  connection.session = document.getElementById('imgw').href; 
        connection.onstream = function (e) {
            e.mediaElement.width = 200;
            if (e.type == 'local')
                attachMediaStream(document.getElementById("myvideoo"), e.stream);

            else if (e.type == 'remote') {
                videosContainer.insertBefore(e.mediaElement, videosContainer.firstChild);
             
                scaleVideos();
            }
        };


        connection.onstreamended = function (e) {

            e.mediaElement.style.opacity = 0;
            setTimeout(function () {
                if (e.mediaElement.parentNode) {
                    e.mediaElement.parentNode.removeChild(e.mediaElement);
                }
                scaleVideos();
            }, 1000);
        };

        var sessions = {};
        connection.onNewSession = function (session) {
            if (sessions[session.sessionid]) return;
            sessions[session.sessionid] = session;
            var tr = document.createElement('div');
            tr.innerHTML = '<strong>' + session.extra['session-name'] + '</strong> is running a conference!<br/>' +
                        '<button class="join btn btn-danger">Join</button><br/>';
            roomsList.insertBefore(tr, roomsList.firstChild);

            var joinRoomButton = tr.querySelector('.join');
            joinRoomButton.setAttribute('data-sessionid', session.sessionid);
            joinRoomButton.onclick = function () {
                this.disabled = true;

                var sessionid = this.getAttribute('data-sessionid');
                session = sessions[sessionid];

                if (!session) throw 'No such session exists.';

                connection.join(session);
            };
            // Ask if we want to talk
            /*     alertify.confirm(session.extra['session-name'] + ' is running a conference!Do you want to Join?', function (e) {
            if (e) {
            var sessionid = session.sessionid;
            session = sessions[sessionid];

            if (!session) throw 'No such session exists.';

            connection.join(session);
     
            } else {
                   
            }
            });*/





        };



        var videosContainer = document.getElementById('videos-container') || document.body;
        var roomsList = document.getElementById('roomslist');

        this.disabled = true;
        connection.extra = {
            'session-name': document.getElementById('hdnUserName').value
        };
        connection.open(document.getElementById('imgw').href.replace(/\/|:|#|%|\.|\[|\]/g, ''));
        // connection.open(document.getElementById('groupName').value);

        // setup signaling to search existing sessions
        connection.connect();

        (function () {
            var uniqueToken = document.getElementById('groupName').value;
            //                    if (uniqueToken)
            //                        if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
            //                        else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace( /\./g , '-');
        })();

        function scaleVideos() {
            var videos = document.querySelectorAll('videos-container'),
                        length = videos.length, video;

            var minus = 130;
            var windowHeight = 700;
            var windowWidth = 600;
            var windowAspectRatio = windowWidth / windowHeight;
            var videoAspectRatio = 4 / 3;
            var blockAspectRatio;
            var tempVideoWidth = 0;
            var maxVideoWidth = 0;

            for (var i = length; i > 0; i--) {
                blockAspectRatio = i * videoAspectRatio / Math.ceil(length / i);
                if (blockAspectRatio <= windowAspectRatio) {
                    tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(length / i);
                } else {
                    tempVideoWidth = windowWidth / i;
                }
                if (tempVideoWidth > maxVideoWidth)
                    maxVideoWidth = tempVideoWidth;
            }
            for (var i = 0; i < length; i++) {
                video = videos[i];
                if (video)
                    video.width = maxVideoWidth - minus;
            }
        }

        

        window.onresize = scaleVideos;


    };

    _newSignal = function (signal) {
        data = JSON.parse(signal);
        console.log('sender :' + data.sender);
        console.log('message :' + data.message);
        if (data.sender == currentUserUUID) return;

        if (channels[data.channel] && channels[data.channel].onmessage) {
            channels[data.channel].onmessage(data.message);
        };
        console.log('sender :' + data.sender);
    };

    var mv = 0;
    var ma = 0;
    $('#togetherjs-video-button').click(function () {
        // if local or remote stream is muted
        if (mv == 0) {
            connection.streams.mute({
                video: true,
                audio: true,
                type: 'local'

            });
            mv = 1;
        }
        else if (mv == 1) {
            // if local or remote stream is unmuted
            connection.streams.unmute({
                video: true,
                audio: true,
                type: 'local'

            });
            mv = 0;
        }
        //     $('#myvideo').toggle();
        $('#mutevideo').toggle();
        if ($('#myvideo').css('display') == "block")
            document.getElementById('togetherjs-video-button').title = "Turn off video";
        else
            document.getElementById('togetherjs-video-button').title = "Turn on video";
    });
    //leave session
    $('#togetherjs-endcall-button').click(function () {
        connection.leave();
        _signaler.server.leaveGroup(grp);
         
    });

    $('#togetherjs-audio-button').click(function () {
        // if local or remote stream is muted
        if (ma == 0) {
            connection.streams.mute({
                audio: true,
                type: 'local'

            });
            ma = 1;
            document.getElementById('myvideoo').volume = 0;

            document.getElementById('togetherjs-audio-button').title = "Turn on microphone";


        }
        else if (ma == 1) {
            // if local or remote stream is unmuted
            connection.streams.unmute({
                audio: true,
                type: 'local'

            });
            ma = 0;
            document.getElementById('myvideoo').volume = 1;

            document.getElementById('togetherjs-audio-button').title = "Turn off microphone";

        }
        $('#muteaudio').toggle();

    });

    // Return our exposed API
    return {
        initialize: _initialize,
        newSignal: _newSignal


    };
})();