var dummyCode = false,
    cachedCode = true,
    notification = ui.notification,
    lang = Tasket.lang.en;

function drawHubs(success){
    var hubView;

    if (success){
        notification.hide();
        Tasket.hubs.each(function(hub){
            hubView = new HubView({
                model: hub,
               
                offset: {
                    top: 300,
                    left: 500
                },
            }).render();
            
            body.append(hubView.elem);
            
            // TODO: temp
            window.hubView = hubView;
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
}


/////


function useCachedData(){
    Tasket.endpoint = "example-data/";
        
    Model.url = Hub.url = Task.url = User.url = function() {
        var base = Tasket.endpoint + this.type + "s";
        return this.isNew() ?
            base + ".json" : base + this.id + ".json";
    };
    
    CollectionModel.url = HubList.url = TaskList.url = UserList.url = Tasket.hubs.url = Tasket.tasks.url = Tasket.users.url = function(){
        var base = Tasket.endpoint + this.type + "s";
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        return base + ".json";
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
