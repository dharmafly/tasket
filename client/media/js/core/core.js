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

// Throttle: http://github.com/premasagar/mishmash/tree/master/throttle/
function throttle(handler, interval, defer){
    var context = this,
        limitOn; // falsey
        
    interval = interval || 250; // milliseconds
    // defer is falsey by default
    
    return function(){
        var args = arguments;
    
        if (!limitOn){
            limitOn = true;
            
            window.setTimeout(function(){
                if (defer){
                    handler.apply(context, args);
                }                            
                limitOn = false;
            }, interval);
            
            if (!defer){
                return handler.apply(context, args);
            }
        }
    };
}

function randomInt(length){
    return Math.ceil((length || 2) * Math.random()) - 1;
}


/////


var Tasket = {};
