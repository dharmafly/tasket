// UI SETTINGS

var cache = new Cache(Tasket.namespace),
    app = _.extend({
        // Sets up the app. Called by init()
        setup: function () {
            // Bind app object's methods to the app object
            _.bindAll(this, "updateAllDoneTasks", "_onChangeUser");
            
            // Cache the body element
            this.bodyElem = jQuery("body");
        
            // app properties
            _.extend(this, {
                wallBuffer: 50, // Pixels margin that project nodes should keep away from the walls of the tank
                hubBuffer: 10,
                taskBuffer: 10,
                tankResizeThrottle: 1000,
                successNotificationHideDelay: 10000, // milliseconds before success notification is hidden; use `0` to not hide at all
                hubDescriptionTruncate: 45, // No. of chars to truncate hub description to
                taskDescriptionTruncate: 140, // No. of chars to truncate task description to
                hubImageWidth: 30,
                hubImageHeight: 30,
                hubPlaceholderImage: "images/placeholder.png",
                userInTaskImageWidth: 14,
                userInTaskImageHeight: 14,
                userPlaceholderImage: "images/placeholder.png",
                animateHubs: false,
                animateTasks: false,
                loaded: false,
                useCsrfToken: true,
                useSessionId: true,
                authtoken: null,
                csrftoken: null,
                currentUser: null,
                selectedHub: null,
                allDoneTasks: null,
                cache: cache,
                statistics:     {tasks: this.blankTaskStatistics()},
                toolbar:        new Toolbar({el: jQuery(".header-container")[0]}),
                notification:   new Notification(),
                lightbox:       new Lightbox(),
                dashboard:      new Dashboard()
            });
            
            
            // BIND EVENTS
            Tasket.bind("task:change:state", this.updateTaskStatistics);
            
            // Listen for changes to the app.allDoneTasks collection, and redraw the dashboard tasks accordingly
            app.bind("change:currentUser", this._onChangeUser);
            
            return this.trigger("setup", this);
        },
        
        _onChangeUser: function(){        
            if (app.currentUserIsAdmin()){
                if (!app.allDoneTasks){
                    Tasket.bind("task:change:state", app.updateAllDoneTasks)
                          .bind("task:remove", app.updateAllDoneTasks);
                }
                app.fetchAllDoneTasks();
            }
            else {
                app.allDoneTasks = null;
                Tasket.unbind("task:change:state", app.updateAllDoneTasks);
            }
        },

        // Sets up the app. Called by init() on app "ready".
        ready: function () {
            _.extend(this, {
                // The controllers will make Ajax calls on their init, so are created after app init
                tank: new TankController(),
                pageController: new PageController(),
                dashController: new DashboardController()
            });
            
            /////
            
            // THE TANK
                        
            this.tank
                .bind("hub:select", function(hubView){
                    app.selectedHubView = hubView;
                    app.selectedHub = hubView.model.id;
                    app.dashboard.hubAnchorSelect();
                })
                .bind("hub:deselect", function(hubView){
                    app.selectedHubView = app.selectedHub = null;
                });
            
            /////
            
            return this.trigger("ready", this);
        },

        // init() accepts jQuery deferred objects as returned by jQuery.ajax() or
        // created manually using new jQuery.Deferred(). These objects are
        // are queued up. When the method is called with no arguments it waits
        // until all deferreds are resolved and triggers the "success" event.
        //
        // All init functions should be passed to this method then it should
        // be called with no arguments to kickstart the app. Any dependancies can
        // listen for the "success" and "error" events.
        init: (function () {
            var callbacks = [];

            return function (deferred) {
                if (callbacks && deferred) {
                    // Push the callbacks into our queue.
                    callbacks.push(deferred);
                }
                else if (callbacks === null) {
                    throw "Cannot add more callbacks. init() has already been run";
                }
                else if (app.loaded !== true) {
                    // Setup app properties that are not dependant on anything.
                    app.setup();

                    // Kick off init(). Trigger "success" if all deferreds return
                    // successfully. Else trigger an "error" event.
                    jQuery.when.apply(null, callbacks).then(
                        function () {
                            app.ready();
                            app.loaded = true;
                        },
                        function () {
                            app.trigger("error", app);
                        }
                    );
                    callbacks = null;
                }
                return app;
            };
        }()),
        
        truncate: function(str, charLimit, continuationStr){
            if (str && str.length > charLimit){
                continuationStr = continuationStr || "…";
                return str
                    .slice(0, charLimit + continuationStr.length)
                    .replace(/\W*(\w*|\W*)$/, "") +
                    continuationStr;
            }
            return str;
        },
        
        // Convert between bottom-zeroed and top-zeroed coordinate systems
        invertY: function(y, maxValue){
            maxValue = maxValue || app.tank.viewportHeight;
        
            return maxValue - y;
        },

        isCurrentUser: function (id) {
            return !!(app.currentUser && id === app.currentUser.id);
        },
        
        currentUserIsAdmin: function(){
            return !!(app.currentUser && app.currentUser.isAdmin());
        },
        
        isCurrentUserOrAdmin: function(id){
            return app.isCurrentUser(id) || app.currentUserIsAdmin();
        },

        restoreCache: function(){
            var currentUserData, currentUser, username;

            // If we don't have a session cookie, destroy the cache. Django will
            // continually set this cookie so this will only really work if the
            // cookie itself expires.
            if (!this.getCookie("sessionid")) {
                // Redirect to login and pre-populate the username field.
                currentUser = app.cache.get("currentUser");
                if (currentUser) {
                    window.location.hash = "/login/";
                    username = currentUser.username;
                    setTimeout(function () {
                        jQuery('#field-username').val(username);
                    }, 200);
                }

                // Destroy the cache.
                this.destroyCache();
            }

            currentUserData = app.cache.get("currentUser");
            if (currentUserData && this.getCookie("sessionid")){
                currentUser = app.updateCurrentUser(new User(currentUserData), false);
                currentUser.fetch();
            }

            app.authtoken = app.cache.get("authtoken");
            app.csrftoken = app.cache.get("csrftoken");
            return app;
        },

        destroyCache: function () {
            app.cache
                .remove("currentUser")
                .remove("authtoken")
                .remove("csrftoken");
        },

        // Requires User model.
        updateCurrentUser: function (user, saveToCache) {
            if (user){
                if (!Tasket.users.get(user.id)){
                    Tasket.users.add(user);
                }
                app.currentUser = user;
                if (saveToCache !== false){
                    app.cache.set("currentUser", app.currentUser.toJSON());
                }
                app.trigger("change:currentUser", app.currentUser); // see dashboard.js > Dashboard.setUser()
            }
            return app.currentUser;
        },
        
        _triggerAllDoneTasksChange: function(){
            app.trigger("change:allDoneTasks", app.allDoneTasks);
            return app;
        },
        
        fetchAllDoneTasks: function(){
            Tasket.getTasksByState("done", function(allDoneTasks){
                if (allDoneTasks){
                    app.allDoneTasks = allDoneTasks;
                }
                // There was a server/connectivity error, and we haven't yet fetched the list of done tasks. Use an empty tasks collection.
                else if (!app.allDoneTasks){
                    app.allDoneTasks = new TaskList();
                }
                else {
                    return;
                }
                
                // Trigger on app whenever the allDoneTasks collection changes
                allDoneTasks
                    .bind("change", app._triggerAllDoneTasksChange)
                    .bind("remove", app._triggerAllDoneTasksChange);
                
                // Trigger now
                app._triggerAllDoneTasksChange();
            });
            
            return app;
        },
        
        updateAllDoneTasks: function(task){ // based on user.updateTasks(); called when task changes
            var allDoneTasks = app.allDoneTasks,
                id, isDone, wasDone, wasDeleted, storedTask;
            
            if (allDoneTasks){
                isDone  = task.get("state") === Task.states.DONE;
                wasDone = task.previous("state") === Task.states.DONE;

                // Remove this task from the allDoneTasks collection
                if (isDone || wasDone){
                    id = task.id;
                    wasDeleted = !Tasket.tasks.get(id);
                    storedTask = allDoneTasks.detect(function(doneTask){
                        return id === doneTask.id;
                    });

                    // Add the task, if it is in the DONE state
                    if (!storedTask && isDone){
                        allDoneTasks.add(task, {silent: true});
                    }
                    
                    // Remove the task, if it is no longer in the DONE state
                    else if (storedTask && !isDone || storedTask && wasDeleted){
                        allDoneTasks.remove(storedTask, {silent: true});
                    }
                }
            }
            
            return app;
        },

        setAuthtoken: function(authtoken){
            app.authtoken = authtoken;
            app.cache.set("authtoken", app.authtoken);
            return app.trigger("change:authtoken", authtoken); // see dashboard.js > Dashboard.setUser()
        },

        // Update the location bar with a previous hash.
        back: function(historyCount){
            var prev = Backbone.history.getPrevious(historyCount);
            if (!prev) {
                prev = "/";
            }
            Backbone.history.saveLocation(prev);
            return app;
        },

        getCookie: function(name){
            var docCookie = window.document.cookie,
                cookieValue, cookies, cookie, i;

            if (docCookie && docCookie !== "") {
                cookies = docCookie.split(";");

                for (i = 0; i < cookies.length; i+=1) {
                    cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) === (name + "=")) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        },

        sendCsrfToken: function(xhr){
            var csrftoken = app.csrftoken;
            if (!csrftoken){
                csrftoken = app.csrftoken = this.getCookie("csrftoken");
            }
            if (csrftoken){
                xhr.setRequestHeader("X-CSRFToken", this.getCookie("csrftoken"));
            }
            return xhr;
        },

        sendSessionId: function(xhr){
            if (app.authtoken){
                xhr.setRequestHeader("Authorization", app.authtoken);
            }
            return xhr;
        },

        sendAuthorization: function(xhr, url){
            // Only send authorisation for requests sent to the Tasket API
            if (url.indexOf(Tasket.endpoint) === 0){
                xhr.withCredentials = true;

                if (app.useCsrfToken){
                    app.sendCsrfToken(xhr);
                }
                if (app.useSessionId){
                    app.sendSessionId(xhr);
                }
            }
            return xhr;
        },

        setupAuthentication: function(){
            jQuery.ajaxSetup({
                beforeSend: function(xhr, settings){
                    app.sendAuthorization(xhr, settings.url);
                }
            });
            return app;
        },

        // Returns true if the browser supports Tasket's tech
        isSupported: (function () {
            var supportsSVG, container = document.createElement("div");

            // SVG SUPPORT
            // from http://diveintohtml5.org/everything.html#svg
            container.innerHTML = "<svg></svg>";
            supportsSVG = !!(window.SVGSVGElement && container.firstChild instanceof window.SVGSVGElement);
        
            // LOCAL STORAGE SUPPORT
            var supported = supportsSVG && !!cache.localStorage;
            
            return function () {
                return supported;
            };
        }()),
        
        blankTaskStatistics: function(){
            return {
                "new": 0,
                "claimed": 0,
                "done": 0,
                "verified": 0
            };
        },

        // Update the global statistics object when a task state changes. This
        // is a callback fruntion for the Tasket "task:change:state" event.
        updateTaskStatistics: function (model) {
            var current, previous,
                wasAlreadyAccountedFor = !model.previous("estimate"); // NOTE: this is a check to see if this task was an empty scaffold, created in Tasket.getModels and the fetched from the server and populated. If it was, then it has already been taken into account by the intial statistics fetch in init.js
            
            if (wasAlreadyAccountedFor){
                return;
            }
        
            current  = model.get("state");
            previous = model.previous("state");
            
            app.statistics.tasks[current]  += 1;
            app.statistics.tasks[previous] -= 1;

            app.trigger("change:statistics", app.statistics, app);
        }
    }, Backbone.Events);
