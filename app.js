//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const encrypt = require("mongoose-encryption");// for database encryption

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

//let's encrypt our database
const secret = process.env.SECRET;
userSchema.plugin(encrypt,{secret:secret, encryptedFields:['password']});
// besure to use plugin first befor set up model cuz we need to encrypt before model

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
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });
    //let's save our brandnew user into our database

    newUser.save()
      .then(()=>{
        res.render("secrets")
      })
      .catch(err=>console.log(err)) // promises async

});

// post to login route
app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
     .then((foundUser)=>{
         if(foundUser.password === password){
            res.render("secrets")
         }
         console.log(password)
     })
     .catch((err)=>{
        console.log(err.message);
        
     })
})

const port = 3000;
app.listen(port,()=>{
    console.log(`server listining on port ${port}`)
})

