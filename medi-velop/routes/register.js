const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("register", { title: "Express" });
});

router.post("/", (req, res, next) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;

  res.redirect("/");
});

module.exports = router;
