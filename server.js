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

const logInfoSchema = new Schema(
  {
    description: { type: String, required: true, default: "" },
    duration: { type: Number, required: true, default: 0 },
    date: { type: String }
  },
  { versionKey: false }
);

const userInfoSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    from: { type: String },
    to: { type: String },
    count: { type: Number, default: 0 },
    log: [logInfoSchema]
  },
  { versionKey: false }
);

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
  userInfo.create({ username: username }, (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      res.json({ _id: data._id, username: data.username });
    }
  });

  //   userInfo.find({}, (err, data) => {
  //     if (err) {
  //       return console.error(err);
  //     } else {
  //       console.log("hi");
  //       res.send("h");
  //       console.log(data);
  //     }
  //   });
});

//5f1a25ae38158a0090b104b3

app.post("/api/exercise/add", (req, res) => {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = parseInt(req.body.duration, 0);
  let date;

  if (!userId) {
    res.send("enter userID");
    return;
  }
  if (!description) {
    res.send("enter description");
    return;
  }
  if (!duration) {
    res.send("enter duration");
    return;
  }

  if (req.body.date) {
    date = new Date(req.body.date);
    if (!(date instanceof Date && !isNaN(date))) {
      res.send("enter valid date");
      return;
    }
  } else {
    date = new Date();
  }

  date = date.toString().substring(0, 15);

  userInfo.findByIdAndUpdate(userId, { $inc: { count: 1 } }, (err, data) => {
    if (err) return console.error(err);
  });

  userInfo.findById(userId, function(err, user) {
    if (err) throw err;
    user.log.push({
      description: description,
      duration: duration,
      date: date
    });
    user.save(function(err, user) {
      if (err) console.error(err);
      else {
        res.json({
          _id: user._id,
          username: user.username,
          date: date,
          duration: duration,
          description: description
        });
        return;
      }
    });
  });
});

app.get("/api/exercise/users", (req, res) => {
  userInfo.find({}, (err, data) => {
    if (err) return console.error(err);
    else {
      res.json(data);
      return;
    }
  });
});

app.get("/api/exercise/log", (req, res) => {
  const userId = req.query.userId;
  console.log(userId);
  if (!userId) {
    res.send("enter user id");
  } else {
    userInfo.findById(userId, (err, data) => {
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

console.log(mongoose.connection.readyState);
