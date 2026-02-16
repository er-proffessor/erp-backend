const Book = require("../models/Book.model");
const Counter = require("../models/Counter.model");
const CounterStock = require("../models/CounterStock.model");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");

// Create Counter
const createCounter = async (req, res) => {
  try {
    const { name, schoolId, schoolName, mobileNo, email, password } = req.body;
    const branchId = req.user.branchId;

    

    const exists = await Counter.findOne({ 
        name, 
        schoolId, 
        branchId,
        status: "ACTIVE"
    });

    console.log(exists);

    if (exists) {
      return res.status(400).json({ message: "Counter already exists" });
    }

    // 🔐 CHECK USER EMAIL (not counter)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already used" });
    }

    // 🔐 CREATE LOGIN USER
    
    const defaultPassword = password && password.trim() !== "" 
    ? password 
    : "counter123";

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const counterEmailExists = await Counter.findOne({ email });

    if(counterEmailExists){
      return res.status(400).json({ message: "Counter email already used" });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "COUNTER"
    });

    console.log(user);

    // 🏪 CREATE COUNTER
    const counter = await Counter.create({
      name,
      schoolId,
      schoolName,
      mobileNo,
      email,
      branchId,
      userId: user._id,   // 🔗 LINK LOGIN USER
      createdBy: req.user.userId,
    });

    console.log(counter);
    
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
    const branchId = req.user.branchId;

    const counters = await Counter.find({ branchId });

    const countersWithStock = await Promise.all(
      counters.map(async (counter) => {

        const stock = await CounterStock.aggregate([
          {
            $match: {
              counterId: counter._id,
              branchId: branchId
            }
          },
          {
            $group: {
              _id: "$counterId",
              total: { $sum: "$quantity" }
            }
          }
        ]);

        return {
          ...counter._doc,
          totalBooksAssigned: stock.length > 0 ? stock[0].total : 0
        };
      })
    );

    res.json(countersWithStock);

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
