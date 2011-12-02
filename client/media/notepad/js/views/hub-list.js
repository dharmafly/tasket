var HubListView = View.extend({
    el: "#main",

    // TODO: on starting at /, editing the hub title or deleting does not trigger - see taskListView._tempTriggerGlobalHubs
    // TODO: on load, selected hub not highlighted in sidebar - taskListView._tempTriggerGlobalHubs now forcing selectHub
    
    // TODO: cached username in login not being populated
    // TODO: app by df spacing
    // TODO: long task titles go underneath hub list
    // TODO: home page screenshots include save/cancel buttons
    // TODO: overlays (e.g. login) are fixed to screen height and appear at the top of the screen, so don't position correctly when scrolling down a long page
    
    // FUTURE
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
        this.collection.comparator = function(hub){
            return -Number(hub.id);
        };
        
        this.collection
            // proxy to the view
            .bind("all", function(){
                view.trigger.apply(view, arguments);
            })
            
            .bind("change:title", function(hub, newTitle){
                view.getHubView(hub).$(".title").text(newTitle);
            })
            
            // TODO: make eventName more specific
            .bind("change", function (hub){
                view.getHubView(hub).$(".count").text(hub.countNewTasks());                
            })
            
            .bind("reset", function(){
                view.renderHubs();
            })
            
            .bind("add", function(hub){
                var hubView = view.getHubView(hub) || view.createHubView(hub);
            
                // clicked save after adding a new list
                view.hubListElem.find(".starred")
                    .after(hubView.render().el);
                
                view.selectHub(hub);
            })
        
            .bind("remove", function(hub){
                var hubView = view.getHubView(hub);
            
                if (hubView){
                    // remove li from the list
                    hubView.remove();
                    delete view.hubViews[hub.id];
                }
            });
            
        return this.showHidePanel(this.isOpen);
    },

    /*
    * Renders the view.
    *
    * Returns the view's element.
    *
    */
    render: function () {
        this.panelElem.html(tim("hub-list"));
        this.hubListElem = this.$("ul.item-list");
        this.renderHubs();
        this.panelElem.find("select").val(this.showTasksOfType);

        return this;
    },

    renderHubs: function () {
        var view = this,
            hubListElem = this.hubListElem,
            taskView;

        // TODO: TEMP
        this.hubListElem.find("li:not(.starred)").remove();

        this.collection
            // Sort into order - TODO: why is this sort required to force the comparator?
            .sort({silent:true})
            // Render each hubView
            .each(function (hub){
                var hubView = view.getHubView(hub) || view.createHubView(hub);
                view.appendHubView(hubView.render());
            });
            
        return this;
    },
    
    getHubView: function(hub){
        return this.hubViews[hub.id];
    },
    
    createHubView: function(hub){
        return this.hubViews[hub.id] = new HubView({model: hub, collection: this.collection});
    },
    
    appendHubView: function(hubView){
        this.hubListElem.append(hubView.el);
        return this;
    },

    selectHub: function(hub){
        var hubView = this.getHubView(hub);
        _.invoke(this.hubViews, "deselect");
        
        if (hubView) {
            hubView.select();
        }
    },
    
    _onSelectionChange: function(event){
        var selectedOption = jQuery(event.target).val();
        
        // TODO: trigger on view, then pick up from controller
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

