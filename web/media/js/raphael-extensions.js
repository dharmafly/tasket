// GROUP ELEMENTS
Raphael.fn.group = function() {
	var r = this,
		cfg = (arguments[0] instanceof Array) ? {} : arguments[0],
		items = (arguments[0] instanceof Array) ? arguments[0] : arguments[1],
		
		// Cache regexes for performance - these assume that valid values exist; they do not check for validity of transform attribute
		regexScale = /scale\([^)]*\)/,
		regexRotate = /rotate\([^)]*\)/,
		regexTranslate = /translate\([^)]*\)/;

	function Group(cfg, items) {
		var inst,
			set = r.set(items),
			group = r.raphael.vml ? 
				document.createElement("group") : 
				document.createElementNS("http://www.w3.org/2000/svg", "g");

		r.canvas.appendChild(group);

		inst = {
			type: 'group',			
			node: group,			
		    _transformAttr: "",
		    _className: "",

            // TODO: make robust, to prevent repeated addition
            addClass: function(className){
                inst._className += inst._className ? " " + className : className;                
			    group.setAttribute("class", inst._className);
			    return inst;
			},

            // TODO: make robust, to prevent repeated addition
            removeClass: function(className){
                inst._className = inst._className.replace(new RegExp(" ?\\b" + className + "\\b"), "");
			    group.setAttribute("class", inst._className);
			    return inst;
			},
		    
			transform: function(attrVal){
			    inst._transformAttr = attrVal;
			    group.setAttribute("transform", attrVal);
			    return inst;
			},
			
			translate: function(x, y){
			    var attrPortion = "translate(" + x + "," + y +")",
			        attrVal = inst._transformAttr;
			        
			    if (attrVal.indexOf("translate") < 0){
			        attrVal += attrPortion + (attrVal ? " " : "");
			    }
			    else {
			        attrVal = attrVal.replace(regexTranslate, attrPortion);
			    }
			    return inst.transform(attrVal);
			},
			
			rotate: function(rotateTo){
			    var attrPortion = "rotate(" + rotateTo +")",
			        attrVal = inst._transformAttr;
			        
			    if (attrVal.indexOf("rotate") >= 0){
			        attrVal = attrVal.replace(regexRotate, attrPortion);
			    }
			    else {
			        attrVal += attrPortion + (attrVal ? " " : "");
			    }
			    return inst.transform(attrVal);
			},
			
			scale: function(scaleTo){
			    var attrPortion = "scale(" + scaleTo +")",
			        attrVal = inst._transformAttr;
			        
			    if (attrVal.indexOf("scale") >= 0){
			        attrVal = attrVal.replace(regexScale, attrPortion);
			    }
			    else {
			        attrVal += attrPortion + (attrVal ? " " : "");
			    }
			    return inst.transform(attrVal);
			},
			
			push: function(item) {
			    var i = 0,
			        length = item.length;
			        
				if (item.type === 'set') {
					for (; i < length; i++) {
						inst.push(item[i]);
					}
				}
				else {
					group.appendChild(item.node);
					set.push(item);
				}
				return inst;
			},
			
			getBBox: function() {
				return set.getBBox();
			},
			
			// TODO: make this work with other style attr settings
			show: function() {
			    group.setAttribute("style", "");
			},
			
			hide: function() {
			    group.setAttribute("style", "display:none;");
			}
		};

		return inst;
	}

	return Group(cfg, items);

};


Raphael.el.addClass = function(className){
    var node = this.node,
        oldClassName = node.getAttribute("class"),
        newClassName = oldClassName ?
            oldClassName.replace(new RegExp("\\b" + className + "\\b|$"), " " + className) :
            className;
        
    node.setAttribute("class", newClassName);
    return this;
};


Raphael.el.removeClass = function(className){
    var node = this.node,
        oldClassName = node.getAttribute("class"),
        newClassName;
        
    if (oldClassName){
        newClassName = oldClassName.replace(new RegExp(" ?\\b" + className + "\\b"), "");
        node.setAttribute("class", newClassName);
    }
    
    return this;
};
