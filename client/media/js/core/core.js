/*global jQuery, console, _, Backbone, tim*/


function now(){
    return (new Date()).getTime();
}

function truncate(str, charLimit, continuationStr){
    if (str && str.length > charLimit){
        continuationStr = continuationStr || "…";
        return str
            .slice(0, charLimit + continuationStr.length)
            .replace(/\W?\s\S*$/m, "") +
            continuationStr;
    }
    return str;
}

function randomInt(length){
    return Math.ceil((length || 2) * Math.random()) - 1;
}


/////


//var Tasket, Model, CollectionModel, TaskList, Task, TaskStates, HubList, Hub, User, UserList, Notification, HubView, TaskView, app;
var Tasket = {};
