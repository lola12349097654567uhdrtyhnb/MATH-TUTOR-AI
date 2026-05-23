const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Connect to the local MongoDB database
const MONGODB_URI = "mongodb://127.0.0.1:27017/tutor_db";

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  notifications: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }]
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const SUBJECT = "🌟 Quick Math Tutor Update! Important Next Steps 🎓";
const MESSAGE_KID_FRIENDLY = 
`Hey there, superstar! 🚀

You've been doing an amazing job working on your math skills! We are so proud of your hard work. 💜

Here is a quick guide on the most important next steps in your math learning journey:

1️⃣ PRACTICE & LEVEL UP! 📝
After finishing your Pre-Assessment, keep practicing on your chosen math path. The AI will guide you step-by-step.

2️⃣ BECOME A MATH MASTER! 🏆
If you practice enough and keep getting answers correct, the program will automatically tell you: "You are a Master at this topic!" 🎉

3️⃣ COMPLETE THE POST-ASSESSMENT! 📊
Whether you reach the "Master" level or not, please make sure to take the Post-Assessment test! This is super important for our research results.

4️⃣ SHARE YOUR FEEDBACK! 💬
Right after you finish the Post-Assessment, a quick, fun questionnaire will pop up. Please fill it out to let us know how your experience was!

Thank you so much for being an awesome part of this project. You are helping us build the future of AI math learning! 🎓

Keep shining,
Your AI Math Tutor Team 💜`;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const students = await User.find({ role: 'student' });
  console.log(`Found ${students.length} student accounts in the database.`);

  let inAppCount = 0;
  let emailSentCount = 0;
  let emailFailedCount = 0;

  // Check if nodemailer is installed
  let nodemailer = null;
  try {
    nodemailer = require('nodemailer');
    console.log("Nodemailer is installed! Preparing SMTP transporter...");
  } catch (e) {
    console.log("\n⚠️  Nodemailer is not installed in Node modules.");
    console.log("👉 The script will still dispatch in-app notifications to 100% of students.");
    console.log("👉 To also send real outbound emails, run: npm install nodemailer inside your frontend folder, set SMTP_USER/SMTP_PASS, and run this script again.\n");
  }

  // Load SMTP config if present in environment
  let transporter = null;
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  if (nodemailer && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log(`SMTP configured for sender: "${smtpUser}"`);
  } else if (nodemailer) {
    console.log("⚠️  SMTP_USER and SMTP_PASS environment variables are missing. Outbound email sending will be skipped.");
  }

  for (const student of students) {
    // 1. Dispatch In-App Notification (Guaranteed Receipt)
    if (!student.notifications) student.notifications = [];
    student.notifications.push({
      message: MESSAGE_KID_FRIENDLY,
      read: false,
      timestamp: new Date()
    });
    student.markModified('notifications');
    await student.save();
    inAppCount++;
    console.log(`- Pushed In-App Notification to student: "${student.username}"`);

    // 2. Dispatch Email (if SMTP is configured and student has email)
    if (transporter && student.email) {
      try {
        await transporter.sendMail({
          from: `"AI Math Tutor Team" <${smtpUser}>`,
          to: student.email,
          subject: SUBJECT,
          text: MESSAGE_KID_FRIENDLY
        });
        emailSentCount++;
        console.log(`  📧 Outbound email successfully sent to: "${student.email}"`);
      } catch (err) {
        emailFailedCount++;
        console.log(`  ❌ Failed to send email to: "${student.email}" - Error: ${err.message}`);
      }
    }
  }

  console.log(`\n================ DISPATCH REPORT ================`);
  console.log(`✅ In-App Notifications pushed: ${inAppCount}`);
  console.log(`📧 Outbound emails sent: ${emailSentCount}`);
  if (emailFailedCount > 0) {
    console.log(`❌ Email dispatches failed: ${emailFailedCount}`);
  }
  console.log(`=================================================`);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
