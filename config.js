require("dotenv").config();

const config = {
  local: {
    verificationLink: `http://localhost:5173/`,
    backendUrl: `http://localhost:3000/`,
  },
};

module.exports = config[process.env.NODE_ENV || "local"];