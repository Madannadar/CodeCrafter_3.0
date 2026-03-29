const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/codecrafters_db', { // Wait, the connection string is in `.env`
  });
}
run();
