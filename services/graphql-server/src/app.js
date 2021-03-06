const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const CORS = cors({
  methods: ['GET', 'POST'],
  maxAge: 600,
});

app.use(helmet());
app.use(CORS);
app.options('*', CORS);

routes(app);

module.exports = app;
