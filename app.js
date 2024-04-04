const express = require("express");
const app = express();

app.use("/ping", (req, res, next) => {
  res.status(200).json({
    message: "pong",
  });
});

module.exports = app;
