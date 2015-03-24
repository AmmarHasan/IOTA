var WebRtcDemo = WebRtcDemo || {};

/************************************************
ConnectionManager.js

Implements WebRTC connectivity for sharing video
streams, and surfaces functionality to the rest
of the app.

WebRTC API has been normalized using 'adapter.js'

************************************************/
WebRtcDemo.ConnectionManager = (function () {
    var _signaler, grp;
    //global stuff
    var channel;
    var onmessageCallbacks = {};
    var speakerid;
    var meeting;
    var data;
    var currentUserUUID;
    // Initialize the ConnectionManager with a signaler and callbacks to handle events
    _initialize = function (signaler, grpp) {
        _signaler = signaler;
        console.log('Signaler :' + _signaler.connection.id);
        currentUserUUID = _signaler.connection.id;

        grp = grpp;
        console.log('Grp :' + grp);
        // Hook up the UI
        _startconference();
    };
    _startconference = function () {

        meeting = new Meeting(location.href);
        var videoContainer = document.getElementById('videos-container');
        meeting.userid = currentUserUUID;

        meeting.openSignalingChannel = function (onmessage) {
            channel = this.channel;
            onmessageCallbacks[channel] = onmessage;
            return {
                send: function (message) {
                    _signaler.server.sendSignal(JSON.stringify({ userid: currentUserUUID, channel: channel, message: message }), grp);
                },
                channel: channel
            };
        };



        //  meeting.firebase = 'rtc';
        // on getting media stream
        meeting.onaddstream = function (e) {
            if (e.type == 'local') {
                e.video.width = 200;
                $(e.video).attr('id', 'mmf');
                document.getElementById("myvideoo").appendChild(e.video);
            }
            else if (e.type == 'remote') {
                e.video.width = 200;

                videoContainer.appendChild(e.video);

            }
        };



        // check pre-created meeting rooms
        meeting.check();

        // if someone leaves; just remove his video
        meeting.onuserleft = function (userid) {
            var video = document.getElementById(userid);
            if (video) video.parentNode.removeChild(video);
        };


        document.getElementById('setup-new-meeting').onclick = function () {
            // setup new meeting room
            meeting.setup($("#groupname").val());
            speakerid = currentUserUUID;
            _signaler.server.sendSpeaker(speakerid);

        

        };

    };



    _newSignal = function (signal) {
        data = JSON.parse(signal);
        if (data.userid != currentUserUUID) {
            if (data.leaving && root.onuserleft) root.onuserleft(data.userid);
            else {
                onmessageCallbacks[data.channel](data.message);

            }
        }
    };


    var mv = 0;
    var ma = 0;
    $('#togetherjs-video-button').click(function () {
        // if local or remote stream is muted
        meeting.stream.getVideoTracks()[0].enabled = !(meeting.stream.getVideoTracks()[0].enabled);

        if (mv == 0) {
            $('#mmf').css("display", "none");
            mv = 1;
        }
        else if (mv == 1) {
            // if local or remote stream is unmuted
            $('#mmf').css("display", "block");


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

            ma = 1;
            document.getElementById('mmf').volume = 0;

            document.getElementById('togetherjs-audio-button').title = "Turn on microphone";


        }
        else if (ma == 1) {
            // if local or remote stream is unmuted

            ma = 0;
            document.getElementById('mmf').volume = 1;

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