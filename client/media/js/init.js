
var dummyCode = false,
    cachedCode = false,
    debugUsername = "TestUser",
    debugPassword = "12345",
    notification = app.notification,
    lang = Tasket.lang.en;
    
    
/////

app.setupAuthentication();

Tasket.login(debugUsername, debugPassword, function(data){
    _("login results", data);
    app.authtoken = data.sessionid;
});


/////
    

function drawHubs(success){
    var hubView;
    
    // TODO: TEMP
    window.hv = [];
    //var skip = 1;
    
    /////
    
    if (success){
        notification.hide();
        Tasket.hubs.each(function(hub, i){
            // TODO: TEMP
            /*
            if (i === skip){
                return;
            }
            */
        
            hubView = new HubView({
                model: hub,
               
                offset: { // TODO: Make useful
                    left: randomInt(window.innerWidth - 550) + 50, // window.innerWidth / 3,
                    top: randomInt(window.innerHeight - 200) + 100 // window.innerHeight / 2
                },
            });
            
            bodyElem.append(hubView.elem);
            hubView.render();
            
            /////
            
            // TODO: TEMP
            //hubView.select();
            window.hv.push(hubView);
        });
    }
    else {
        notification.error(lang.DOWNLOAD_ERROR);
    }
}

function bootstrap(){
    // Timeout required to prevent notification appearing immediately (seen in Chrome)
    window.setTimeout(function(){
        notification.warning(lang.LOADING);
    }, 0);

    // Get data from the server and draw
    Tasket.getOpenHubs(drawHubs);
    // TODO: setTimeout in case of non-load -> show error and cancel all open xhr
}


/////


// TODO: TEMP
if (dummyCode){
    drawDummyData();
}
else {
    // TODO: TEMP
    if (cachedCode){
        useCachedData();
    }
    
    /////

    // START
    bootstrap();
}


/////     /////     /////     /////     /////     /////     /////


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


/////     /////     /////     /////     /////     /////     /////


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
