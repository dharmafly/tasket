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

// Helper function to escape a string for HTML rendering.
function escapeHTML(string) {
  return string.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Returns seconds in human readbale format. in days, hours & minutes.
function humanTimespan (remainder, units) {
    var times = [];

    units = units || {day: 86400, hour: 3600, minute: 60};

    _.each(units, function (seconds, unit) {
        var timespan = Math.floor(remainder / seconds);
        remainder = remainder % seconds;

        if (timespan !== 0) {
            if (timespan !== 1) {
                unit += 's';
            }
            times.push(timespan + ' ' + unit);
        }
    });

    return times.join(', ');
}

function randomInt(length){
    return Math.ceil((length || 2) * Math.random()) - 1;
}


/////


var Tasket = {};
