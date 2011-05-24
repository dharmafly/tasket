// Intended as v2 of the /dependencies.forcedirector.js

ForceDirector.create = (function(){

    /*
    function calculateWalls(viewportHeight, wallBuffer){
        var wallBuffer = app.wallBuffer,
            viewportHeight = document.documentElement.clientHeight;

        this.wallBuffer = wallBuffer;
        this.wallRight = app.dashboard.elem.offset().left - wallBuffer;
        this.wallLeft = wallBuffer;
        this.width = this.wallRight - this.wallLeft;

         // NOTE: this is zero-bottom y
        //this.wallTop = window.innerHeight - wallBuffer - app.toolbar.elem.outerHeight(true);
        this.wallTop = viewportHeight - wallBuffer - app.toolbar.elem.outerHeight(true);
        this.wallBottom = wallBuffer;
        this.height = this.wallTop - this.wallBottom;
        //this.marginTop = window.innerHeight - this.wallTop;
        this.marginTop = viewportHeight - this.wallTop;

        _.extend(this.forceDirector.options, {
            wallTop: this.wallTop,
            wallBottom: this.wallBottom,
            wallLeft: this.wallLeft,
            wallRight: this.wallRight
        });

        return this;
    }
    */
    
    ForceDirector.prototype.setWalls = function(dimensions){
        if (dimensions === false){
            this.wallsFlag = false;
        }
        else {
            _.extend(this, {
                wallsFlag: true,
                top: dimensions.top,
                bottom: dimensions.bottom,
                left: dimensions.left,
                right: dimensions.right
            });
        }
        return this;
    };
        
        
    // Apply new API on top of old one
    function tempTranslateOptions(options){
        return {
            wallsFlag: options.wallsFlag,
            top: options.wallTop,
            bottom: options.wallBottom,
            left: options.wallLeft,
            right: options.wallRight
        };
    }
    
    function createForceDirector(options){
        var f = new ForceDirector(),
            defaultSettings = {
                fps: 10,
                numCycles: 200,
                updateStepMin: 0.3,
                updateStepMax: 1,
                updateStepDamping: 0.00001,
                animate: false,
                animator: null,
                callback: null,
                
                // engine settings
                inCoulombK: 50,
                inWallRepulsion: 600,
                inVelDampK: 0.01,
            },
            easing, i;

        // Combine options with default settings
        options = _.defaults(options || {}, defaultSettings);

        // TODO: Temporary conversion of old API with new one
        options = tempTranslateOptions(options);

        function loop(){
            f.updateCycle(options.updateStepMin + easing);
            easing = easing - (easing * options.updateStepDamping);

            if (options.animate && options.animator){
                options.animator();
            }

            if (i <= options.numCycles){
                if (options.animate){
                    window.setTimeout(function(){
                        loop(++i);
                    }, 1000 / options.fps);
                }
                else {
                    loop(++i);
                }
            }
            else if (options.callback){
                options.callback();
            }
        }
        
        function startLoop(newOptions){
            if (newOptions){
                options = _.extend(options, newOptions);
            }
            
            i = 0;
            easing = options.updateStepMax - options.updateStepMin;
            
            //f.inHookeK = 0.1;
            f.inVelDampK = options.inVelDampK;
            f.inCoulombK = options.inCoulombK;
            f.inWallRepulsion = options.inWallRepulsion;
            //f.inBBRepulsion = 200;
            //f.inVelDampK = 0.000025;
            
            this.setWalls(options);
            
            loop();
        }
        
        return {
            engine: f,
            options: options,
            go: startLoop
        };
    }
    

    return createForceDirector;
}());
