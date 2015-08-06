var express = require('express');
var router = express.Router();
module.exports = function(passport){

	//A catch all logic for this route
   router.use(function(req , res , next){
   	  if(req.path === '/logout'){
         next();
   	  }
   	 else if(req.isAuthenticated()){

		    res.status(200).send(req.user);
	   }
     
     else{
         next();
   	  }	 
   });


   var status = function(req , res , next){
       if(req.isAuthenticated()){
		      res.status(200).send(req.user);
	     } 

	    else {
		     res.status(401).send('invalid username or password');
	     }
   };

  
   router.post('/signup' , passport.authenticate('signup') , function(req , res){
        status(req , res);
   });

   router.post('/signin' , passport.authenticate('login') , function(req , res){
        status(req , res);
   });
  
	router.get('/logout' , function(req, res){
		console.log('logout called');
		req.logout();
		res.status(200).send('Logged out successfully');
	});

	return router; 
};
