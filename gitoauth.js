//jshint esversion:6
// level5 security with passport
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const path = require("path");
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
//for github authentication
const GitHubStrategy = require('passport-github').Strategy;
// findORCreate package
const findOrCreate = require('mongoose-findorcreate');
//for google authentication  
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const mongoose = require("mongoose");//Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js
const app = express();// instance of express app
app.set('view engine', 'ejs')// ejs
app.use(express.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname, 'public')));
// let's add session middleware
app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized: false
}));
//let's add middle ware to initialize passport and session
// they are middlware function provided by passport js library
app.use(passport.initialize());
app.use(passport.session());

// connect to mongodb server namely userDB database
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{
    useNewUrlParser: true,
    useUnifiedTopology: true 
});

//create a userSchema,js object
const userSchema = new mongoose.Schema({
   email:String, // value is type of value
   password:String,
   githubId:String,
   googleId:String
});

// add plugin to enhance Schema functionality
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//set up a mongoose model
const User = new mongoose.model("User",userSchema);

// to authenticate with local strategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null,  { id: user.id, username: user.username, name: user.name });
    });
  });
 
  // authenticate with githubstarategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret:process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ githubId: profile.id ,username:profile.username}, function (err, user) {
      return cb(err, user);
    });
  }
));

// authenticate with googleStrategy
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
 // userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    //findorcreate keep data into database that specified 
  User.findOrCreate({ googleId: profile.id, username:profile.displayName}, function (err, user) {
    return cb(err, user);
  });
}
));



app.get("/",(req,res)=>{
    res.render("home")
});
// sign with github
app.get('/auth/github',
  passport.authenticate('github')
  );
  app.get('/auth/github/secrets', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});
// sign with google
app.get('/auth/google',
passport.authenticate('google', { scope: ['profile'] })
);
app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

app.get("/login",(req,res)=>{
    res.render('login')
});

app.get("/register",(req,res)=>{
    res.render("register")
});
app.get("/secrets",(req,res)=>{
    if (req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});
app.get("/logout",(req,res,next)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})

// post to register route
app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err.message);
            
            res.render("login")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    });


});

// post to login route
app.post("/login",(req,res)=>{
   const user = new User({
    username:req.body.username,
    password:req.body.password
   });
   req.login(user,function(err){
    if(err){
        console.log(err)
    }else{
        passport.authenticate("local",{
            failureRedirect: '/login',
            failureMessage: true
        })(req,res,function(){
            res.redirect("/secrets");
        })
    }
   })
})

const port = 3000;
app.listen(port,()=>{
    console.log(`server listining on port ${port}`)
})

