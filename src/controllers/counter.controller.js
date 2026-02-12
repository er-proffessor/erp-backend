const Counter = require("../models/Counter.model");
const CounterStock = require("../models/CounterStock.model");

// Create Counter
const createCounter = async (req, res) => {
  try {
    const { name, schoolId, schoolName, mobileNo } = req.body;
    const branchId = req.user.branchId;

    const exists = await Counter.findOne({ 
        name, 
        schoolId, 
        branchId,
        status: "ACTIVE"
    });

    if (exists) {
      return res.status(400).json({ message: "Counter already exists" });
    }

    const counter = await Counter.create({
      name,
      schoolId,
      schoolName,
      mobileNo,
      branchId,
      createdBy: req.user.userId,
    });

    res.status(201).json(counter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Counter by SchoolId

const getCountersBySchool = async (req, res) => {
  try {
    const counters = await Counter.find({
        schoolId: req.params.schoolId,
        branchId: req.user.branchId,
        status: "ACTIVE",
        }).sort({ createdAt: -1 });

    res.json(counters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all counter listed by Publication
const getCountersByBranch = async (req, res) => {
  try {
          
          console.log(req.user.branchId);
          console.log(req.params.branchId);

            if (req.user.branchId !== req.params.branchId) {
                return res.status(403).json({ message: "Unauthorized access" });
            }

    const counters = await Counter.find({
      branchId: req.params.branchId,
        status: "ACTIVE"
    })
      .populate("schoolId", "schoolName")
      .sort({ createdAt: -1 });

      const countersWithStock = await Promise.all(
                
                  counters.map(async (counter) => {
                    const stockCount = await CounterStock.countDocuments({
                    branchId: req.params.branchId,
                    counterId: counter._id
              });

    return {
      ...counter.toObject(),
      stockCount
    };
  })
);

res.json(countersWithStock);

      // console.log(counters);
      
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Counter update

const updateCounter = async (req, res) => {
  try {
    const { name, status } = req.body;
    
    const counter = await Counter.findOneAndUpdate(
  {
    _id: req.params.id,
    branchId: req.user.branchId,
  },
  { name, status },
  { new: true }
);

    if (!counter) {
      return res.status(404).json({ message: "Counter not found" });
    }

    res.json(counter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Counter Delete

const deleteCounter = async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
        {
            _id: req.params.id,
            branchId: req.user.branchId,
        },
        { status: "INACTIVE" },
        { new: true }
    );

        if (!counter) {
        return res.status(404).json({ message: "Counter not found" });
        }

    res.json({ message: "Counter disabled successfully" });
  } 
  catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {createCounter, getCountersBySchool, getCountersByBranch, updateCounter, deleteCounter};
