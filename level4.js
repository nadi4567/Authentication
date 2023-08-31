//jshint esversion:6
// level4 security hashing salting with bcrypt
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");//Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js
const app = express();// instance of express app
app.set('view engine', 'ejs')// ejs
app.use(express.urlencoded({extended:true}));

// connect to mongodb server namely userDB database
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{
    useNewUrlParser: true,
    useUnifiedTopology: true 
})

//create a userSchema,js object
const userSchema = new mongoose.Schema({
   email:String, // value is type of value
   password:String,
});


//set up a mongoose model
const User = new mongoose.model("User",userSchema);

app.get("/",(req,res)=>{
    res.render("home")
});

app.get("/login",(req,res)=>{
    res.render('login')
});

app.get("/register",(req,res)=>{
    res.render("register")
});


// post to register route
app.post("/register",(req,res)=>{
    // create a new user based on userSchema and model
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email:req.body.username,
            password:hash
        });
        //let's save our brandnew user into our database
    
        newUser.save()
          .then(()=>{
            console.log(newUser.password)
            res.render("secrets")
          })
          .catch(err=>console.log(err)) // promises async
    
    });
    
});

// post to login route
app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
     .then((foundUser)=>{
        //if foundUser, compare our type ps and last typed ps
         bcrypt.compare(password, foundUser.password, function(err, result) {
            // if result of comparing ps is true,we send our secret
                if(result){
                    res.render("secrets")
                }
            });
        })
     .catch((err)=>{
        console.log(err.message);
        
     })
})

const port = 3000;
app.listen(port,()=>{
    console.log(`server listining on port ${port}`)
})

