const identifyController = (req, res, next) => {
  console.log('req body:', req.body);
  res.status(200).json({
    message: 'success',
  });
};

module.exports = identifyController;
