require('dotenv').config({ path: 'frontend/.env.local' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  await db.collection('users').updateMany({}, {
    $set: {
      diagnostic_index_exponents: 0,
      diagnostic_completed_exponents: false,
      diagnostic_index_geometry: 0,
      diagnostic_completed_geometry: false,
    }
  });
  console.log("diagnostics reset");
  process.exit();
}
run();
