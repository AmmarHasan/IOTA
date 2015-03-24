var WebRtcDemo = WebRtcDemo || {};

/************************************************
whiteBoard.js

Implements WhiteBoard for our page
************************************************/
WebRtcDemo.WhiteBoard = (function () {
    var DrawState =
{
    Started: 0,
    Inprogress: 1,
    Completed: 2
}
    var DrawTool =
{
    Pencil: 0,
    Line: 1,
    Text: 2,
    Rect: 3,
    Ellipse: 4,
    Erase: 5,
    Clear: 6,
    Circle: 7
}
    var whiteboardHub;
    var tool_default = 'pencil';
    var canvas, context, canvaso, contexto;

    var tools = {};
    var tool;
    var WIDTH;
    var HEIGHT;
    var INTERVAL = 20;

    var mx, my;
    var URL = window.webkitURL || window.URL;

    var selectedLineWidth = 5;


    var drawObjectsCollection = [];
    var drawPlaybackCollection = [];


    function DrawIt(drawObject, syncServer) {


        if (drawObject.Tool == DrawTool.Line) {
            switch (drawObject.currentState) {
                case DrawState.Inprogress:
                case DrawState.Completed:
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.beginPath();
                    context.moveTo(drawObject.StartX, drawObject.StartY);
                    context.lineTo(drawObject.CurrentX, drawObject.CurrentY);
                    context.stroke();
                    context.closePath();
                    if (drawObject.currentState == DrawState.Completed) {
                        updatecanvas();
                    }
                    break;
            }
        }
        else if (drawObject.Tool == DrawTool.Pencil) {

            switch (drawObject.currentState) {
                case DrawState.Started:
                    context.beginPath();
                    context.moveTo(drawObject.StartX, drawObject.StartY);
                    break;
                case DrawState.Inprogress:
                case DrawState.Completed:
                    context.lineTo(drawObject.CurrentX, drawObject.CurrentY);
                    context.stroke();
                    if (drawObject.currentState == DrawState.Completed) {
                        updatecanvas();
                    }
                    break;
            }
        }
        else if (drawObject.Tool == DrawTool.Text) {
            switch (drawObject.currentState) {
                case DrawState.Started:
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    clear(context);
                    context.save();
                    context.font = 'normal 16px Calibri';
                    context.fillStyle = $("#color").css("background-color");
                    context.textAlign = "left";
                    context.textBaseline = "bottom";
                    context.fillText(drawObject.Text, drawObject.StartX, drawObject.StartY);
                    context.restore();
                    updatecanvas();
                    break;

            }


        }
        else if (drawObject.Tool == DrawTool.Erase) {

            switch (drawObject.currentState) {

                case DrawState.Started:
                    context.fillStyle = "#f8f8f8";
                    context.fillRect(drawObject.StartX, drawObject.StartY, 10, 10);
                    context.restore();
                    updatecanvas();
                    //context.clearRect(drawObject.StartX, drawObject.StartY, 5, 5);
                    break;
                case DrawState.Inprogress:
                case DrawState.Completed:
                    context.fillStyle = "#f8f8f8";
                    context.fillRect(drawObject.CurrentX, drawObject.CurrentY, 10, 10);
                    context.restore();
                    updatecanvas();
                    // context.clearRect(drawObject.CurrentX, drawObject.CurrentY, 5, 5);
                    break;
            }


        }
        else if (drawObject.Tool == DrawTool.Rect) {

            switch (drawObject.currentState) {
                case DrawState.Inprogress:
                case DrawState.Completed:
                    var x = Math.min(drawObject.CurrentX, drawObject.StartX),
                    y = Math.min(drawObject.CurrentY, drawObject.StartY),
                    w = Math.abs(drawObject.CurrentX - drawObject.StartX),
                    h = Math.abs(drawObject.CurrentY - drawObject.StartY);

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    if (!w || !h) {
                        return;
                    }

                    context.strokeRect(x, y, w, h);
                    if (drawObject.currentState == DrawState.Completed) {
                        updatecanvas();
                    }
                    break;
            }

        }


        else if (drawObject.Tool == DrawTool.Ellipse) {
            switch (drawObject.currentState) {
                case DrawState.Inprogress:
                case DrawState.Completed:
                    var x = Math.min(drawObject.CurrentX, drawObject.StartX),
                    y = Math.min(drawObject.CurrentY, drawObject.StartY),
                    w = Math.abs(drawObject.CurrentX - drawObject.StartX),
                    h = Math.abs(drawObject.CurrentY - drawObject.StartY);

                    context.clearRect(0, 0, canvas.width, canvas.height);


                    if (!w || !h) {
                        return;
                    }


                    var kappa = .5522848;
                    ox = (w / 2) * kappa, // control point offset horizontal
                  oy = (h / 2) * kappa, // control point offset vertical
                  xe = x + w,           // x-end
                  ye = y + h,           // y-end
                  xm = x + w / 2,       // x-middle
                  ym = y + h / 2;       // y-middle

                    context.beginPath();
                    context.moveTo(x, ym);
                    context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
                    context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
                    context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                    context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
                    context.closePath();
                    context.stroke();
                    if (drawObject.currentState == DrawState.Completed) {
                        updatecanvas();
                    }

                    break;
            }
        }


        else if (drawObject.Tool == DrawTool.Circle) {
            switch (drawObject.currentState) {
                case DrawState.Inprogress:
                case DrawState.Completed:
                    context.clearRect(0, 0, canvas.width, canvas.height);



                    var x = (drawObject.CurrentX + drawObject.StartX) / 2;
                    var y = (drawObject.CurrentY + drawObject.StartY) / 2;
                    var radius = Math.max(Math.abs(drawObject.CurrentX - drawObject.StartX), Math.abs(drawObject.CurrentY - drawObject.StartY)) / 2;

                    context.beginPath();

                    context.arc(x, y, radius, 0, Math.PI * 2, false);
                    context.stroke();
                    context.closePath();

                    context.stroke();
                    if (drawObject.currentState == DrawState.Completed) {
                        updatecanvas();
                    }

                    break;
            }
        }

        if (syncServer && drawObject.Tool != DrawTool.Pencil) {

            drawObjectsCollection = [];
            drawObjectsCollection.push(drawObject);
            var message = JSON.stringify(drawObjectsCollection);
            if (whiteboardHub != null)
                whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#hdnUserName").val());

        }
    }

    function DrawObject() {
    }
    function UpdatePlayback(drawObject) {
        if (drawPlaybackCollection.length > 1000) {
            drawPlaybackCollection = [];
            alert("Playback cache is cleared due to more than 1000 items");
        }
        drawPlaybackCollection.push(drawObject);
    }
    function Clear() {
        canvaso.hieght = canvas.hieght;
        canvaso.width = canvas.width;
    }
    function Playback() {
        if (drawPlaybackCollection.length == 0) {
            alert("No drawing to play"); return;
        }
        canvaso.hieght = canvas.hieght;
        canvaso.width = canvas.width;


        for (var i = 0; i < drawPlaybackCollection.length; i++) {
            var drawObject = drawPlaybackCollection[i];
            setTimeout(function () { DrawIt(drawObject, false, false); }, 3000);
        }
        drawPlaybackCollection = [];
    }
    _initBoard = function () {


        console.log('initBoard is called');
        canvaso = document.getElementById('imageView');
        var container = document.getElementById('container');

        canvaso.height = $(container).height();
        canvaso.width = $(container).width();

        // Get the 2D canvas context.
        contexto = canvaso.getContext('2d');
        // Add the temporary canvas.
        canvas = document.createElement('canvas');
        canvas.id = 'imageTemp';
        container.appendChild(canvas);
        canvas.height = $(container).height();
        canvas.width = $(container).width();

      

        context = canvas.getContext('2d');
        // Activate the default tool.
        SelectTool(tool_default);

        //tools
        var pencil = document.getElementById('pencil');
        var line = document.getElementById('line');
        var rect = document.getElementById('rect');
        var circle = document.getElementById('circle');
        var text = document.getElementById('text');
        var erase = document.getElementById('erase');
        var clear = document.getElementById('clear');
        var ellipse = document.getElementById('ellipse');
        var save = document.getElementById('save');

        pencil.addEventListener('click', ev_tool_change, false);
        ellipse.addEventListener('click', ev_tool_change, false);

        line.addEventListener('click', ev_tool_change, false);
        rect.addEventListener('click', ev_tool_change, false);
        erase.addEventListener('click', ev_tool_change, false);
        clear.addEventListener('click', ev_tool_change, false);
        circle.addEventListener('click', ev_tool_change, false);
        text.addEventListener('click', ev_tool_change, false);
        save.addEventListener('click', SaveDrawings, false);


        //            //change stoke color
        //            var tool_color = document.getElementById('stroke');
        //            tool_color.addEventListener('change', ev_color_change, false);

        //            
        context.strokeStyle = 'black';

        var is_touch_device = 'ontouchstart' in document.documentElement;

        if (is_touch_device) {
            canvas.addEventListener('touchstart', ev_canvas, false);
            canvas.addEventListener('touchend', ev_canvas, false);
            canvas.addEventListener('touchmove', ev_canvas, false);

        }
        else {
            // Attach the mousedown, mousemove and mouseup event listeners.
            canvas.addEventListener('mousedown', ev_canvas, false);
            canvas.addEventListener('mousemove', ev_canvas, false);
            canvas.addEventListener('mouseup', ev_canvas, false);

        }


    };

    // The event handler for any changes made to the tool selector.
    ev_tool_change = function (ev) {
        $(".cols").css("display", "none");

        i = 0;

        if (tools[this.id]) {
            tool = new tools[this.id]();
            console.log('Current tool is : ' + this.id);
        }

    };



    // The event handler for any changes made to the color selector.
    ev_color_change = function (ev) {
        context.strokeStyle = this.value;

    };
    function clear(c) {
        c.clearRect(0, 0, WIDTH, HEIGHT);
    }

    function ev_canvas(ev) {
        var iebody = (document.compatMode && document.compatMode != "BackCompat") ? document.documentElement : document.body

        var dsocleft = document.all ? iebody.scrollLeft : pageXOffset
        var dsoctop = document.all ? iebody.scrollTop : pageYOffset
        var appname = window.navigator.appName;
        var is_touch_device = 'ontouchstart' in document.documentElement;
        try {

            if (is_touch_device && (ev.touches[0])) {
                ev._x = ev.targetTouches[0].pageX;
                ev._y = ev.targetTouches[0].pageY;




                // Now we need to get the offset of the canvas location
                var obj = canvas;

                if (obj.offsetParent) {
                    // Every time we find a new object, we add its offsetLeft and offsetTop to curleft and curtop.
                    do {
                        ev._x -= obj.offsetLeft;
                        ev._y -= obj.offsetTop;
                    }
                    // The while loop can be "while (obj = obj.offsetParent)" only, which does return null
                    // when null is passed back, but that creates a warning in some editors (i.e. VS2010).
                    while ((obj = obj.offsetParent) != null);
                }

            }
            else {
                if (ev.layerX || ev.layerX == 0) {  // Firefox
                    ev._x = ev.layerX;
                    if ('Netscape' == appname)
                        ev._y = ev.layerY;
                    else
                        ev._y = ev.layerY - dsoctop;

                }
                else if (ev.offsetX || ev.offsetX == 0) { // Opera
                    ev._x = ev.offsetX;
                    ev._y = ev.offsetY - dsoctop;
                }
            }
            // Call the event handler of the tool.
            var func = tool[ev.type];

            if (func) {
                func(ev);
            }
        }
        catch (err) {
            alert(err.message);
        }
    }

    function getMouse(e) {
        var element = canvaso, offsetX = 0, offsetY = 0;

        if (element.offsetParent) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        // Add padding and border style widths to offset
        offsetX += stylePaddingLeft;
        offsetY += stylePaddingTop;

        offsetX += styleBorderLeft;
        offsetY += styleBorderTop;

        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        mx = e._x;
        my = e._y;
    }

    function updatecanvas() {
        contexto.drawImage(canvas, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    tools.pencil = function () {
        var tool = this;
        this.started = false;
        drawObjectsCollection = [];
        this.mousedown = function (ev) {
            var drawObject = new DrawObject();
            drawObject.Tool = DrawTool.Pencil;
            tool.started = true;
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            DrawIt(drawObject, true);
            drawObjectsCollection.push(drawObject);
        };

        this.mousemove = function (ev) {
            if (tool.started) {
                var drawObject = new DrawObject();
                drawObject.Tool = DrawTool.Pencil;
                drawObject.currentState = DrawState.Inprogress;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                drawObjectsCollection.push(drawObject);
            }
        };

        // This is called when you release the mouse button.
        this.mouseup = function (ev) {
            if (tool.started) {
                var drawObject = new DrawObject();
                drawObject.Tool = DrawTool.Pencil;
                tool.started = false;
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                drawObjectsCollection.push(drawObject);
                var message = JSON.stringify(drawObjectsCollection);
                if (whiteboardHub != null)

                    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#hdnUserName").val());


            }
        };
        this.mouseout = function (ev) {
            if (tool.started) {
                var message = JSON.stringify(drawObjectsCollection);
                if (whiteboardHub != null)

                    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#hdnUserName").val());

            }
            tool.started = false;

        };

        this.touchstart = function (ev) {
            ev.preventDefault();
            var drawObject = new DrawObject();
            drawObject.Tool = DrawTool.Pencil;
            tool.started = true;
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            DrawIt(drawObject, true);
            drawObjectsCollection.push(drawObject);

        };

        this.touchmove = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                var drawObject = new DrawObject();
                drawObject.Tool = DrawTool.Pencil;
                drawObject.currentState = DrawState.Inprogress;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                drawObjectsCollection.push(drawObject);
            }

        };

        this.touchend = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                var message = JSON.stringify(drawObjectsCollection);
                if (whiteboardHub != null)

                    whiteboardHub.server.sendDraw(message, $("#sessinId").val(), $("#groupName").val(), $("#hdnUserName").val());

            }
            tool.started = false;


        };

    };


    // The clear tool.
    tools.clear = function () {
        this.mousedown = function (ev) {
            var yes = confirm('Clear drawing?');
            if (yes) {
                contexto.clearRect(0, 0, canvas.width, canvas.height);
                //                    context.fillStyle = "rgb(255,255,255)";
                //                    context.fillRect(0, 0, canvas.width, canvas.height);
                //img_update();


            }
        };
        this.touchstart = function (ev) {
            ev.preventDefault();

            var yes = confirm('Clear drawing?');
            if (yes) {
                contexto.clearRect(0, 0, canvas.width, canvas.height);

            }
        };

    };

    tools.rect = function () {
        var tool = this;
        var drawObject = new DrawObject();
        drawObject.Tool = DrawTool.Rect;
        this.started = false;

        this.mousedown = function (ev) {
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;
        };

        this.mousemove = function (ev) {
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
        };

        this.mouseup = function (ev) {
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;

            }
        };
        this.touchstart = function (ev) {
            ev.preventDefault();
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;

        };
        this.touchmove = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);

        };
        this.touchend = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;

            }

        };
    };


    tools.circle = function () {
        var tool = this;
        var drawObject = new DrawObject();
        drawObject.Tool = DrawTool.Circle;
        this.started = false;

        this.mousedown = function (ev) {
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;
        };

        this.mousemove = function (ev) {
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
        };

        this.mouseup = function (ev) {
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;

            }
        };
        this.touchstart = function (ev) {
            ev.preventDefault();
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;

        };
        this.touchmove = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);

        };
        this.touchend = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;

            }

        };
    };


    tools.line = function () {
        var tool = this;
        var drawObject = new DrawObject();
        drawObject.Tool = DrawTool.Line;
        this.started = false;

        this.mousedown = function (ev) {
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;
        };

        this.mousemove = function (ev) {
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
        };

        this.mouseup = function (ev) {
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;
            }
        };
        this.touchstart = function (ev) {
            ev.preventDefault();
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;

        };
        this.touchmove = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);

        };
        this.touchend = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;
            }

        };
    };

    tools.ellipse = function () {
        var tool = this;
        var drawObject = new DrawObject();
        drawObject.Tool = DrawTool.Ellipse;
        this.started = false;

        this.mousedown = function (ev) {
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;
        };

        this.mousemove = function (ev) {
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
        };

        this.mouseup = function (ev) {
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;

            }
        };
        this.touchstart = function (ev) {
            ev.preventDefault();
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            tool.started = true;

        };
        this.touchmove = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);

        };
        this.touchend = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                drawObject.currentState = DrawState.Completed;
                drawObject.CurrentX = ev._x;
                drawObject.CurrentY = ev._y;
                DrawIt(drawObject, true);
                tool.started = false;

            }

        };
    };
    tools.text = function () {
        var tool = this;
        this.started = false;
        var drawObject = new DrawObject();
        drawObject.Tool = DrawTool.Text;
        this.mousedown = function (ev) {

            if (!tool.started) {
                tool.started = true;
                drawObject.currentState = DrawState.Started;
                drawObject.StartX = ev._x;
                drawObject.StartY = ev._y;
                var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
                drawObject.Text = "";
                drawObject.Text = text_to_add;
                if (text_to_add.length < 1) {
                    tool.started = false;
                    return;
                }

                DrawIt(drawObject, true);
                tool.started = false;
                updatecanvas();
            }
        };

        this.mousemove = function (ev) {
            if (!tool.started) {
                return;
            }
        };

        this.mouseup = function (ev) {
            if (tool.started) {
                tool.mousemove(ev);
                tool.started = false;
                updatecanvas();
            }
        };
        this.touchstart = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                tool.started = true;
                drawObject.currentState = DrawState.Started;
                drawObject.StartX = ev._x;
                drawObject.StartY = ev._y;
                var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
                drawObject.Text = "";
                drawObject.Text = text_to_add;
                if (text_to_add.length < 1) {
                    tool.started = false;
                    return;
                }

                DrawIt(drawObject, true);
                tool.started = false;
                updatecanvas();
            }

        };
        this.touchmove = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                return;
            }

        };
        this.touchend = function (ev) {
            ev.preventDefault();
            if (tool.started) {
                tool.mousemove(ev);
                tool.started = false;
                updatecanvas();
            }

        };
    }

    tools.erase = function (ev) {


        var tool = this;
        this.started = false;
        var drawObject = new DrawObject();
        drawObject.Tool = DrawTool.Erase;
        this.mousedown = function (ev) {
            tool.started = true;
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            DrawIt(drawObject, true);
        };
        this.mousemove = function (ev) {
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
        };
        this.mouseup = function (ev) {
            drawObject.currentState = DrawState.Completed;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
            tool.started = false;
        };
        this.touchstart = function (ev) {
            ev.preventDefault();
            tool.started = true;
            drawObject.currentState = DrawState.Started;
            drawObject.StartX = ev._x;
            drawObject.StartY = ev._y;
            DrawIt(drawObject, true);

        };
        this.touchmove = function (ev) {
            ev.preventDefault();
            if (!tool.started) {
                return;
            }
            drawObject.currentState = DrawState.Inprogress;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);

        };
        this.touchend = function (ev) {
            ev.preventDefault();
            drawObject.currentState = DrawState.Completed;
            drawObject.CurrentX = ev._x;
            drawObject.CurrentY = ev._y;
            DrawIt(drawObject, true);
            tool.started = false;

        };
    }



    var i = 0;
    $("#color").click(function (e) {
        e.preventDefault();
        if (i == 0) {
            i = 1;
            $(".cols").css("display", "block");
        }
        else if (i == 1) {
            i = 0;
            $(".cols").css("display", "none");
        }




    });

    $(".black").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "black");
        $(".cols").css("display", "none");
        context.strokeStyle = "black";

    });

    $(".blue").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "blue");
        $(".cols").css("display", "none");
        context.strokeStyle = "blue";

    });


    $(".red").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "red");
        $(".cols").css("display", "none");
        context.strokeStyle = "red";
    });





    $(".yellow").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "yellow");
        $(".cols").css("display", "none");
        context.strokeStyle = "yellow";

    });


    $(".orange").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "orange");
        $(".cols").css("display", "none");
        context.strokeStyle = "orange";

    });

    $(".green").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "green");
        $(".cols").css("display", "none");
        context.strokeStyle = "green";

    });

    $(".purple").click(function (e) {

        e.preventDefault();
        i = 0;

        $("#color").css("background", "purple");
        $(".cols").css("display", "none");
        context.strokeStyle = "purple";

    });


    function fireEvent(element, event) {
        var evt;
        if (document.createEventObject) {
            // dispatch for IE
            evt = document.createEventObject();
            return element.fireEvent('on' + event, evt)
        }
        else {
            // dispatch for firefox + others
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, true, true); // event type,bubbling,cancelable
            return !element.dispatchEvent(evt);
        }
    }

    function UpdateCanvas() {
        var file_UploadImg = document.getElementById("fileUploadImg");
        LoadImageIntoCanvas(URL.createObjectURL(file_UploadImg.files[0]));
    }

    function LoadImageIntoCanvas(bgImageUrl) {

        var image_View = document.getElementById("imageView");
        var ctx = image_View.getContext("2d");

        var img = new Image();
        img.onload = function () {
            image_View.width = img.width;
            image_View.height = img.height;
            WIDTH = img.width;
            HEIGHT = img.height;
            ctx.clearRect(0, 0, image_View.width, image_View.height);
            ctx.drawImage(img, 1, 1, img.width, img.height);
        }
        img.src = bgImageUrl;

        // Activate the default tool.
        SelectTool(tool_default);
    }

    function SelectTool(toolName) {
        if (tools[toolName]) {
            tool = new tools[toolName]();
        }

        if (toolName == "line" || toolName == "curve" || toolName == "measure")
            canvaso.style.cursor = "crosshair";
        else if (toolName == "select")
            canvaso.style.cursor = "default";
        else if (toolName == "text")
            canvaso.style.cursor = "text";

        ChangeIcons(toolName);

    }
    function ChangeIcons(toolName) {

        if (toolName == "line")
            $("#imgline").attr({ src: "/images/line.png", border: "1px" });
        else
            $("#imgline").attr({ src: "/images/line_dim.png", border: "0px" });

        if (toolName == "pencil")
            $("#imgpencil").attr({ src: "/images/pencil.png", border: "1px" });
        else
            $("#imgpencil").attr({ src: "/images/pencil_dim.png", border: "0px" });

        if (toolName == "rect")
            $("#imgrect").attr({ src: "/images/rect.png", border: "1px" });
        else
            $("#imgrect").attr({ src: "/images/rect_dim.png", border: "0px" });

        if (toolName == "erase")
            $("#imgerase").attr({ src: "/images/erase.png", border: "1px" });
        else
            $("#imgerase").attr({ src: "/images/erase_dim.png", border: "0px" });


        if (toolName == "text")
            $("#imgtext").attr({ src: "/images/text.png", border: "1px" });
        else
            $("#imgtext").attr({ src: "/images/text_dim.png", border: "0px" });



    }


    function getAbsolutePosition(e) {
        var curleft = curtop = 0;
        if (e.offsetParent) {
            curleft = e.offsetLeft;
            curtop = e.offsetTop;
            while (e = e.offsetParent) {
                curleft += e.offsetLeft;
                curtop += e.offsetTop;
            }
        }
        return [curleft, curtop];
    }

    function SaveDrawings() {


        var img = canvaso.toDataURL("image/png");
        WindowObject = window.open('', "PrintPaintBrush", "toolbars=no,scrollbars=yes,status=no,resizable=no");
        WindowObject.document.open();
        WindowObject.document.writeln('<img src="' + img + '"/>');
        WindowObject.document.close();
        WindowObject.focus();

    }







    var drawobjects = [];

    _joinHub = function (hub, grpname) {

        whiteboardHub = hub;
        grpId = grpname;
        console.log('Grp name received : ' + grpname);
    };

    _handleDraw = function (message, sessnId, name) {
        var sessId = $('#sessinId').val();
        if (sessId != sessnId) {
            $("#divStatus").html("");

            $("#divStatus").html("<i>" + name +" " +"is drawing...</i>")
            console.log(name +"is drawing...");
            var drawObjectCollection = jQuery.parseJSON(message)
            for (var i = 0; i < drawObjectCollection.length; i++) {
                DrawIt(drawObjectCollection[i], false);
                if (drawObjectCollection[i].currentState) {
                    if (drawObjectCollection[i].currentState == DrawState.Completed) {
                        $("#divStatus").html("<i>" + name + " drawing completing...</i>")
                        $("#divStatus").html("");

                    }
                }
            }
        }



    };

    // Return our exposed API
    return {
        initBoard: _initBoard,
        joinHub: _joinHub,
        handleDraw: _handleDraw

    };

})();