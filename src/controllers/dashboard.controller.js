const School = require("../models/school.model");
const Books = require("../models/Book.model");
const Counter = require("../models/Counter.model");

const getDashboardStats = async(req, resp) => {
    try{
        const { branchId } = req.params;

        const totalSchools = await School.countDocuments({ branchId: branchId });
        const totalBooks = await Books.countDocuments({ branchId: branchId });
        const totalCounters = await Counter.countDocuments({ branchId: branchId, status: "ACTIVE" });
        const pendingTasks = 5; // future update

        resp.status(200).json({
            success: true,
            data: {
            totalSchools,
            totalBooks,
            totalCounters,
            pendingTasks
            },
        });
    }
    catch(err){
            console.error("Dashboard Error:", err);
            resp.status(500).json({message: "Server Error"});
    }
}

module.exports = {getDashboardStats};

