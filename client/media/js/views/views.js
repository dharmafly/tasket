// ABSTRACT VIEW
var View = Backbone.View.extend({
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
    
    initialize: function(options){
        this.elem = jQuery(this.el);
    }
});
