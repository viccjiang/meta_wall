var express = require("express"); // 引入 express
var router = express.Router(); // 使用 express 的 Router

// 錯誤處理的部分
const appError = require("../service/appError");
const handleErrorAsync = require("../service/handleErrorAsync");
const handleSuccess = require("../service/handleSuccess");

// 驗證是否登入 & 產生 JWT token
const { isAuth, generateSendJWT } = require("../service/auth");

// Model schema
const Post = require("../models/postsModel"); // 引入 postsModel 模組 schema
const User = require("../models/usersModel"); // 引入 usersModel 模組 schema
const Comment = require("../models/commentsModel"); // 引入 commentsModel 模組 schema

// 網址 Router 首頁
router.get(
  "/",
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '取得所有貼文'
     */

    // const post = await Post.find().populate("user") // 關聯 user 資料;

    // 貼文關鍵字搜尋與篩選
    const timeSort = req.query.timeSort == "asc" ? "createdAt" : "-createdAt";
    const q =
      req.query.q !== undefined ? { content: new RegExp(req.query.q) } : {};

    // 關聯 user 資料
    const post = await Post.find(q)
      .populate({
        path: "user",
        select: "name photo",
      })
      .populate({
        path: "comments", // post Schema populate comments 的欄位 (這支檔案) 拉出 comments 資料
        select: "comment user", // 只拉出 comments 的 comment 和 user
      })
      .sort(timeSort);

    // asc 遞增(由小到大，由舊到新) createdAt ;
    // desc 遞減(由大到小、由新到舊) "-createdAt"

    handleSuccess(res, post);
  })
);

// 這裡是新增文章，並且要透過 isAuth 來確認是否有登入
// handleErrorAsync 夾帶一個 async function 參數 ，會將錯誤丟到 app.js 的錯誤處理
router.post(
  "/",
  isAuth, // middleware 這裡是確認是否有登入
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '新增貼文'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const { body } = req;

    if (body.content == undefined) {
      return next(appError(400, "你沒有填寫 content 資料"));
    }

    const newPost = await Post.create({
      user: body.user,
      content: body.content.trim(),
      image: body.photo,
    });

    handleSuccess(res, newPost);
  })
);

// router.delete 刪除單筆
router.delete(
  "/:id",
  isAuth, // middleware 這裡是確認是否有登入
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '刪除單筆貼文'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const post = await Post.findByIdAndDelete(req.params.id);

    if (post !== null) {
      handleSuccess(res, post);
    } else {
      return next(appError(400, "欄位未填寫正確或無此 id"));
    }
  })
);

// router.delete 刪除全部
router.delete(
  "/",
  isAuth, // middleware 這裡是確認是否有登入
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '刪除全部貼文'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const posts = await Post.deleteMany({});
    handleSuccess(res, posts);
  })
);

// 取得單一貼文
router.get(
  "/:id",
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '取得單一貼文'
     */
    const post = await Post.findById(req.params.id).populate("user");
    handleSuccess(res, post);
  })
);

// router.patch 修改單一貼文
router.patch(
  "/:id",
  isAuth, // middleware 這裡是確認是否有登入
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '修改單一貼文'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const { body } = req;

    // 取得 id
    const id = req.params.id;

    if (body.content === undefined) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const post = await Post.findByIdAndUpdate(
      id,
      {
        name: body.name,
        content: body.content,
        image: body.photo,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    handleSuccess(res, post);
  })
);

// 貼文的按讚功能
router.post(
  "/:id/likes",
  isAuth,
  handleErrorAsync(async function (req, res, next) {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '新增按讚'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const _id = req.params.id;
    const userId = req.user.id;
    console.log(_id, userId);

    const result = await Post.findOneAndUpdate(
      { _id },
      { $addToSet: { likes: req.user.id } }
    );

    if (result) {
      handleSuccess(res, {
        postId: _id,
        userId: req.user.id,
      });
    } else {
      return next(appError(400, "欄位未填寫正確"));
    }
  })
);

// 取消讚
router.delete(
  "/:id/likes",
  isAuth,
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '取消按讚'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const _id = req.params.id;
    await Post.findOneAndUpdate(
      { _id },
      { $pull: { likes: req.user.id } },
      { new: true, runValidators: true }
    );

    handleSuccess(res, {
      postId: _id,
      userId: req.user.id,
    });
  })
);

// 貼文的留言功能
router.post(
  "/:id/comment",
  isAuth, // 驗證使用者
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '新增留言'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const user = req.user.id; // 使用者 id
    const post = req.params.id; // 貼文 id
    const { comment } = req.body;

    // 新增留言
    const newComment = await Comment.create({
      post,
      user,
      comment,
    });

    handleSuccess(res, {
      comments: newComment,
    });
  })
);

// 刪除貼文的留言功能
router.delete(
  "/:commentId/comment",
  isAuth, // 驗證使用者
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '刪除留言'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     */
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (comment !== null) {
      handleSuccess(res, comment);
    } else {
      return next(appError(400, "欄位未填寫正確或無此 id"));
    }
  })
);

// 取得某個使用者的所有留言
router.get(
  "/user/:id",
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '取得某個使用者的所有留言'
     */
    const user = req.params.id;
    const posts = await Post.find({ user }).populate({
      path: "comments",
      select: "comment user",
    });

    // 提取出所有的留言
    const comments = posts.reduce((allComments, post) => {
      return allComments.concat(post.comments);
    }, []);

    handleSuccess(res, {
      results: posts.length,
      comments,
    });
  })
);

// 取得某個使用者的所有貼文
router.get(
  "/user/:id/posts",
  handleErrorAsync(async (req, res, next) => {
    /**
     * #swagger.tags = ['Posts - 貼文']
     * #swagger.description = '取得某個使用者的所有貼文'
     */
    const user = req.params.id;
    const posts = await Post.find({ user });

    handleSuccess(res, {
      results: posts.length,
      posts,
    });
  })
);

module.exports = router;

// next(appError) 會將錯誤丟到 app.js 的錯誤處理
