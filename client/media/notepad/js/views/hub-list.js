var HubListView = View.extend({
    el: "div#main",

    hubViews: {},

	events: {
		"click h1.listsTab a": "_onShowHidePanel"
	},
	
    constructor: function HubListView () {
        // Display object name in browser console
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        this.elem = jQuery(this.el).find('aside nav');
		this.hubViews = {};

		var view = this;
		this.collection
		    .bind("reset", function () {
                view.renderHubs();
            })
            .bind('add', function(hub){
                // clicked save after adding a new list
                // view.renderHubs(hub);
                view.itemList.find('.star').after(view.renderHub(hub).render().el);
    			
                view.selectHub(hub);
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
			};
			
			itemList.append(view.renderHub(hub).render().el);
        });
        
	},
	
	renderHub: function(hub) {
	    var view = this;
	    
	    if (hub && !view.hubViews[hub.id]) {
            var hubView = new HubView({model: hub, collection: view.collection});
			view.hubViews[hub.id] = hubView;
		};
		return view.hubViews[hub.id];
	},

	selectHub: function(hub){
		var hubView = this.hubViews[hub.id];
		_.invoke(this.hubViews, 'deselect');
		if (hubView) {
			hubView.select();
		};
	},

    _onShowHidePanel: function (event) {
        var $el = this.elem.parents('div#main');
		if($el.hasClass('open')){
		    $el.removeClass('open')
		        .find('> span')
		        .text('Open lists');
		}else{
		    $el.addClass('open')
		        .find('> span')
		        .text('Close lists');
		}

		event.preventDefault();
    }

});

