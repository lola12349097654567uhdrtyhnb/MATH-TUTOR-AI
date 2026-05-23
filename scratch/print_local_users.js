const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://127.0.0.1:27017/tutor_db";

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB local!");
  const users = await User.find({});
  console.log(`Total users: ${users.length}`);
  users.forEach(u => {
    console.log(`- Username: ${u.username}, Email: ${u.email || '(none)'}, Role: ${u.role}`);
  });
  process.exit(0);
}

run().catch(console.error);
