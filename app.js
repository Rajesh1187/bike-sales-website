// app.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error(err));

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false })); // Body parser for form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)

// Express Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecret', // Use a strong secret in .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash Middleware
app.use(flash());

// Global Variables (for flash messages and user info)
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); // Used by Passport for login errors
    res.locals.user = req.user || null; // Pass logged-in user to all views
    next();
});
// ... inside app.js, after global variables middleware
// Routes
app.use('/', require('./routes/index')); // Create index.js in routes later
app.use('/users', require('./routes/users'));
app.use('/bikes', require('./routes/bikes')); // Will add later for bike operations
app.use('/admin', require('./routes/admin')); // Will add later for admin operation
app.use('/cart', require('./routes/cart')); // Will add later for cart operations

// Dashboard route (for logged-in users)
const { ensureAuthenticated } = require('./config/auth'); // Create this later
app.get('/dashboard', ensureAuthenticated, (req, res) =>
    res.render('dashboard', {
        name: req.user.name
    })
);


// Dummy User Model (will be replaced by actual Mongoose model)
const User = require('./models/User'); // Will create this later


// Passport Local Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return done(null, false, { message: 'That email is not registered' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Password incorrect' });
        }
        return done(null, user);
    } catch (err) {
        console.error(err);
        return done(err);
    }
}));

// Passport Serialize/Deserialize User
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Routes (will be separated into individual files)
app.get('/', (req, res) => {
    res.render('index', { title: 'Bike Sales Home' });
});

// Start Server
app.listen(PORT, console.log(`Server running on port ${PORT}`));
