var ObjectId = require('mongodb').ObjectId;

module.exports = function(dbResource){
	//models
	var Tags = dbResource.model('Tags');
    
    var getPopular = function(){
    	return ['general' , 'tech' , 'startup' , 'arts' , 'FTR']
    };

	return {
		getPopular : getPopular
	}
}