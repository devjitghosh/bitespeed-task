const database = require('../database');

const identifyController = async (req, res, next) => {
  const data = await database.getAllContacts();
  console.log('data:', data);
  console.log('req body:', req.body);
  const contact = {
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    linkedId: null,
    linkPrecedence: 'primary',
    createdAt: new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace('T', ' '),
    updatedAt: new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace('T', ' '),
    deletedAt: null,
  };
  const insertData = await database.insertContact(contact);
  console.log('insertData:', insertData);
  res.status(200).json({
    message: 'success',
  });
};

module.exports = identifyController;
