// utils/auth.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;
const generateToken = (id, type) => {
  const payload = {
    id,
    type,
  };
  const token = jwt.sign(payload, secretKey, { expiresIn: "7d" });
  return token;
};

module.exports = generateToken;
