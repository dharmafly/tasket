var TankController = Backbone.Controller.extend({
    routes: {
        "/hubs/:id": "displayHub"
    },
    
    initialize: function(options){
        this.hubViews = {};
        if (options && options.hubs){
            this.addHubs(options.hubs);
        }
    },
    
    getHubView: function(id){
        return _(this.hubViews).detect(function(hubView){
            return id === hubView.model.id;
        });
    },
    
    addHubs: function(hubs){
        _(hubs).each(this.addHub, this);
        return this;
    },
    
    
    addHub: function(hub){
        var hubView = this.hubViews[hub.cid] = new HubView({
            model: hub,

            offset: { // TODO: Make useful
                left: randomInt(window.innerWidth - 550) + 50, // window.innerWidth / 3,
                top: randomInt(window.innerHeight - 200) + 100 // window.innerHeight / 2
            },
        });
        
        // TODO: move bodyElem to app.bodyElem
        bodyElem.append(hubView.elem);
        hubView.render();
        
        return this;
    },
    
    displayHub: function(id){
        var controller = this,
            hubView = this.getHubView(id);
            
        if (hubView){
            hubView.select().renderTasks();
        }
        else {
            Tasket.fetchAndAdd(id, Tasket.hubs, function(){
                controller.displayHub(id);
            });
        }
        return this;
    }
});
