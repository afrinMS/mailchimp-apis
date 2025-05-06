require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { createServer } = require("node:http");
const Mailchimp = require("./routes/MailchimpRouter");

const PORT = process.env.PORT || 3000;
require("./database/connection");

// Set limits for raw data, JSON, and URL encoded data
app.use("/yourApp-app-webhooks", express.raw({ type: "*/*", limit: "500mb" }));
app.use(express.json({ limit: "100mb" }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

app.use(cors());

const server = createServer(app);

///New Code///
let users = {};

// Middleware to add io to req
app.use((req, res, next) => {
  req.io = io;
  req.users = users;
  next();
});

app.use(Mailchimp);

server.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));