const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/testRoutes");
const schoolRoutes = require("./routes/school.routes");
const branchRoutes = require("./routes/branch.routes");
const booksRoutes = require("./routes/book.routes");
const counterRoutes = require("./routes/counter.routes");
const counterStockRoutes = require("./routes/counterStock.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

app.use("/api/schools", schoolRoutes); // add school
app.use("/api/branches", schoolRoutes); // get school list

app.use("/api/branches", branchRoutes);

app.use("/api/books", booksRoutes);     // add books
app.use("/api/branches", booksRoutes);  // get books list

app.use("/api/counters", counterRoutes); // add counter
app.use("/api/branches", counterRoutes); // get counter list

app.use("/api/counter-stock", counterStockRoutes);



app.get("/", (req,resp) => {
    resp.send("ERP API Running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

module.exports = app;

