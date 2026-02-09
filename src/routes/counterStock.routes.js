const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");

const {
  upsertCounterStock,
  getStockByCounter,
} = require("../controllers/counterStock.controller");

const router = express.Router();

router.post("/", authMiddleware, upsertCounterStock);
router.get("/counter/:counterId", authMiddleware, getStockByCounter);

module.exports = router;
