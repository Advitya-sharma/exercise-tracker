require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");


//setting up database

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Schema = mongoose.Schema;

const logInfoSchema = new Schema({
  description: { type: String, required: true, default: "" },
  duration: { type: Number, required: true, default: "" },
  date: { type: String }
});

const userInfoSchema = new Schema({
  username: { type: String, required: true, unique: true },
  from: { type: String },
  to: { type: String },
  count: { type: Number },
  log: [logInfoSchema]
});

const userInfo = mongoose.model("userInfo", userInfoSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  const username = req.body.username;

  console.log(username);
  const newUser = new userInfo({ username: username });
  newUser.save(function (err) {
    if (err) {
      console.log(err);
      return;
    }
    res.send("h");
  });

  userInfo.find({}, (err, data) => {
    if (err) {
      return console.error(err);
    } else {
      console.log("hi");
      res.send("h");
      console.log(data);
    }
  });
});

app.post("/api/exercise/new-user", (req, res) => {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = req.body.duration;
  let date;

  if (req.body.date) {
    date = req.body.date;
  } else {
    date = String(new Date()).substring(0, 15);
  }

  userInfo.findById(userId, function (err, user) {
    if (err) throw err;
    userInfo.log.push({
      description: description,
      duration: duration,
      date: date
    });
    userInfo.save(function (err, user) {
      if (err) console.error(err);
    });
  });
});

app.get("/api/exercise/log?userId&from&to&limit", (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    res.send("enter user id");
  } else {
    userInfo.find({ userId: userId }, (err, data) => {
      if (err) {
        return err;
      } else {
        res.json(data);
      }
    });
  }
});

// Not found middleware

// app.use((req, res, next) => {
//   return next({ status: 404, message: "not found" });
// });

//Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
