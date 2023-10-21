const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const productRouter = require("./routes/productRoute");

dotenv.config({ path: "./config.env" });
const app = express();
app.enable("trust proxy");
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use("/api/v1", (req, res, next) => {
  console.log("hello from App Middleware");
  next();
});

app.use("/api/v1/products", productRouter);

module.exports = app;
