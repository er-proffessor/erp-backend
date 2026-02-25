const School = require("../models/school.model");

//Add New School 

const addSchool = async (req, resp) => {
    try{
        const {
            schoolName,
            schoolAddress,
            schoolOwnerMobile,
            schoolClasses
        } = req.body;

        const branchId = req.user.branchId;

         const exists = await School.findOne({
            schoolName,
            branchId,
            status: "ACTIVE",
            });

              if (exists) {
                 return resp.status(400).json({ message: "School already exists" });
                }

        const school = await School.create({
            schoolName,
            schoolAddress,
            schoolOwnerMobile,
            schoolClasses,
            branchId,
            createdBy: req.user.userId,
        });

        resp.status(201).json({
            success: true,
            message: "New School Registered",
            data: school
        });
    }
    catch(error){
        resp.status(500).json({
            success: false,
            message: "Failed to Add School!! Server Error",
            error: error.message
        });

    }
};

// Get School List

const getSchoolList = async (req, resp) => {
    try{
        const schools = await School.find().sort({createdAt: -1});

        resp.status(200).json({
            success: true,
            data: schools
        });

    }
    catch(error){
        resp.status(500).json({
            success: false,
            message: "Failed to fetch data",
            error: error.message
        });
    }
};

const getSchoolsByBranch = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const schools = await School.find({
      branchId,
      status: "ACTIVE",
    }).sort({createdAt: -1});

    // .select("_id name")
    console.log(schools);
    
   return res.status(200).json({data: schools});

    

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user.branchId;

    const updated = await School.findOneAndUpdate(
      { _id: id, branchId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "School not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {addSchool, getSchoolList, getSchoolsByBranch, updateSchool};