import dotenv from "dotenv"
dotenv.config({
  path: "./.env",
});

import {app} from "./app.js"
import connecteDB from "./db/index.js";




connecteDB().then(()=>
    {   // () yeh call back hai call back execute hoga tbhi chlega port
       app.listen(process.env.PORT || 7005,() =>{
       console.log(`server is running on port ${process.env.PORT}`);
}) 

    
})
.catch((error)=>{
    console.log("mongodb coonection error", error);
})  
