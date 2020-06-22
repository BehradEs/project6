const passport = require('passport');

const router = require('express').Router();
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const locationModel = require('./models/location');
const user = require('./models/user');
const rating = require('./models/rate');
const comments = require('./models/comments');

mongoose.connect('mongodb://localhost/project6', { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
  if (err) {
    console.log(
      'Could not connect to mongodb on localhost. Ensure that you have mongodb running on localhost and mongodb accepts connections on standard ports!'
    );
  } else {
    console.log('connected');
  }
});
let db = mongoose.connection;
//#############################################################################################################//
//*********************************************************************************************************** */
//#############################################################################################################//
//**************************************USER ***************************************************** */
//#############################################################################################################//
router.get('/', function (req, res) {
  res.render('index', { user: req.user });
});

router.get('/register', function (req, res) {
  res.render('register', {});
});

router.post('/register', function (req, res, next) {
  user.register(
    new user({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.email,
      Admin: false,
    }),
    req.body.password,
    (err) => {
      if (err) {
        console.log('error while user register!', err);
        return next(err);
      }
      console.log('user registered!');
      res.redirect('/');
    }
  );
});

router.get('/login', function (req, res) {
  res.render('login', { user: req.user, message: req.flash('error') });
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function (req, res) {
  res.redirect('/');
});

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/login');
});
//#############################################################################################################//
//*********************************************************************************************************** */
//#############################################################################################################//
//**************************************location ***************************************************** */
//#############################################################################################################//
const FILE_PAth = 'public/uploads';

const upload = multer({
  dest: `${FILE_PAth}/`,
});

router.get('/location', (req, res) => {
  res.render('location', { user: req.user, message: req.flash('error') });
  console.log('user id is :', req.user._id);
});

router.post('/location', upload.single('photo'), (req, res) => {
  const photo = req.file;
  const img = fs.readFileSync(req.file.path);
  const encode_image = img.toString('base64');
  // Define a JSONobject for the image attributes for saving to database
  // var user = {
  //   locationName: req.body.locationName,
  //   description: req.body.Description,
  // };
  // console.log(req.body);

  const finalImg = new locationModel({
    locationName: req.body.locationName,
    description: req.body.description,
    username: req.user.username,
    image: { filename: req.file.filename, data: new Buffer(encode_image, 'base64'), contentType: req.file.mimetype },
    Approved: false,
  });

  db.collection('location').insertOne(finalImg, (err, result) => {
    if (err) return console.log(err);

    console.log('saved to database');
    res.redirect('/review');
  });
});

router.get('/review', (req, res) => {
  return locationModel.find({ Approved: true }).then((reviews) => {
    res.render('review', {
      user: req.user,
      reviews,
    });
  });
});

//#######################################EACH LOcation ###################################

const commentsDB = async (location_id) => {
  let comment = comments.find({ location_id: mongoose.Types.ObjectId(location_id) }, {}, { sort: { updatedAt: 'desc' } });
  return comment;
};

router.get('/each/:id', async (req, res) => {
  let { id } = req.params;

  let thumbclass = 0;
  const comment = await commentsDB(id);
  let totalRated = await rating
    .find({ location_id: mongoose.Types.ObjectId(id), rate: 1 })
    .countDocuments()
    .exec()
    .then(function (docs) {
      return docs;
    })
    .catch(function (err) {
      throw err;
    });

  if (req.user) {
    let rated = await rating.find(
      {
        // find if user has already rated
        location_id: mongoose.Types.ObjectId(id),
        user_id: mongoose.Types.ObjectId(req.user._id),
      },
      {
        rate: 1,
        _id: 0,
      }
    );

    if (rated.length > 0 && rated[0].rate > 0) thumbclass = rated.length;
  }

  return locationModel.find({ _id: id }).then((eachlocation) => {
    res.render('each', {
      user: req.user,
      eachlocation,
      totalRated,
      thumbclass,
      comment,
    });
  });
});

//##############################################################//
//###########################Rating##############################//
//##############################################################//
router.post('/rating', async (req, res, next) => {
  try {
    const { userId, locationId, thumbId } = req.body;
    if (userId != null) {
      await rating.findOneAndUpdate(
        {
          location_id: mongoose.Types.ObjectId(locationId),
          user_id: mongoose.Types.ObjectId(userId),
        },
        {
          $set: { rate: thumbId },
        },
        {
          upsert: true,
        }
      );
      console.log('rate submitted');
      window.each.reload();
    } else {
      window.each.reload();
      console.log('user null');
    }
  } catch (error) {
    res.render('login', { error });
  }
});

//##############################################################//
//###########################Comment ##############################//
//##############################################################//

router.post('/comments', async (req, res) => {
  try {
    const { user, locationId, comment } = req.body;
    // user is returned as a string. Need to convert back to object
    let userObj = user
      .replace('{\r\n', '')
      .replace('\r\n}', '')
      .replace(/'/g, '')
      .split(',')
      .map((x) => x.split(':').map((y) => y.trim()))
      .reduce((a, x) => {
        // eslint-disable-next-line prefer-destructuring
        a[x[0]] = x[1];
        return a;
      }, {});

    if (user != null) {
      await comments.create({
        location_id: mongoose.Types.ObjectId(locationId),
        user_id: mongoose.Types.ObjectId(user._id),
        firstname: userObj.firstname,
        comment,
      });
      res.redirect('back');
      // window.location.reload()
    } else {
      // window.location.reload()
    }
  } catch (error) {
    res.render('login', { error });
  }
});
//##############################################################//
// router.post('/rating', async (req, res) => {
//   try {
//     const { userId, locationId, rate } = req.body;
//     console.log(req.body);

//     // const rateDetails = rating({
//     //   location_id: req.body.locationID,
//     //   user_id: req.body.user_id,
//     //   rate: req.body.thumbId,

//     //   // location_id: req.body.locationID,
//     //   // user_id: req.user._id,
//     //   // rate: req.body.rate,
//     // });
//     console.log(location_id);
//     console.log(user_id);
//   } catch (err) {
//     res.render('each', { err });
//   }

//   // db.collection('rate').insertOne(rateDetails, (err, res) => {
//   //   if (err) throw err;
//   //   console.log('your rate has been submited');
//   //   console.log(user_id);
//   // });
// });

// router.post('rating', (req, res) => {
//   let user_id = req.body.userId;
//   let location_id = req.body.locationID;
//   let rate = req.body.thumbId;
//   rating.findByIdAndUpdate(
//     { _id: req.body.locationID },
//     {
//       user_id,
//       location_id,
//       rate,
//     },
//     (err, rep) => {
//       if (err) {
//         throw err;
//       } else {
//         console.log(rep);
//       }
//     }
//   );
//   res.redirect('/each');
// });

//######################################### Admin Page ##################################
router.get('/admin', (req, res) => {
  let location = req.params;
  return locationModel.find({ Approved: false }).then((admin) => {
    res.render('admin', {
      user: req.user,
      admin,
    });
    console.log(location);
  });
});

router.get('/test/:id', (req, res) => {
  let location = req.params;
  return locationModel.find({ Approved: false }).then((test) => {
    res.render('test', {
      user: req.user,
      test,
      location,
    });
  });
});

router.post('/test', (req, res) => {
  let Approved = 'true';
  locationModel.findByIdAndUpdate({ _id: req.body.locationID }, { Approved }, (err, rep) => {
    if (err) {
      throw err;
    } else {
      console.log(rep);
      console.log('updated');
    }
  });
  res.redirect('/admin');
});
// router.post('/admin', (req, res) => {
//   let locations = req.body.locationIDs;
//   Approved = 'true';

//   locationModel.findByIdAndUpdate({ _id: req.locationModel._id }, { Approved }, (err, rep) => {
//     if (err) {
//       throw err;
//     } else {
//       console.log(rep);
//     }
//   });
//   res.redirect('/');
// });
//##########################################################//

router.get('/update/:id', (req, res) => {
  res.render('update', { user: req.user });
});

router.post('/update', (req, res) => {
  console.log('updatibg user');

  let trimstr = (str) => String(str).trim();
  let email = req.body.email;
  let { firstname } = req.body;
  let { lastname } = req.body;
  let { password } = req.body;
  let { confirmPassword } = req.body;

  console.log(req.body);

  if (!firstname || !lastname || !password || !email) throw createError(400, 'all fields are required');
  firstname = trimstr(firstname);
  lastname = trimstr(lastname);
  email = trimstr(email);

  if (password !== confirmPassword) throw createError(400, 'password  do not match');

  user.findByIdAndUpdate(
    { _id: req.user._id },
    {
      email,
      firstname,
      lastname,
      password,
    },
    (err, rep) => {
      if (err) {
        throw err;
      } else {
        console.log(rep);
      }
    }
  );
  user.findByIdAndUpdate(req.user._id).then(
    (sanitizedUser) => {
      if (sanitizedUser) {
        sanitizedUser.setPassword(password, () => {
          sanitizedUser.save();
          res.status(200).json({ message: 'password reset successful' });
        });
      } else {
        res.status(500).json({ message: 'This user does not exist' });
      }
    },
    (err) => {
      console.error(err);
    }
  );

  res.redirect('/');
});
module.exports = router;
