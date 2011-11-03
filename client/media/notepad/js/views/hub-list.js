var HubListView = View.extend({
    el: "aside#lists",

    hubViews: {},

	events: {
		"click h1 a": "_onShowHidePanel"
	},
	
    constructor: function HubListView () {
        // Display object name in browser console
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        this.elem = jQuery(this.el).find('nav');
		this.hubViews = {};

		var view = this;
		this.collection
		    .bind("reset", function () {
                view.renderHubs();
            })
            .bind('add', function(hub){
                view.renderHubs();
            });
        
        
	},

    /*
    * Renders the view.
    *
    * Returns the view's element.
    *
    */
    render: function () {
        var user = this.model,
  			view = this;
            
        this.elem.html(tim("hub-list"));
        this.itemList = this.$("ul.item-list");

		this.renderHubs();

        return this;
    },

    renderHubs: function () {
        var view = this,
            itemList = this.itemList,
            taskView;

        this.collection.each(function (hub) {
            if (!view.hubViews[hub.id]) {
	            var hubView = new HubView({model: hub, collection: view.collection});
				view.hubViews[hub.id] = hubView;
	            itemList.append(hubView.render().el);
			};
        });

	},

	selectHub: function(hub){
		var hubView = this.hubViews[hub.id];
		_.invoke(this.hubViews, 'deselect');
		if (hubView) {
			hubView.select();
		};
	},

    _onShowHidePanel: function (event) {
		var $el = this.$(this.el);
		$el.toggleClass('open');

		event.preventDefault();
    }

});

