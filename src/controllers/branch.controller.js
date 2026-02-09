const User = require("../models/User.model");
const Branch = require("../models/Branch.model");
const bcrypt = require("bcryptjs");

const createBranch = async (req, resp) => {
    try{
        const {
            branchName,
            mobile,
            email,
            address,
            password
        } = req.body;

        // Check existing User
        const existingUser = await User.findOne({email});
        if(existingUser) {
            return resp.status(400).json({message: "Client Already registered with this email"});
        }

        // Create Client User

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: branchName,
            email,
            password: hashedPassword,
            role: "CLIENT"
        });

        // Create Branch linked to User
        const branch = await Branch.create({
            branchName,
            mobile,
            email,
            address,
            userId: user._id
        });

       return resp.status(201).json({
            message: "Client Registered Successfully",
            branch
        });
        
    }
    catch(error) {
        console.error(error);
       return resp.status(500).json({message: "Server Error"});
    }
};

    // Get Branch data through api

    const getAllBranch = async (req, resp) => {
            try{
                const branches = await Branch.find().populate("userId", "email role").sort({ createdAt: -1 });

                return resp.status(200).json({
                    success: true,
                    data: branches,
                });
            }
            catch(error){
                console.error(error);
                return resp.status(500).json({message: "Server Error"});
            }

    };

    // Get Branch Data by Branch Id

    const getBranchById = async (req, resp) => {
        try{
            const {branchId} = req.params;

            // console.log("Branch Id is:", req.params);


            const branch = await Branch.findById(branchId);
            
            if(!branch){
                return resp.status(404).json({message: "Branch Not found"});
            }

            return resp.status(200).json({
                success: true,
                data: branch,
            });
        }
        catch(error){
            console.error(error);
            return resp.status(500).json({message: "Server Error"});
        }
    };



module.exports = { createBranch, getAllBranch, getBranchById };