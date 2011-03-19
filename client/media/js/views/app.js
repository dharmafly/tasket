// UI SETTINGS

var app = {
    useCsrfToken: false,
    useSessionId: true,
    authtoken: null,
    csrftoken: null,
    hubDescriptionTruncate: 30, // No. of chars to truncate hub description to
    currentUser: null,
    notification: new Notification(),
    tankController: new TankController(),
    
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
};
