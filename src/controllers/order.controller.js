const Order = require("../models/Order.model");
const CounterStock = require("../models/CounterStock.model");
const Counter = require("../models/Counter.model");
const Book = require("../models/Book.model");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const School = require("../models/school.model");

// const createOrder = async (req, res) => {
//   try {
//     const {
//       counterId,
//       schoolId,
//       studentName,
//       fatherName,
//       mobileNo,
//       className,
//       buyerType,
//       books,
//       billingStatus,
//       paymentType,
//       utrNo
//     } = req.body;

//     const branchId = req.user.branchId;

//     if (!books || books.length === 0) {
//       return res.status(400).json({ message: "No books selected" });
//     }

//     if (buyerType && !["SCHOOL", "DIRECT"].includes(buyerType)) {
//       return res.status(400).json({ message: "Invalid buyer type" });
//     }

//     // 1️⃣ Get Counter
//     // const counter = await Counter.findOne({
//     //   _id: counterId,
//     //   branchId
//     // });

//     // if (!counter) {
//     //   return res.status(404).json({ message: "Counter not found" });
//     // }

//     // const schoolId = counter.schoolId;

//     let school = null;

// // 👉 If DIRECT (Counter sale)
// if (buyerType === "DIRECT") {
//   const counter = await Counter.findOne({
//     _id: counterId,
//     branchId
//   });

//   if (!counter) {
//     return res.status(404).json({ message: "Counter not found" });
//   }

//   school = counter.schoolId;
// }

// // 👉 If SCHOOL (Bulk sale)
// if (buyerType === "SCHOOL") {
//   if (!schoolId) {
//     return res.status(400).json({ message: "School is required" });
//   }

//   school = schoolId;
// }

//     let calculatedTotal = 0;
//     const orderBooks = [];

//     // 2️⃣ Loop through books
//     for (const item of books) {
//       const { bookId, quantity, sellPrice } = item;

//       if (!quantity || quantity <= 0) {
//         return res.status(400).json({ message: "Invalid quantity" });
//       }

//       // 🔥 ADD PRICE VALIDATION HERE
//       const book = await Book.findById(bookId);

//       if (!book) {
//         return res.status(404).json({ message: "Book not found" });
//       }

//       if (!sellPrice || sellPrice <= 0) {
//         return res.status(400).json({ message: "Invalid sell price" });
//       }

//       if (sellPrice > book.mrp) {
//         return res.status(400).json({
//           message: `Sell price cannot exceed MRP ₹${book.mrp}`
//         });
//       }


//       // Check stock
//       // const updatedStock = await CounterStock.findOneAndUpdate(
//       //   {
//       //     branchId,
//       //     counterId,
//       //     bookId,
//       //     quantity: { $gte: quantity }
//       //   },
//       //   { $inc: { quantity: -quantity } },
//       //   { new: true }
//       // );

//       let updatedStock;

// // 👉 COUNTER SALE
// if (buyerType === "DIRECT") {
//   updatedStock = await CounterStock.findOneAndUpdate(
//     {
//       branchId,
//       counterId,
//       bookId,
//       quantity: { $gte: quantity }
//     },
//     { $inc: { quantity: -quantity } },
//     { new: true }
//   );
// }

// // 👉 SCHOOL SALE (from BRANCH stock)
// if (buyerType === "SCHOOL") {
//   updatedStock = await Book.findOneAndUpdate(
//     {
//       _id: bookId,
//       branchId,
//       stock: { $gte: quantity } // 👈 ensure you have stock field
//     },
//     { $inc: { stock: -quantity } },
//     { new: true }
//   );
// }

// if (!updatedStock) {
//   return res.status(400).json({
//     message: "Stock not available"
//   });
// }

//       // if (!updatedStock) {
//       //   return res.status(400).json({
//       //     message: "Stock changed or not enough stock available"
//       //   });
//       // }

//       const total = sellPrice * quantity;
//       calculatedTotal += total;

//       orderBooks.push({
//         bookId,
//         quantity,
//         price: sellPrice,
//         total
//       });
//     }
//     // Check payment status and type of payment

//     if (!["PAID", "DUE"].includes(billingStatus)) {
//       return res.status(400).json({ message: "Invalid billing status" });
//     }

//     if (!["PhonePe", "GooglePay", "Paytm", "NetBanking", "Cash"].includes(paymentType)) {
//       return res.status(400).json({ message: "Invalid payment type" });
//     }

//     // 3️⃣ Create Order
//     // const order = await Order.create({
//     //   branchId,
//     //   schoolId,
//     //   counterId,
//     const order = await Order.create({
//       branchId,
//       schoolId: school,
//       counterId: buyerType === "DIRECT" ? counterId : null,
//       buyerType,
//       studentName,
//       fatherName,
//       mobileNo,
//       className,
//       books: orderBooks,
//       totalAmount: calculatedTotal,
//       billingStatus,
//       paymentType,
//       utrNo
//     });

//     res.status(201).json(order);

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };



const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      counterId,
      schoolId,
      studentName,
      fatherName,
      mobileNo,
      className,
      buyerType,
      books,
      billingStatus,
      paymentType,
      utrNo
    } = req.body;

    const branchId = req.user.branchId;

    // ============================
    // ✅ BASIC VALIDATIONS
    // ============================

    if (!books || books.length === 0) {
      throw new Error("No books selected");
    }

    if (!["SCHOOL", "DIRECT"].includes(buyerType)) {
      throw new Error("Invalid buyer type");
    }

    if (!["PAID", "DUE"].includes(billingStatus)) {
      throw new Error("Invalid billing status");
    }

    if (!["PhonePe", "GooglePay", "Paytm", "NetBanking", "Cash"].includes(paymentType)) {
      throw new Error("Invalid payment type");
    }

    if (paymentType !== "Cash" && !utrNo) {
      throw new Error("UTR number is required for non-cash payments");
    }

    if (!className) {
      throw new Error("Class is required");
    }

    let school = null;

    // ============================
    // ✅ DIRECT SALE (COUNTER)
    // ============================
    if (buyerType === "DIRECT") {
      if (!counterId) {
        throw new Error("Counter is required for direct sale");
      }

      if (!studentName || !fatherName || !mobileNo) {
        throw new Error("Student details required for direct sale");
      }

      const counter = await Counter.findOne({
        _id: counterId,
        branchId
      }).session(session);

      if (!counter) {
        throw new Error("Counter not found");
      }

      school = counter.schoolId;
    }

    // ============================
    // ✅ SCHOOL SALE (BRANCH)
    // ============================
    if (buyerType === "SCHOOL") {
      if (!schoolId) {
        throw new Error("School is required");
      }

      const schoolData = await School.findOne({
        _id: schoolId,
        branchId
      }).session(session);

      if (!schoolData) {
        throw new Error("Invalid school for this branch");
      }

      school = schoolId;
    }

    let calculatedTotal = 0;
    const orderBooks = [];

    // ============================
    // ✅ PROCESS BOOKS
    // ============================
    for (const item of books) {
      const { bookId, quantity, sellPrice } = item;

      if (!bookId) {
        throw new Error("Invalid book ID");
      }

      if (!quantity || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (!sellPrice || sellPrice <= 0) {
        throw new Error("Invalid sell price");
      }

      const book = await Book.findById(bookId).session(session);

      if (!book) {
        throw new Error("Book not found");
      }

      if (sellPrice > book.mrp) {
        throw new Error(`Sell price cannot exceed MRP ₹${book.mrp}`);
      }

      let updatedStock;

      // 👉 DIRECT SALE (Counter Stock)
      if (buyerType === "DIRECT") {
        updatedStock = await CounterStock.findOneAndUpdate(
          {
            branchId,
            counterId,
            bookId,
            quantity: { $gte: quantity }
          },
          { $inc: { quantity: -quantity } },
          { new: true, session }
        );
      }

      // 👉 SCHOOL SALE (Branch Stock)
      if (buyerType === "SCHOOL") {
        updatedStock = await Book.findOneAndUpdate(
          {
            _id: bookId,
            branchId,
            quantity: { $gte: quantity }
          },
          { $inc: { quantity: -quantity } },
          { new: true, session }
        );
      }
      // console.log(updatedStock);

      if (!updatedStock) {
        throw new Error(`Not enough stock for selected book`);
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

    // ============================
    // ✅ CREATE ORDER
    // ============================
    const order = await Order.create(
      [
        {
          branchId,
          schoolId: school,
          counterId: buyerType === "DIRECT" ? counterId : null,
          buyerType,
          studentName,
          fatherName,
          mobileNo,
          className,
          books: orderBooks,
          totalAmount: calculatedTotal,
          billingStatus,
          paymentType,
          utrNo: paymentType !== "Cash" ? utrNo : null
        }
      ],
      { session }
    );

    // ============================
    // ✅ COMMIT TRANSACTION
    // ============================
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(order[0]);

  } catch (err) {
    // ============================
    // ❌ ROLLBACK ON ERROR
    // ============================
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      message: err.message || "Order creation failed"
    });
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

    // console.log(stocks);

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


// Get Order History for Branch to Schools Bulk sale

const getSchoolOrders = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    console.log(branchId);
     console.log("REQ.USER:", req.user);
    console.log("Branch:", branchId);

    // debugging

    console.log("Branch:", branchId);

const orders = await Order.find({ branchId });
console.log("All Orders:", orders);

const schoolOrders = await Order.find({
  branchId,
  buyerType: "SCHOOL"
})
.populate("books.bookId", "bookName sellPrice")
.populate("schoolId", "schoolName")
      .sort({ createdAt: -1 });
;
console.log("School Orders:", schoolOrders);

    // const orders = await Order.find({
    //   branchId,
    //   buyerType: "SCHOOL"   // 🔥 IMPORTANT
    // })
    //   .populate("books.bookId", "bookName sellPrice")
    //   .sort({ createdAt: -1 });

    res.json(schoolOrders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Payment update from Due to Paid

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { billingStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // allow only DUE → PAID
    if (order.billingStatus === "PAID") {
      return res.status(400).json({
        message: "Payment already completed"
      });
    }

    order.billingStatus = billingStatus;

    await order.save();

    res.json({
      success: true,
      message: "Payment status updated"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download Invoice module

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("books.bookId", "bookName")
      .populate("counterId", "name phone email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    /* =============================
       HEADER
    ============================== */

    doc
      .fontSize(16)
      .text(order.counterId?.name || "N K PUBLICATION", {
        align: "center",
      });

    doc
      .fontSize(10)
      .text("Educational Book Distributor", { align: "center" });

    doc
      .fontSize(10)
      .text(
        `Phone: ${order.counterId?.phone || "-"} | Email: ${order.counterId?.email || "-"
        }`,
        { align: "center" }
      );

    doc.moveDown(1);

    doc
      .fontSize(14)
      .text("Student Invoice", { align: "center", underline: true });

    doc.moveDown(2);

    /* =============================
       STUDENT + INVOICE INFO
    ============================== */

    const infoTop = doc.y;

    // LEFT SIDE
    doc.fontSize(10);
    doc.text(`Invoice No : ${order._id}`, 50, infoTop);
    doc.text(`Name : ${order.studentName}`, 50, infoTop + 15);
    doc.text(`Father Name : ${order.fatherName}`, 50, infoTop + 30);

    // RIGHT SIDE
    doc.text(
      `Date : ${new Date(order.createdAt).toLocaleDateString()}`,
      350,
      infoTop
    );
    doc.text(`Class : ${order.className}`, 350, infoTop + 15);
    doc.text(`Mobile : ${order.mobileNo || "-"}`, 350, infoTop + 30);

    /* =============================
       PAYMENT INFO
    ============================== */

    const paymentTop = infoTop + 70;

    doc.text(
      `Billing Status : ${order.billingStatus || "PAID"}`,
      50,
      paymentTop
    );

    doc.text(
      `Payment Type : ${order.paymentType || "-"}`,
      250,
      paymentTop
    );

    doc.text(
      `UTR No : ${order.utrNo || "-"}`,
      420,
      paymentTop
    );

    /* =============================
       TABLE
    ============================== */

    const tableTop = paymentTop + 40;

    const col1 = 55;
    const col2 = 90;
    const col3 = 350;
    const col4 = 420;
    const col5 = 490;

    const tableWidth = 500;
    const rowHeight = 20;

    // HEADER TEXT
    doc.fontSize(10).text("S.No", col1, tableTop);
    doc.text("Particular", col2, tableTop);
    doc.text("Qty", col3, tableTop);
    doc.text("Rate", col4, tableTop);
    doc.text("Amount", col5, tableTop);

    // HEADER BORDER
    doc.rect(50, tableTop - 5, tableWidth, rowHeight).stroke();

    // HEADER COLUMN LINES
    doc.moveTo(col2 - 10, tableTop - 5).lineTo(col2 - 10, tableTop + 15).stroke();
    doc.moveTo(col3 - 10, tableTop - 5).lineTo(col3 - 10, tableTop + 15).stroke();
    doc.moveTo(col4 - 10, tableTop - 5).lineTo(col4 - 10, tableTop + 15).stroke();
    doc.moveTo(col5 - 10, tableTop - 5).lineTo(col5 - 10, tableTop + 15).stroke();

    let y = tableTop + 20;

    /* =============================
       TABLE ROWS
    ============================== */

    order.books.forEach((item, index) => {

      // ROW BORDER
      doc.rect(50, y - 5, tableWidth, rowHeight).stroke();

      doc.text(index + 1, col1, y);

      doc.text(item.bookId?.bookName || "-", col2, y);

      doc.text(item.quantity, col3, y, {
        width: 40,
        align: "center",
      });

      doc.text(item.price.toFixed(2), col4, y, {
        width: 50,
        align: "right",
      });

      doc.text(item.total.toFixed(2), col5, y, {
        width: 60,
        align: "right",
      });

      // COLUMN LINES
      doc.moveTo(col2 - 10, y - 5).lineTo(col2 - 10, y + 15).stroke();
      doc.moveTo(col3 - 10, y - 5).lineTo(col3 - 10, y + 15).stroke();
      doc.moveTo(col4 - 10, y - 5).lineTo(col4 - 10, y + 15).stroke();
      doc.moveTo(col5 - 10, y - 5).lineTo(col5 - 10, y + 15).stroke();

      y += rowHeight;
    });

    /* =============================
       TOTAL SECTION
    ============================== */

    doc.moveTo(350, y + 5).lineTo(550, y + 5).stroke();

    doc
      .fontSize(11)
      .text(`Grand Total : Rs. ${order.totalAmount}`, 420, y + 15);

    /* =============================
       FOOTER
    ============================== */

    doc.moveDown(3);
    doc.x = 50;

    doc
      .fontSize(9)
      .text("Thank you for your purchase.", {
        align: "center",
        width: 500,
      });

    doc
      .text("This is a computer generated invoice.", {
        align: "center",
        width: 500,
      });

    doc.end();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { createOrder, getAvailableBooksAtCounter, getOrdersByCounter, getSchoolOrders, updatePaymentStatus, downloadInvoice };
