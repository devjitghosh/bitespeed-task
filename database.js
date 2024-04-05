const mysql = require('mysql2');

const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  })
  .promise();

exports.getAllContacts = async () => {
  const [records] = await pool.query('SELECT * FROM contacts');
  return records;
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
