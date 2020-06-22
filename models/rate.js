let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const rate = new Schema({
  location_id: { type: Schema.Types.ObjectId, ref: 'location' },
  user_id: { type: Schema.Types.ObjectId, ref: 'user' },
  rate: Number,
});

module.exports = mongoose.model('rate', rate, 'rate');
