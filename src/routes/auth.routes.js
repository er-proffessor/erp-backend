const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

const {register, login} = require("../controllers/auth.controller");

router.post("/register", authMiddleware, roleMiddleware("SUPER_ADMIN"), register);
router.post("/login", login);

module.exports = router;
