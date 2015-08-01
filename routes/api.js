var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;
var _ = require('underscore');

//api routes
module.exports = function(dbResource){
    //models
	var Tags = dbResource.model('Tags');
	var Comments = dbResource.model('Comments');
	var Users = dbResource.model('Users');
	var Posts = dbResource.model('Posts');

	router.use(function(req , res , next){
	   if(req.isAuthenticated()){
		  console.log('This User is authenticated'); 
		  return next();
	   }
	   else{
		   console.log('This is not auth ');
		   res.status(403).send({"error":{"msg":"invalid login credentials while in session"}});
	   }
   });

   router.param('id' , function(req , res , next , id){
	  req.id  = id;
	  return next();
   });
	
  /*********************************************************************************
   *********************************************************************************/
	router.route('/tags')
	   .post(function(req , res){
	   	    Tags.find({_id : ObjectId(req.body.id)}).toArray(function(err ,  result){
                if(err){
                    res.status(500).send(err);
                } else {
                   var tags = result[0].tags;
                   computeTags(tags);
                }
	   	    });

	   	    function computeTags(tags){
	   	       //this create an object containg a key value pair where the
	   	       //key is the name of the tag while the value  the count for  that tag
               var map = _.countBy(tags , function(item){
                     return item;
               });

               //This converts the object into an array of key value pairs and sorts
               //The array based on the the value of the count and limits it to the last
               //ten tags since the array is sorted in ascending order
               
               var topTenTags= _.sortBy( _.pairs(map) , function(item){
                     return item[1];
	   	    	} , 1).slice(-10);
                
                //This applys a map function to the array to extract the tag names
                //from the tags value pairs
	   	    	topTenTags = _.map(topTenTags , function(item){
                     return item = item[0];
	   	    	});

                res.send(topTenTags);
               
	   	    }
	   })
	   .put(function(req , res){
	   	   console.log(req.body);
	   	   Tags.update({_id : ObjectId(req.body.id)} , {
	   	   	   "$push" : {
                    "tags": {
                    	"$each": req.body.tags
                    }
	   	   	   }
	   	   } , function(err , result){
               if(err){
                  res.status(500).send(err);
               } else {
               	  res.status(200).send('update recieved on the server');
               }
	   	   });
           
	   });

	 /*********************************************************************************
	 *********************************************************************************/
     router.route('/user')
        .put(function(req , res){
        	//convert the _id to db compliant
        	req.body._id = ObjectId(req.body._id);
        	Users.update({_id : ObjectId(req.body._id)} , req.body , function(err , result){
                 if(err){
	                  res.status(500).send(err);
	               } else {
	               	  res.status(200).send('user updated on the server');
	               }
        	});
        });

	/*********************************************************************************
	 *********************************************************************************/
     router.route('/posts/:id')
        .post(function(req , res){
             Comments.insertOne({comments : []} , function(err , result){
                 if(err){
                     return res.status(500).send('Not ok');
                 } 
                 else {
                 	req.body.comments_id = result.ops[0]._id.toString();
                 	savePost(req.body);
                 }
             });
             
             function savePost(post){
             	Posts.insertOne(post , function(err , result){
                    if(err){
						res.status(500).send('Not ok post was not added 0');
					}
					else {
						addToFavourites(result.ops[0]);
			     	}
             	});
             }

             function addToFavourites(post){
                 Users.update(
                 	{"username":post.username} , 
                 	{
                 	  "$addToSet":{
                         "favourites":post._id.toString()
	                   }
	               } , 
	               function(err , result){
	                    if(err){
							res.status(500).send('Not ok post was not added 1');
						}
						else {
							res.status(200).send('new post added successfully');
						}
	               });
             }
        })
        
        .delete(function(req , res){
        	//@TODO delete post
        	 console.log(req.query);
             res.status(200).send('delete recieved in the server');
        });

     
	 /*********************************************************************************
	 *********************************************************************************/
	  router.route('/allPosts')
	     .post(function(req , res){
	     	  Posts.find({}).toArray(function(err , result){
                   if(err){
						res.status(500).send('Not ok post was not added 1');
					}
					else {
						res.status(200).send(result);
					}
	     	  });
	     });

    /*********************************************************************************
	 *********************************************************************************/

	
	return router;
};
