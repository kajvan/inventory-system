const express = require("express");
const dailyUpdate = require("./dailyUpdate");
const mongoose = require("mongoose");
const cors = require("cors");
const mysql = require("mysql");
const migration = require("mysql-migrations");
require("dotenv").config();

const connection = mysql.createPool({
    connectionLimit : 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

migration.init(connection, __dirname + '/migrations', function() {
    console.log("finished running migrations");
});

// set up express
const app = express();
app.use(express.json());
app.use(cors());

// this variable is for online hosting like heroku or our localhost:5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`The server has started on port: ${PORT}`));

// set up mongoose
mongoose.connect(
  process.env.MONGODB_CONNECTION_STRING,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (error) => {
    if (error) throw error;
    console.log("MongoDB connection established");
  }
);

//if time is 00:00:00, run dailyUpdate
const time = new Date();
if (time.getHours() === 0 && time.getMinutes() === 0 && time.getSeconds() === 0) {
  dailyUpdate();
}

app.use("/users", require('./routes/userRouter'));
app.use("/products", require('./routes/productRouter'));