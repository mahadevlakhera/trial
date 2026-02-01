

import multer from "multer";       //   Iska kaam kya hai? - Jab user koi file upload karega (image, pdf, etc.), ye code us file ko ./public/temp folder mein save karega. - File ka naam wahi hoga jo user ne originally diya hai (e.g., photo.png).




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});