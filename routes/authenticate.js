var express = require('express');
var router = express.Router();
module.exports = function(passport){
  
   router.get('/signinResult' , function(req , res){
	   if(!req.isAuthenticated()){
		   res.status(401).send('invalid username or password');
	   } else {
		   res.send(req.user);
	   }
   });
   
   router.get('/signupResult' , function(req , res){
	   if(!req.isAuthenticated()){
		   res.status(401).send('User details not valid');
	   } else {
		   res.send(req.user);
	   }
   });
   
   router.post('/signup' ,  passport.authenticate('signup' , {
		successRedirect : '/auth/signupResult',
		failureRedirect : '/auth/signupResult'
    }));

	router.post('/login' ,  passport.authenticate('login' , {
		successRedirect : '/auth/signinResult',
		failureRedirect : '/auth/signinResult'
	}));
	

	router.get('/logout' , function(req, res){
		req.logout();
		res.status(200).send('Logged out successfully');
	});
	
	return router;
};
