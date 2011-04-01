// examples of use:
// tk = Tasketter();
// tk.addProject({key:'pA', title:'some project', width:200, height:150});
// task = tk.addTaskToProject({key:'tA', title='some task', width:100, height:50});
// /* to tether task by elastic to point in environment */
// task.addTether(200, 200);
// task.removeTether();
// /* to (un)fix in place */
// task.fix();
// /* to remove/replace use the 'active' boolean */
// task.active = true/false;
// /* For walls, use top, bottom, left and right to specify position and wallsFlag to turn on/off detection /*
// tk.right = 300;
// tk.top = 300;
// tk.wallsFlag = true;
// /* to set/animate task/project height and width: */
// task.setHeight(200);
// task.setWidth(200);


var BIG_NUMBER = 999999;

// Default box sizes
var PROJECT_WIDTH = 150;
var PROJECT_HEIGHT = 75;
var TASK_WIDTH = 100;
var TASK_HEIGHT = 50;

Tasketter = function(){
	//World.call(this);
	// dim gives bounds for random node placement
	this.dim = vec2.create([100,100]);
	this.v2null = vec2.create([0,0]);
	this.nodes = [];
	this.objects = this.nodes;
	this.nodeIJs = [];
	this.physics_dt = 0.5;
	this.MASS_DRAW_COEFF = 4;
	this.inScaleFac = 0.75;
	this.inCoulombK = 100.0;
	this.inBBRepulsion = 60.0;
	this.inWallRepulsion = 120.0;
	this.inHookeK = 0.25;
	this.inHookeEquilib = 60;
	this.inVelDampK = 0.1;
	this.runningTime = 0;
	this.nodesByKey = {};
	this.context = null;
	this.top = BIG_NUMBER;
	this.bottom = -BIG_NUMBER;
	this.left = -BIG_NUMBER;
	this.right = BIG_NUMBER;
	this.wallsFlag = true;
};

Tasketter.prototype = {
	init: function(){
		//this.context.lineWidth = 1;

		this.parseData(this.projData);
		this.randomizeNodes();
		// ProjectNode 0 is fixed and central
		this.nodes[0].makeCentralNode();
	},

	//mergeParams: function(base, add){
		//var params = {};
		//for(p in base){params[p] = base[p];}
		//for(p in add){params[p] = add[p];}
		//return params;
	//},
	reset: function(){
		this.nodes.length = 0;
		this.nodeIJs.length = 0;
	},

	addProject: function(params){
		this.nodes.length = 0;
		this.nodeIJs.length = 0;
		
		// add a project node - fixed by default (index will be 0)
		this.nodes.push(new ProjectNode(this, $.extend({x:0, y:0, dx:0, dy:0, width:PROJECT_WIDTH, height:PROJECT_HEIGHT},params)));
		this.nodeIJs.push({});
		this.nodes[0].fixed = true;
		return this.nodes[0];
	},


	addTask: function(params){
		task = new TaskNode(this, $.extend({x:0, y:0, dx:0, dy:0, width:TASK_WIDTH, height:TASK_HEIGHT}, params));
		this.nodes.push(task);
		this.nodeIJs.push({});
		return task;
	},

	addTaskToProject: function(params, pKey){
		if(typeof pKey === 'undefined'){
			pNode = this.nodes[0];
		}
		else{
			pNode = this.nodesByKey[pKey];
		}

		node = this.addTask(params);
		this.addLink({target:node.key, source:pNode.key, value:1});
		return node;
	},

	getTask: function(key){
		return this.nodesByKey[key];
	},

	hideTask: function(key){
		this.nodesByKey[key].active = false;
	},

	parseData: function(data){
		this.addProject(data);

		// add task nodes - indexed from 1 to t+1
		for(var i=0; i<data.tasks.length; i++){
			this.nodes.push(new TaskNode(this, $.extend({x:0, y:(i+1)*50, dx:0, dy:0}, data.tasks[i])));
			this.nodeIJs.push({});
		}

		// by default link all tasks to project - can be overridden in data-file
		if(typeof data.links === 'undefined'){
			data.links = [];
			for(i=0; i<data.tasks.length; i++){
				data.links.push({'source':data.key, 'target':data.tasks[i].key, 'value':1});
			}
		}

		for(i=0; i<data.links.length; i++){
			var l, h;
			l = data.links[i];
			this.addLink(l);
		}
	},

	// links specified by key
	addLink:  function(l){	
		target_i = this.nodes.indexOf(this.nodesByKey[l.target]);
		source_i = this.nodes.indexOf(this.nodesByKey[l.source]);
		this.nodes[target_i].links_to.push(new Link(this.nodes[source_i], l.value));
		this.nodes[source_i].links_from.push(new Link(this.nodes[target_i], l.value));
		if(target_i > source_i){
			h = target_i;
			l = source_i;
		}
		else{
			h = source_i;
			l = target_i;
		}
		nij = this.nodeIJs[l][h];
		if(nij){
			this.nodeIJs[l][h] +=1;
		}
		else{
			this.nodeIJs[l][h] = 1;
		}

	},

	randomizeNodes: function(){
		for(var i=0; i<this.nodes.length; i++){
			n = this.nodes[i];
			n.placeRandomly();
		}
	},

	deactivateNodes: function(){
		for(var i=0; i<this.nodes.length; i++){
			n = this.nodes[i];
			n.active = false;
			n.fixed = false;
		}
	},
			
	getProjBBox: function(){
		var bot_left = vec2.create([9999999,9999999]);
		var top_right = vec2.create([-9999999, -9999999]);

		for(var i=0; i<this.objects.length; i++){
			var n_i = this.nodes[i];
			bot_left[0] = Math.min(bot_left[0], n_i.p[0] - n_i.offw);
			bot_left[1] = Math.min(bot_left[1], n_i.p[1] - n_i.offh);
			top_right[0] = Math.max(top_right[0], n_i.p[0] + n_i.offw);
			top_right[1] = Math.max(top_right[1], n_i.p[1] + n_i.offh);
		}

		return [bot_left, top_right];
	},

	benchmark: function(t, dt){
		t0 = new Date().getTime();
		for(var i=0; i<t; i+=dt){
			this.updateCycle(dt);
		}

		console.debug(new Date().getTime() - t0 + 'ms');

		return;
	},

	updateCycle: function(dt){
		this.runningTime += dt;
		for(var i=0; i<this.nodes.length; i++){
			//this.nodes[i].f.setElements([0,0]);
			vec2.set(this.v2null, this.nodes[i].f);
		}

		for(i=0; i<this.nodes.length; i++){
			var p_i = this.nodes[i];
			if(p_i.active){
				for(var j=i+1; j<this.nodes.length; j++){
					var p_j = this.nodes[j];
					if(p_j.active){
						var r = vec2.subtract2(p_j.p, p_i.p, vec2.create([0,0]));
						// we add a small ammount to d to prevent division by 0
						var d = vec2.length(r) + 0.01;
						// First calculate Coulomb repulsion
						// var cf = p_j.m*p_i.m / Math.pow(d, 2);
						cf = -this.inCoulombK/d;
						// repulsion based on nodes' bounding boxes
						if(this.nodeBBIntersect(p_i, p_j)){
							cf -= this.inBBRepulsion;
						}
						// calculate Hooke using nodeIJ links
						nij = this.nodeIJs[i][j];
						var hf = 0;
						if(nij){
							hf = nij * (d - this.inHookeEquilib)*this.inHookeK;
						}
						var f = vec2.normalize(r);
						vec2.scale(f, cf+hf);

						vec2.add(p_i.f, f);
						vec2.subtract(p_j.f, f);
					}
				}
				// some nodes are tethered to a point in the environment
				if(p_i.tether){
					// apply elastic attraction from tether point
					var tr = vec2.subtract2(p_i.tether, p_i.p, vec2.create([0,0]));
					// we add a small ammount to d to prevent division by 0
					var td = vec2.length(tr) + 0.01;
					var thf = td * this.inHookeK;
					var tf = vec2.normalize(tr);
					vec2.scale(tf, thf);
					vec2.add(p_i.f, tf);
				}

				// bounding walls' repulsion
				if(this.wallsFlag){
					var px = p_i.p[0];
					var py = p_i.p[1];
					var w = p_i.offw;
					var h = p_i.offh;
					// t, b, l, r
					if(py + h > this.top){p_i.f[1] -= this.inWallRepulsion;}
					else if(py - h < this.bottom){p_i.f[1] += this.inWallRepulsion;}
					if(px + w > this.right){p_i.f[0] -= this.inWallRepulsion;}
					else if(px - w < this.left){p_i.f[0] += this.inWallRepulsion;}
				}

				if(!p_i.fixed){
					var dpdt = vec2.scale(p_i.dp, dt, vec2.create([0, 0]));
					vec2.add(p_i.p, dpdt);
					var fdt = vec2.scale(p_i.f, dt/p_i.m, vec2.create([0, 0]));
					vec2.add(p_i.dp, fdt);
					// Damp velocities
					vec2.scale(p_i.dp, this.inVelDampK);
				}

				//p_i.p = p_i.p.add(p_i.dp.x(dt));
				//p_i.dp = p_i.dp.add(p_i.f.x(dt/p_i.m));
			}
		}
	},

	nodeBBIntersect: function(n1, n2){
		//bool DoBoxesIntersect(Box a, Box b) {
		return (Math.abs(n1.p[0] - n2.p[0]) < (n1.offw + n2.offw)) &&
				(Math.abs(n1.p[1] - n2.p[1]) < (n1.offh + n2.offh));
		}


};

//core.extenWrapd(Tasketter, World);

TaskNode = function(world, params){
	//Thing.call(this, world, params);
	this.world = world;
	this.context = world.context;
	this.p = vec2.create([params.x, params.y]);
	this.dp = vec2.create([params.dx, params.dy]);
	this.f = vec2.create([0,0]);
	this.tether = null;
	this.m = 1;
	this.key = params.key;
	this.title = params.title;
	this.width = params.width;
	this.height = params.height;
	this.offw = this.width/2;
	this.offh = this.height/2;
	this.links_to = [];
	this.links_from = [];
	this.active = true;
	this.fixed = false;
	this.MIN_DRAW_SIZE = 14;
	// add node key to world's dictionary
	world.nodesByKey[this.key] = this;
};

TaskNode.prototype = {
	getPos: function(){
		return {'x':this.p[0], 'y':this.p[1]};
	},

	setHeight: function(h){
		this.height = h;
		this.offh = h/2;
	},

	setWidth: function(w){
		this.width = w;
		this.offw = w/2;
	},

	addTether: function(x, y){
		this.tether = vec2.create([x, y]);
	},

	removeTether: function(){
		this.tether = null;
	},

	placeRandomly: function(){
		this.dp[0] = 0;
		this.dp[1] = 0;
		this.p[0] = 2.0*(Math.random()-0.5)*this.world.dim[0];
		this.p[1] = 2.0*(Math.random()-0.5)*this.world.dim[1];
	}, 

	fix: function(){
		this.fixed = true;
	},

	unFix: function(){
		this.fixed = false;
	},

	makeCentralNode: function(){
		this.world.selectedObject = this;
		this.world.randomizeNodes();
		this.world.deactivateNodes();
		this.activateConnectedNodes();
		this.active = true;
		this.fixed = true;
		this.p[0] = 0;
		this.p[1] = 0;
	},

	activateConnectedNodes: function(){
		for(var i=0; i<this.links_from.length; i++){
			l = this.links_from[i];
			l.node.active = true;
		}

		for(i=0; i<this.links_to.length; i++){
			l = this.links_to[i];
			l.node.active = true;
		}
	},

	// Drawing methods redundant in headless tasket ---

	draw: function(){
		if(!this.active){return;}
		ctx = this.context;
		ctx.strokeStyle = '#f00';
		ctx.strokeRect(this.p[0] - this.offw, this.p[1] - this.offh, this.width, this.height);
		ctx.font         = 'bold 12px sans-serif';
		ctx.fillStyle    = '#fff';
		ctx.fillText(this.title, this.p[0], this.p[1]);
		if(this.tether){
			ctx.moveTo(this.p[0], this.p[1]);
			ctx.lineTo(this.tether[0], this.tether[1]);
			ctx.stroke();
		}
	},

	drawLinks: function(){
		if(!this.active){return;}
		ctx = this.context;
		ctx.beginPath();
		for(var i=0; i<this.links_to.length; i++){
			l = this.links_to[i];

			n = l.node;
			if(!n.active){continue;}
			ctx.moveTo(n.p[0], n.p[1]);
			ctx.lineTo(this.p[0], this.p[1]);
		}
		ctx.stroke();
	}

};

//core.extend(TaskNode, Thing);

ProjectNode = function(world, params){
	TaskNode.call(this, world, params);
};

ProjectNode.prototype = {
	draw: function(){
		if(!this.active){return;}
		ctx = this.context;
		ctx.strokeStyle = '#00f';
		ctx.strokeRect(this.p[0] - this.offw, this.p[1] - this.offh, this.width, this.height);
		ctx.font         = 'bold 12px sans-serif';
		ctx.fillStyle    = '#fff';
		ctx.fillText(this.title, this.p[0], this.p[1]);
	}
};

function mozextend(child, supertype){
	child.prototype.__proto__ = supertype.prototype;
	child.prototype._super = supertype;
}

mozextend(ProjectNode, TaskNode);

Link = function(node, value){
	this.node = node;
	this.value = value;
};

