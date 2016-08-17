'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config');
var urljoin = require('url-join');

mongoose.connect(urljoin(config.get('MONGO_URL'),config.get('MONGO_DATABASE')));

var userSchema = new Schema({
  displayName: String,
  email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
  admin: {type:Boolean,default:false},
  location: String,
  created_at: Date,
  updated_at: Date
});

userSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});


var User = mongoose.model('User', userSchema);
module.exports = User;