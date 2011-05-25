// A visualisation canvas overlay, for testing and demonstrating the application's force-directed physics engine.


(function(){
    function createTestForceDirector(){
        var PI2 = Math.PI * 2,
            strokeWidth = 1,
            canvasStrokeColor = "#333",
            nodeStrokeColor = "#33f",
            //offset = jQuery("body").offset(),
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
            //context.save();
            context.strokeStyle = canvasStrokeColor;
            context.strokeWidth = strokeWidth;
            context.strokeRect(0, 0, width, height);
            //context.restore();
        }
        
        function drawNodes(){
            var pos;

            //context.save();
            context.strokeStyle = nodeStrokeColor;
            context.strokeWidth = strokeWidth;
            _.each(tankForce.nodes, function(node){
                 pos = node.getPos();
                 O(pos.x, pos.y, node.width, height - node.height, node);
                 context.strokeRect(pos.x, height - pos.y, node.width, node.height);
            });
            
            //context.restore();
        }
        
        function draw(){
            resetSize();
            drawWalls();
            window.setTimeout(drawNodes, 0); // TODO: find out why this setTimeout is necessary (if not present, drawNodes() functions, but draw() does not. seen in Chrome dev (v13)
        }
        
        function cacheAndDraw(){
            cacheSettings();
            draw();
        }
        
        function initialize(){
            cacheSettings();
            createCanvas();
            draw();
            
            tank.bind("addHub", draw);
            tank.bind("change:walls", cacheAndDraw);
            
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
