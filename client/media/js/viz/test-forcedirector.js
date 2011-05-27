// A visualisation canvas overlay, for testing and demonstrating the application's force-directed physics engine.


(function(){
    function createTestForceDirector(){
        var PI2 = Math.PI * 2,
            strokeWidth = 1,
            circleRadius = 5,
            wallStrokeColor = "#333",
            hubNodeStrokeColor = "#33f",
            hubNodeStrokeColorForTasks = "#3f3",
            taskNodeStrokeColor = "#f33",
            canvasElem, canvas, context,
            tank = app.tank,
            tankForce = tank.forceDirector,
            buffer = tank.wallBuffer,
            walls, width, height;
            
        /////
        
        function cacheSettings(){
            walls = tankForce.getWalls();
            width = ~~(walls.right - walls.left);
            height = ~~(walls.top - walls.bottom); // rounding + Math.abs()
        }
        
        function createCanvas(){
            canvasElem = jQuery("<canvas id=test-forcedirector></canvas>")
                .css({
                    position:"absolute",
                    top:app.invertY(walls.top) + "px",
                    left:walls.left + "px",
                    pointerEvents:"none",
                    zIndex:99999
                })
                .appendTo("body");
                
            canvas = canvasElem[0];
            context = canvas.getContext("2d");
        }

        function drawWallsDom(){
            jQuery("<div style='position:absolute; outline:1px solid green; width:" + width + "px; top:" + app.invertY(walls.top) + "px; height: " + height + "px; left:" + walls.left + "px; pointer-events:none;'></div>")
                .appendTo("body");
        }
        
        function resetSize(){
            canvasElem.attr({
                width:  width,
                height: height
            });
        }
        
        function drawWalls(){
            context.strokeStyle = wallStrokeColor;
            rect(0, 0, width, height);
        }
        
        function circle(x, y, r){
            context.beginPath();
            context.arc(x, y, r || circleRadius, 0, Math.PI * 2, false);
            context.closePath();
            context.stroke();
        }
        
        function rect(x, y, width, height){
            context.strokeRect(x, y, width, height);
        }
        
        function drawNodes(){
            var selectedHub = app.selectedHub,
                selectedHubView = selectedHub && tank.getHubView(selectedHub),
                hubForce = selectedHubView && selectedHubView.forceDirector,
                taskViews = selectedHubView && selectedHubView.taskViews;
        
            context.strokeStyle = hubNodeStrokeColor;
            
            _.each(tankForce.nodes, function(node){
                var pos, hubView;
                
                if (node.width && node.height){
                    pos = node.getPos();
                    hubView = tank.getHubView(node.key.split("-")[1]);
                    
                    // Draw node pos
                    circle(pos.x, height - pos.y);
                    
                    // Draw node boundary
                    // TODO: determine why the pos circle is not centre of box
                    rect(pos.x - node.width / 2, height - pos.y - node.height / 2, node.width, node.height);
                }
            });
            
            // Draw tasks
            if (hubForce){
                _.each(hubForce.nodes, function(node){
                    var pos, hubView;
                
                    if (node.width && node.height){
                        pos = node.getPos();
                        hubView = selectedHubView;
                    
                        if (node.key.indexOf("hub-") === 0){
                            context.strokeStyle = hubNodeStrokeColorForTasks;
                        }
                        else {
                            context.strokeStyle = taskNodeStrokeColor;
                        }
                        
                        // Draw node boundary
                        rect(pos.x - node.width / 2, height - pos.y - node.height / 2, node.width, node.height);
                            
                        // Draw node pos
                        circle(pos.x, height - pos.y);
                    }
                });
                
                // Draw hubForce walls
                /*
                var hubForceWalls = hubForce.getWalls(),
                    hubForceWidth = hubForceWalls.right - hubForceWalls.left,
                    hubForceHeight = ~~(hubForceWalls.top - hubForceWalls.bottom);
                    
                //context.strokeStyle = "#ff0";
                rect(0, 0, hubForceWidth, hubForceHeight);
                */
            }
        }
        
        function draw(){
            resetSize();
            drawWalls();
            drawNodes();
        }
        
        function cacheAndDraw(){
            cacheSettings();
            draw();
        }
        
        function invisibleTaskViews(){
            jQuery("<style>li.task {visibility:hidden !important}</style>")
                .appendTo("head");
        }
        
        function initialize(){
            cacheSettings();
            createCanvas();
            
            context.strokeWidth = strokeWidth;
            draw();
            
            // Setup drawing
            tank.bind("change:walls", cacheSettings)
                .bind("change:position:tasks", draw)
                .bind("hub:select", draw);
            
            tankForce
                .bind("loop", draw)
                .bind("end", draw);
            
            if (!tankForce.looping){
                draw();
            }
            
            // testForceDirector APIT
            window.testForceDirector = {
                canvas: canvas,
                context: context,
                resetSize: resetSize,
                clear: resetSize,
                cacheSettings: cacheSettings,
                draw: draw,
                drawWalls: drawWalls,
                drawNodes: drawNodes,
                circle: circle,
                rect: rect,
                walls: _.bind(tankForce.getWalls, tankForce),
                tankForce: tankForce
            };
        }
        
        initialize();
    }
    
    // Initialise
    if (app.loaded){
        createTestForceDirector();
    }
    else {
        app.bind("ready", createTestForceDirector);
    }
}());
