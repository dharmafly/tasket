// PUBLIC API
_.extend(Tasket, Backbone.Events, {
    namespace: "tasket", // used for settings such as localStorage namespacing
    version: "0.1.0",
    //endpoint: "http://tasket.ep.io/",
    endpoint: "http://localhost:8000/",

    lang: {},

    hubs: new HubList(),
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
     * ids - An array of ids to fetch.
     *
     * Examples
     *
     *   var users = Tasket.getUsers([1, 2, 3, 4]);
     *   users.bind('refresh', updateUserDisplay);
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
     * ids - An array of ids to fetch.
     *
     * Examples
     *
     *   var tasks = Tasket.getTasks([1, 2, 3, 4]);
     *   tasks.bind('refresh', updateTaskDisplay);
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
     * ids - An array of ids to fetch.
     *
     * Examples
     *
     *   var hubs = Tasket.getHubs([1, 2, 3, 4]);
     *   hubs.bind('refresh', updateHubDisplay);
     *
     * Returns a HubList object.
     */
    getHubs: function (ids) {
        return Tasket.getModels(Tasket.hubs, ids);
    },

    /* Fetch models from the global cache provided. If the model is not cached
     * an empty promise is created with just an id. Once the collection has
     * refreshed any ids that do not exist on the server will be removed from
     * the collection. So in order to display the correct data it's best to
     * listen to the "refresh" event to be notified when the fetch completes.
     *
     * collection - One of the Tasket Collection caches.
     * ids        - An array of ids to fetch.
     *
     * Examples
     *
     *   var hubs = Tasket.getModels(Tasket.hubs, [1, 2, 3, 4]);
     *   hubs.bind('refresh', updateHubDisplay);
     *
     * Returns a Collection object.
     */
    getModels: function (collection, ids) {
        var wrapped = _(ids),
            type    = collection.model.prototype.type,
            subset  = new collection.constructor(),
            toLoad  = new collection.constructor(),
            toLoadCopy = new collection.constructor();

        // Removed previously failed ids.
        ids = wrapped.without.apply(wrapped, Tasket.failed[type]);

        _.each(ids, function (id) {
            var model = collection.get(id);

            if (!model) {
                model = new collection.model({id: id});
                toLoad.add(model);
                toLoadCopy.add(model);
            }
            subset.add(model);
        });

        if (toLoad.length) {
            toLoad.fetch().bind('refresh', function () {
                toLoad.each(function (model) {
                    if (!collection.get(model.id)) {
                        collection.add(model);
                    }
                    // Update the model in the subset with the new data.
                    subset.get(model.id).set(model.toJSON());
                });

                // Remove all models from subset that appear in toLoadCopy
                // but not in toLoad. As they do not exist on the server.
                toLoadCopy.each(function (model) {
                    if (!toLoad.get(model.id)) {
                        subset.remove(model);

                        // Cache the failed model id.
                        Tasket.failed[model.type].push(model.id);
                    }
                });

                subset.trigger("refresh", subset, {});
            });
        }

        return subset;
    },

    // Helper function for fetching multiple collections and models in one go,
    // with a callback on completion
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

    // Bootstrap data on page load: fetch all open hubs, their owners and tasks,
    // and the users involved in those tasks
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
    },

    thumbnail: function (image, width, height, crop) {
        var url = '/thumb/' + width + 'x' + height + '/' + image;
        return crop ? url + '?crop' : url;
    }
});
