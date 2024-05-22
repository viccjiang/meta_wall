const multer = require("multer"); // 一種檔案類型 的 middleware 的機制
const path = require("path");

const appError = require("../service/appError");
const handleErrorAsync = require("../service/handleErrorAsync");

// multer 守門員
// 上傳檔案的設定，限制檔案大小為 2MB，檔案格式為 jpg、jpeg 與 png
const upload = multer({
  // 檔案大小限制
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  // 檔案格式過濾器，cb 是 callback 的縮寫
  fileFilter(req, file, cb) {
    // console.log(file);
    // 檢查副檔名檔案格式
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg") {
      // 如果檔案格式不符合，就回傳錯誤，error 到全域的統一錯誤處理
      cb(new Error("檔案格式錯誤，僅限上傳 jpg、jpeg 與 png 格式。"));
    }
    // 如果檔案格式正確，就回傳 true，進到下一個 middleware，類似 next()
    cb(null, true);
  },
}).any(); // .any() 會夾帶上 req.files

module.exports = upload;
