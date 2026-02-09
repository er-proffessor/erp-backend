const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {createCounter, getCountersBySchool, 
    getCountersByBranch, updateCounter, 
    deleteCounter} = require("../controllers/counter.controller");

router.post("/addCounter", authMiddleware, roleMiddleware("CLIENT"), createCounter);
router.get("/school/:schoolId", authMiddleware, getCountersBySchool);
router.get("/branch/:branchId", authMiddleware, getCountersByBranch);
router.put("/:counterId", authMiddleware, roleMiddleware("CLIENT"), updateCounter);
router.delete("/:counterId", authMiddleware, roleMiddleware("CLIENT"), deleteCounter);

module.exports = router;
