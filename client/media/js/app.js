// UI SETTINGS

var cache = new Cache(Tasket.namespace),
    app = _.extend({
        // Sets up the app. Called by init()
        setup: function () {
            this.bodyElem = jQuery("body");

            return _.extend(this, {
                wallBuffer: 50, // Pixels margin that project nodes should keep away from the walls of the tank
                taskBuffer: 20,
                tankResizeThrottle: 750,
                hubDescriptionTruncate: 30, // No. of chars to truncate hub description to
                hubPlaceholderImage: "/media/images/placeholder.png",
                userPlaceholderImage: "/media/images/placeholder.png",
                loaded: false,
                useCsrfToken: false,
                useSessionId: true,
                authtoken: null,
                csrftoken: null,
                currentUser: null,
                cache: cache,
                toolbar:        new Toolbar({el: jQuery(".header-container")[0]}),
                notification:   new Notification(),
                lightbox:       new Lightbox(),
                dashboard:      new Dashboard()
            });
        },

        // Sets up the app. Called by init() on app "ready".
        ready: function () {
            return _.extend(this, {
                // The controllers will make Ajax calls on their init, so are created after app init
                tankController: new TankController(),
                pageController: new PageController(),
                dashController: new DashboardController()
            });
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
                    app.trigger("setup", app);

                    // Kick off init(). Trigger "success" if all deferreds return
                    // successfully. Else trigger an "error" event.
                    jQuery.when.apply(null, callbacks).then(
                        function () {
                            app.ready();
                            app.trigger("ready", app);
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
        
        // Convert between bottom-zeroed and top-zeroed coordinate systems
        invertY: function(y){
            return window.innerHeight - y;
        },
    
        createForceDirector: function(options){
            var f = new ForceDirector(),
                defaultSettings = {
                    fps: 60,
                    numCycles: 200,
                    inCoulombK: 50,
                    inWallRepulsion: 600,
                    inVelDampK: 0.01,
                    updateStepMin: 0.1,
                    updateStepMax: 5,
                    updateStepDamping: 0.005,
                    animate: null,
                    callback: null,
                    wallsFlag: true
                },
                easing;
            
            // Combine options with default settings
            options = _.extend(defaultSettings, options || {});
            
            function loop(){
                f.updateCycle(options.updateStepMin + easing);
                easing = easing - (easing * options.updateStepDamping);
                
                if (options.animate){
                    options.animate();
                }
                
                if (i <= options.numCycles){
                    if (options.animate){
                        window.setTimeout(function(){
                            loop(++i);
                        }, 1000 / options.fps);
                    }
                    else {
                        loop(++i);
                    }
                }
                else if (options.callback){
                    options.callback();
                }
            }
            
            function startLoop(newOptions){
                if (newOptions){
                    options = _.extend(options, newOptions);
                }
                
                i = 0;
                easing = options.updateStepMax - options.updateStepMin;
                
                f.inVelDampK = options.inVelDampK;
                f.inCoulombK = options.inCoulombK;
                f.inWallRepulsion = options.inWallRepulsion;
                f.wallsFlag = options.wallsFlag;
                f.top = options.wallTop;
                f.bottom = options.wallBottom;
                f.left = options.wallLeft;
                f.right = options.wallRight;
                
                loop();
            }
            
            return {
                engine: f,
                options: options,
                go: startLoop
            }
        },

        isCurrentUser: function (id) {
            return !!(app.currentUser && id === app.currentUser.id);
        },

        restoreCache: function(){
            var currentUserData, currentUser;

            // If we don't have a session cookie, destroy the cache. Django will
            // continually set this cookie so this will only really work if the
            // cookie itself expires.
            if (!this.getCookie("sessionid")) {
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
            app.cache.remove("currentUser");
            app.cache.remove("authtoken");
            app.cache.remove("csrftoken");
        },

        // Requires User model.
        updateCurrentUser: function (user, cache) {
            if (user){
                app.currentUser = user;
                if (cache !== false){
                    app.cache.set("currentUser", app.currentUser.toJSON());
                }
                app.trigger("change:currentUser", app.currentUser); // see dashboard.js > Dashboard.setUser()
            }
            return app.currentUser;
        },

        setAuthtoken: function(authtoken){
            app.authtoken = authtoken;
            app.cache.set("authtoken", app.authtoken);
            return app.trigger("change:authtoken", authtoken); // see dashboard.js > Dashboard.setUser()
        },

        // Update the location bar with the previous hash.
        back: function(){
            var prev = Backbone.history.getPrevious();
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

        // Returns true if the browser supports Taskets API"s.
        supported: (function () {
            var canvas = document.createElement("canvas"),
                supported;

            supported = !!(canvas.getContext && canvas.getContext("2d") && cache.localStorage);

            return function () {
                return supported;
            };
        }())
    }, Backbone.Events);
