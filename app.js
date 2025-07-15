const express=require('express')
const app=express()
const mysql=require('mysql2')
const bcrypt=require('bcrypt')
const session=require('express-session')
const path=require("path")
const PORT=3000;
app.set('view engine','ejs')
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
    database:"blog",
    cookie: {
        maxAge: 1000 * 60 * 60 * 24  // session lasts 1 day
    }
})
db.connect((err)=>{
    if(err) throw err
    console.log("database connected")
})
function isAuthenticated(req,res,next){
    if(req.session.userID){
        next();
    }else{
        res.redirect("/login");
    }

}
app.get("/",(req,res)=>{
    res.render("home")
})
app.get("/register",(req,res)=>{
    res.render("register")
})
app.post("/register",async(req,res)=>{
    const {name,email,password}=req.body;
    const hashedpassword= await bcrypt.hash(password,10);
    db.query('insert into users(name,email,password)values(?,?,?)',[name,email,hashedpassword],(err,result)=>{
        if(err){
            console.error(err);
        }else{
            return res.redirect("/login")
        }
    })
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    db.query('select *from users where email=?',[email],async(err,result)=>{
        if(err){
        console.error(err);
        res.send(err);
            
        }else{
            if(result.length==0){
                return res.send("NO RECORD FOUND");
            }else{
                const user=result[0];
                const isMatched=await bcrypt.compare(password,user.password);
                if(!isMatched){
                    return res.redirect("/login");
                }
                req.session.userID=user.id;
                return res.redirect("/dashboard")
            }
        }
    })

})
app.get("/dashboard",isAuthenticated,async(req,res)=>{
    const userid=req.session.userID;
    db.query("select * from users where id=?",[userid],async(err,result)=>{
        if(err){
            console.error(err);
            return res.send(err);
        }
            const user=result[0];

        
        
        db.query("select *from posts where user_id=?",[userid],async(err,posts)=>{
        if(err){
            console.error(err)
            return res.send(err)
        }else{
           
            return res.render("dashboard",{user,posts})
        }
    })
        

    })
    
})
app.get("/post/create",(req,res)=>{
    

    res.render("post");
})
app.post("/post/create",async(req,res)=>{
   
    const {title,content}=req.body;
    const userid=req.session.userID;
    db.query("select *from users where id=?",[userid],(err,result)=>{
        console.log(result[0]);
    })
    db.query("insert into posts(user_id,title,content)values(?,?,?)",[userid,title,content],(err,result)=>{
        if(err){
            console.error(err);
                return res.send("error")
        }else{
           return  res.redirect("/dashboard")
        }
    });


})
app.post("/post/delete",(req,res)=>{
    console.log(req.body)
    const postid= req.body.postid;
    console.log(postid)
    db.query("DELETE from posts where id=?",[postid],(err,result)=>{
        if(err){
            return res.send(err)
        }else{
            return res.redirect("/dashboard")
        }
    })
})
app.get("/post/edit/:id",isAuthenticated,(req,res)=>{
    const postid=req.params.id;
    const userid=req.session.userID;
    db.query("select * from posts where id=? and user_id=?",[postid,userid],(err,result)=>{
        if(err){
            console.error(err);
            return res.send(err);
        }else{
            const post=result[0];
            res.render("editpost",{post})
        }

    })

})
app.post("/post/update",isAuthenticated,(req,res)=>{
    const postid=req.body.postid;
    const userid=req.session.userID;
    const {title,content}=req.body;
    db.query("update posts set title=?,content=? where id=? and user_id=?",[title,content,postid,userid],(err,result)=>{
        if(err){
            console.error(err)
            return res.send("error updating the post")
        }else{
            res.redirect("/dashboard")
        }
    })
})
app.post("/logout",(req,res)=>{
    req.session.destroy((err)=>{
        return res.send(err)
    })
    res.redirect("/")
})
app.listen(PORT,(req,res)=>{
    console.log(`you are live at ${PORT}`)
})