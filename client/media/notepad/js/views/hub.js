var HubView = View.extend({
    tagName: "li",

    constructor: function HubView () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },
    
    initialize: function (options) {
        var view = this;
        view.elem = jQuery(view.el);

        view.elem.attr("data-id", view.model.id);

        view.model
            .bind("remove", view.remove)
            .bind("change", function (hub) {
				if (hub.hasChanged("title")) {
                	view.$(".title").text(hub.get("title"));
				}

                view.$(".count").text(hub.countNewTasks());                
            });
    },

	select: function(){
		this.elem.addClass("active");
	},

	deselect: function(){
		this.elem.removeClass("active");
	},

    render: function () {
        var hub = this.model;
        	
        jQuery(this.el).html(tim("hub", _.extend(this.model.toJSON(), {count: hub.countNewTasks() }) ));
       return this;
    }
});
