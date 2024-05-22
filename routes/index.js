var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  /**
   * #swagger.tags = ['Index - 首頁']
   * #swagger.description = '首頁'
   */
  res.render("index", { title: "Express" });
});

module.exports = router;
