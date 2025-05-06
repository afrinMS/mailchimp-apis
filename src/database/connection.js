const mysql = require("mysql2/promise");

//for local
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "xxxxxxXXX",
  database: "your_database_name",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "utc",
});

pool
  .getConnection()
  .then((connection) => {
    console.log("Connected to MySQL database!");
    connection.release();
  })
  .catch((error) => {
    console.error("Error connecting to MySQL database:", error.message);
  });

module.exports = pool;
