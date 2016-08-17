var config = require('../config');
// module.exports = {
//     getModel:function() {
//         return require('./model-' + config.get('DATA_BACKEND'));
//     }
// }

module.exports = {
    getModel:function(collection) {
        return require('./' + config.get('DATA_BACKEND')+'/model-'+collection);
    }
}