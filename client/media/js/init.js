
var dummyCode = false,
    cachedCode = false,
    notification = ui.notification,
    lang = Tasket.lang.en;
    
    
/////


function setupAjaxToDjango(){
    var docCookie = window.document.cookie;

    function getCookie(name) {
        var cookieValue, cookies, cookie, i;
        
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
    }
    
    function sendCsrfToken(xhr, settings){
        // Only send the token to the Tasket API            
        if (settings.url.indexOf(Tasket.endpoint) === 0) {
            O("CSRFToken", getCookie("csrftoken"));
            xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
        }
    }

    jQuery.ajaxSetup({beforeSend:sendCsrfToken});
}

setupAjaxToDjango();


function login(username, password, callback){
    jQuery.post(Tasket.endpoint + "login/", {
        username: username,
        password: password
    }, callback);
}
login("TestUser", "12345");


/////
    

function drawHubs(success){
    var hubView;
    
    // TODO: temp
    window.hv = [];
    var skip = 1;

    if (success){
        notification.hide();
        Tasket.hubs.each(function(hub, i){
            // TODO: temp
            if (i === skip){
                return;
            }
        
            hubView = new HubView({
                model: hub,
               
                offset: { // TODO: Make useful
                    left: window.innerWidth / 3, //randomInt(window.innerWidth - 550) + 50,
                    top: window.innerHeight / 2 //randomInt(window.innerHeight - 200) + 100
                },
            });
            
            bodyElem.append(hubView.elem);
            hubView.render();
            
            // TODO: temp
            hubView.select();
            window.hv.push(hubView);
        });
    }
    else {
        notification.error(lang.DOWNLOAD_ERROR);
    }
}


/////


if (dummyCode){
    drawDummyData();
}
else {
    // TODO: temp - requires localhost to serve static files
    if (cachedCode){
        useCachedData();
    }
    
    /////


    // Timeout required to prevent notification appearing immediately (seen in Chrome)
    window.setTimeout(function(){
        notification.warning(lang.LOADING);
    }, 0);

    // Get data from the server and draw
    Tasket.getOpenHubs(drawHubs);
    // TODO: setTimeout in case of non-load -> show error and cancel all open xhr
}


/////


function useCachedData(){
    Tasket.endpoint = "example-data/";
        
    Model.url = Hub.url = Task.url = User.url = function() {
        var url = Tasket.endpoint + this.type + "s";
        return this.isNew() ?
            url + ".json" : url + this.id + ".json";
    };
    
    CollectionModel.url = HubList.url = TaskList.url = UserList.url = Tasket.hubs.url = Tasket.tasks.url = Tasket.users.url = function(){
        var url = Tasket.endpoint + this.type + "s";
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        // TODO: find out why tasks pluck is in two arrays
        return url + ".json?ids=" + this.pluck("id").sort();
    }
}


/////


function drawDummyData(){
    notification.hide();

    var myHub = new Hub({
            title: "Foo foo foo",
            description: "Lorem ipsum",
            image: "media/images/placeholder.png",
            owner: "5"
        }),
        
        myHubView = new HubView({
            model: myHub,
            
            // options
            selected: true,
            offset: {
                top: 300,
                left: 500
            },
            
            collection: new TaskList([ // TODO: add these to the hub, not the hubview
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Another User',
                        url: '#/user/another-user/',
                        image: 'media/images/placeholder.png'
                    },
                    hub:myHub, // TODO: how does this align with a JSON representation, using the id?
                    hasUser: true,
                    isOwner: false,
                    isNotOwner: true,
                    showTakeThisButton: false,
                    showDoneThisButton: false
                },
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Current User',
                        url: '#/user/current-user/',
                        image: 'media/images/placeholder.png'
                    },
                    hub:myHub,
                    hasUser: true,
                    isOwner: true,
                    isNotOwner: false,
                    showTakeThisButton: false,
                    showDoneThisButton: true
                },
                {
                    description: 'This is a task description, it should contain a few sentences detailing the nature of the task.',
                    owner: {
                        name: 'Current User',
                        url: '#/user/current-user/',
                        image: 'media/images/placeholder.png'
                    },
                    hub:myHub,
                    hasUser: false,
                    isOwner: false,
                    isNotOwner: true,
                    showTakeThisButton: true,
                    showDoneThisButton: false
                }
            ])
        });
    
        jQuery("body").append(myHubView.elem);   
        myHubView.render();
}
