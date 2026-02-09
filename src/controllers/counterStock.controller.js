const CounterStock = require("../models/CounterStock.model");

const upsertCounterStock = async (req, resp) => {
    try{
        const { bookId, counterId, quantity } = req.body;
        const branchId = req.user.branchId;

        if(!counterId || !bookId){
            return resp.status(400).json({meesage: "counterId and bookId required"});
        }

        const stock = await CounterStock.findOneAndUpdate(
            { branchId, bookId, counterId },
            {$set: { quantity }},
            { new: true, usert: true }
        );

       return resp.status(200).json({
            message: "Record Updated Successfully",
            data: stock,
        });
    }
    catch(error){
       return resp.status(500).json({message: error.message});
    }

};

// Get Stock By Counter

const getStockByCounter = async (req, res) => {
  try {
    const { counterId } = req.params;
    const branchId = req.user.branchId;

    const stock = await CounterStock.find({ branchId, counterId })
      .populate("bookId", "name code price")
      .populate("counterId", "name");

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { upsertCounterStock, getStockByCounter };



