if(typeof tasket_data === 'undefined'){tasket_data = {};}

// !NOTE! both projects and tasks should have a key to retrieve positional info. 

tasket_data = {
	"projects": {
		"title": 'A Set of Projects',
		"projectA": {
			"key": 'projA',
			"title": 'A Very Important Project', 
			"width": 150,
			"height":100,
			"description": 'This is a very important project, consisting of a variable number of tasks',
			"tasks": [
				{"key":"tA", "title":"taskA", "width":100, "height":80},
				{"key":"tB", "title":"taskB", "width":100, "height":50},
				{"key":"tC", "title":"taskC", "width":100, "height":80},
				{"key":"tD", "title":"taskD", "width":100, "height":20},
				{"key":"tE", "title":"taskE", "width":100, "height":20}
				]
		}
	}
};




