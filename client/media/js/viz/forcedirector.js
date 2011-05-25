// Intended as v2 of the /dependencies.forcedirector.js

(function(){
    
    ForceDirector.prototype.v = 2;
    
    ForceDirector.prototype.setWalls = function(dimensions){
        if (!dimensions){
            this.wallsFlag = false;
        }
        else {
            _.extend(this, {
                wallsFlag: true,
                top:    ~~(dimensions.top), // NOTE: ~~(n) === Math.floor(n) but faster
                bottom: ~~(dimensions.bottom),
                left:   ~~(dimensions.left),
                right:  ~~(dimensions.right)
            });
        }
        return this;
    };
    
    ForceDirector.prototype.getWalls = function(){
        return {
            top: this.top,
            bottom: this.bottom,
            left: this.left,
            right: this.right
        };
    };
        
        
    // Apply new API on top of old one
    function tempTranslateOptions(options){
        options.top = options.wallTop;
        delete options.wallTop;
        
        options.bottom = options.wallBottom;
        delete options.wallBottom;
        
        options.left = options.wallLeft;
        delete options.wallLeft;
        
        options.right = options.wallRight;
        delete options.wallRight;
        
        return options;
    }
    
    ForceDirector.create = function(options){
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
        
        f.options = options;

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
                this.setWalls(options.walls);
            }
            
            i = 0;
            easing = options.updateStepMax - options.updateStepMin;
            
            //f.inHookeK = 0.1;
            f.inVelDampK = options.inVelDampK;
            f.inCoulombK = options.inCoulombK;
            f.inWallRepulsion = options.inWallRepulsion;
            //f.inBBRepulsion = 200;
            //f.inVelDampK = 0.000025;
            
            loop();
        }
        
        f.go = startLoop;
        return f;
    };
}());
