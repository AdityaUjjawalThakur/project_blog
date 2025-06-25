const express=require('express')
const app=express()
const mysql=require('mysql2')
const bcrypt=require('bcrypt')
const session=require('express-session')
const path=require("path")
app.set('view-engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.urlencoded({extended:false}))
app.use(session(
    {
    secret: 'blog_secret_key',
    resave: false,
    saveUninitialized: false
    }
))
const db=mysql.createConnection({
    host:'localhost',
    user:"root",
    password:"4nm21cs007",
    database:"blog"
})
db.connect((err)=>{
    if(err) throw err
    console.log("database connected")
})
app.get("/register",(req,res)=>{
    res.render("register")
})
app.post("/register",async(req,res)=>{
    const {name,email,password}=req.body;
    const hashedpassword= await bcrypt.hash(paassword,10);
    db.query('insert into users')
})