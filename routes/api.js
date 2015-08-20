var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;
var _ = require('underscore');

//api routes
module.exports = function(dbResource , tagsReducer , emailClient){
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
     .get(tagsReducer.getPopular())

	   .post(function(req , res){
	   	    Tags.find({_id : ObjectId(req.body.id)}).toArray(function(err ,  result){
                if(err){
                    res.status(500).send(err);
                } else {
                   computeTags(result[0].tags);
                }
	   	    });

	   	    function computeTags(tags){
	   	        tagsReducer.topTags(tags , 10 , function(result){
                   res.status(200).send(result);
              });   
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
               	  res.status(200).send('tags updated');
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
                  else if(result[0] == undefined){
                     return res.status(500).send('preview Not ok 1');
                  }
                  else {
                    if(req.query.p == '1'){
                        console.log('external linked');
                        recordView(result[0]);
                    }
                    else{
                       console.log('in linked');
                       res.status(200).send(result[0]);
                    }
                    
                  }
             });

             function recordView(result){
                 Users.update({"username":result.username} , {
                    "$inc":{
                       "pageViews":1
                    },
                    "$set":{
                        "lastViewed": Date.now()
                    }
                 } , 
                 function(err , status){
                      if(err){
                         res.status(500).send('preview not ok 2');
                      }
                     else{
                         incrementPostView(result);
                      }
                 });
                 
             }

             function incrementPostView(result){
                  Posts.update({"_id":ObjectId(req.id)} , {"$inc":{"views":1}} , function(err , status){
                      if(err){
                         res.status(500).send('preview not ok 3');
                      }
                     else{
                          res.status(200).send(result);
                      }
                  })
             }
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
           Posts.find({}).toArray(
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
   router.route('/authorPosts/:username')
       .get(function(req , res){
             Posts.find({"username":req.params.username}).sort({'date':-1}).limit(5).toArray(function(err , result){
               if(err){
                  res.status(500).send('Not ok authorPosts get');
                }
                else {
                  res.status(200).send(result);
                }
              });
       });

  /*********************************************************************************
   *********************************************************************************/
   router.route('/sendEmail')
      .post(function(req , res){
            emailClient.test(function(err , status){
                 if(err){
                      console.log(err);
                      res.status(500).send('Email not sent at this time');
                 }
                 else {
                     console.log(status);
                     res.status(200).send('email sent ok on the server');
                 }
                
            });
      });
   /*********************************************************************************
   *********************************************************************************/
	return router;
};
