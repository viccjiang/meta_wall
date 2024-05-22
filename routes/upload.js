const express = require("express");
const router = express.Router();
const appError = require("../service/appError");
const handleErrorAsync = require("../service/handleErrorAsync");
const sizeOf = require("image-size");
const upload = require("../service/image"); // 上傳檔案時 middleware 的一些設定
const { ImgurClient } = require("imgur"); // Imgur 服務

const { v4: uuidv4 } = require("uuid"); // 引入 uuidv4 用來產生唯一的檔案名稱
const firebaseAdmin = require("../service/firebase"); // 引入 firebase-admin 自訂的連線設定
const bucket = firebaseAdmin.storage().bucket(); // 取得 Firebase Storage 的 bucket 物件 (桶子)

const { isAuth, generateSendJWT } = require("../service/auth");

//  Imgur 服務，上傳圖片的路由，上傳時要鎖登入狀態
router.post(
  "/",
  isAuth, // 驗證使用者 middleware
  upload, // 上傳檔案的 middleware
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Upload - 上傳檔案']
     * #swagger.description = 'Imgur 服務，上傳圖片'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    // 如果沒有檔案，就回傳錯誤訊息
    if (!req.files.length) {
      return next(appError(400, "尚未上傳檔案", next));
    }
    // 取得上傳的檔案資訊列表裡面的第一個檔案，並檢查是否為 1:1 的圖片
    const dimensions = sizeOf(req.files[0].buffer);
    if (dimensions.width !== dimensions.height) {
      return next(appError(400, "圖片長寬不符合 1:1 尺寸。", next));
    }
    // Imgur套件 ，建立 ImgurClient 物件，並使用 Imgur API 上傳圖片
    const client = new ImgurClient({
      clientId: process.env.IMGUR_CLIENTID,
      clientSecret: process.env.IMGUR_CLIENT_SECRET,
      refreshToken: process.env.IMGUR_REFRESH_TOKEN,
    });
    // 使用 ImgurClient 物件的 upload 方法上傳圖片
    const response = await client.upload({
      image: req.files[0].buffer.toString("base64"), // 將檔案的 buffer 轉換成 base64 格式
      type: "base64",
      album: process.env.IMGUR_ALBUM_ID,
    });
    res.status(200).json({
      status: "success",
      imgUrl: response.data.link,
    });
  })
);

// firebase 服務，上傳檔案的路由，這裡使用 upload 這支檔案的 multer 來處理 middleware 的部分
router.post(
  "/file",
  isAuth, // 驗證使用者
  upload, // 上傳檔案的 middleware，這裡使用 multer 來處理
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Upload - 上傳檔案']
     * #swagger.description = 'Firebase 服務，上傳檔案'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    // 如果沒有上傳檔案，就回傳錯誤訊息
    if (!req.files.length) {
      return next(appError(400, "尚未上傳檔案", next));
    }

    // 取得上傳的檔案資訊列表裡面的第一個檔案
    const file = req.files[0];

    // 基於檔案的原始名稱建立一個 blob 物件
    // 放到 images 資料夾下，檔名使用 uuidv4 產生一個唯一的檔名
    // images 資料夾會出現在 Firebase Storage 中
    const blob = bucket.file(
      `images/${uuidv4()}.${file.originalname.split(".").pop()}`
    );

    // 建立一個可以寫入 blob 的物件，建立串留通道，尚未寫入
    // 這裡是建立一個寫入串流，將檔案寫入到 blob 物件中
    // 接著會進入監聽狀態 on 的 finish 以及 error 事件 ，等待檔案寫入完成
    const blobStream = blob.createWriteStream();

    // 成功寫入，監聽上傳狀態，當上傳完成時，會觸發 finish 事件
    blobStream.on("finish", () => {
      // 設定檔案的存取權限
      const config = {
        action: "read", // 權限
        expires: "12-31-2500", // 網址的有效期限
      };
      // 取得檔案的網址
      blob.getSignedUrl(config, (err, fileUrl) => {
        // 傳送檔案的網址給前端
        res.send({
          fileUrl, // 檔案的網址
        });
      });
    });

    // 失敗未寫入，如果上傳過程中發生錯誤，會觸發 error 事件
    blobStream.on("error", (err) => {
      // 回傳錯誤訊息
      res.status(500).send("上傳失敗");
    });

    // 將檔案的 buffer 寫入 blobStream
    blobStream.end(file.buffer);

    // res.status(200).json({
    //     status:"success",
    //     imgUrl: response.data.link
    // })
  })
);

// 上傳多張圖片的路由
// 是否要用到 multer 的 array() 方法來處理多張圖片的上傳 ?
// 是在 image.js 裡面設定處理多張圖片的上傳嗎 ?
// 這部分有實際的範例可以參考嗎 ?

module.exports = router;
