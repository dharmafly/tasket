// PUBLIC API
_.extend(Tasket, Backbone.Events, {
    version: "0.1.0",
    //endpoint: "http://tasket.ep.io/",
    endpoint: "http://localhost:8000/",
    
    lang: {},
    
    hubs: new HubList(),
    tasks: new TaskList(),
    users: new UserList(),
    
    now: now,
    
    // Helper function for fetching multiple collections and models in one go, with a callback on completion
    fetchAndAdd: function fetchAndAdd(ids, collection, callback){
        // Keep track of fetched collections, and trigger event on completion
        function callbackIfComplete(){
            if (!--fetchAndAdd.pending){
                Tasket.trigger("fetchComplete", true);
                Tasket.unbind("fetchComplete");
            }
        }
    
        var changedIds = [],
            fetchOptions = {
                // Trigger event on error
                error: function(){
                    Tasket.trigger("fetchComplete", false);
                    Tasket.unbind("fetchComplete");
                },
                // Send supplied callback, and final trigger on completion
                success: callback ?
                    function(model, instance){
                        callback(model, instance);
                        callbackIfComplete();
                    } :
                    callbackIfComplete
            };
        
        // Start counting
        if (_.isUndefined(fetchAndAdd.pending)){
            fetchAndAdd.pending = 0;
        }
        
        // Accept a single id, or array of ids
        if (!_.isArray(ids)){
            ids = [ids];
        }
        
        // Add each id to the collection
        _.each(ids, function(id){
            if (!collection.get(id)){
                changedIds.push(id);
                collection.add(
                    new collection.model({id:id})
                );
            }
        });
        
        // Fetch the whole collection
         // TODO: only fetch subset of models just added
        if (changedIds.length){
            fetchAndAdd.pending ++;
            collection.fetch(fetchOptions);
        }
    },
    
    // Bootstrap data on page load: fetch all open hubs, their owners and tasks, and the users involved in those tasks
    getOpenHubs: function(callback){
        var pending = 0,
            hubs = this.hubs,
            tasks = this.tasks,
            users = this.users,
            fetchAndAdd = this.fetchAndAdd,
            fetchOptions = {
                success: function(){
                    fetchAndAdd(hubs.pluck("tasks"), tasks, function(){
                        var usersToFetch = _([
                                hubs.pluck("owner"),
                                tasks.pluck("owner"),
                                tasks.pluck("claimedBy")
                            ])
                            .chain()
                            .flatten()
                            .unique()
                            .compact()
                            .value();
                            
                        fetchAndAdd(usersToFetch, users);
                    });
                }
            };
        
        if (callback){
            fetchOptions.error = function(){
                callback(false);
            };
            Tasket.bind("fetchComplete", callback);
        }

        hubs.seed = true;
        hubs.fetch(fetchOptions);

        return this;
    },
    
    login: function(username, password, callback) {
        return jQuery.ajax({
            url: Tasket.endpoint + "login/",
            type: "POST",
            contentType: 'application/json',
            data: JSON.stringify({
                username: username,
                password: password
            }),
            dataType: "json",
            success: callback
        });
    }
});
