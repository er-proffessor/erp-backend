const User = require("../models/User.model");
const Counter = require("../models/Counter.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Branch = require("../models/Branch.model");


// Register api body

exports.register = async (req, resp) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return resp.status(400).json({ message: "All fields required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return resp.status(400).json({ message: "User Already exist" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        resp.status(201).json({
            message: "User Registered Successfully",
            userId: user._id
        });
    }

    catch (error) {
        resp.status(500).json({ message: error.message })
    }
};



// Login api body

exports.login = async (req, resp) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return resp.status(400).json({ message: "Email and Password required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return resp.status(400).json({ message: "Invalid Login" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return resp.status(401).json({ message: "Invalid Password" });
        }

        let branchId = null;
        let counterId = null;

            if (user.role === "CLIENT") {
                const branch = await Branch.findOne({ userId: user._id });

                if (!branch) {
                    return resp.status(403).json({ message: "No Branch assign to this account" });
                }

                branchId = branch._id;
            }

            if (user.role === "COUNTER") {

                const counter = await Counter.findOne({ 
                userId: user._id,
                status: "ACTIVE"   // ✅ ADD THIS LINE
            });

            if (!counter) {
                return resp.status(403).json({ 
                message: "Counter is inactive or not assigned" 
            });
            }

                branchId = counter.branchId;
                counterId = counter._id;
        }

        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role,
                branchId,
                counterId
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return resp.status(200).json({
            message: "Login Successfull",
            token,
            role: user.role,
            branchId,
            counterId,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    }
    catch (error) {
        return resp.status(500).json({ message: error.message });
    }
};

