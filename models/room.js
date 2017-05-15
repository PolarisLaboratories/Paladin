var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Room = new Schema({
    name: String,
    x: Number,
    y: Number
});

module.exports = mongoose.model('Room', Room);
