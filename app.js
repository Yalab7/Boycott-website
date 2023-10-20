const dotenv = require('dotenv');
const express = require('express');


dotenv.config({ path: './config.env' });
const app = express();

app.use('/api/v1', (req, res, next) => {
    console.log('hello from Major App Middleware');
    next();
  });

module.exports = app;