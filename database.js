const e = require('express');
const mysql = require('mysql2');

const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  })
  .promise();

const getContactsByEmailOrPhone = async (email, phoneNumber) => {
  let records = [];
  try {
    if (phoneNumber || email) {
      if (phoneNumber && email) {
        const [results] = await pool.query(
          'SELECT * FROM contacts WHERE phoneNumber=? OR email=? ORDER BY createdAt ASC',
          [phoneNumber, email]
        );
        records = results;
      } else if (phoneNumber) {
        const [results] = await pool.query(
          'SELECT * FROM contacts WHERE phoneNumber=? ORDER BY createdAt ASC',
          [phoneNumber]
        );
        records = results;
      } else if (email) {
        const [results] = await pool.query(
          'SELECT * FROM contacts WHERE email=? ORDER BY createdAt ASC',
          [email]
        );
        records = results;
      }
    } else {
      const [results] = await pool.query(
        'SELECT * FROM contacts ORDER BY createdAt ASC'
      );
      records = results;
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
  }
  return records;
};

const insertNewContact = async (
  email,
  phoneNumber,
  linkedId,
  linkPrecedence,
  updatedAt
) => {
  const contact = {
    phoneNumber: phoneNumber,
    email: email,
    linkedId,
    linkPrecedence,
    createdAt: new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace('T', ' '),
    updatedAt:
      updatedAt ||
      new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' '),
    deletedAt: null,
  };

  try {
    const [records] = await pool.query(
      'INSERT INTO contacts (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        contact.phoneNumber,
        contact.email,
        contact.linkedId,
        contact.linkPrecedence,
        contact.createdAt,
        contact.updatedAt,
        contact.deletedAt,
      ]
    );
    console.log('GG', records.insertId);
    contact.id = records.insertId;
    return contact;
  } catch (error) {
    console.error('Error in inserting contact:', error);
    return null;
  }
};

const getContactsByPrimaryId = async (primaryId) => {
  try {
    const [records] = await pool.query(
      'SELECT * FROM contacts WHERE linkedId=? OR id=? ORDER BY createdAt ASC',
      [primaryId, primaryId]
    );
    return records;
  } catch (error) {
    console.error('Error while getting contacts linked by primaryId:', error);
    return [];
  }
};

const updatePrimaryContact = async (firstPrimaryId, secondPrimaryId) => {
  try {
    const [records] = await pool.query(
      'UPDATE contacts SET linkedId=?, linkPrecedence="secondary", updatedAt=? WHERE linkedId=? OR id=?',
      [
        firstPrimaryId,
        new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' '),
        secondPrimaryId,
        secondPrimaryId,
      ]
    );
    return records;
  } catch (error) {
    console.error('Error while getting contacts linked by primaryId:', error);
    return [];
  }
};

const getPrimaryIds = (records) => {
  if (records && records.length > 0) {
    const primaryIdArray = records.map(
      (record) => record.linkedId || record.id
    );
    const uniquePrimaryIds = [...new Set(primaryIdArray)];
    console.log('uniqueIds', uniquePrimaryIds);
    return uniquePrimaryIds;
  }
  return null;
};

const extractEamilsAndPhoneNumbers = (contacts) => {
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
};
exports.getContacts = async ({ email, phoneNumber }) => {
  //If only one of Email or PhoneNo is Present
  if (!email || !phoneNumber) {
    const linkedContacts = await getContactsByEmailOrPhone(email, phoneNumber);
    const primaryIds = getPrimaryIds(linkedContacts);
    console.log('linkedContacts', linkedContacts);
    console.log('primaryId', primaryIds);

    //If primaryId is null create new record and return
    if (!primaryIds) {
      const newContact = await insertNewContact(
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
      const linkedContacts = await getContactsByPrimaryId(primaryIds);
      console.log('linkedContacts', linkedContacts);
      return linkedContacts;
    }
  } else {
    //both email and phone no is there
    const linkedContacts = await getContactsByEmailOrPhone(email, phoneNumber);

    //if no linked contacts create new contact
    if (linkedContacts.length === 0) {
      const newContact = await insertNewContact(
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
      const contacts = await getContactsByPrimaryId(primaryIds[0]);

      console.log('contacts', contacts);
      const [emails, phoneNumbers] = extractEamilsAndPhoneNumbers(contacts);
      console.log(emails, phoneNumbers);
      //If new info is there create new record
      if (!emails.includes(email) || !phoneNumbers.includes(phoneNumber)) {
        const newContact = await insertNewContact(
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
      let contacts1 = await getContactsByPrimaryId(primaryIds[0]);
      let contacts2 = await getContactsByPrimaryId(primaryIds[1]);
      console.log('contacts1', contacts1);
      console.log('contacts2', contacts2);
      //We need to update the linkedIds and linkPreference for all with primaryIds[1]
      const result = await updatePrimaryContact(primaryIds[0], primaryIds[1]);
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
};
