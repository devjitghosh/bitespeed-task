const mysql = require('mysql2');

const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  })
  .promise();

exports.getContacts = async ({ email, phoneNumber }) => {
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

  console.log('records', records);
  let primaryContacts = [];
  if (records.length) {
    primaryContacts = records.filter(
      (item) => item.linkPrecedence === 'primary'
    );
    console.log('primaryContactsDB', primaryContacts);
  }

  //if there are more than two primary contact
  if (primaryContacts.length === 2) {
    try {
      const [results] = await pool.query(
        'UPDATE contacts SET linkedId=?, linkPrecedence="secondary", updatedAt=? WHERE id=?',
        [
          primaryContacts[0].id,
          new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' '),
          primaryContacts[1].id,
        ]
      );
      linkedRecords = results;
    } catch (error) {
      console.error('Error updating contacts:', error);
    }
  }

  let primaryId;
  if (primaryContacts.length) {
    primaryId = primaryContacts[0].id;
  } else {
    if (records.length) primaryId = records[0].linkedId;
  }
  console.log('primaryId', primaryId);
  if (!primaryId) return [];

  let linkedRecords = [];
  try {
    const [results] = await pool.query(
      'SELECT * FROM contacts WHERE linkedId=? OR id=?',
      [primaryId, primaryId]
    );
    linkedRecords = results;
  } catch (error) {
    console.error('Error fetching contacts:', error);
  }

  console.log('linkedRecords', linkedRecords);
  return linkedRecords;
};

exports.insertContact = async (contact) => {
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
  return records;
};
