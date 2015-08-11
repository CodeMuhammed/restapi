var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;
var _ = require('underscore');

//api routes
module.exports = function(dbResource , tagsReducer){
    //models
	var Tags = dbResource.model('Tags');
	var Comments = dbResource.model('Comments');
	var Users = dbResource.model('Users');
	var Posts = dbResource.model('Posts');

	router.use(function(req , res , next){
	   
     if(req.method==='GET'){
        return next();
     }
     else if(req.isAuthenticated()){
      console.log('This User is authenticated here'); 
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
     .get(function(req , res){
          res.status(200).send(tagsReducer.getPopular());
     })

	   .post(function(req , res){
	   	    Tags.find({_id : ObjectId(req.body.id)}).toArray(function(err ,  result){
                if(err){
                    res.status(500).send(err);
                } else {
                   computeTags(result[0].tags);
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
               	  res.status(200).send('tags update recieved on the server');
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
       .get(function(req , res){
             Posts.find({"_id":ObjectId(req.id)}).toArray(function(err , result){
                  if(err){
                     return res.status(500).send('preview Not ok');
                  }
                  else {
                    res.status(200).send(result);
                  }
             });
        })
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
          							res.status(200).send(post);
          						}
	               });
             }
        })
        
        .put(function(req , res){
             req.body._id = ObjectId(req.body._id);
             Posts.update(
                {_id : req.body._id},
                req.body,
                function(err , result){
                    if(err){
                        console.log(err);
                        res.status(500).send('Not ok post was not updated');
                    }
                    else {
                       res.status(200).send('update post recieved on the server');
                    }
                }
             );
             
        })

        .delete(function(req , res){
        	//@TODO delete post
        	var query = req.query;
        	Comments.remove({_id : ObjectId(query.comments_id)} , function(err , result){
                 if(err){
                     res.status(500).send('Not ok comment was not removed');
                 }
                 else{
                     removePost(query._id);
                 }
        	});
        	
        	function removePost(post_id){
                 Posts.remove({_id : ObjectId(post_id)} , function(err , result){
	                 if(err){
	                     res.status(500).send('Not ok post was not removed');
	                 }
	                 else{
	                 	 removeRef(post_id);
	                 }
	        	});
        	};

        	function removeRef(post_id){
                 Users.update({username : query.username} , 
                 	  {
                 	  	 "$pull":{
                             "favourites":post_id
                 	  	 }
                 	  },
                 	  function(err ,  reesult){
                          if(err){
                              res.status(500).send('post ref was not removed');
                          }
                          else{
                              res.status(200).send('post deleted successfully');
                          }
                 	  }
                 );
        	}; 

        });

     
	 /*********************************************************************************
	 *********************************************************************************/
  router.route('/comments/:id')
     .get(function(req , res){
          Comments.find({"_id":ObjectId(req.id)}).toArray(function(err , result){
              if(err){
                 res.status(500).send('Not ok get comment');
              }
              else{
                res.status(200).send(result);
              }
          });
          
     })

     .post(function(req , res){
          Comments.update({"_id":ObjectId(req.id)} , 
            {
               "$addToSet":{
                     "comments":req.body
               }
            } ,
             function(err , result){
                 if(err){
                     res.status(500).send('not ok new comment');
                 }
                 else{
                     res.status(200).send('comment post success');
                 }
            })
          
     })

     .put(function(req , res){
           Comments.update({
              "_id":ObjectId(req.id),
              "comments.date": req.body.date*1
            } , 
          {
            "$set": {
                "comments.$" : req.body
            }
          }, function(err , result){
              if(err){
                   console.log(err);
                   res.status(500).send('not ok update comment');
               }
               else{
                   res.status(200).send('comment updated successfully');
               }
          });
     })

     .delete(function(req , res){
          Comments.update({
              "_id":ObjectId(req.id),
              "comments.date": req.query.date*1
            } , 
          {
            "$unset": {
                "comments.$" : 1
            }
          },
          function(err , result){
              if(err){
                   console.log(err);
                   res.status(500).send('not ok delete comment 1');
               }
               else{
                  removeNull();
               }
          });

          function removeNull(){
               Comments.update({
                  "_id":ObjectId(req.id)
                } , 
              {
                "$pull": {
                    "comments" : null
                }
              },
              function(err , result){
                  if(err){
                       console.log(err);
                       res.status(500).send('not ok delete comment 2');
                   }
                   else{
                      res.status(200).send('comment deletted successfully');
                   }
              });
          }
     });
  /*********************************************************************************
   *********************************************************************************/
	  router.route('/allPosts')
       .get(function(req , res){
           Posts.find({} , {_id : 1}).toArray(
           function(err , result){
            if(err){
              res.status(500).send('Not ok all posts');
            }
            else {
              res.status(200).send(result);
            }
          });
       })

	     .post(function(req , res){
          console.log(req.body);
          var query;
          if(req.body.length == 1 &&  req.body[0] == 'general'){
              query  = {};
          }
          else{
              query = {
                  "tags":{"$in":req.body}
              };
          }
	     	  Posts.find(query).sort({'date':-1}).limit(1000).toArray(
           function(err , result){
            if(err){
  						res.status(500).send('Not ok all posts');
  					}
  					else {
  						res.status(200).send(result);
  					}
	     	  });
	     });

  /*********************************************************************************
	 *********************************************************************************/
     router.route('/allFavourites')
	     .post(function(req , res){
	     	  //convert ids into objecctids
	     	  req.body = _.map( req.body , function(item){
	     	  	  if(item.length>12){
                  return item = ObjectId(item);
	     	  	  } 
	     	  });

	     	  Posts.find({"_id":{"$in":req.body}}).sort({'date':-1}).limit(1000).toArray(function(err , result){
           if(err){
  						res.status(500).send('Not ok all favourites');
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
