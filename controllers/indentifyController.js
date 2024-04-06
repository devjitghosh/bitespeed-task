const database = require('../database');

const identifyController = async (req, res, next) => {
  const matchedContacts = await database.getContacts(req.body);
  console.log('matchedContacts:', matchedContacts);
  let primaryContacts = [];
  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];
  if (req.body.email) {
    emails.push(req.body.email);
  }
  if (req.body.phoneNumber) {
    phoneNumbers.push(req.body.phoneNumber);
  }
  matchedContacts.forEach((element) => {
    if (element.email) emails.push(element.email);
    if (element.phoneNumber) phoneNumbers.push(element.phoneNumber);
    if (element.linkPrecedence === 'secondary')
      secondaryContactIds.push(element.id);
  });

  if (matchedContacts.length) {
    primaryContacts = matchedContacts.filter(
      (item) => item.linkPrecedence === 'primary'
    );
    console.log('primaryContacts', primaryContacts);
  }
  let linkPrecedence = 'primary';
  let linkedId = null;
  if (primaryContacts.length !== 0) {
    linkPrecedence = 'secondary';
    linkedId = primaryContacts[0].id;
  }
  const contact = {
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    linkedId,
    linkPrecedence,
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
  const insertedContact = await database.insertContact(contact);
  console.log('insertedContact:', insertedContact);
  if (matchedContacts.length) {
    secondaryContactIds.push(insertedContact.insertId);
  }
  res.status(200).json({
    contact: {
      primaryContatctId: linkedId || insertedContact.insertId,
      emails: [...new Set(emails)], // first element being email of primary contact
      phoneNumbers: [...new Set(phoneNumbers)], // first element being phoneNumber of primary contact
      secondaryContactIds: secondaryContactIds, // Array of all Contact IDs that are "secondary" to the primary contact
    },
  });
};

module.exports = identifyController;
