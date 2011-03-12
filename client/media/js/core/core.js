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
}


/////


//var Tasket, Model, CollectionModel, TaskList, Task, TaskStates, HubList, Hub, User, UserList, Notification, HubView, TaskView, ui, api,
var Tasket = {},
    body = jQuery("body");
