let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const location = new Schema({
  locationName: String,
  description: { type: String, required: true },
  image: { filename: String, data: Buffer, contentType: String },
  username: String,
  Approved: Boolean,
});

module.exports = mongoose.model('location', location, 'location');
