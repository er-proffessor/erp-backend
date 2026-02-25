const Book = require("../models/Book.model");

// Add New Books

const createBook = async (req, resp) => {
    try{
        const branchId = req.user.branchId;
        
        const {
            bookName,
            publisherName,
            className,
            subject,
            mrp,
            purchasePrice,
            sellPrice,
            quantity
        } = req.body; 

        const book = await Book.create({
            branchId,
            bookName,
            publisherName,
            className,
            subject,
            mrp,
            purchasePrice,
            sellPrice,
            quantity
        });

        // console.log(req.body);

        // console.log(book);

        resp.status(201).json({success: true, data: book});
    }
    catch(error){
        resp.status(500).json({message: error.message});
    }
};

// Get Books List for Branch/Publication

    const getBooksByBranch = async (req, resp) => {
        try{
            const { branchId } = req.params;

            const books = await Book.find({ branchId }).sort({ createdAt: -1 });
            
            resp.status(200).json({ success: true, data: books });
            
            console.log(books);

        }
        catch(error){
            resp.status(500).json({ message: error.message });
        }
    };

    const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user.branchId;

    const updated = await Book.findOneAndUpdate(
      { _id: id, branchId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {createBook, getBooksByBranch, updateBook};
