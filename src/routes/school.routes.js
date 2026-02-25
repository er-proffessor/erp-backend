const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const {addSchool, getSchoolList, getSchoolsByBranch, updateSchool} = require("../controllers/school.controller");

router.post("/addSchool", authMiddleware, roleMiddleware("CLIENT"), addSchool);

router.get("/getSchoolslist", getSchoolList);

router.get("/:branchId/schools", authMiddleware, getSchoolsByBranch);

router.put("/update/:id", authMiddleware, updateSchool);

module.exports = router;
