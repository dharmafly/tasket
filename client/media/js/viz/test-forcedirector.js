// A visualisation canvas overlay, for testing and demonstrating the application's force-directed physics engine.


(function(){
    function createTestForceDirector(){
        var PI2 = Math.PI * 2,
            strokeWidth = 1,
            wallStrokeColor = "#333",
            hubNodeStrokeColor = "#33f",
            taskNodeStrokeColor = "#33f",
            canvasElem, canvas, context,
            tank, tankForce, walls, buffer, width, height;
            
        /////
        
        function cacheSettings(){
            tank = app.tank;
            tankForce = tank.forceDirector;
            walls = tankForce.getWalls();
            buffer = tank.wallBuffer;
            width = walls.right - walls.left;
            height = ~~(walls.top - walls.bottom); // rounding + Math.abs()
        }
        
        function createCanvas(){
            canvasElem = jQuery("<canvas id=test-forcedirector></canvas>")
                .css({
                    position:"absolute",
                    top:app.invertY(walls.top) + "px",
                    left:walls.left + "px",
                    pointerEvents:"none"
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
            context.strokeWidth = strokeWidth;
            context.strokeRect(0, 0, width, height);
        }
        
        function circle(x, y, r){
            context.beginPath();
            context.arc(x, y, r, 0, Math.PI * 2, false);
            context.closePath();
            context.stroke();
        }
        
        function drawNodes(){
            context.strokeStyle = hubNodeStrokeColor;
            context.strokeWidth = strokeWidth;
            _.each(tankForce.nodes, function(hubNode){
                var pos = hubNode.getPos(),
                    hubView = tank.getHubView(hubNode.key.split("-")[1]),
                    hubForce = hubView.forceDirector,
                    taskViews = hubView.taskViews;
                
                // Draw node pos
                circle(pos.x, height - pos.y, 5);
                
                // Draw node boundary
                // TODO: determine why node pos is not centre of area
                context.strokeRect(pos.x - hubNode.width / 2 - hubView.nucleusWidth / 2, height - pos.y, hubNode.width, hubNode.height);

                // Draw tasks
                if (taskViews){
                    context.strokeStyle = taskNodeStrokeColor;
                    _.each(hubForce.nodes, function(taskNode){
                        if (taskNode.key.indexOf("task-") > 0){
                            var pos = taskNode.getPos();
                        
                            // Draw node pos
                            circle(pos.x, height - pos.y, 5);
                        }
                    });
                    context.strokeStyle = hubNodeStrokeColor;
                }
            });
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
        
        function initialize(){
            cacheSettings();
            createCanvas();
            draw();
            
            // Setup drawing
            tank.bind("change:walls", cacheSettings)
                .bind("change:position:tasks", draw);
            
            tankForce
                .bind("loop", draw)
                .bind("end", draw);
            
            if (!tankForce.looping){
                draw();
            }
            
            window.testForceDirector = {
                canvas: canvas,
                context: context,
                resetSize: resetSize,
                clear: resetSize,
                cacheSettings: cacheSettings,
                draw: draw,
                drawWalls: drawWalls,
                drawNodes: drawNodes,
                walls: walls,
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
