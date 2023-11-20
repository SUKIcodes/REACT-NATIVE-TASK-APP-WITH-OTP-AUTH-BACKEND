const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary");

const router = require("./routes/User");

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use("/api/v1", router);

app.get = (req, res) => {
  res.send("WORKING");
};

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database connection established...");
  })
  .catch((error) => {
    console.log(error.message);
  });

app.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:${process.env.PORT}`);
});
