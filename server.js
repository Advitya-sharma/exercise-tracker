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
});


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
    if (!dateValidator(date)) {
      res.send("enter valid date");
      return;
    }
  } else {
    date = new Date();
  }

  date = date.toString().substring(0, 15);

  userInfo.findById(userId, function (err, user) {
    if (err) throw err;
    user.log.push({
      description: description,
      duration: duration,
      date: date
    });
    user.save(function (err, user) {
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

let dateValidator = obj => {
  return obj instanceof Date && !isNaN(obj);
};

let logProcessing = (log, to, from, limit) => {
  if (limit < 0) {
    limit = 0;
  }

  if (dateValidator(to) && dateValidator(from)) {
    return log
      .filter(
        date => new Date(date["date"]) >= from && new Date(date["date"]) <= to
      )
      .slice(0, limit);
  } else if (dateValidator(from)) {
    return log.filter(date => new Date(date["date"]) >= from).slice(0, limit);
  } else if (dateValidator(to)) {
    return log.filter(date => new Date(date["date"]) <= to).slice(0, limit);
  } else {
    return log.slice(0, limit);
  }
};

app.get("/api/exercise/log", (req, res) => {
  const userId = req.query.userId;
  const to = new Date(req.query.to);
  const from = new Date(req.query.from);
  const limit = req.query.limit;
  let doc;

  console.log(limit);

  if (!userId) {
    res.send("enter user id");
  } else {
    userInfo.findById(userId, (err, data) => {
      if (err) {
        return err;
      } else {
        doc = {
          _id: data._id,
          username: data.username,
          count: logProcessing(data.log, to, from, limit).length,
          log: logProcessing(data.log, to, from, limit),
        };
        res.json(doc);
      }
    });
  }
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

