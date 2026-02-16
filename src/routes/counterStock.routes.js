const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");

const {
  assignStockToCounter,
  getStockByCounter,
} = require("../controllers/counterStock.controller");

const router = express.Router();

router.post("/assign", authMiddleware, assignStockToCounter);
router.get("/counter/:counterId", authMiddleware, getStockByCounter);

module.exports = router;
