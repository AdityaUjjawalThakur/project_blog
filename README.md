# project_blog
#ways to upload image using a cloud is through multer as express does not have capablity to parse multipart form data 
multer parse it for express and automatically store the image into respective storage and genetrates req.file which has metadata for the image or file
how to setup cloudinary
first install 
npm multer
npm istall multer-storage-cloudniary---> it provide storage engine it automaticvally store image in cloud and return metadat in form of req.file
then do configuration
const cloudinary=require('cloudinary').v2;
cloudinary.config({
    cloud_name:'dhxzjgq14',
    api_key:"674562591513815",
    api_secret:"xRMbNI18XYUG0iL2xQSg_Gk8E-0"
});
module.exports=cloudinary
in main app.js
import cloudinary and then configure storage 
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
const upload=multer({storage}) this initialises the storage

now when a form submit the data and it has a image in it then 
use a middleware upload.single("profile") in the declaration of route here profile is name of image from the form field
the form should have
<!-- <input type="file" name="profile" id="profile" accept="image/*" class="form-control">  -->
<!-- <form action="/register" method="post" enctype="multipart/form-data"> -->  enctype="multipart/form-data this should ne necessray otherwise it will not senf the image

npm install cloudinary