const Order = require("../models/Order.model");
const CounterStock = require("../models/CounterStock.model");
const Counter = require("../models/Counter.model");
const Book = require("../models/Book.model");
const PDFDocument = require("pdfkit");

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
      books,
      billingStatus,
      paymentType,
      utrNo
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
      // Check payment status and type of payment

      if (!["PAID", "DUE"].includes(billingStatus)) {
        return res.status(400).json({ message: "Invalid billing status" });
      }

      if (!["PhonePe", "GooglePay", "Paytm", "NetBanking", "Cash"].includes(paymentType)) {
        return res.status(400).json({ message: "Invalid payment type" });
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
      totalAmount: calculatedTotal,
      billingStatus,
      paymentType,
      utrNo
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

      // const downloadInvoice = async (req, res) => {
      //   try {
      //     const { orderId } = req.params;

      //     const order = await Order.findById(orderId)
      //       .populate("books.bookId", "bookName");

      //     if (!order) {
      //       return res.status(404).json({ message: "Order not found" });
      //     }

      //     const doc = new PDFDocument({ margin: 40 });

      //     res.setHeader("Content-Type", "application/pdf");
      //     res.setHeader(
      //       "Content-Disposition",
      //       `attachment; filename=invoice-${order._id}.pdf`
      //     );

      //     doc.pipe(res);

      //     // ===== HEADER =====
      //     doc.fontSize(20).text("N K Publication", { align: "center" });
      //     doc.moveDown();
      //     doc.fontSize(14).text("Invoice Receipt");
      //     doc.moveDown();

      //     doc.fontSize(12).text(`Invoice ID: ${order._id}`);
      //     doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      //     doc.moveDown();

      //     doc.text(`Student: ${order.studentName || "-"}`);
      //     doc.text(`Father Name: ${order.fatherName || "-"}`);
      //     doc.text(`Class: ${order.className || "-"}`);
      //     doc.moveDown();

      //     // ===== TABLE HEADER =====
      //     doc.text("------------------------------------------------------------");
      //     doc.text("Book Name        Qty        Price        Total");
      //     doc.text("------------------------------------------------------------");

      //     order.books.forEach(item => {
      //       doc.text(
      //         `${item.bookId?.bookName}    ${item.quantity}        ₹${item.price}        ₹${item.total}`
      //       );
      //     });

      //     doc.text("------------------------------------------------------------");
      //     doc.moveDown();

      //     doc.fontSize(14).text(`Grand Total: ₹ ${order.totalAmount}`, {
      //       align: "right"
      //     });

      //     doc.end();

      //   } catch (err) {
      //     res.status(500).json({ message: err.message });
      //   }
      // };

//       const downloadInvoice = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate("books.bookId", "bookName");

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const doc = new PDFDocument({ margin: 50 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order._id}.pdf`
//     );

//     doc.pipe(res);

//     // ===== HEADER =====
//     doc
//       .fontSize(22)
//       .text("N K Publication", { align: "center" });

//     doc
//       .fontSize(12)
//       .text("Educational Book Distributor", { align: "center" });

//     doc.moveDown(2);

//     // ===== INVOICE TITLE =====
//     doc
//       .fontSize(16)
//       .text("INVOICE RECEIPT", { align: "center", underline: true });

//     doc.moveDown(2);

//     // ===== INVOICE DETAILS =====
//     doc.fontSize(11);

//     doc.text(`Invoice ID : ${order._id}`);
//     doc.text(`Date : ${new Date(order.createdAt).toLocaleDateString()}`);
//     doc.text(`Billing Status : ${order.billingStatus}`);
//  doc.text(`Billing Status : ${order.status || "PAID"}`);
  //  doc.moveDown();

//     // ===== CUSTOMER DETAILS =====
//     doc.text(`Student Name : ${order.studentName || "-"}`);
//     doc.text(`Father Name : ${order.fatherName || "-"}`);
//     doc.text(`Mobile No : ${order.mobileNo || "-"}`);
      // doc.text(`Mobile No : ${order.mobile || "-"}`);
//     doc.text(`Class : ${order.className || "-"}`);

//     doc.moveDown();

//     // ===== PAYMENT DETAILS =====
//     doc.text(`Payment Type : ${order.paymentType}`);
//     doc.text(`UTR No : ${order.utrNo || "-"}`);
    //   doc.text(`Payment Type : ${order.paymentMethod || "-"}`);
    // doc.text(`UTR No : ${order.utrNumber || "-"}`);

//     doc.moveDown(2);

//     // ===== TABLE HEADER =====
//     const tableTop = doc.y;

//     doc
//       .fontSize(12)
//       .text("Book Name", 50, tableTop)
//       .text("Qty", 300, tableTop)
//       .text("Price", 350, tableTop)
//       .text("Total", 420, tableTop);

//     doc.moveDown();

//     doc.text("------------------------------------------------------------------");

//     // ===== BOOK ITEMS =====
//     order.books.forEach((item, index) => {

//       const y = doc.y + 5;

//       doc
//         .fontSize(11)
//         .text(item.bookId?.bookName || "-", 50, y)
//         .text(item.quantity, 300, y)
//         .text(`Rs. ${item.price}`, 350, y)
//         .text(`Rs. ${item.total}`, 420, y);

//       doc.moveDown();
//     });

//     doc.text("------------------------------------------------------------------");

//     doc.moveDown(2);

//     // ===== GRAND TOTAL =====
//     doc
//       .fontSize(14)
//       .text(`Grand Total : Rs. ${order.totalAmount}`, {
//         align: "right"
//       });

//     doc.moveDown(3);

//     // ===== FOOTER =====
//     doc
//       .fontSize(11)
//       .text("Thank you for your purchase!", { align: "center" });

//     doc
//       .fontSize(10)
//       .text("N K Publication", { align: "center" });

//     doc.end();

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const downloadInvoice = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate("books.bookId", "bookName");

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const doc = new PDFDocument({ margin: 50 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order._id}.pdf`
//     );

//     doc.pipe(res);

//     /* =============================
//         HEADER
//     ============================== */

//     doc
//       .fontSize(22)
//       .text("N K Publication", { align: "center" });

//     doc
//       .fontSize(11)
//       .text("Educational Book Distributor", { align: "center" });

//     doc.moveDown();

//     doc
//       .fontSize(16)
//       .text("INVOICE RECEIPT", { align: "center", underline: true });

//     doc.moveDown(2);

//     /* =============================
//         INVOICE INFO
//     ============================== */

//     doc.fontSize(11);

//     doc.text(`Invoice ID : ${order._id}`);
//     doc.text(`Date : ${new Date(order.createdAt).toLocaleDateString()}`);
//     doc.text(`Billing Status : ${order.billingStatus || "PAID"}`);

//     doc.moveDown();

//     doc.text(`Student Name : ${order.studentName}`);
//     doc.text(`Father Name : ${order.fatherName}`);
//     doc.text(`Mobile No : ${order.mobileNo || "-"}`);
//     doc.text(`Class : ${order.className}`);

//     doc.moveDown();

//     doc.text(`Payment Type : ${order.paymentType || "-"}`);
//     doc.text(`UTR No : ${order.utrNo || "-"}`);

//     doc.moveDown(2);

//     /* =============================
//         TABLE HEADER
//     ============================== */

//     const tableTop = doc.y;

//     const itemX = 50;
//     const qtyX = 350;
//     const priceX = 420;
//     const totalX = 500;

//     doc
//       .fontSize(12)
//       .text("Book Name", itemX, tableTop)
//       .text("Qty", qtyX, tableTop)
//       .text("Price", priceX, tableTop)
//       .text("Total", totalX, tableTop);

//     doc.moveTo(50, tableTop + 15)
//       .lineTo(550, tableTop + 15)
//       .stroke();

//     /* =============================
//         TABLE ROWS
//     ============================== */

//     let y = tableTop + 30;

//     order.books.forEach((item) => {
//       doc
//         .fontSize(11)
//         .text(item.bookId?.bookName || "-", itemX, y)
//         .text(item.quantity, qtyX, y)
//         .text(`Rs. ${item.price}`, priceX, y)
//         .text(`Rs. ${item.total}`, totalX, y);

//       y += 20;
//     });

//     /* =============================
//         TOTAL SECTION
//     ============================== */

//     doc.moveTo(350, y + 10)
//       .lineTo(550, y + 10)
//       .stroke();

//     doc
//       .fontSize(13)
//       .text(`Grand Total : Rs. ${order.totalAmount}`, 350, y + 20);

//     /* =============================
//         FOOTER
//     ============================== */

//     doc.moveDown(4);

//     doc
//       .fontSize(10)
//       .text("Thank you for your purchase!", { align: "center" });

//     doc
//       .fontSize(9)
//       .text("This is a computer generated receipt.", { align: "center" });

//     doc.end();

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// const PDFDocument = require("pdfkit");

// const downloadInvoice = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate("books.bookId", "bookName");

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const doc = new PDFDocument({ margin: 40 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order._id}.pdf`
//     );

//     doc.pipe(res);

//     /* =============================
//        HEADER (School Style)
//     ============================== */

//     doc
//       .fontSize(16)
//       .text("N K PUBLICATION", { align: "center", bold: true });

//     doc
//       .fontSize(10)
//       .text("Educational Book Distributor", { align: "center" });

//     doc
//       .fontSize(10)
//       .text("Phone: 9876543210 | Email: nkpublication@gmail.com", {
//         align: "center",
//       });

//     doc.moveDown(1);

//     doc
//       .fontSize(14)
//       .text("Student Invoice", { align: "center", underline: true });

//     doc.moveDown(2);

//     /* =============================
//        STUDENT + INVOICE INFO
//     ============================== */

//     const infoTop = doc.y;

//     // LEFT SIDE
//     doc.fontSize(10);
//     doc.text(`Invoice No : ${order._id}`, 50, infoTop);
//     doc.text(`Name : ${order.studentName}`, 50, infoTop + 15);
//     doc.text(`Father Name : ${order.fatherName}`, 50, infoTop + 30);

//     // RIGHT SIDE
//     doc.text(
//       `Date : ${new Date(order.createdAt).toLocaleDateString()}`,
//       350,
//       infoTop
//     );
//     doc.text(`Class : ${order.className}`, 350, infoTop + 15);
//     doc.text(`Mobile : ${order.mobileNo || "-"}`, 350, infoTop + 30);

//     doc.moveDown(3);

//     /* =============================
//        TABLE
//     ============================== */

//     const tableTop = doc.y;

//     const col1 = 50;   // S.no
//     const col2 = 90;   // Particular
//     const col3 = 350;  // Qty
//     const col4 = 420;  // Rate
//     const col5 = 500;  // Amount

//     doc.fontSize(10).text("S.no", col1, tableTop);
//     doc.text("Particular", col2, tableTop);
//     doc.text("Qty", col3, tableTop);
//     doc.text("Rate", col4, tableTop);
//     doc.text("Amount", col5, tableTop);

//     doc.moveTo(50, tableTop + 12)
//       .lineTo(550, tableTop + 12)
//       .stroke();

//     let y = tableTop + 20;

//     /* =============================
//        TABLE ROWS
//     ============================== */

//     order.books.forEach((item, index) => {

//       doc.text(index + 1, col1, y);
//       doc.text(item.bookId?.bookName || "-", col2, y);
//       doc.text(item.quantity, col3, y);
//       doc.text(item.price.toFixed(2), col4, y);
//       doc.text(item.total.toFixed(2), col5, y);

//       y += 18;
//     });

//     /* =============================
//        TOTAL SECTION
//     ============================== */

//     doc.moveTo(350, y + 5)
//       .lineTo(550, y + 5)
//       .stroke();

//     doc
//       .fontSize(11)
//       .text(`Grand Total : Rs. ${order.totalAmount}`, 420, y + 15);

//     doc.moveDown(3);

//     /* =============================
//        FOOTER
//     ============================== */

//     doc
//       .fontSize(9)
//       .text("Thank you for your purchase.", { align: "center" });

//     doc
//       .text("This is a computer generated invoice.", {
//         align: "center",
//       });

//     doc.end();

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// const PDFDocument = require("pdfkit");
// const path = require("path");

// const downloadInvoice = async (req, res) => {
//   try {

//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate("books.bookId", "bookName");

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const doc = new PDFDocument({ margin: 40, size: "A4" });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order._id}.pdf`
//     );

//     doc.pipe(res);

//     /* ==============================
//        HEADER SECTION
//     ============================== */

//     // Optional logo
//     // const logo = path.join(__dirname, "../public/logo.png");
//     // doc.image(logo, 40, 40, { width: 60 });

//     doc
//       .fontSize(18)
//       .text("N K PUBLICATION", 0, 40, { align: "center" });

//     doc
//       .fontSize(10)
//       .text("Educational Book Distributor", { align: "center" });

//     doc
//       .fontSize(9)
//       .text("Jaipur, Rajasthan | Phone: 9876543210", { align: "center" });

//     doc.moveDown(2);

//     /* ==============================
//        INVOICE TITLE
//     ============================== */

//     doc
//       .fontSize(16)
//       .text("INVOICE", { align: "center", underline: true });

//     doc.moveDown(2);

//     /* ==============================
//        CUSTOMER + INVOICE INFO
//     ============================== */

//     const startY = doc.y;

//     // LEFT
//     doc.fontSize(10);
//     doc.text(`Student Name : ${order.studentName}`, 50, startY);
//     doc.text(`Father Name  : ${order.fatherName}`, 50, startY + 15);
//     doc.text(`Class        : ${order.className}`, 50, startY + 30);
//     doc.text(`Mobile       : ${order.mobileNo || "-"}`, 50, startY + 45);

//     // RIGHT
//     doc.text(`Invoice No : ${order._id}`, 350, startY);
//     doc.text(
//       `Date       : ${new Date(order.createdAt).toLocaleDateString()}`,
//       350,
//       startY + 15
//     );
//     doc.text(`Payment    : ${order.paymentType}`, 350, startY + 30);
//     doc.text(`Status     : ${order.billingStatus || "PAID"}`, 350, startY + 45);

//     doc.moveDown(4);

//     /* ==============================
//        TABLE
//     ============================== */

//     const tableTop = doc.y;

//     const col1 = 50;
//     const col2 = 90;
//     const col3 = 350;
//     const col4 = 420;
//     const col5 = 500;

//     // Table Header Background
//     doc.rect(50, tableTop - 5, 500, 20).stroke();

//     doc.fontSize(10);

//     doc.text("S.No", col1, tableTop);
//     doc.text("Particular", col2, tableTop);
//     doc.text("Qty", col3, tableTop);
//     doc.text("Rate", col4, tableTop);
//     doc.text("Amount", col5, tableTop);

//     let y = tableTop + 20;

//     /* ==============================
//        TABLE ROWS
//     ============================== */

//     order.books.forEach((item, index) => {

//       doc.text(index + 1, col1, y);
//       doc.text(item.bookId?.bookName || "-", col2, y);
//       doc.text(item.quantity, col3, y);
//       doc.text(item.price.toFixed(2), col4, y);
//       doc.text(item.total.toFixed(2), col5, y);

//       y += 18;

//       doc.moveTo(50, y)
//         .lineTo(550, y)
//         .stroke();
//     });

//     /* ==============================
//        TOTAL BOX
//     ============================== */

//     y += 10;

//     doc.rect(350, y, 200, 30).stroke();

//     doc
//       .fontSize(12)
//       .text(`Grand Total : Rs. ${order.totalAmount}`, 370, y + 10);

//     doc.moveDown(4);

//     /* ==============================
//        SIGNATURE
//     ============================== */

//     doc.text("Authorized Signature", 420, doc.y + 20);

//     doc.moveTo(400, doc.y + 35)
//       .lineTo(550, doc.y + 35)
//       .stroke();

//     doc.moveDown(4);

//     /* ==============================
//        FOOTER
//     ============================== */

//     doc
//       .fontSize(9)
//       .text("Thank you for your purchase!", { align: "center" });

//     doc
//       .text("This is a computer generated invoice.", { align: "center" });

//     doc.end();

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const PDFDocument = require("pdfkit");

//   const downloadInvoice = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate("books.bookId", "bookName").populate("counterId", "name email mobileNo");

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const doc = new PDFDocument({ margin: 40 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order._id}.pdf`
//     );

//     doc.pipe(res);

//    
//     /* =============================
//        HEADER
//     ============================== */

//     doc
//       .fontSize(16)
//       .text(order.counterId?.name || "N K PUBLICATION", { align: "center" });

//     doc
//       .fontSize(10)
//       .text("Educational Book Distributor", { align: "center" });

//     doc
//       .fontSize(10)
//       .text(`Phone No.: ${order.counterId?.mobileNo}  | Email: ${order.counterId?.email}` || "Phone: 0000000000  | Email: ", {align: "center",});

//     doc.moveDown(1);

//     doc
//       .fontSize(14)
//       .text("Student Invoice", { align: "center", underline: true });

//     doc.moveDown(2);

//     /* =============================
//        STUDENT + INVOICE INFO
//     ============================== */

//     const infoTop = doc.y;

//     // LEFT SIDE
//     doc.fontSize(10);
//     doc.text(`Invoice No : ${order._id}`, 50, infoTop);
//     doc.text(`Name : ${order.studentName}`, 50, infoTop + 15);
//     doc.text(`Father Name : ${order.fatherName}`, 50, infoTop + 30);

//     // RIGHT SIDE
//     doc.text(
//       `Date : ${new Date(order.createdAt).toLocaleDateString()}`,
//       350,
//       infoTop
//     );
//     doc.text(`Class : ${order.className}`, 350, infoTop + 15);
//     doc.text(`Mobile : ${order.mobileNo || "-"}`, 350, infoTop + 30);

//     /* =============================
//        PAYMENT INFO
//     ============================== */

//     const paymentTop = infoTop + 70;

//     doc.text(
//       `Billing Status : ${order.billingStatus || "PAID"}`,
//       50,
//       paymentTop
//     );

//     doc.text(
//       `Payment Type : ${order.paymentType || "-"}`,
//       250,
//       paymentTop
//     );

//     doc.text(
//       `UTR No : ${order.utrNo || "-"}`,
//       420,
//       paymentTop
//     );

//     doc.moveDown(4);

//     /* =============================
//        TABLE
//     ============================== */

//     const tableTop = paymentTop + 30;

//     const col1 = 50;   // S.no
//     const col2 = 90;   // Particular
//     const col3 = 350;  // Qty
//     const col4 = 420;  // Rate
//     const col5 = 500;  // Amount

//     doc.fontSize(10).text("S.no", col1, tableTop);
//     doc.text("Particular", col2, tableTop);
//     doc.text("Qty", col3, tableTop);
//     doc.text("Rate", col4, tableTop);
//     doc.text("Amount", col5, tableTop);

//     // doc.moveTo(50, tableTop + 12)
//     //   .lineTo(550, tableTop + 12)
//     //   .stroke();

//     let y = tableTop + 20;

//     /* =============================
//        TABLE ROWS
//     ============================== */

//     order.books.forEach((item, index) => {

//       doc.text(index + 1, col1, y);
//       doc.text(item.bookId?.bookName || "-", col2, y);
//       doc.text(item.quantity, col3, y);
//       doc.text(item.price.toFixed(2), col4, y);
//       doc.text(item.total.toFixed(2), col5, y);

//       y += 18;
//     });

//     /* =============================
//        TOTAL SECTION
//     ============================== */

//     doc.moveTo(350, y + 5)
//       .lineTo(550, y + 5)
//       .stroke();

//     doc
//       .fontSize(11)
//       .text(`Grand Total : Rs. ${order.totalAmount}`, 420, y + 15);

//     doc.moveDown(3);

//     /* =============================
//        FOOTER
//     ============================== */

//     doc.moveDown(3);
// doc.x = 50;

// doc
//   .fontSize(9)
//   .text("Thank you for your purchase.", {
//     align: "center",
//     width: 500
//   });

// doc
//   .text("This is a computer generated invoice.", {
//     align: "center",
//     width: 500
//   });

//     doc.end();

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };




// const PDFDocument = require("pdfkit");
// const Order = require("../models/Order");

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
        `Phone: ${order.counterId?.phone || "-"} | Email: ${
          order.counterId?.email || "-"
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


module.exports = { createOrder, getAvailableBooksAtCounter, getOrdersByCounter, updatePaymentStatus, downloadInvoice };
