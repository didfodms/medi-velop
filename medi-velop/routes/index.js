const express = require("express");
const multer = require("multer");
// const upload = multer({ dest: "uploads/" });
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "emr" + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/file/post", upload.single("file"), (req, res, next) => {
  const body = req.body;

  if (!req.file.mimetype.startsWith("text/csv")) {
    return res.status(422).json({
      error: "The uploaded file must be an csv",
    });
  }

  console.log(req.file);

  return res.status(200).send(req.file);
});

module.exports = router;
