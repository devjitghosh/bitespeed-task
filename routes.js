const express = require('express');
const identifyController = require('./controllers/indentifyController');

const router = express.Router();

router.post('/identify', identifyController);

module.exports = router;
