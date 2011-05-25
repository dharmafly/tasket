// A visualisation canvas overlay, for testing and demonstrating the application's force-directed physics engine.


(function(){
    function createTestForceDirector(){
        var PI2 = Math.PI * 2,
            strokeWidth = 1,
            canvasStrokeColor = "#333",
            nodeStrokeColor = "#33f",
            canvasElem, canvas, context,
            tank, tankForce, walls, buffer, width, height;
            
        /////
        
        function cacheSettings(){
            tank = app.tankController;
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
            context.strokeStyle = canvasStrokeColor;
            context.strokeWidth = strokeWidth;
            context.strokeRect(0, 0, width, height);
        }
        
        function drawNodes(){
            context.strokeStyle = nodeStrokeColor;
            context.strokeWidth = strokeWidth;
            _.each(tankForce.nodes, function(node){
                var pos = node.getPos(),
                    hubView = tank.getHubView(node.key.split("-")[1]);
                
                // Draw node pos
                context.beginPath();
                context.arc(pos.x, height - pos.y, 5, 0, Math.PI * 2, false);
                context.closePath();
                context.stroke();
                
                // Draw node boundary
                context.strokeRect(pos.x - node.width / 2 - hubView.nucleusWidth / 2, height - pos.y, node.width, node.height);
                
                // TODO: determine why node pos is not centre of area
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
            tank.bind("change:walls", cacheSettings);
            
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
