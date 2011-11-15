
var Tasket = {};


// **
function now(){
    return (new Date()).getTime();
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

// Takes all methods prefixed with "_on" and binds them to the current scope.
//
// Example
//
//   var obj = {
//     doSomething: function () {},
//     _onClick: function () {},
//     _onHover: function () {}
//   }
//   bindHandlers(obj); // _onClick and _onHover will be bound to current scope.
//
function bindHandlers(object) {
    var key, value;
    for (key in object) {
        value = object[key];
        if (key.indexOf("_on") === 0 && typeof value === "function" && !value.bound) {
            object[key] = _.bind(value, object);

            // Prevent an item being bound multiple times. This could happen
            // if multiple constructors call bindHandlers(this);
            object[key].bound = true;
        }
    }
}

// Helper function to escape a string for HTML rendering.
function escapeHTML(string) {
  return string.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Returns seconds in human readbale format. in days, hours & minutes.
function humanTimespan (remainder, units) {
    var times = [];

    units = units || {day: 86400, hour: 3600, min: 60};

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

// Converts newlines into HTML <br> tags.
function nl2br(value) {
    return value.replace(/\n/g, '<br />');
}

// converts a timestamp to a presentable date string
function timestampToDate(timestamp) {
    // ensure all values have two s.f.
    function twosf(val) { return (val < 10) ? "0"+val : val; }

    var jsDate = new Date([timestamp] * 1000), // convert seconds to milliseconds
        months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        year = jsDate.getFullYear(),
        month = months[jsDate.getMonth()],
        date = twosf(jsDate.getDate()),
        hour = twosf(jsDate.getHours()),
        min = twosf(jsDate.getMinutes()),
        sec = twosf(jsDate.getSeconds());
        
    return date+' '+month+' '+year;
}

// converts a timestamp to a presentable relative date
function timestampToRelativeDate(timestamp) {
    
    // condition : if a project has just been archived, 
    // it won't have a timestamp, so don't return a date
    if (!timestamp) { return false; }
    
    var now = new Date(),
        difference = now - (timestamp*1000),
        seconds = difference / 1000,
        minutes = seconds / 60,
        hours = minutes / 60,
        days = hours / 24,
        years = days / 365,
        relativeDate;
        
    relativeDate = seconds < 2 && "1 second ago" ||
		seconds < 60 && Math.round(seconds) + " seconds ago" ||
        seconds < 90 && "1 minute ago" ||
        minutes < 60 && Math.round(minutes) + " minutes ago" ||
        minutes < 90 && "1 hour ago" ||
        hours < 24 && Math.round(hours) + " hours ago" ||
        hours < 48 && "1 day ago" ||
        days < 30 && Math.floor(days) + " days ago" ||
        days < 60 && "1 month ago" ||
        days < 365 && Math.floor(days / 30) + " months ago" ||
        years < 2 && "1 year ago" ||
        "on " + timestampToDate(timestamp);    
        
    return relativeDate;
}