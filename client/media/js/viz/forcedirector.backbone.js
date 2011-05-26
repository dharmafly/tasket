// FORCE-DIRECTOR extension for Backbone.js
    
// Extend ForceDirector with event bindings
_.extend(ForceDirector.prototype, Backbone.Events);

// Override noop methods in ForceDirector prototype to allow triggering of events on loop start and end
ForceDirector.prototype.triggerLoopStart = function(){
    return this.trigger("start", this);
};

ForceDirector.prototype.triggerLoopEnd = function(){
    return this.trigger("end", this);
};

ForceDirector.prototype.triggerLoop = function(){
    return this.trigger("loop", this);
};
