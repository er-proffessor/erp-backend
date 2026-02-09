const express = require("express");
const router = express.Router();

const {createBook, getBooksByBranch} = require("../controllers/book.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.post("/addBooks", authMiddleware, createBook);
router.get("/:branchId/books", authMiddleware, getBooksByBranch);

module.exports = router;
