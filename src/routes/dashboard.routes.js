const authMiddleware = require("../middleware/auth.middleware");

const express = require("express");
const router = express.Router();

const {getDashboardStats} = require("../controllers/dashboard.controller");

router.get("/:branchId", authMiddleware,  getDashboardStats);

module.exports = router;

