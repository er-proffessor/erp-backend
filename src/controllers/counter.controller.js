const Book = require("../models/Book.model");
const Counter = require("../models/Counter.model");
const CounterStock = require("../models/CounterStock.model");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const mongoose = require("mongoose");

// Create Counter
const createCounter = async (req, res) => {
  try {
    const { name, schoolId, schoolName, mobileNo, email, password } = req.body;
    const branchId = req.user.branchId;

    
    // check Counter name
    const exists = await Counter.findOne({ 
        name, 
        schoolId, 
        branchId,
        status: "ACTIVE"
    });

    if (exists) {
      return res.status(400).json({ message: "Counter already exists" });
    }

    // Check Mobile No. unique 
    const mobileExists = await Counter.findOne({ 
      mobileNo,
      branchId
     });

    if (mobileExists) {
      return res.status(400).json({ message: "Mobile number already used by another counter" });
    }

    // 🔐 CHECK USER EMAIL (not counter)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already used" });
    }

    // Check Counter Email    
    const counterEmailExists = await Counter.findOne({ email });

    if(counterEmailExists){
      return res.status(400).json({ message: "Counter email already used" });
    }


    // 🔐 CREATE LOGIN USER
    
    const defaultPassword = password && password.trim() !== "" 
    ? password 
    : "counter123";

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "COUNTER"
    });

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

    // console.log(counter);
    
    const populatedCounter = await Counter.findById(counter._id)
  .populate("schoolId", "schoolName");

res.status(201).json(populatedCounter);

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
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);

    const counters = await Counter.find({ branchId, status: "ACTIVE" }).populate("schoolId", "schoolName");

    console.log(counters);

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
        // console.log(counter._doc);

        return {
          ...counter._doc,
          schoolName: counter.schoolId ? counter.schoolId.schoolName : "N/A",
          totalBooksAssigned: stock.length > 0 ? stock[0].total : 0
        };
      })
    );
        // console.log(totalBooksAssigned);

    res.json(countersWithStock);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Counter update

const updateCounter = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user.branchId;

    const updated = await Counter.findOneAndUpdate(
      { _id: id, branchId },
      req.body,
      { new: true }
    ).populate("schoolId", "schoolName");

    // console.log(updated);

    if (!updated) {
      return res.status(404).json({ message: "Counter not found" });
    }

    res.json({
      suceess: true,
      data: updated
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Counter Delete

const deleteCounter = async (req, res) => {
  try {

    // console.log(req.params.counterId);

    const counter = await Counter.findOneAndUpdate(
        {
            _id: req.params.counterId,
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

const getSingleCounter = async (req, res) => {
  try {
    const counter = await Counter.findOne({
      _id: req.params.id,
      branchId: req.user.branchId,
      status: "ACTIVE"
    }).populate("schoolId", "schoolName");

    if (!counter) {
      return res.status(404).json({ message: "Counter not found" });
    }

    res.json({
      success: true,
      data: counter
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {createCounter, getCountersBySchool, getCountersByBranch, updateCounter, deleteCounter, getSingleCounter};
