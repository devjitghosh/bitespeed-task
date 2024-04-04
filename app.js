const express = require('express');
const bodyparser = require('body-parser');
const router = require('./routes');
const app = express();

app.use(bodyparser.json());

app.use(router);

app.use('/ping', (req, res, next) => {
  res.status(200).json({
    message: 'pong',
  });
});

app.use('*', (req, res, next) => {
  res.status(404).json({
    message: 'path not found',
  });
});

module.exports = app;
