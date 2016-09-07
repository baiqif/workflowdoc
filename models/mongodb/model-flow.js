'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config');
var urljoin = require('url-join');
var user = require("./model-users");
//var __ = require('underscore');
var logger = require('../../logs'); 

var flowconn = mongoose.createConnection(urljoin(config.get('MONGO_URL'),config.get('MONGO_DATABASE')));

var flowSchema = new Schema({
  flowid: { type: String, required: true, unique: true },
  title: String,
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  description:String,
  project: String,
  keywords:String,
  doc:String,
  is_public:{type:Boolean,default:true},
  activities:[{
    doc:String,
    who:String,
    updated_at:Date
  }],
  created_at: Date,
  updated_at: Date
});

flowSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});




// function upsertObject (src, dest) {
//   function recursiveFunc (src, dest) {
//     __.forEach(src, function (value, key) {
//       if(__.keys(value).length !== 0) {
//         dest[key] = dest[key] || {};
//         recursiveFunc(src[key], dest[key])
//       } else {
//         dest[key] = value;
//       }
//     });
//   }
//   recursiveFunc(src, dest);

//   return dest;
// }


var Flow = flowconn.model('Flow', flowSchema);
module.exports = Flow;