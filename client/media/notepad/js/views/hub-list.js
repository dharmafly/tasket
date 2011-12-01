var HubListView = View.extend({
    el: "#main",
    
    // MORE
    // TODO: reordering incorrect on reload, if done tasks
    // TODO: delete all items on a hub, and add five new ones. the fourth will be starred
    // TODO: sometimes, multiple DELETE requests are made; seems related to showStarred setup
    
    // LESS
    // TODO: Chrome pixel shift on edit task and on edit list title
    // TODO: cached username in login not being populated
    // TODO: app by df spacing
    
    // FUTURE
    // Remove save / edit controls and just allow editing
    // On press RETURN when editing, then move to next item in edit mode?
    

    hubViews: {},

    showTasksOfType: "",
    
    events: {
        "click h1.listsTab a": "_onShowHidePanel",
        "change select#showing": "_onSelectionChange"
    },
    
    constructor: function HubListView () {
        // Display object name in browser console
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function (options) {
        var view = this;
    
        this.panelElem = this.$("aside#lists > nav");
        this.mainContentElem = jQuery(this.el);
        
        this.hubViews = {};
        this.showTasksOfType = app.cache.get("showTasksOfType") || "onlyIncomplete";
        this.isOpen = app.cache.get("hubListIsOpen") || false;
        
        // keep in reverse id order
        this.collection.comparator = function(hub) {
            return -Number(hub.id);
        };
        
        this.collection
            .bind("remove", function(hub){
                var hubView = view.getHubView(hub.id);
            
                if (hubView) {
                    // remove li from the list
                    hubView.remove();
                    delete view.hubViews[hub.id];
                }
            })
            .bind("reset", function () {
                view.renderHubs();
            })
            .bind("add", function(hub){
                var hubView = view.getHubView(hub.id) || view.createHubView(hub);
            
                // clicked save after adding a new list
                // view.renderHubs(hub);
                view.itemList.find(".starred")
                    .after(hubView.render().el);
                
                view.selectHub(hub);
            });
            
        this.showHidePanel(this.isOpen);
    },

    /*
    * Renders the view.
    *
    * Returns the view's element.
    *
    */
    render: function () {
        this.panelElem.html(tim("hub-list"));
        this.itemList = this.$("ul.item-list");

        this.renderHubs();
        this.panelElem.find("select").val(this.showTasksOfType);

        return this;
    },
    
    getHubView: function(hubId){
        return this.hubViews[hubId];
    },
    
    createHubView: function(hub){
        var hubView = this.getHubView(hub.id);
    
        if (!hubView) {
            hubView = this.hubViews[hub.id] = new HubView({model: hub, collection: this.collection});
        }
        return hubView;
    },

    renderHubs: function () {
        var view = this,
            itemList = this.itemList,
            taskView;
        
        // TODO: why is this sort required to force the comparator?
        this.collection.sort({silent:true});

        this.collection.each(function (hub) {
            var hubView = view.getHubView(hub.id) || view.createHubView(hub);
            itemList.append(hubView.render().el);
        });
        
    },

    selectHub: function(hub){
        var hubView = this.hubViews[hub.id];
        _.invoke(this.hubViews, "deselect");
        if (hubView) {
            hubView.select();
        };
    },
    
    _onSelectionChange: function(e){
        var selectedOption = jQuery(e.target).val();
        
        app.trigger("change:selectedHub", app.selectedHub, {
            showTasksOfType: selectedOption
        });
    },

    showHidePanel: function(shouldBeOpen){
        var mainContentElem = this.mainContentElem;

        if (shouldBeOpen){
            mainContentElem.addClass("lists-open")
                .find("span.label")
                .text("Close lists");
        }
        else {
            mainContentElem.removeClass("lists-open")
                .find("span.label")
                .text("Open lists");
        }
        
        this.isOpen = shouldBeOpen;
        app.cache.set("hubListIsOpen", shouldBeOpen);
        return this;
    },

    _onShowHidePanel: function (event) {
        event.preventDefault();
        return this.showHidePanel(!this.isOpen);
    }
});

