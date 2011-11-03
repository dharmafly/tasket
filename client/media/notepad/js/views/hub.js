var HubView = View.extend({
    tagName: "li",

    events: {
    },

    constructor: function HubView () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },
    
    initialize: function (options) {
        var view = this;
        this.elem = jQuery(this.el);

        this.elem.attr("data-id", this.model.id);

        this.model
            .bind("remove", view.remove)
            .bind("change", function (hub) {
				if (hub.hasChanged('title')) {
                	view.$("a").text(hub.get('title'));
				}
            });
    },

	select: function(){
		this.elem.addClass("active");
	},

	deselect: function(){
		this.elem.removeClass("active");
	},

    render: function () {			
        jQuery(this.el).html(tim("hub", this.model.toJSON()));
       return this;
    }
});
