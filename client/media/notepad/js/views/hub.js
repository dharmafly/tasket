var HubView = View.extend({
    tagName: "li",

    constructor: function HubView () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },
    
    initialize: function (options) {
        var view = this;
        this.elem = jQuery(this.el)
            .attr("data-id", this.model.id);
    },

    select: function(){
        this.elem.addClass("active");
    },

    deselect: function(){
        this.elem.removeClass("active");
    },

    render: function () {
        var numTasks = this.model.countNewTasks(),
            data = _.extend(this.model.toJSON(), {count: numTasks});
    
        this.elem.html(tim("hub", data));
        return this;
    }
});
