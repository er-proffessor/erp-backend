const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// console.log("roleMiddleware:", roleMiddleware("SUPER_ADMIN"));

const {createBranch, getAllBranch, getBranchById} = require("../controllers/branch.controller");

// console.log("createBranch:", createBranch);


router.post("/register", authMiddleware, roleMiddleware("SUPER_ADMIN"), createBranch);
router.get("/branchlist", authMiddleware, roleMiddleware("SUPER_ADMIN"), getAllBranch);
router.get("/:branchId/branch", authMiddleware, roleMiddleware("CLIENT" , "SUPER_ADMIN"), getBranchById);

module.exports = router;
