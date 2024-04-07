const database = require('../database');

const getResponseData = (contacts) => {
  let primaryContatctId;
  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];
  contacts.forEach((element) => {
    if (element.linkPrecedence === 'primary') {
      primaryContatctId = element.id;
    } else {
      secondaryContactIds.push(element.id);
    }
    if (element.email) emails.push(element.email);
    if (element.phoneNumber) phoneNumbers.push(element.phoneNumber);
  });
  const emailsAndPhoneNumbers = [
    [...new Set(emails)],
    [...new Set(phoneNumbers)],
  ];
  // return emailsAndPhoneNumbers;
  return {
    primaryContatctId,
    emails: [...new Set(emails)],
    phoneNumbers: [...new Set(phoneNumbers)],
    secondaryContactIds,
  };
};

const identifyController = async (req, res, next) => {
  const matchedContacts = await database.getContacts(req.body);
  console.log('matchedContacts:', matchedContacts);
  const responseData = getResponseData(matchedContacts);

  res.status(200).json({
    contact: responseData,
  });
};

module.exports = identifyController;
