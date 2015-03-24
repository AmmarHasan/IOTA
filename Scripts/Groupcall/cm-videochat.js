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
    // Initialize the ConnectionManager with a signaler and callbacks to handle events
    _initialize = function (grpp) {

        connection = new RTCMultiConnection();
        connection.session = {
            audio: true,
            video: true
        };
        //  connection.session = document.getElementById('imgw').href; 
        connection.onstream = function (e) {
            e.mediaElement.width = 600;
            if (e.type == 'local')
                attachMediaStream(document.getElementById("myvideoo"), e.stream);

            else if (e.type == 'remote') {
                videosContainer.insertBefore(e.mediaElement, videosContainer.firstChild);
                rotateVideo(e.mediaElement);
                scaleVideos();
            }
        };

        function rotateVideo(mediaElement) {
            mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
            setTimeout(function () {
                mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
            }, 1000);
        }

        connection.onstreamended = function (e) {
            e.mediaElement.style.opacity = 0;
            rotateVideo(e.mediaElement);
            setTimeout(function () {
                if (e.mediaElement.parentNode) {
                    e.mediaElement.parentNode.removeChild(e.mediaElement);
                }
                scaleVideos();
            }, 1000);
        };

        var sessions = {};
        connection.onNewSession = function (session) {


            if (sessions[session.sessionid]) {
                console.log(session.sessionid);

                return;
            }
            sessions[session.sessionid] = session;

            var sessionid = session.sessionid;
            session = sessions[sessionid];

            if (!session) throw 'No such session exists.';

            connection.join(session);
            console.log('session is already there... :' + session.sessionid);


        };



        var videosContainer = document.getElementById('videos-container') || document.body;
        this.disabled = true;
        connection.extra = {
            'session-name': document.getElementById('groupName').value
        };
        connection.open(document.getElementById('imgw').href.replace(/\/|:|#|%|\.|\[|\]/g, ''));
        // setup signaling to search existing sessions
        connection.connect();

        (function () {
            var uniqueToken = document.getElementById('groupName');
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

    $('#togetherjs-audio-button').click(function () {
        // if local or remote stream is muted
        if (ma == 0) {
            connection.streams.mute({
                audio: true,
                type: 'local'

            });
            ma = 1;
            document.getElementById('myvideoo').volume = 0 ;

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
        initialize: _initialize


    };
})();