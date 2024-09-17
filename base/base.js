const sqlite3 = require('sqlite3')

let base = new sqlite3.Database('./base/base.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

module.exports = base