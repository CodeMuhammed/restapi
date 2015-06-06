/*test route implementations*/
var path = require('path');
var fs = require('fs');


/********************PRIVATE FUNCTIONS****************/
var parseFonts = function(file , resultType , callback){
	var lb;
	var ub;
	var fonts = [];
	for(var i=0; i<file.length; i++){
		if(file.charAt(i)==='@'){
			lb=i;
		}
		if(file.charAt(i)===';'){
			ub=i;
			fonts.push(parseFont(file.substr(lb , ub-lb+1)));
		}
	}
	callback(fonts);
};

var parseFont = function(fontStr){
	fontStr = fontStr.substr('@fa-var-'.length , fontStr.indexOf(':')-'@fa-var-'.length);
	return fontStr;
};
/****************************************************/

var getFontAwesome = function(req , res){
	var file = fs.readFileSync(path.join('public' , 'json' , 'font-awesome.json')).toString();
	parseFonts(file , 'array' , function(fonts){
		res.status(200).send(fonts);
	});
}

module.exports = function(app){
	return {
		getFontAwesome :getFontAwesome
	};
};