var // SETTINGS
    hubRadius = 38,
    pathStartAngle = 270,
    pathTotalArc = 240,
    pathLength = 38,
    taskCircleRadius = 5,
    pathRadius = hubRadius + pathLength,
    
    bodyElem = jQuery("body"),
    vizElem = jQuery("section.board div.viz"),
    contentElem = jQuery("section.board div.content"),
    contentTasksElem = jQuery("ul.tasks", contentElem),
    sideElem = jQuery("aside.profile"),
    inProgressElem = jQuery("section.in-progress", sideElem),
    inProgressTasksElem = jQuery("ul.tasks", inProgressElem),
    completedElem = jQuery("section.completed", sideElem),
    completedTasksElem = jQuery("ul.tasks", completedElem),
    createdElem = jQuery("section.created", sideElem),
    createdTasksElem = jQuery("ul.tasks", createdElem),
    viz = Raphael(vizElem[0]),
    
    templates,
    tasks = {},
    tempTasks = {},
    you,
    
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

function getBy(enumerable, findProperty, findValue){
    return jQuery.map(enumerable, function(el, i){
        if (typeof el[findProperty] !== 'undefined'){
            if (typeof findValue === 'undefined' ||
                el[findProperty] === findValue){
                return el;
            }
        }
    });
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
    this.img = opts.img || null;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
}
Hub.prototype = {
    r: hubRadius,
    numTasks: 0,
    
    translate: function(x, y){
        forEach(h.shapes, function(elem){
            elem.translate(x, y)
        });
        
        forEach(h.elements, function(elem){
            var offset = elem.offset();
                
            elem.offset({
                left:offset.left + x,
                top:offset.top + y
            });
        });
    },

    addTask: function(id, title, opts){
        var task = new Task(id, this, title, opts);
        this.tasks[task.id || task.tempId] = task;
        this.numTasks ++;
        return this;
    },
    
    draw: function(){
        if (this.shapes && this.elements){
            forEach(this.shapes, function(el){
                el.remove();
            });
            forEach(this.elements, function(el){
                if (!el.data("task") || el.data("task").status === "todo"){
                    el.remove();
                }
            });
        }
        
        // Gravity
        this.y = this.numTasks * 50 + 50;
        
    
        var hub = this,
            elements = this.elements = [],
            shapes = this.shapes = [], 
            taskElems = elements.tasks = [],
            degreesPerSegment = pathTotalArc / this.numTasks,
            count = 0,
            imageWidth = this.r * 1.38,
            circle;
        
        jQuery.each(this.tasks, function(taskId, task){
            if (task.status !== "todo"){
                return true;
            }
        
            var angle = ((degreesPerSegment * count) + pathStartAngle) % 360,
                taskPath = viz.path("M" + hub.x + " " + hub.y + " L" + (hub.x + pathRadius - taskCircleRadius) + " " + hub.y).rotate(angle, hub.x, hub.y).attr("stroke", "#555"),
                taskCircle = viz.circle(hub.x + pathRadius, hub.y, taskCircleRadius).rotate(angle, hub.x, hub.y),
                
                // TODO: TEMP - use jQuery to calculate offset position
                taskNode = jQuery(taskCircle.node),
                taskOffset = taskNode.offset();
                
            shapes.push(taskPath, taskCircle);
            task.draw(taskOffset.left, taskOffset.top);
            count ++;
        });
        
        circle = this.circle = viz.circle(this.x, this.y, this.r)
            .attr({fill:"#7390aa"});
        shapes.push(circle);
        shapes.push(viz.image(this.img, this.x - imageWidth / 2, this.y - imageWidth / 2, imageWidth, imageWidth));
        
        var html = tim(getTemplate("hub"), {
            title: this.title
        }),
        hubName = jQuery(html)
            // TODO: calculate positions more reliably
            .offset({
                left:(this.x - this.r - 110),
                top:(this.y - 10)
            })
            .appendTo(contentElem);
        
        elements.push(hubName);
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
    status: "todo",

    draw: function(x, y){
        var html = tim(getTemplate("task"), {
            title: this.title,
            desc: this.desc
        }),
        task = jQuery(html)
            .css({left:x + "px", top: y + "px"})
            .appendTo(contentTasksElem)
            .draggable({
                containment:bodyElem,
                revert:"invalid",
                start: function(){
                    inProgressElem.addClass("dragging");
                },
                stop: function(){
                    inProgressElem.removeClass("dragging");
                }
            })
            .data("task", this);
        
        this.hub.elements.push(task);        
        return this;
    }
};
Task.create = function(){
    var lightbox = jQuery.nitelite(0.62, "#567490");
    lightbox.open(tim(getTemplate("createTask"), {}));
    
    function setUp() {
        jQuery('#taskform')
            .ajaxForm({
                beforeSubmit: addTempId,
                success: taskAdded
            })
            .submit(function(){
                lightbox.close();
            });
    }

    function addTempId(formData, jqForm, options){
        var title = getBy(formData, "name", "title")[0].value,
            desc = getBy(formData, "name", "summary")[0].value,
            time = getBy(formData, "name", "time_estimate")[0].value,
            task;
        
        if (!you){
            you = new Hub(5, "Mary-Sue", {x:550, y:150, img:"media/images/profile.jpg"});
        }
        task = you.addTask(null, title, {desc:desc, time:time});        
        jQuery('#temp_id').attr('value', task.tempId);
        
        you.draw();
        lightbox.close();
    }

    function taskAdded(responseText, statusText, xhr, $form) {
        if (!JSON || !responseText){
            return;
        }
        try {
        var data = JSON.parse(responseText),
            tempId = data.temp_id,
            taskId = data.task_id,
            task;
            
        if (tempId && taskId){
            task = tempTasks[tempId];
        }
        if (task){
            task.id = taskId;
            delete task.tempId;
            delete tempTasks[tempId];
        }
        }
        catch(e){}
    }

    setUp();
};

createdTasksElem.find("a.create")
    .click(Task.create);

bodyElem.delegate("article.task", "click", function(){
    var taskElem = jQuery(this),
        visible = !taskElem.data("visible"),
        descElem = taskElem.find("div.desc");
    
    if (visible){
        descElem.slideDown("fast");
    }
    else {
        descElem.slideUp("fast");
    }
    taskElem
        .toggleClass("visible")
        .data("visible", visible);
});

inProgressElem.droppable({
	drop: function(event, ui){
	    var taskElem = ui.draggable,
	        task = taskElem.data("task");
	        
	    jQuery("<li></li>")
	        .append(taskElem)
	        .appendTo(inProgressTasksElem);
	        
	    var doneElem = jQuery("<a class=done>done</a>")
	        .hide()
	        .insertAfter(taskElem.find("h1"))
	        .click(function(){
	            doneElem.remove();
	            taskElem
	                .addClass("added")
	                .parent().appendTo(completedTasksElem);
	                
	            window.setTimeout(function(){
	                taskElem.removeClass("added");
	            }, 618);
	            
                taskElem.data("task").status = "inprogress";
	        });
	        
	    taskElem
	        .draggable("option", "disabled", true)
	        .data("visible", false)
	        .hover(
	            function(){
                    doneElem.show();
                },
                function(){
                    doneElem.hide();
                }
            )
            .addClass("added");
            
        taskElem.find("div.desc").hide();
            
	    window.setTimeout(function(){
	        taskElem.removeClass("added");
	    }, 0);
	    
	    task.status = "inprogress";
	    task.hub.numTasks --;
	    task.hub.draw();
	}
});

var h = new Hub(5, "Bob Jenkins", {x:145, y:400, img:"media/images/profile2.jpg"});
h.addTask(null, "Buy food from market", {desc:"lorem ipsum"});
h.addTask(null, "Pick up prescription", {desc:"lorem ipsum"});
h.addTask(null, "Put out dustbin", {desc:"lorem ipsum"});
h.draw();
