const mysql = require('mysql2');

const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  })
  .promise();

exports.getContactsByEmailOrPhone = async (email, phoneNumber) => {
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

exports.insertNewContact = async (
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

exports.getContactsByPrimaryId = async (primaryId) => {
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

exports.updatePrimaryContact = async (firstPrimaryId, secondPrimaryId) => {
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
    console.error('Error while updating contact:', error);
    return [];
  }
};
