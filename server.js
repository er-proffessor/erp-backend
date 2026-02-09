require("dotenv").config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error("Missing required environment variables");
}

const app = require("./src/app");

const connectDB = require("./src/config/db");

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`server running on Port ${PORT}`);
});


