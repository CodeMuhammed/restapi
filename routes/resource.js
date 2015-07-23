module.exports = function(app , dbResource){
	//import resource controllers here
    var rCtrl = require('../app_server/controllers/resourceCtrl.js')(app , dbResource);
	
	//extracts parameters from the route
	app.param('userId' , function(req  , res  , next  , userId){
		req.userId  = userId;
		return next();
	});
	
	app.route('/beta')
       .get(rCtrl.get)
       .post(rCtrl.post);
};