const mongoose = require("mongoose");

// - user：使用者 id(必填)
// - image：貼文圖片
// - content：貼文內容(必填)
// - likes：按讚數
// - comments：留言數
// - createdAt：發文時間

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "User ID 未填寫"],
    },
    content: {
      type: String,
      required: [true, "Content 未填寫"],
    },
    image: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user", // 關聯 user model
      },
    ],
  },
  {
    versionKey: false,
    toJSON: { virtuals: true }, // virtual 虛擬屬性 (因為 postSchema.virtual 有設定 comments)
    toObject: { virtuals: true }, // virtual 虛擬屬性 (因為 postSchema.virtual 有設定 comments)
  }
);

// 虛擬關聯 comments，在需要的時候，加上 comments schema
postSchema.virtual("comments", {
  ref: "Comment", // 引用 留言功能的 model :  Comment model
  foreignField: "post", // 關聯的欄位
  localField: "_id", // 本地的欄位 貼文 id
});

// model export 模組化
// 1. 建立 schema
// 2. 建立 model
// 3. 引入 mongoose
// 4. 匯出 model

// model 開頭字變小寫
// 建立 Model 時後面會強制加上 s (英文規則)

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
