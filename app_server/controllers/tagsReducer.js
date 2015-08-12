var ObjectId = require('mongodb').ObjectId;
var _ = require('underscore');

module.exports = function(dbResource){
	//models
	var Tags = dbResource.model('Tags');
    
    var topTags = function(tags , number , cb){
           //this create an object containg a key value pair where the
		   //key is the name of the tag while the value  the count for  that tag
	       var map = _.countBy(tags , function(item){
	             return item;
	       });

	       //This converts the object into an array of key value pairs and sorts
	       //The array based on the the value of the count and limits it to the last
	       //ten tags since the array is sorted in ascending order
	       
	       var top= _.sortBy( _.pairs(map) , function(item){
         	   return item[1];
    	   } , 1).slice(-number);

	        //This applys a map function to the array to extract the tag names
	        //from the tags value pairs
   	    	top = _.map(top , function(item){
               return item = item[0];
   	    	});
            
            console.log(top[0]);
   	    	return cb(top);
    };

    var getPopular = function(){
    	return function(req , res){
             Tags.find({} , {"_id":0}).toArray(function(err , result){
	              if(err){
	                   res.status(500).send(err);
	              }
	              else{
                       computeTags(result);
	              }
	    	});

            function computeTags(tagsCol){
            	//convert the array of objects that contains a tags key which is array into
            	//a flat array 
                tagsCol = _.pluck(tagsCol , 'tags');

            	var allTags = _.reduceRight(tagsCol , function(a , b){
            		 return a.concat(b);
            	} , []);
                
                //computes the top 50 tags and send the result in response
                topTags(allTags , 50 , function(result){
                     res.status(200).send(result);
                });   
            }
    	};
    };

	return {
		getPopular : getPopular,
		topTags : topTags
	}
}