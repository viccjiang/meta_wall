const mongoose = require("mongoose");

// 留言功能的 model Schema
const commentSchema = new mongoose.Schema(
  {
    // 留言內容
    comment: {
      type: String,
      required: [true, "comment can not be empty!"],
    },
    // 留言時間
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // 來自於哪一個 user 留言者 ( id 資訊)
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      require: ["true", "user must belong to a post."],
    },
    // 來自於哪一個 post 貼文 id (引用)
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "post",
      require: ["true", "comment must belong to a post."],
    },
  },
  {
    versionKey: false,
  }
);

// pre 提前處理，當有 find 的時候，執行下面
// 預先處理 populate user，在有 匹配到find文字 的時候，取出 user 的 name 和 id 以及 createdAt
commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user", // comment Schema populate user 的欄位 (這支檔案) 拉出 user 資料
    select: "name id createdAt", // 只拉出 user 的 name 和 id 以及 createdAt
  });

  next(); // middleware
});
// 留言功能的 model
const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
