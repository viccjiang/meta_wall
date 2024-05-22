// firebase-admin 在這個專案中，我們會使用 firebase-admin 來上傳檔案到 Firebase Storage

const dotenv = require("dotenv"); // 環境變數
dotenv.config({ path: "./config.env" }); // 設定環境變數
const admin = require("firebase-admin"); // Firebase admin 連接套件，橋梁的概念去連接 Firebase

// Firebase 連接套件的設定
const config = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_X509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// 初始化 Firebase
admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`, // Firebase Storage 的 Bucket 名稱 ，空間名稱、空間桶
});

module.exports = admin; // 匯出 Firebase 連接套件，可以使用 Storage 功能
