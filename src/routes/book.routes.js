const express = require("express");
const router = express.Router();

const {createBook, getBooksByBranch, updateBook, deleteBook, getBooksByClass} = require("../controllers/book.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.post("/addBooks", authMiddleware, createBook);
router.get("/:branchId/books", authMiddleware, getBooksByBranch);
router.put("/update/:id", authMiddleware, updateBook);
router.delete("/:id", authMiddleware, deleteBook);
router.get("/class/:className", authMiddleware, getBooksByClass);

module.exports = router;
