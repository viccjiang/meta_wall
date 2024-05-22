var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// 解決跨域問題
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const postRouter = require("./routes/posts");
const uploadRouter = require("./routes/upload");

var app = express();

require("./connections");

// 監聽未捕捉到的錯誤
// 程式出現重大錯誤時
process.on("uncaughtException", (err) => {
  // 記錄錯誤下來，等到服務都處理完後，停掉該 process
  console.error("Uncaughted Exception！");
  console.error(err);
  process.exit(1);
});

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/posts", postRouter);
app.use("/upload", uploadRouter);

// swagger 文件
app.use("/api-doc", swaggerUI.serve, swaggerUI.setup(swaggerFile));

// 404 錯誤 (全域) -------------------------------------

app.use(function (req, res, next) {
  res.status(404).json({
    status: "error",
    message: "無此路由資訊",
  });
});

// express 錯誤處理 (全域) ------------------------------

// 自己設定的 err 錯誤
// 生產環境錯誤
const resErrorProd = (err, res) => {
  // 如果是預期錯誤，就回傳自己設定的錯誤訊息
  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
    });
  } else {
    // log 紀錄
    console.error("出現重大錯誤", err);
    // 送出罐頭預設訊息
    res.status(500).json({
      status: "error",
      message: "系統錯誤，請恰系統管理員",
    });
  }
};

// 開發環境錯誤，會顯示所有的錯誤訊息
const resErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// 錯誤處理 - 統一錯誤處理  (主要從這裡開始，上面為定義開發環境錯誤處理以及生產環境錯誤處理)
// next(appError) 會將錯誤丟到這裡，因為 next 第一個參數是 err 錯誤，直接帶進下一個 middleware
// 使用 Express 的中間件，捕獲應用程序中未處理的錯誤
app.use(function (err, req, res, next) {
  // 將錯誤狀態碼設置為 err.statusCode，如果未設置，則默認為 500
  err.statusCode = err.statusCode || 500;

  // dev 開發環境
  if (process.env.NODE_ENV === "dev") {
    return resErrorDev(err, res);
  }
  // production 生產環境
  if (err.name === "ValidationError") {
    // mongoose 錯誤
    err.message = "資料欄位未填寫正確，請重新輸入！";
    err.isOperational = true; // 標記此錯誤為可操作的
    return resErrorProd(err, res);
  } else if (err.name === "SyntaxError") {
    // 如果是語法錯誤
    err.isOperational = true; // 標記此錯誤為可操作的
    err.message = "資料格式錯誤"; // 更改錯誤信息
    return resErrorProd(err, res); // 返回生產環境下的錯誤信息
  }
  resErrorProd(err, res);
});

// 未捕捉到的 catch ( 捕捉到未處理的 promise rejection ) 主要是有打 api 的地方
// ex.只有 .then 的 promise ，但沒有帶 .catch
process.on("unhandledRejection", (err, promise) => {
  console.error("未捕捉到的 rejection：", promise, "原因：", err);
});

module.exports = app;
