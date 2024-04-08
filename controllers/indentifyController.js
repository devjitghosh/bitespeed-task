const database = require('../database');

const identifyController = async (req, res, next) => {
  const matchedContacts = await getContacts(req.body);
  console.log('matchedContacts:', matchedContacts);
  const responseData = getResponseData(matchedContacts);

  res.status(200).json({
    contact: responseData,
  });
};

async function getContacts({ email, phoneNumber }) {
  //If only one of Email or PhoneNo is Present
  if (!email || !phoneNumber) {
    const linkedContacts = await database.getContactsByEmailOrPhone(
      email,
      phoneNumber
    );
    const primaryIds = getPrimaryIds(linkedContacts);
    console.log('linkedContacts', linkedContacts);
    console.log('primaryId', primaryIds);

    //If primaryId is null create new record and return
    if (!primaryIds) {
      const newContact = await database.insertNewContact(
        email,
        phoneNumber,
        null,
        'primary',
        null
      );
      console.log('newContact', newContact);
      return [newContact];
    } else {
      // Already records exit with same email/phoneNo no need to insert new record
      const linkedContacts = await database.getContactsByPrimaryId(primaryIds);
      console.log('linkedContacts', linkedContacts);
      return linkedContacts;
    }
  } else {
    //both email and phone no is there
    const linkedContacts = await database.getContactsByEmailOrPhone(
      email,
      phoneNumber
    );

    //if no linked contacts create new contact
    if (linkedContacts.length === 0) {
      const newContact = await database.insertNewContact(
        email,
        phoneNumber,
        null,
        'primary',
        null
      );
      console.log('newContact', newContact);
      return [newContact];
    }
    const primaryIds = getPrimaryIds(linkedContacts);
    console.log('linkedContacts', linkedContacts);
    console.log('primaryId', primaryIds);

    //If only one primary id there no further linking requird
    //Fetch all the contacts related to that Id
    //Check if new info is there
    //If new info there insert else return the ftched array
    if (primaryIds.length === 1) {
      const contacts = await database.getContactsByPrimaryId(primaryIds[0]);

      console.log('contacts', contacts);
      const [emails, phoneNumbers] = extractEamilsAndPhoneNumbers(contacts);
      console.log(emails, phoneNumbers);
      //If new info is there create new record
      if (!emails.includes(email) || !phoneNumbers.includes(phoneNumber)) {
        const newContact = await database.insertNewContact(
          email,
          phoneNumber,
          primaryIds[0],
          'secondary',
          null
        );
        console.log('newContact', newContact);
        contacts.push(newContact);
      }
      return contacts;
    }
    //email and phone no links t two differnt primary contacs
    //no need to create new contact
    if (primaryIds.length === 2) {
      let contacts1 = await database.getContactsByPrimaryId(primaryIds[0]);
      let contacts2 = await database.getContactsByPrimaryId(primaryIds[1]);
      console.log('contacts1', contacts1);
      console.log('contacts2', contacts2);
      //We need to update the linkedIds and linkPreference for all with primaryIds[1]
      const result = await database.updatePrimaryContact(
        primaryIds[0],
        primaryIds[1]
      );
      console.log('result', result);
      contacts2 = contacts2.map((contact) => {
        return {
          ...contact,
          linkedId: primaryIds[0],
          linkPrecedence: 'secondary',
        };
      });
      return [...contacts1, ...contacts2];
    }
  }
}

function getResponseData(contacts) {
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
}

function extractEamilsAndPhoneNumbers(contacts) {
  const emails = [];
  const phoneNumbers = [];
  contacts.forEach((element) => {
    if (element.email) emails.push(element.email);
    if (element.phoneNumber) phoneNumbers.push(element.phoneNumber);
  });
  const emailsAndPhoneNumbers = [
    [...new Set(emails)],
    [...new Set(phoneNumbers)],
  ];
  return emailsAndPhoneNumbers;
}

function getPrimaryIds(records) {
  if (records && records.length > 0) {
    const primaryIdArray = records.map(
      (record) => record.linkedId || record.id
    );
    const uniquePrimaryIds = [...new Set(primaryIdArray)];
    console.log('uniqueIds', uniquePrimaryIds);
    return uniquePrimaryIds;
  }
  return null;
}

module.exports = identifyController;
