const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {createCounter, getCountersBySchool, 
    getCountersByBranch, updateCounter, 
    deleteCounter, getSingleCounter} = require("../controllers/counter.controller");

router.post("/addCounter", authMiddleware, roleMiddleware("CLIENT"), createCounter);
router.get("/school/:schoolId", authMiddleware, getCountersBySchool);
router.get("/:branchId/counters", authMiddleware, getCountersByBranch);
router.get("/single/:id", authMiddleware, getSingleCounter);
router.put("/update/:id", authMiddleware, roleMiddleware("CLIENT"), updateCounter);
router.delete("/:counterId", authMiddleware, roleMiddleware("CLIENT"), deleteCounter);

module.exports = router;
