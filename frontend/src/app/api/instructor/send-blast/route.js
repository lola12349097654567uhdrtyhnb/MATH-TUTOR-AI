import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

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

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const inst = await User.findOne({ username: sessionUser });
    if (!inst || inst.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await User.find({ role: 'student' });
    
    // Prepare SMTP Email transporter if keys are configured in Vercel environment
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    let transporter = null;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    }

    let inAppSent = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    let skippedCount = 0;
    
    const logs = [];

    for (const student of students) {
      // STRICT EXCLUSION: Check if student has already received this specific blast
      const hasReceived = student.notifications?.some(n => n.message?.includes("superstar! 🚀"));
      
      if (hasReceived) {
        skippedCount++;
        logs.push({ username: student.username, status: 'SKIPPED', reason: 'Already received this blast' });
        continue;
      }

      // 1. Send In-App Notification (Guaranteed dashboard delivery)
      if (!student.notifications) student.notifications = [];
      student.notifications.push({
        message: MESSAGE_KID_FRIENDLY,
        read: false,
        timestamp: new Date()
      });
      student.markModified('notifications');
      await student.save();
      inAppSent++;

      let emailStatus = 'N/A (No SMTP or student email)';
      
      // 2. Send Outbound SMTP Email
      if (transporter && student.email) {
        try {
          await transporter.sendMail({
            from: `"AI Math Tutor Team" <${smtpUser}>`,
            to: student.email,
            subject: SUBJECT,
            text: MESSAGE_KID_FRIENDLY
          });
          emailsSent++;
          emailStatus = 'SUCCESS';
        } catch (err) {
          emailsFailed++;
          emailStatus = `FAILED (${err.message})`;
        }
      }

      logs.push({ 
        username: student.username, 
        email: student.email || 'None',
        status: 'SENT', 
        in_app: 'SUCCESS',
        email_status: emailStatus 
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_students: students.length,
        in_app_notifications_pushed: inAppSent,
        outbound_emails_sent: emailsSent,
        outbound_emails_failed: emailsFailed,
        already_received_skipped: skippedCount
      },
      message: `Dispatched ${inAppSent} new notifications and ${emailsSent} emails! Skipped ${skippedCount} users who already had this message.`,
      logs
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
