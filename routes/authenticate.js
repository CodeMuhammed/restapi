var express = require('express');
var router = express.Router();
module.exports = function(passport){
  
   router.get('/reason' , function(req , res){
	   console.log('reason called');
	   if(req.isAuthenticated()){
		   res.status(200).send(req.user);
	   } else {
		   res.status(401).send('invalid username or password');
	   }
   });
   
   router.post('/signup' ,  passport.authenticate('signup' , {
		successRedirect : '/auth/reason',
		failureRedirect : '/auth/reason'
    }));

	router.post('/login' ,  passport.authenticate('login' , {
		successRedirect : '/auth/reason',
		failureRedirect : '/auth/reason'
	}));
	

	router.get('/logout' , function(req, res){
		req.logout();
		res.status(200).send('Logged out successfully');
	});
	
	return router;
};
