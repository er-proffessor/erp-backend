const Book = require("../models/Book.model");
const CounterStock = require("../models/CounterStock.model");

const assignStockToCounter = async (req, res) => {
     try {
        const { counterId, bookId, quantity } = req.body;
        const branchId = req.user.branchId;
        const qty = Number(quantity); 

         if (!counterId || !bookId  || !qty) {
          return res.status(400).json({ message: "All fields required" });
          }

          // Check Publication Stock

        const book = await Book.findOne({ _id: bookId, branchId });
          

        if (!book) {
          return res.status(404).json({ message: "Book not found in branch" });
        }

        console.log(book.quantity);

        if (book.quantity < qty) {
          return res.status(400).json({ message: "Not enough stock in branch" });
        }

        // Deduct from branch
        // book.quantity -= qty;
        // await book.save();

        await Book.findOneAndUpdate(
          { _id: bookId, branchId },
          { $inc: { quantity: -qty } }
        );

        // Add to counter
        const counterStock = await CounterStock.findOneAndUpdate(
          { branchId, counterId, bookId },
          { $inc: { quantity: qty } },
          { new: true, upsert: true }
        );

      res.status(200).json({
      message: "Stock assigned to counter successfully",
      data: counterStock
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
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

      console.log(stock);

    res.status(200).json(stock.map(item => ({
        stockId: item._id,
        bookId: item.bookId?._id,
        bookName: item.bookId?.name,
        price: item.bookId?.price,
        availableQuantity: item.availableQuantity
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { assignStockToCounter, getStockByCounter };



