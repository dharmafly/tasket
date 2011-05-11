if(typeof tasket_data === 'undefined'){tasket_data = {};}

// !NOTE! both projects and tasks should have a key to retrieve positional info. 

tasket_data = {                                                                 
    "projects": {                                                               
        "title": 'A Set of Projects',                                           
        "projectA": {
          "key": 'projA',                                                     
          "title": 'A Very Important Project',                                
          "width": 150,
          "height":50,
          "description": 'This is a very important project, consisting of a variable number of tasks',
          "tasks": [
              {"key":"tA", "title":"taskA", "width":150, "height":50},        
              {"key":"tB", "title":"taskB", "width":150, "height":50},        
              {"key":"tC", "title":"taskC", "width":150, "height":50},        
              {"key":"tD", "title":"taskD", "width":150, "height":50},        
              {"key":"tE", "title":"taskE", "width":150, "height":50},        
              {"key":"tF", "title":"taskE", "width":150, "height":50},        
              {"key":"tG", "title":"taskE", "width":150, "height":50},        
              {"key":"tH", "title":"taskE", "width":150, "height":50},        
              {"key":"tI", "title":"taskE", "width":150, "height":50},        
              {"key":"tJ", "title":"taskE", "width":150, "height":50}
              ]
        }       
    }           
};
