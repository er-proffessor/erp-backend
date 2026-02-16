const authMiddleware = require("../middleware/auth.middleware");

const router = require("express").Router();
const { createOrder, getAvailableBooksAtCounter, getOrdersByCounter } = require("../controllers/order.controller");

router.post("/create", authMiddleware,  createOrder);

router.get("/counter-books/:counterId", authMiddleware, getAvailableBooksAtCounter);

router.get("/history/:counterId", authMiddleware, getOrdersByCounter);


module.exports = router;
