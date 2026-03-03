const Order = require("../models/Order.model");
const CounterStock = require("../models/CounterStock.model");
const Counter = require("../models/Counter.model");
const Book = require("../models/Book.model");

// const createOrder = async (req, res) => {
//   try {
//     const { counterId, bookId, quantity, studentName, className, buyerType } = req.body;
//     const branchId = req.user.branchId;

//     // 0. Validate quantity
//     if (!quantity || quantity <= 0) {
//       return res.status(400).json({ message: "Invalid quantity" });
//     }

//     // 1. Get counter to know school
//     const counter = await Counter.findOne({
//                 _id: counterId,
//                 branchId
//                 });

//     if (!counter) {
//       return res.status(404).json({ message: "Counter not found" });
//     }

//     const schoolId = counter.schoolId;

//     // 2. Check stock availability
//     const stock = await CounterStock.findOne({
//       branchId,
//       counterId,
//       bookId
//     });

//     if (!stock || stock.quantity < quantity) {
//       return res.status(400).json({ message: "Not enough stock available" });
//     }

//     // 3. Get Book Price
//     const book = await Book.findById(bookId);

//     if (!book) {
//       return res.status(404).json({ message: "Book not found" });
//     }

//     const price = book.sellPrice || 0;

//     const totalAmount = price * quantity;

//     if (buyerType && !["SCHOOL", "DIRECT"].includes(buyerType)) {
//          return res.status(400).json({ message: "Invalid buyer type" });
//         }

//     // 4. Atomic stock deduction
//     const updatedStock = await CounterStock.findOneAndUpdate(
//       {
//         branchId,
//         counterId,
//         bookId,
//         quantity: { $gte: quantity }
//       },
//       { $inc: { quantity: -quantity } },
//       { new: true }
//     );

//     if (!updatedStock) {
//       return res.status(400).json({ message: "Stock changed. Try again." });
//     }

    

//     // 5. Create order
//     const order = await Order.create({
//       branchId,
//       schoolId,
//       counterId,
//       bookId,
//       buyerType,
//       studentName,
//       className,
//       quantity,
//       price,
//       totalAmount
//     });

//     res.status(201).json(order);

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

const createOrder = async (req, res) => {
  try {
    const {
      counterId,
      studentName,
      fatherName,
      mobileNo,
      className,
      buyerType,
      books
    } = req.body;

    const branchId = req.user.branchId;

    if (!books || books.length === 0) {
      return res.status(400).json({ message: "No books selected" });
    }

    if (buyerType && !["SCHOOL", "DIRECT"].includes(buyerType)) {
      return res.status(400).json({ message: "Invalid buyer type" });
    }

    // 1️⃣ Get Counter
    const counter = await Counter.findOne({
      _id: counterId,
      branchId
    });

    if (!counter) {
      return res.status(404).json({ message: "Counter not found" });
    }

    const schoolId = counter.schoolId;

    let calculatedTotal = 0;
    const orderBooks = [];

    // 2️⃣ Loop through books
    for (const item of books) {
      const { bookId, quantity, sellPrice } = item;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

       // 🔥 ADD PRICE VALIDATION HERE
  const book = await Book.findById(bookId);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!sellPrice || sellPrice <= 0) {
    return res.status(400).json({ message: "Invalid sell price" });
  }

  if (sellPrice > book.mrp) {
    return res.status(400).json({
      message: `Sell price cannot exceed MRP ₹${book.mrp}`
    });
  }

      // Check stock
      const updatedStock = await CounterStock.findOneAndUpdate(
        {
          branchId,
          counterId,
          bookId,
          quantity: { $gte: quantity }
        },
        { $inc: { quantity: -quantity } },
        { new: true }
      );

      if (!updatedStock) {
        return res.status(400).json({
          message: "Stock changed or not enough stock available"
        });
      }

      const total = sellPrice * quantity;
      calculatedTotal += total;

      orderBooks.push({
        bookId,
        quantity,
        price: sellPrice,
        total
      });
    }

    // 3️⃣ Create Order
    const order = await Order.create({
      branchId,
      schoolId,
      counterId,
      buyerType,
      studentName,
      fatherName,
      mobileNo,
      className,
      books: orderBooks,
      totalAmount: calculatedTotal
    });

    res.status(201).json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Providing available stocks counterwise for purchase books

const getAvailableBooksAtCounter = async (req, res) => {
  try {
    const { counterId } = req.params;
    const branchId = req.user.branchId;

    // 1. Get counter to know school
    const counter = await Counter.findOne({
                _id: counterId,
                branchId
            }).populate("schoolId", "schoolName");

    if (!counter) {
      return res.status(404).json({ message: "Counter not found" });
    }

    // 2. Get available stock
    const stocks = await CounterStock.find({
      branchId,
      counterId,
      quantity: { $gt: 0 }
    })
    .populate("bookId", "bookName sellPrice className mrp");

        console.log(stocks);

    // 3. Format response
    const availableBooks = stocks.map(stock => ({
      stockId: stock._id,
      bookId: stock.bookId._id,
      bookName: stock.bookId.bookName,
      className: stock.bookId.className,
      schoolName: counter.schoolId?.schoolName || "",
      mrp: stock.bookId.mrp || 0,
      sellPrice: stock.bookId.sellPrice || 0,
      availableQuantity: stock.quantity
    }));

    // console.log(availableBooks);

    res.json(availableBooks);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get Order History

// const getOrdersByCounter = async (req, res) => {
//   try {
//     const { counterId } = req.params;
//     const branchId = req.user.branchId;

//     const orders = await Order.find({
//       branchId,
//       counterId
//     })
//     .populate("bookId", "bookName sellPrice")
//     .sort({ createdAt: -1 });

//     res.json(orders);

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const getOrdersByCounter = async (req, res) => {
  try {
    const { counterId } = req.params;
    const branchId = req.user.branchId;

    const orders = await Order.find({
      branchId,
      counterId
    })
    .populate("books.bookId", "bookName sellPrice")
    .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { createOrder, getAvailableBooksAtCounter, getOrdersByCounter };
