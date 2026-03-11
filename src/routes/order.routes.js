const authMiddleware = require("../middleware/auth.middleware");

const router = require("express").Router();
const { createOrder, getAvailableBooksAtCounter, getOrdersByCounter, updatePaymentStatus, downloadInvoice } = require("../controllers/order.controller");

router.post("/create", authMiddleware,  createOrder);

router.get("/counter-books/:counterId", authMiddleware, getAvailableBooksAtCounter);

router.get("/history/:counterId", authMiddleware, getOrdersByCounter);

router.get("/invoice/:orderId", authMiddleware, downloadInvoice);

router.put("/update-payment/:orderId", authMiddleware, updatePaymentStatus);

module.exports = router;
