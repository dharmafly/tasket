// Intended as v2 of /dependencies.forcedirector.js - to be merged into that file once an appropriate API is settled on. The ForceDirector GUI app will need updating at that time

(function(){
    var noop = function(){};

    
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
    
    ForceDirector.prototype.triggerLoopStart = ForceDirector.prototype.triggerLoopEnd = ForceDirector.prototype.triggerLoop = noop;
    
    
    // Rename existing methods
    ForceDirector.prototype.createNode = ForceDirector.prototype.addTask;
    ForceDirector.prototype.createSun = ForceDirector.prototype.addProject;
    ForceDirector.prototype.createSatellite = ForceDirector.prototype.addTaskToProject;
    
    ForceDirector.prototype.looping = false;
    
    ForceDirector.create = function(options){
        var f = new ForceDirector(),
            defaultSettings = {
                fps: 60,
                numCycles: 200,
                updateStepMin: 0.3,
                updateStepMax: 1,
                updateStepDamping: 0.00001,
                animate: false,
                
                // engine settings
                /*
                inCoulombK: 50,
                inWallRepulsion: 600,
                inVelDampK: 0.01
                */
            },
            easing, intervalRef, i;

        // Combine options with default settings
        options = _.defaults(options || {}, defaultSettings);
        
        f.options = options;

        function loop(){
            i++;
            
            f.updateCycle(options.updateStepMin + easing);
            easing = easing - (easing * options.updateStepDamping);
            
            if (i < options.numCycles){
                if (options.animate){
                    f.triggerLoop();
                }
                else {
                    loop();
                }
            }
            else {
                stopLoop();
            }
        }
        
        function stopLoop(){
            f.looping = false;
            
            if (intervalRef){
                window.clearInterval(intervalRef);
                intervalRef = null;
            }
            
            // This method can be overriden, to provide a trigger callback
            f.triggerLoopEnd();
        }
        
        function startLoop(newOptions){
            f.looping = true;
            
            if (newOptions){
                options = _.extend(options, newOptions);
                this.setWalls(options.walls);
            }
            
            i = 0;
            easing = options.updateStepMax - options.updateStepMin;
            
            if (options.inVelDampK){
                f.inVelDampK = options.inVelDampK;
            }
            if (options.inHookeK){
                f.inHookeK = options.inHookeK;
            }
            if (options.inWallRepulsion){
                f.inWallRepulsion = options.inWallRepulsion;
            }
            if (options.inBBRepulsion){
                f.inBBRepulsion = options.inBBRepulsion;
            }
            
            // This method can be overriden, to provide a trigger callback
            f.triggerLoopStart();
            
            if (options.animate){
                intervalRef = window.setInterval(loop, 1000 / options.fps);
            }
            
            loop();
        }
        
        f.go = startLoop;
        return f;
    };
}());
