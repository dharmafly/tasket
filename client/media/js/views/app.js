// UI SETTINGS

var app = _.extend({
    useCsrfToken: false,
    useSessionId: true,
    authtoken: null,
    csrftoken: null,
    hubDescriptionTruncate: 30, // No. of chars to truncate hub description to
    currentUser: null,
    notification: new Notification(),
    tankController: new TankController(),
    pageController: new PageController(),

    // init() accepts jQuery deferred objects as returned by $.ajax() or
    // created manually using new jQuery.Deferred(). These objects are
    // are queued up. When the method is called with no arguments it waits
    // until all deferreds are resolved and triggers the "success" event.
    //
    // An all init functions should be passed to this method then it should
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
            else {
                // Kick off init(). Trigger "success" if all deferreds return
                // successfully. Else trigger an "error" event.
                jQuery.when.apply(null, callbacks).then(
                    function () {
                        app.trigger('ready');
                    },
                    function () {
                        app.trigger('error');
                    }
                );
                callbacks = null;
            }
        };
    })(),

    getCookie: function(name){
        var docCookie = window.document.cookie,
            cookieValue, cookies, cookie, i;
        
        if (docCookie && docCookie !== "") {
            cookies = docCookie.split(";");
            
            for (i = 0; i < cookies.length; i++) {
                cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },
    
    sendCsrfToken: function(xhr){
        var csrftoken = this.csrftoken;
        if (!csrftoken){
            csrftoken = this.csrftoken = getCookie("csrftoken");
        }
        if (csrftoken){
            xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
        }
        return xhr;
    },
    
    sendSessionId: function(xhr){
        if (this.authtoken){
            xhr.setRequestHeader("Authorization", this.authtoken);
        }
        return xhr;
    },
    
    sendAuthorization: function(xhr, url){
        // Only send authorisation for requests sent to the Tasket API            
        if (url.indexOf(Tasket.endpoint) === 0){
            xhr.withCredentials = true;
            
            if (this.useCsrfToken){
                this.sendCsrfToken(xhr);
            }
            if (this.useSessionId){
                this.sendSessionId(xhr);
            }
        }
        return xhr;
    },
    
    setupAuthentication: function(){
        var app = this;
    
        jQuery.ajaxSetup({
            beforeSend: function(xhr, settings){
                app.sendAuthorization(xhr, settings.url);
            }
        });
    }
}, Backbone.Events);

