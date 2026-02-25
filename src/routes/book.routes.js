const express = require("express");
const router = express.Router();

const {createBook, getBooksByBranch, updateBook} = require("../controllers/book.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.post("/addBooks", authMiddleware, createBook);
router.get("/:branchId/books", authMiddleware, getBooksByBranch);
router.put("/update/:id", authMiddleware, updateBook);

module.exports = router;
