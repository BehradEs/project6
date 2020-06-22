let mongoose = require('mongoose');
(Schema = mongoose.Schema), (passportLocalMongoose = require('passport-local-mongoose'));

const user = Schema({
  email: String,
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  Admin: Boolean,
});

user.plugin(passportLocalMongoose);

module.exports = mongoose.model('user', user, 'user');
