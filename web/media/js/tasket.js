var // SETTINGS
    hubRadius = 38,
    pathStartAngle = 0,
    pathLength = 38,
    taskCircleRadius = 6,
    taskPadding = 3,
    pathRadius = hubRadius + pathLength,
    
    vizElem = jQuery("section.board div.viz"),
    contentElem = jQuery("section.board div.content"),
    viz = Raphael(vizElem[0]),
    
    templates,
    forEach = Array.prototype.forEach ?
    function(array, fn, thisp){
        return array.forEach(fn, thisp);
    } :
    function(array, fn, thisp){
        var i = 0,
            arrayCopy = Object(array),
            length = arrayCopy.length;
        
        for (; i < length; i++){
            if (i in arrayCopy){
                fn.call(thisp, arrayCopy[i], i, arrayCopy);
            }
        }
        return arrayCopy;
    };

// returns int from 1 to max
function randomInt(max){
    return Math.ceil((max || 2) * Math.random());
}   

function getTemplate(key){
    if (!templates){
        templates = {};
        jQuery("script[type=text/tim]").each(function(){
            templates[this.className] = this.innerHTML;
        });
    }
    return templates[key];
}


function Hub(id, title, opts){
    opts = opts || {};
    
    this.id = id;
    this.title = title;
    this.tasks = {};
}
Hub.prototype = {
    r: hubRadius,
    numTasks: 0,

    addTask: function(id, title, opts){
        var task = new Task(id, this, title, opts);
        this.tasks[task.id || task.tempId] = task;
        this.numTasks ++;
        return this;
    },
    
    draw: function(){
        var hub = this,
            shapes = this.shapes = {},
            set = shapes.set = viz.set(),
            degreesPerSegment = 360 / this.numTasks,
            count = 0,
            circle;
            
        this.x = 100;
        this.y = 100;
        
        
        jQuery.each(this.tasks, function(taskId, task){
            var angle = ((degreesPerSegment * count) + pathStartAngle) % 360,
                taskPath = viz.path("M" + hub.x + " " + hub.y + " L" + (hub.x + pathRadius) + " " + hub.y).rotate(angle, hub.x, hub.y),
                taskCircle = viz.circle(hub.x + pathRadius, hub.y, taskCircleRadius).attr({fill:"#ccc"}).rotate(angle, hub.x, hub.y),
                taskSet = viz.set(),
                
                // TODO: TEMP - use jQuery to calculate offset position
                taskNode = jQuery(taskCircle.node),
                taskOffset = taskNode.offset(),
                taskX = taskOffset.left  - taskPadding,
                taskY = taskOffset.top - taskPadding;
            
            taskSet.push(taskPath, taskCircle);
            set.push(taskSet);

            task.draw(taskX, taskY);
            count ++;
        });
        
        circle = shapes.circle = viz.circle(this.x, this.y, this.r)
            .attr({fill:"#ccc"});
        set.push(circle);
        return this;
    }
};

function Task(id, hub, title, opts){
    opts = opts || {};
    
    this.id = id;
    if (!id){
        this.tempId = (new Date).getTime() + "-" + randomInt(99999);
    }
    this.hub = hub;
    this.title = title;
    this.desc = opts.desc || "";
}
Task.prototype = {
    draw: function(x, y){
        var html = tim(getTemplate("task"), {
            title: this.title,
            desc: this.desc
        });
        
        jQuery(html)
            .css({left:x + "px", top: y + "px"})
            .appendTo(contentElem);
        return this;
    }
};

var h = new Hub(5, "Bob Jenkins");
h.addTask(null, "Get food");
h.addTask(null, "Get food");
h.addTask(null, "Get food");
h.addTask(null, "Get food");
h.draw();
