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


// 1. Static files
app.use(express.static(path.join(__dirname, 'public')));

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Cookie parser
app.use(cookieParser());

// 4. Cache control
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
  next();
});


// 5. Session (MongoStore)
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// 6. Flash
app.use(flash());

// 7. SyncAuth
app.use(syncAuth);

// 8. Passport
app.use(passport.initialize());
app.use(passport.session());

// 9. settings 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// 10. Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);



// 11. 404 handler
app.use((req, res) => {
  res.status(404).render('errorpage');
});


// 12. Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errorpage', { error: err.message });
});



// 13 Initialize Magnific Popup
app.use('/magnific-popup', express.static(path.join(__dirname, 'node_modules/magnific-popup/dist')));


// Call the admin function to create the admin user during initialization

// adminController.admin()
//   .then(() => {
//     console.log('Admin user created during application initialization.');
//   })
//   .catch((error) => {
//     console.error('Error creating admin user during initialization:', error);
//   });

// Server
const PORT = process.env.PORT || 7001;

app.listen(PORT, () => {
  console.log(`✅ Server running at ${process.env.BASE_URL || "http://localhost:" + PORT}`);
});
