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
            degreesPerSegment = pathTotalArc / this.numTasks,
            count = 0,
            imageWidth = this.r * 1.38,
            circle;
            
        this.x = 162;
        this.y = 162;
        
        jQuery.each(this.tasks, function(taskId, task){
            var angle = ((degreesPerSegment * count) + pathStartAngle) % 360,
                taskPath = viz.path("M" + hub.x + " " + hub.y + " L" + (hub.x + pathRadius - taskCircleRadius) + " " + hub.y).rotate(angle, hub.x, hub.y).attr("stroke", "#555"),
                taskCircle = viz.circle(hub.x + pathRadius, hub.y, taskCircleRadius).rotate(angle, hub.x, hub.y),
                taskSet = viz.set(),
                
                // TODO: TEMP - use jQuery to calculate offset position
                taskNode = jQuery(taskCircle.node),
                taskOffset = taskNode.offset();
            
            taskSet.push(taskPath, taskCircle);
            set.push(taskSet);

            task.draw(taskOffset.left, taskOffset.top);
            count ++;
        });
        
        circle = shapes.circle = viz.circle(this.x, this.y, this.r)
            .attr({fill:"#7390aa"});
        set.push(circle);
        set.push(viz.image("media/images/profile2.jpg", this.x - imageWidth / 2, this.y - imageWidth / 2, imageWidth, imageWidth));
        
        var html = tim(getTemplate("hub"), {
            title: this.title
        });
        
        jQuery(html)
            // TODO: calculate positions more reliably
            .css({left:(this.x - this.r - 110) + "px", top:(this.y - 10) + "px"})
            .appendTo(contentElem);
        
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
            .appendTo(contentTasksElem)
            .draggable({containment:bodyElem, revert:"invalid"})
            .data("task", this);
            
        return this;
    }
};
Task.create = function(){
    var lightbox = jQuery.nitelite(0.62, "#567490");
    lightbox.open(tim(getTemplate("createTask"), {}));
    
    function setUp() {
        jQuery('#taskform').ajaxForm({
            beforeSubmit: addTempId,
            success: taskAdded
        })
            .submit(function(){
                lightbox.close();
            });
    }

    function addTempId(formData, jqForm, options) {
        jQuery('#temp_id').attr('value', new Date().getTime());
        lightbox.close();
    }

    function taskAdded(responseText, statusText, xhr, $form) {
        var tempId = "foo",
            taskId = 5,
            task = tempTasks[tempId];
            
        if (task){
            task.id = taskId;
            delete task.tempId;
            delete tempTasks[tempId];
        }
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
	    }, 618);
	}
});

var h = new Hub(5, "Bob Jenkins");
h.addTask(null, "Get food", {desc:"lorem ipsum"});
h.addTask(null, "Get food", {desc:"lorem ipsum"});
h.addTask(null, "Get food", {desc:"lorem ipsum"});
h.addTask(null, "Get food", {desc:"lorem ipsum"});
h.draw();
