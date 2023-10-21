const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

//Load config
dotenv.config({ path: ".config.env" });

//Database connection

const DBstring = process.env.DATABASE;

console.log("connecting to DB");

mongoose
  .connect(DBstring, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("DB is connected successfuly!");
  });

//Hosting the server
app.listen(process.env.PORT, () => {
  console.log(`App is running on port ${process.env.PORT}`);
});
