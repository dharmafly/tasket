// ABSTRACT VIEW
var View = Backbone.View.extend({
    // GET/SET
    
    defaults: {},
    
    getset: function(property, value){
        return _.isUndefined(value) ? this.get(property) : this.set(property, value);
    },
    
    get: function(property){
        var value = this.options[property];
        return _.isUndefined(value) ? this.defaults[property] : value;
    },
    
    set: function(property, value){
        this.options[property] = value;
        this.trigger("change", property, value);
        return this;
    },
    
    render: function () {
        return this.el;
    },
    
    /////
    
    // Set hash location
    updateLocation: function(){
        app.trigger("request:change:location", this);
        return this;
    },
    
    /////
    
    // OFFSET
    
    offsetValues: function(offset){
        return this.getset("offset", offset);
    },
    
    offsetApply: function(){
        var offset = this.get("offset");
        if (offset){ // only apply offset if it is not the default
            this.elem.css({
                top:  offset.top + "px",
                left: offset.left + "px"
            });
        }
        return this;
    },
    
    offset: function(offset){ // TODO: ensure HubElem or tasksCollection has position:relative
        if (offset){
            return this
                .offsetValues(offset)
                .offsetApply();
        }
        return this.get("offset") || {
            top:  this.defaults.offsetTop || 0,
            left: this.defaults.offsetLeft || 0
        };
    },
    
    
    /////
    
    initialize: function(options){
        this.elem = jQuery(this.el);
        if (this.model && this.model.type && this.model.id){
            this.elem.attr("data-model", this.model.type + "-" + this.model.id);
        }
    }
});
