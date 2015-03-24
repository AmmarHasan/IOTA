if (window.addEventListener) {
    window.addEventListener('load', function () {
        var canvas, context, canvaso, contexto;
        // global implementation of canvas.data equivalent
        var myData = new Object();

        // The active tool instance.
        var tool;
        var tool_default = 'pencil';


        function init() {
            // Find the canvas element.
            canvaso = document.getElementById('imageView');
            var container = document.getElementById('container');

            canvaso.width = $(container).width();
            canvaso.height = 520;
            canvas = document.getElementById('imageView');
            //   context = canvas.get(0).getContext('2d');
            // Get the 2D canvas context.
            contexto = canvaso.getContext('2d');
            // Add the temporary canvas.
            canvas = document.createElement('canvas');
            canvas.id = 'imageTemp';

            container.appendChild(canvas);
            canvas.width = $(container).width();
            canvas.height = $(container).height();


            context = canvas.getContext('2d');

            //Run function when browser resizes
            $(window).resize(respondCanvas);

            function respondCanvas() {

                canvas.width = $(container).width();
                canvas.height = $(container).height();



            }

            //Initial call 
            respondCanvas();

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
            line.addEventListener('click', ev_tool_change, false);
            rect.addEventListener('click', ev_tool_change, false);
            ellipse.addEventListener('click', ev_tool_change, false);
            erase.addEventListener('click', ev_tool_change, false);
            clear.addEventListener('click', ev_tool_change, false);
            circle.addEventListener('click', ev_tool_change, false);
            text.addEventListener('click', ev_tool_change, false);
            save.addEventListener('click', save_drawings, false);
            // links the upload function to a change in the file input
            $("#uploadElement").change(handlePicUpload);

            //change stoke color
            //            var tool_color = document.getElementById('stroke');
            //            tool_color.addEventListener('change', ev_color_change, false);

            // Activate the default tool.
            if (tools[tool_default]) {
                tool = new tools[tool_default]();
            }
            context.strokeStyle = "black";
            // This will be defined on a TOUCH device such as iPad or Android, etc.
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


            myData.currentPic = null;
            myData.canvasWidth = 640;
            myData.canvasHeight = 400;
            myData.imageWidth = 130;
            myData.imageHeight = 80;
            myData.minBufferZone = 50;
            myData.x = 320;
            myData.y = 200;
            myData.dx = +3;
            myData.dy = +3;



        }


        function save_drawings(ev) {

            var img = canvaso.toDataURL("image/png");
            WindowObject = window.open('', "PrintPaintBrush", "toolbars=no,scrollbars=yes,status=no,resizable=no");
            WindowObject.document.open();
            WindowObject.document.writeln('<img src="' + img + '"/>');
            WindowObject.document.close();
            WindowObject.focus();

        }


        $("#btnSave").click(function () {
            var form = $("#drawingForm");
            var image = canvaso.toDataURL("image/png");

            $("#imageData").val(image);
            var chk_blank = isCanvasTransparent();
            if (chk_blank == true) {
                alert('Nothing on canvas');
            }
            else
                form.submit();

        });


        function isCanvasTransparent() { // true if all pixels Alpha equals to zero
            var ctx = canvaso.getContext("2d");
            var imageData = ctx.getImageData(0, 0, canvaso.offsetWidth, canvaso.offsetHeight);
            for (var i = 0; i < imageData.data.length; i += 4)
                if (imageData.data[i + 3] !== 0) {
                    console.log('Canvas filled');
                    return false;
                }
            console.log('Canvas empty');
            return true;
        }
        // The general-purpose event handler. This function just determines the mouse 
        // position relative to the canvas element.
        function ev_canvas(ev) {

            var is_touch_device = 'ontouchstart' in document.documentElement;

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

            else if (ev.layerX || ev.layerX == 0) { // Firefox
                ev._x = ev.layerX;
                ev._y = ev.layerY;
            }
            else if (ev.offsetX || ev.offsetX == 0) { // Opera
                ev._x = ev.offsetX;
                ev._y = ev.offsetY;
            }
            // Call the event handler of the tool.
            var func = tool[ev.type];

            if (func) {
                func(ev);
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
        // The event handler for any changes made to the tool selector.
        function ev_tool_change(ev) {
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            i = 0;
            if (tools[this.id]) {
                tool = new tools[this.id]();
            }
        }



        //        // The event handler for any changes made to the color selector.
        //        function ev_color_change(ev) {
        //            context.strokeStyle = this.value;

        //        }


        // This function draws the #imageTemp canvas on top of #imageView, after which 
        // #imageTemp is cleared. This function is called each time when the user 
        // completes a drawing operation.
        function img_update() {
            contexto.drawImage(canvas, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);
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



        // This object holds the implementation of each drawing tool.
        var tools = {};

        // The drawing pencil.
        tools.pencil = function () {
            var tool = this;
            this.started = false;
            // This is called when you start holding down the mouse button.
            // This starts the pencil drawing.
            this.mousedown = function (ev) {
                context.beginPath();
                context.moveTo(ev._x, ev._y);
                tool.started = true;
            };

            // This function is called every time you move the mouse. Obviously, it only 
            // draws if the tool.started state is set to true (when you are holding down 
            // the mouse button).
            this.mousemove = function (ev) {
                if (tool.started) {
                    context.lineTo(ev._x, ev._y);
                    context.stroke();
                }
            };

            // This is called when you release the mouse button.
            this.mouseup = function (ev) {
                tool.started = false;
                img_update();


            };


            this.touchstart = function (ev) {
                ev.preventDefault();
                context.beginPath();
                context.moveTo(ev._x, ev._y);
                tool.started = true;
            };

            this.touchmove = function (ev) {
                ev.preventDefault();
                if (tool.started) {
                    context.lineTo(ev._x, ev._y);
                    context.stroke();
                }
            };

            this.touchend = function (ev) {
                ev.preventDefault();
                tool.started = false;
                img_update();

            };



        };




        // The drawing eraser.
        tools.erase = function () {

            var tool = this;
            this.started = false;
            this.mousedown = function (ev) {
                tool.started = true;


            };
            this.mousemove = function (ev) {
                if (!tool.started) {
                    return;
                }
                tool.x0 = ev._x;
                tool.y0 = ev._y;
                context.fillStyle = "#f8f8f8";
                context.fillRect(tool.x0, tool.y0, 10, 10);
                context.restore();
                img_update();

            };
            this.mouseup = function (ev) {
                //                context.fillStyle = "#0f2b19";
                //                context.fillRect(ev._x, ev._y, 20, 20);
                //                context.restore();
                tool.started = false;
                //img_update();
            };




            this.touchstart = function (ev) {
                ev.preventDefault();
                tool.started = true;


            };
            this.touchmove = function (ev) {
                ev.preventDefault();

                if (!tool.started) {
                    return;
                }
                tool.x0 = ev._x;
                tool.y0 = ev._y;
                context.fillStyle = "#f8f8f8";
                context.fillRect(tool.x0, tool.y0, 10, 10);
                context.restore();
                img_update();
            };
            this.touchend = function (ev) {
                ev.preventDefault();

                tool.started = false;
            };

        };

        // The rectangle tool.
        tools.rect = function () {
            var tool = this;
            this.started = false;

            this.mousedown = function (ev) {
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.mousemove = function (ev) {
                if (!tool.started) {
                    return;
                }

                var x = Math.min(ev._x, tool.x0),
          y = Math.min(ev._y, tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);

                context.clearRect(0, 0, canvas.width, canvas.height);

                if (!w || !h) {
                    return;
                }

                context.strokeRect(x, y, w, h);
            };

            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                    img_update();
                }
            };


            this.touchstart = function (ev) {
                ev.preventDefault();
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.touchmove = function (ev) {
                ev.preventDefault();

                if (!tool.started) {
                    return;
                }

                var x = Math.min(ev._x, tool.x0),
          y = Math.min(ev._y, tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);

                context.clearRect(0, 0, canvas.width, canvas.height);

                if (!w || !h) {
                    return;
                }

                context.strokeRect(x, y, w, h);
            };

            this.touchend = function (ev) {
                ev.preventDefault();
                tool.started = false;
                img_update();


            };
        };


        // The ellipse tool.
        tools.ellipse = function () {
            var tool = this;
            this.started = false;

            this.mousedown = function (ev) {
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.mousemove = function (ev) {
                if (!tool.started) {
                    return;
                }
                context.clearRect(0, 0, canvas.width, canvas.height);

                var x = Math.min(ev._x, tool.x0),
          y = Math.min(ev._y, tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);


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
            };

            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                    img_update();
                }
            };


            this.touchstart = function (ev) {
                ev.preventDefault();

                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.touchmove = function (ev) {
                ev.preventDefault();

                if (!tool.started) {
                    return;
                }
                context.clearRect(0, 0, canvas.width, canvas.height);

                var x = Math.min(ev._x, tool.x0),
          y = Math.min(ev._y, tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);


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
            };

            this.touchend = function (ev) {
                ev.preventDefault();
                tool.started = false;
                img_update();


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
                    context.clearRect(0, 0, canvas.width, canvas.height);

                }
            };

        };

        // Text tool
        tools.text = function () {
            var tool = this;
            this.started = false;

            this.mousedown = function (ev) {
                if (!tool.started) {
                    tool.started = true;

                    tool.x0 = ev._x;
                    tool.y0 = ev._y;

                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.save();
                    context.font = 'normal 16px Calibri';
                    context.fillStyle = $("#color").css("background-color");

                    context.textAlign = "left";
                    context.textBaseline = "bottom";
                    var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
                    if (text_to_add.length < 1) {
                        tool.started = false;
                        return;
                    }

                    context.fillText(text_to_add, ev._x, ev._y);
                    context.restore();
                    tool.started = false;

                    img_update();
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
                    img_update();
                }
            };






            this.touchstart = function (ev) {
                if (!tool.started) {
                    tool.started = true;

                    tool.x0 = ev._x;
                    tool.y0 = ev._y;

                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.save();
                    context.font = 'normal 16px Calibri';
                    context.fillStyle = "white";
                    context.textAlign = "left";
                    context.textBaseline = "bottom";
                    var text_to_add = prompt('Enter the text:', ' ', 'Add Text');
                    if (text_to_add.length < 1) {
                        tool.started = false;
                        return;
                    }

                    context.fillText(text_to_add, ev._x, ev._y);
                    context.restore();
                    tool.started = false;

                    img_update();
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
                tool.started = false;
                img_update();

            };


        }

        // The circle tool.
        tools.circle = function () {
            var tool = this;
            this.started = false;

            this.mousedown = function (ev) {
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.mousemove = function (ev) {
                if (!tool.started) {
                    return;
                }
                context.clearRect(0, 0, canvas.width, canvas.height);


                context.beginPath();
                var x = (ev._x + tool.x0) / 2;
                var y = (ev._y + tool.y0) / 2;
                var radius = Math.max(Math.abs(ev._x - tool.x0), Math.abs(ev._y - tool.y0)) / 2;

                context.arc(x, y, radius, 0, Math.PI * 2, false);
                context.stroke();
                context.closePath();

            };

            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                    img_update();
                }
            };




            this.touchstart = function (ev) {
                ev.preventDefault();
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.touchmove = function (ev) {
                ev.preventDefault();

                if (!tool.started) {
                    return;
                }
                context.clearRect(0, 0, canvas.width, canvas.height);


                context.beginPath();
                var x = (ev._x + tool.x0) / 2;
                var y = (ev._y + tool.y0) / 2;
                var radius = Math.max(Math.abs(ev._x - tool.x0), Math.abs(ev._y - tool.y0)) / 2;

                context.arc(x, y, radius, 0, Math.PI * 2, false);
                context.stroke();
                context.closePath();

            };

            this.touchend = function (ev) {
                ev.preventDefault();
                tool.started = false;
                img_update();

            };

        };



















        // The line tool.
        tools.line = function () {
            var tool = this;
            this.started = false;

            this.mousedown = function (ev) {
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.mousemove = function (ev) {
                if (!tool.started) {
                    return;
                }

                context.clearRect(0, 0, canvas.width, canvas.height);

                context.beginPath();
                context.moveTo(tool.x0, tool.y0);
                context.lineTo(ev._x, ev._y);
                context.stroke();
                context.closePath();
            };

            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                    img_update();
                }
            };






            this.touchstart = function (ev) {
                ev.preventDefault();
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
            };

            this.touchmove = function (ev) {
                ev.preventDefault();

                if (!tool.started) {
                    return;
                }

                context.clearRect(0, 0, canvas.width, canvas.height);

                context.beginPath();
                context.moveTo(tool.x0, tool.y0);
                context.lineTo(ev._x, ev._y);
                context.stroke();
                context.closePath();
            };

            this.touchend = function (ev) {
                ev.preventDefault();
                tool.started = false;
                img_update();
                /*   if (tool.started) {
                tool.touchmove(ev);
                tool.started = false;
                img_update();
                }*/
            };

        };







        var i = 0;
        $("#color").click(function (e) {
            e.preventDefault();
            if (i == 0) {
                i = 1;
                $(".tools").css("display", "block").animate({ height: "230px" }, "fast", "linear", function () { $(".cols").css("display", "block"); });
            }
            else if (i == 1) {
                i = 0;
                $(".tools").css("display", "none").animate({ height: "0px" }, "fast", "linear", function () { $(".cols").css("display", "none"); });
            }




        });

        $(".black").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "black");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "black";

        });

        $(".blue").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "blue");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "blue";

        });


        $(".red").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "red");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "red";
        });





        $(".yellow").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "yellow");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "yellow";

        });


        $(".orange").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "orange");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "orange";

        });

        $(".green").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "green");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "green";

        });

        $(".purple").click(function (e) {

            e.preventDefault();
            i = 0;

            $("#color").css("background", "purple");
            $(".tools").css("display", "none").animate({ height: "0px" }, 1000, "linear", function () { $(".cols").css("display", "none"); });
            context.strokeStyle = "purple";

        });



        function handlePicUpload(e) {
            var fullPath = document.getElementById('uploadElement').value;
            if (fullPath) {
                var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
                var filename = fullPath.substring(startIndex);
                if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
                    filename = filename.substring(1);
                }
                alert(fullPath);
                document.getElementById('addpdf').data = fullPath;
                document.getElementById('addpdf').style.display = "block";

                $("#container").css("display", "none");

            }
        }
        init();

    }, false);
}

// vim:set spell spl=en fo=wan1croql tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:





