//jshint esversion:6
// level5 security with passport
const express = require("express");
const ejs = require("ejs");
const path = require("path");
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
});

userSchema.plugin(passportLocalMongoose);
//set up a mongoose model
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home")
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
            console.log(err);
            res.render("/register")
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

