const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {superAdminOnly, clientOnly} = require("../controllers/testController");

router.get("/superadmin", authMiddleware, roleMiddleware("SUPER_ADMIN"), superAdminOnly);

router.get("/client", authMiddleware, roleMiddleware("CLIENT","SUPER_ADMIN"), clientOnly);

module.exports = router;



