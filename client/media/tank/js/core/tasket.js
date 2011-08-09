// PUBLIC API
_.extend(Tasket, Backbone.Events, {
    namespace: "tasket", // used for settings such as localStorage namespacing
    version: "0.1.0",
    endpoint: "/",
    
    defaultSettings: {
        CLAIMED_TIME_LIMIT: 72,
        USERS_CAN_CREATE_HUBS: true,
        TASK_ESTIMATE_MAX: 14400, // seconds that a task can take
        TASK_LIMIT: 10, // max number of un-verified tasks on a hub
        DONE_TIME_LIMIT: 72,
        CLAIMED_LIMIT: 5, // max number of tasks that a user can claim at one time
        AUTOVERIFY_TASKS_DONE_BY_OWNER: true // If this task was "done" by its owner, then automatically verify it - see /models/task.js
    },

    lang: {},

    hubs:  new HubList(),
    tasks: new TaskList(),
    users: new UserList(),

    failed: {
        hub:  [],
        task: [],
        user: []
    },

    now: now,

    /* Fetch users by id from the global cache. Returns a UserList of promise
     * models which may not all be loaded. If not all loaded the caller
     * can then listen to the "refresh" event on the collection to be notified
     * when it changes.
     *
     * ids - An array of ids to fetch. (or single id of a model to fetch)
     *
     * Examples
     *
     *   var users = Tasket.getUsers([1, 2, 3, 4]);
     *   users.bind("refresh", updateUserDisplay);
     *
     * Returns a UserList object.
     */
    getUsers: function (ids) {
        return Tasket.getModels(Tasket.users, ids);
    },

    /* Fetch tasks by id from the global cache. Returns a TaskList of promise
     * models which may not all be loaded. If not all loaded the caller
     * can then listen to the "refresh" event on the collection to be notified
     * when it changes.
     *
     * ids - An array of ids to fetch. (or single id of a model to fetch)
     *
     * Examples
     *
     *   var tasks = Tasket.getTasks([1, 2, 3, 4]);
     *   tasks.bind("refresh", updateTaskDisplay);
     *
     * Returns a TaskList object.
     */
    getTasks: function (ids) {
        return Tasket.getModels(Tasket.tasks, ids);
    },

    /* Fetch hubs by id from the global cache. Returns a HubList of promise
     * models which may not all be loaded. If not all loaded the caller
     * can then listen to the "refresh" event on the collection to be notified
     * when it changes.
     *
     * ids - An array of ids to fetch. (or single id of a model to fetch)
     *
     * Examples
     *
     *   var hubs = Tasket.getHubs([1, 2, 3, 4]);
     *   hubs.bind("refresh", updateHubDisplay);
     *
     * Returns a HubList object.
     */
    getHubs: function (ids) {
        return Tasket.getModels(Tasket.hubs, ids);
    },
    
    /* Fetch all archived hubs from the server
     * On complete, call the callback function, 
     * passing through a HubList of archived hub models
     */
    getArchivedHubs: function (callback) {
        jQuery.ajax({
            url: Tasket.endpoint + "hubs/?archived=true",
            contentType: "application/json",
            dataType: "json",
            success: function(response){
                var ids = [];
            
                _(response).each(function(hubData){
                    ids.push(hubData.id);
                    
                    if (!Tasket.hubs.get(hubData.id)){
                        Tasket.hubs.add(hubData);
                    }
                });
                callback(Tasket.getHubs(ids));
            },
            error: function(){
                callback(null);
            }
        });
    },

    /* Fetch models from the global cache provided. If the model is not cached
     * an empty promise is created with just an id. Once the collection has
     * refreshed any ids that do not exist on the server will be removed from
     * the collection. So in order to display the correct data it"s best to
     * listen to the "refresh" event to be notified when the fetch completes.
     *
     * collection - One of the Tasket Collection caches.
     * ids        - An array of ids to fetch. (or single id of a model to fetch)
     *
     * Examples
     *
     *   var hubs = Tasket.getModels(Tasket.hubs, [1, 2, 3, 4]);
     *   hubs.bind("refresh", updateHubDisplay);
     *   Returns a Collection object.
     *
     *   var hub = Tasket.getModels(Tasket.hubs, 5);
     *   Returns a Model.
     *
     */
    getModels: function (collection, ids) {
        var wrappedModel, model,
            wrapped, type, ctor, subset, toLoad, toLoadCopy, silent;
    
        // SINGLE MODEL
        if (!_.isArray(ids)){
            wrappedModel = this.getModels(collection, [ids]);
            model = wrappedModel.at(0);
            
            if (!model.isComplete()){
                wrappedModel.bind("refresh", function onRefresh(){
                    wrappedModel.unbind("refresh", onRefresh);
                    model.trigger("change", model, {});
                });
            }
            
            return model;
        }
        
        // COLLECTION OF MODELS
        wrapped    = _(ids);
        type       = collection.model.prototype.type;
        ctor       = collection.constructor;
        subset     = new ctor();
        toLoad     = new ctor();
        toLoadCopy = new ctor();
        silent     = {silent:true};

        // Removed previously failed ids.
        ids = wrapped.without.apply(wrapped, Tasket.failed[type]);

        _.each(ids, function (id) {
            var model = collection.get(id);

            if (id){
                if (!model) {
                    model = new collection.model({id: id});
                    toLoad.add(model, silent);
                    toLoadCopy.add(model, silent);
                    collection.add(model, silent);
                }
                subset.add(model, silent);
            }
        }, this);

        if (toLoad.length) {
            toLoad.bind("refresh", function () {
                toLoad.each(function (model) {
                    // Update the model in the subset with the new data.
                    subset.get(model.id).set(model.toJSON(), silent);
                });

                // Remove all models from subset that appear in toLoadCopy
                // but not in toLoad. As they do not exist on the server.
                toLoadCopy.each(function (model) {
                    if (!toLoad.get(model.id)) {
                        subset.remove(model, silent);
                        collection.remove(model, silent);

                        // Cache the failed model id.
                        Tasket.failed[model.type].push(model.id);
                    }
                });

                subset.trigger("refresh", subset, {});
            });
            
            toLoad.fetch();
        }
        else if (!subset.isComplete()) {
            // It's possible that a subset could contain models that are
            // currently being loaded in another request. In this case the
            // "refresh" event will not fire. So we must watch each unloaded
            // model in the collection until they are all completed then
            // manually fire the "refresh" event.
            subset.bind("change", function onChange() {
                if (subset.isComplete()) {
                    subset.unbind("change", onChange);
                    subset.trigger("refresh", subset, {});
                }
            });
        }
        // Else, there is nothing to load at all

        return subset;
    },
    
    getTasksByState: function (state, callback) {
        return jQuery.ajax({
            url: Tasket.endpoint + "tasks/?state=" + state,
            contentType: "application/json",
            dataType: "json",
            success: function(response){
                var ids = [];
            
                _(response).each(function(model){
                    ids.push(model.id);
                    
                    if (!Tasket.tasks.get(model.id)){
                        Tasket.tasks.add(model);
                    }
                });
                
                callback(Tasket.getTasks(ids));
            },
            error: function(){
                callback(null);
            }
        });
    },

    login: function(username, password, callback) {
        return jQuery.ajax({
            url: Tasket.endpoint + "login/",
            type: "POST",
            contentType: "application/json",
            // TODO: this should use JSON.stringify in case password contains double-quotes
            data: '{"username":"' + username + '","password":"' + password + '"}',
            dataType: "json",
            success: callback
        });
    },

    forgotDetails: function(data, callback) {
        return jQuery.ajax({
            url: Tasket.endpoint + "forgot-password/",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            dataType: "json",
            success: callback
        });
    },
    
    getData: function(methodName, success){
        return jQuery.ajax({
            url: Tasket.endpoint + methodName + "/",
            dataType: "json",
            success: success
        });
    },
    
    statistics: function(callback){
        return this.getData("statistics", callback);
    },
    
    settings: function(callback){
        return this.getData("settings", callback);
    },

    media: function (image) {
        return image ? "/media/" + image : "";
    },

    thumbnail: function (image, width, height, crop) {
        var url = "/thumb/" + width + "x" + height + "/" + image;
        return crop ? url + "?crop" : url;
    },

    // Republishes all events for models in the Tasket caches namespaced with
    // the model type. eg.
    //
    // Tasket.bind("hub:change:owner", updateHubOwner);
    _republishModelEvent: function () {
        var args = _.toArray(arguments);
        args[0] = this.type + ":" + args[0];
        Tasket.trigger.apply(Tasket, args);
    },
    
    _addRemoveHubOnUser: function(hub, shouldBeAdded, collectionsToUpdate){
        var hubId = hub.id,
            user, hub, toSet;

        if (!hubId){
            hub.bind("change:id", function(){
                Tasket._addRemoveHubOnUser(hub, shouldBeAdded, collectionsToUpdate);
            });
            return;
        }
    
        user = Tasket.users.get(hub.get("owner"));
        
        if (user){
            if (!collectionsToUpdate){
                collectionsToUpdate = hub.isArchived() ?
                    ["hubs.owned", "hubs.archived"] : ["hubs.owned"];
            }
            toSet = {};
        
            _.each(collectionsToUpdate, function(collectionName){
                // NOTE: we must clone the array so that Backbone successfully triggers a "change" event when it detects a difference in the previous and the changed attribute
                var ids = _.clone(app.currentUser.get(collectionName));
                
                if (!_.isUndefined(ids.length)){
                    // Add
                    if (shouldBeAdded){
                        if (!_.include(ids, hubId)){
                            ids.push(hubId);
                        }
                    }
                    // Remove
                    else {
                        ids = _.without(ids, hubId);
                    }
                    toSet[collectionName] = ids;
                }
            });
            
            user.set(toSet);
        }
    },
    
    _onHubAdded: function(hub){
        return Tasket._addRemoveHubOnUser(hub, true);
    },
    
    _onHubRemoved: function(hub){
        return Tasket._addRemoveHubOnUser(hub, false);
    },
    
    _onHubChangeArchived: function(hub){
        var addOrRemove = hub.isArchived();
        return Tasket._addRemoveHubOnUser(hub, addOrRemove, ["hubs.archived"]);
    }
});

/////

// Extend Tasket.settings with defaultSettings
_.defaults(Tasket.settings, Tasket.defaultSettings);

// Re-publish events from models on to Tasket object
Tasket.hubs.bind("all", Tasket._republishModelEvent);
Tasket.tasks.bind("all", Tasket._republishModelEvent);
Tasket.users.bind("all", Tasket._republishModelEvent);

// Update user's owned hubs on hub add
Tasket.bind("hub:add", Tasket._onHubAdded)
      .bind("hub:remove", Tasket._onHubRemoved)
      .bind("hub:change:archived", Tasket._onHubChangeArchived);
        
// TODO: change user.stars on task.star or task.unstar
