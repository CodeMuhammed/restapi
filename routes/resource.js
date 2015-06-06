module.exports = function(app){
	//import resource controllers here
    var rCtrl = require('../app_server/controllers/resourceCtrl.js')(app);
	
	//extracts parameters from the route
	app.param('userId' , function(req  , res  , next  , userId){
		req.userId  = userId;
		return next();
	});
	
	app.route('/users/:userId')
       .get(rCtrl.get)
       .put(rCtrl.put)
       .post(rCtrl.post)
       .delete(rCtrl.remove);
};