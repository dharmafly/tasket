// Decorates the .add() method of all Tasket cache collections to re-broadcast
// all events. This allows other objects to register interest in any model
// within the Tasket application.
function decorateAddMethod(models) {
    if (!_.isArray(models)) {
        models = [models];
    }

    _.each(models, function (model) {
        if (!(model instanceof Backbone.Model)) {
            model = new this.model(model, {collection: this});
        }
        model.bind("all", Tasket.republishModelEvent);
    }, this);

    return this.constructor.prototype.add.apply(this, arguments);
}

// PUBLIC API
_.extend(Tasket, Backbone.Events, {
    namespace: "tasket", // used for settings such as localStorage namespacing
    version: "0.1.0",
    endpoint: "/",
    
    settings: {
        TASK_ESTIMATE_MAX: 14400, // seconds that a task can take
        TASK_LIMIT: 10, // max number of un-verified tasks on a hub
        CLAIMED_LIMIT: 5 // max number of tasks that a user can claim at one time
    },

    lang: {},

    hubs:  _.extend(new HubList(),  {add: decorateAddMethod}),
    tasks: _.extend(new TaskList(), {add: decorateAddMethod}),
    users: _.extend(new UserList(), {add: decorateAddMethod}),

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
        var wrapped    = _(ids),
            type       = collection.model.prototype.type,
            subset     = new collection.constructor(),
            toLoad     = new collection.constructor(),
            toLoadCopy = new collection.constructor(),
            silent     = {silent:true};
            
        // If a specific model has been requested, rather than a collection
        if (!_.isArray(ids)){
            return this.getModels(collection, [ids]).at(0);
        }

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
            toLoad.fetch().bind("refresh", function () {
                toLoad.each(function (model) {
                    // Update the model in the subset with the new data.
                    subset.get(model.id).set(model.toJSON());
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
        }

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
            data: JSON.stringify({
                username: username,
                password: password
            }),
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
    republishModelEvent: function () {
        var args = _.toArray(arguments);
        args[0] = this.type + ":" + args[0];
        Tasket.trigger.apply(Tasket, args);
    }
});

// TODO: widgetised to do app. browser extension, Sqwidget
// iPad improvements: scrollable lightbox content (e.g. faq), svg lines
