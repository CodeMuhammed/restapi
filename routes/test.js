module.exports = function(app){
	//import controllers here
    var testCtrl = require('../app_server/controllers/testCtrl.js')(app);
	
	app.get('/fontNames' , testCtrl.getFontAwesome);
};