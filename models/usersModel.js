const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "請輸入您的名字"],
    },
    email: {
      type: String,
      required: [true, "請輸入您的 Email"],
      unique: true,
      lowercase: true,
      select: false,
    },
    photo: String,
    sex: {
      type: String,
      enum: ["male", "female"],
    },
    password: {
      type: String,
      required: [true, "請輸入密碼"],
      minlength: 8,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    // 追蹤者(關注者)
    followers: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "user" },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // 我追蹤的(我關注的)
    following: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "user" },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    versionKey: false,
  }
);
// User
const User = mongoose.model("user", userSchema);

module.exports = User;
