require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const userRouter = require('./routers/user');
const adminRouter = require('./routers/admin');
const User = require('./models/userSchema');
const session = require('express-session');
const db = require('./config/db');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('./config/passport')(passport);
const MongoStore = require('connect-mongo');
const adminController = require('./controllers/adminController');
const syncAuth = require('./middlewares/syncAuth');
const blockCheck = require('./middlewares/blockCheck');

app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cookieParser());


app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
  next();
});


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));


app.use(flash());


app.use(passport.initialize());
app.use(passport.session());


app.use(syncAuth);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use('/admin', adminRouter);    
app.use('/', blockCheck, userRouter);


app.use((req, res) => {
  res.status(404).render('errorpage');
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errorpage', { error: err.message });
});


app.use('/magnific-popup', express.static(path.join(__dirname, 'node_modules/magnific-popup/dist')));


// Call the admin function to create the admin user during initialization

// adminController.admin()
//   .then(() => {
//     console.log('Admin user created during application initialization.');
//   })
//   .catch((error) => {
//     console.error('Error creating admin user during initialization:', error);
//   });


const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`✅ Server running at ${process.env.BASE_URL || "http://localhost:" + PORT}`);
});
