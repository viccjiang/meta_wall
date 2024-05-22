const express = require("express");

// JWT 套件
const jwt = require("jsonwebtoken");

// 錯誤處理的部分
const appError = require("../service/appError");
const handleErrorAsync = require("../service/handleErrorAsync");
const handleSuccess = require("./handleSuccess");

// Model schema
const User = require("../models/usersModel");

// isAuth 驗證是否登入
const isAuth = handleErrorAsync(async (req, res, next) => {
  // 確認 token 是否存在
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; // Bearer token 分割空白處只保留後面 token
  }

  // 如果 token 不存在
  if (!token) {
    return next(appError(401, "你尚未登入！", next));
  }

  // 若有 token， 驗證 token 正確性
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        resolve(payload); // payload 會回傳 id ,iat ,exp
      }
    });
  });

  // decoded 是一個物件會回傳 id ,iat ,exp
  // 用 findById 找出使用者 decoded.id 的資料取出來，並且將使用者資料放入 req.user
  const currentUser = await User.findById(decoded.id);
  // 這裡是自訂，將使用者資料放入 req.user
  req.user = currentUser; // 個人資料
  next(); // 繼續下一步，回傳給下一個 middleware
});

// 產生 JWT token 有傳入三個參數，user, statusCode, res
const generateSendJWT = (user, statusCode, res) => {
  // payload: user._id
  // secret: process.env.JWT_SECRET
  // 過期時間: process.env.JWT_EXPIRES_DAY

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_DAY,
  });

  // 這裡算是防呆，避免誤傳整包資訊回來，所以不要回傳密碼，避免外洩，所以這裡直接清掉
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    user: {
      token,
      name: user.name,
    },
  });
};

module.exports = {
  isAuth,
  generateSendJWT,
};
