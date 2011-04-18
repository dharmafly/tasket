/*global jQuery, console, _, Backbone, tim*/


function now(){
    return (new Date()).getTime();
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

// Checks to see if any attributes in an array have changed when a Model fires
// a change event. If they have it calls the callback.
//
// Example
//
//  this.model.bind("change", hasChanged([
//    "tasks.new", "tasks.claimed", "tasks.done", "tasks.verified"
//  ], this.refreshTasks));
//
// Returns a Function to be passed into the Model#bind() method.
function hasChanged(attributes, callback) {
  attributes = _.isArray(attributes) ? attributes : [attributes];
  return function onChange(model) {
    var watch = _.clone(attributes);
    do {
        if (model.hasChanged(watch.pop())) {
            callback();
            break;
        }
    } while (watch.length);
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
