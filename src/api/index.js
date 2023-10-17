require('dotenv').config({ path: '../../.env' });

const cors = require('cors');

const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

const { API_HOST } = process.env;
const { API_PORT } = process.env;

const apiRouter = require('./routes/api');

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.use('/api', apiRouter);

app.use('*', (req, res, next) => {
  const errorObj = {
    log: 'Page not found',
    status: 404,
    message: { err: 'Error 404: Page not Found' },
  };
  next(errorObj);
});

app.use((err, req, res, next) => {
  const defaultErr = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  };

  const errorObj = Object.assign(defaultErr, err);
  console.error(errorObj.log);

  res.status(errorObj.status).json(errorObj.message);
});

app.listen(API_PORT, API_HOST, () => {
  console.log(`Server listening on ${API_HOST}:${API_PORT}`);
});
