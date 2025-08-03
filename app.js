require('dotenv').config();
const express=require('express')
const app=express()
const mysql=require('mysql2')
const bcrypt=require('bcrypt')
const session=require('express-session')
const path=require("path")
const PORT=process.env.PORT||3000;
const multer=require("multer")
const { CloudinaryStorage } = require('multer-storage-cloudinary');


const cloudinary=require("./config/cloudinary")
const { json } = require('stream/consumers')
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.urlencoded({extended:false}))
app.use(express.static("public"))
app.use(session(
    {
    secret: 'blog_secret_key',
    resave: false,
    saveUninitialized: false
    }
))
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password:"4nm21cs007",
  database:"blog",
  
});
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
//middleware to check if user is Admin
function isAdmin(req,res,next){
    if(req.session && req.session.isAdmin){
        next();
    }else{
         return res.status(403).send("Admin Only")

    }
   

}
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
 params: async (req, file) => {
  console.log("📦 File Received by Multer:", file.originalname);
  return {
    folder: "blog_images",
    public_id: file.originalname.split('.')[0],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };
  },
});

const upload=multer({storage})
app.get("/",(req,res)=>{
    res.render("landing")
})


app.get("/home",(req,res)=>{
    const query="select posts.*,users.name as Author from posts join users on posts.user_id =users.id order by posts.created_at desc "
   db.query(query,(err,result)=>{
     if(err){
        console.error(err);
        return res.send("error loading the posts")
     }
       res.render("home",{session:req.session,posts:result})
   })
    
})
app.get("/register",(req,res)=>{
    res.render("register",{session})
})
app.post("/register",upload.single("profile"),async(req,res)=>{
     const { name, email, password } = req.body;
    const hashedpassword = await bcrypt.hash(password, 10);
    try{

    const profileimagurl = req.file?.path || null;
    console.log("Uploaded image URL:", profileimagurl);

    db.query('insert into users(name,email,password,profile_img)values(?,?,?,?)',[name,email,hashedpassword,profileimagurl],(err,result)=>{
        if(err){
            console.error("DB Error:", err);
          return res.status(500).send(err.message);
        }else{
            return res.redirect("/login")
        }
    })
}catch(err){
    console.error("Upload failed:", err);
    return res.status(500).send("Image upload failed");
}
})
// app.post("/register", upload.single("profile"), async (req, res) => {
//   try {
//      console.log("====== Incoming Form Data ======");
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file); // Will be undefined if multer fails
//     console.log("================================");
//     const { name, email, password } = req.body;

//     // Basic validation
//     if (!name || !email || !password) {
//       return res.status(400).send("Please fill in all required fields.");
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Extract image URL from Cloudinary response
//     let profileImageUrl = null;
//     if (req.file) {
//       console.log("Uploaded File Details:", req.file);
//       profileImageUrl = req.file.path || req.file.url || null;
//     } else {
//       console.log("No profile image uploaded.");
//     }

//     // Insert user data into MySQL
//     const query = "INSERT INTO users (name, email, password, profile_img) VALUES (?, ?, ?, ?)";
//     const values = [name, email, hashedPassword, profileImageUrl];

//     db.query(query, values, (err, result) => {
//       if (err) {
//         console.error("Full DB Error Object:", err);
//         return res.status(500).send(
//           `Registration failed: ${err.sqlMessage || err.message || JSON.stringify(err)}`
//         );
//       }

//       console.log("User registered successfully:", result);
//       return res.redirect("/login");
//     });
//   } catch (error) {
//     console.error("Unexpected Error:", error);
//     return res.status(500).send(
//       `Unexpected error: ${error.message || JSON.stringify(error)}`
//     );
//   }
// });

// app.post("/register", (req, res, next) => {
//   upload.single("profile")(req, res, function (err) {
//     if (err) {
//       console.error("🧨 Multer or Cloudinary error:", err);
//       return res
//         .status(500)
//         .send("Upload failed: " + (err.message || JSON.stringify(err)));
//     }
//     next(); // Continue if no error
//   });
// }, async (req, res) => {
//   try {
//     console.log("✅ Image accepted by multer");
//     console.log("req.file:", req.file); // Should be filled now
//     console.log("req.body:", req.body);

//     const { name, email, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const profileImageUrl = req.file?.path || req.file?.url || null;

//     db.query(
//       "INSERT INTO users (name, email, password, profile_img) VALUES (?, ?, ?, ?)",
//       [name, email, hashedPassword, profileImageUrl],
//       (err, result) => {
//         if (err) {
//           console.error("❌ DB error:", err);
//           return res
//             .status(500)
//             .send("Database error: " + (err.sqlMessage || err.message));
//         }
//         return res.redirect("/login");
//       }
//     );
//   } catch (error) {
//     console.error("💥 Unexpected Error:", error);
//     return res
//       .status(500)
//       .send("Unexpected error: " + (error.message || JSON.stringify(error)));
//   }
// });



app.get("/login",(req,res)=>{
    res.render("login",{session:req.session})
})
app.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    db.query('select *from users where email=?',[email],async(err,result)=>{
        if(err){
        console.error(err);
         return res.send(err);
            
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
                req.session.userName=user.name;
                req.session.isAdmin=user.is_admin;
                console.log(req.session.isAdmin)
               if (req.session.isAdmin) {
                     return res.redirect("/admin/post");
                    }else{
                        return res.redirect("/dashboard");

                    }
                   


                
               
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
           
            return res.render("dashboard",{user,posts,session:req.session})
        }
    })
        

    })
    
})
app.get("/post/create",isAuthenticated,(req,res)=>{
    

    res.render("post",{session:req.session});
})
app.post("/post/create",upload.array("image",5),async(req,res)=>{
   
    const {title,content}=req.body;
    const userid=req.session.userID;
    const imageUrl= req.files.map(file=>file.path);
    const jsonimageUrls=JSON.stringify(imageUrl);
    db.query("select *from users where id=?",[userid],(err,result)=>{
        console.log(result[0]);
    })
    db.query("insert into posts(user_id,title,content,image_url)values(?,?,?,?)",[userid,title,content,jsonimageUrls],(err,result)=>{
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
    const value=req.session.isAdmin?[postid]:[postid,userid]
    const query=req.session.isAdmin?"select * from posts where id=?":"select * from posts where id =? and user_id=?";
    db.query(query,value,(err,result)=>{
        if(err){
            console.error(err);
            return res.send(err);
        }else{
            const post=result[0];
            // Safely parse image_url
    try {
      post.image_url = post.image_url ? JSON.parse(post.image_url) : [];
    } catch (e) {
      post.image_url = [];
    }
            
            res.render("editpost",{post,session:req.session})
        }

    })

})
app.post("/post/update",upload.array("editimage",5),isAuthenticated,async(req,res)=>{
    const postid=req.body.postid;
    const userid=req.session.userID;
    const {title,content}=req.body;
     const newImageUrl= req.files.map(file=>file.path)
    const removeimageraw=req.body.removeimage;
     let removeimage;
     if(Array.isArray(removeimageraw)){
        removeimage=removeimageraw;
     }else if(removeimageraw){
        removeimage=[removeimageraw]
     }else{
        removeimage=[];
     }
     removeimage.forEach(url=>{
        const segment=url.split('/');
        const filenamewithext=segment[segment.length-1]
        const fileName=filenamewithext.split('.')[0];
        const publicId=`blog-images/${fileName}`
        cloudinary.uploader.destroy(publicId,async (err,result)=>{
            if(err){
                console.error(err)
            }else{
                console.log("Image Deleted from cloudinary")
            }
        })
     })
     db.query("select * from posts where id=? and user_id=? ",[postid,userid],async(err,result)=>{
        if(err){
            return res.send("Error Retriving Post from the Database")
        }
        let post= result[0];
        let currentImages;
        if(post.image_url&& post.image_url.length){
            currentImages=JSON.parse(post.image_url)
        }else{
            currentImages=[];
        }
        let updatedImages=currentImages.filter((url)=>{
            if(!removeimage.includes(url)){
                return url;
            }
        })
        updatedImages.push(...newImageUrl)
        const updatedImagesUrls=JSON.stringify(updatedImages);
        db.query("update posts set title=?,content=?,image_url=? where id=? and user_id=?",[title,content,updatedImagesUrls,postid,userid],(err,result)=>{
        if(err){
            console.error(err)
            return res.send("error updating the post")
        }else{
            res.redirect("/dashboard")
        }
    })
       

     })
     
   
    

    
})
app.post("/logout",(req,res)=>{
    req.session.destroy((err)=>{
        return res.send(err)
    })
    res.redirect("/")
})
app.get("/post/:id",(req,res)=>{
    const postid=req.params.id;
    const query="select posts.*, users.name as Author from posts join users on posts.user_id=users.id where posts.id=?"
    db.query(query,[postid],(err,result)=>{
        if(err){
            console.error(err)
            return res.send(err);
        }
         const post=result[0];
    try{
         post.image_url=JSON.parse(post.image_url)

    }catch(e){
        post.image_url=[];
    }
    return res.render("readpost",{posts:post,session:req.session})
    
    
       
    })
    
   

    
    
})
app.get("/admin/post",isAuthenticated,isAdmin,async(req,res)=>{
    db.query("select posts.* ,users.name as Author from posts join users on posts.user_id =users.id order by posts.created_at desc",(err,result)=>{
        if(err){
            return res.send(err)
        }
        // console.log(result[0])
       return  res.render("admindashboard",{posts:result,session:req.session})
    })
})
app.listen(PORT,(req,res)=>{
    console.log(`you are live at ${PORT}`)
})