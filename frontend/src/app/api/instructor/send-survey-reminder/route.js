import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const SUBJECT = "🌟 Quick Reminder: Don't forget your Math Tutor feedback! 🎓";
const MESSAGE_KID_FRIENDLY = 
`Hey there, math champion! 🌟

You did an absolutely amazing job completing your Post-Assessment test! We are so incredibly proud of your hard work. 🏆

But guess what? There is just one last tiny step to finish your math journey with us! 

Please don't forget to fill out our quick, fun survey! It takes less than 2 minutes and helps us so much with our research. 💬

👉 How to do it: Just log in to your student dashboard, and you will see the feedback questionnaire popup waiting for you! 

Thank you so much for being an awesome math superstar! 💜

Keep shining,
Your AI Math Tutor Team 🎓`;

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

    // Find all student users who finished post-assessment but haven't submitted the survey
    const students = await User.find({
      role: 'student',
      'post_assessment.completed': true,
      evaluation_questionnaire: null
    });

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
      // Check if student has already received this specific survey reminder
      const hasReceived = student.notifications?.some(n => n.message?.includes("Post-Assessment test! We are so incredibly proud"));
      
      if (hasReceived) {
        skippedCount++;
        logs.push({ username: student.username, status: 'SKIPPED', reason: 'Already received survey reminder' });
        continue;
      }

      // 1. Send In-App Notification (dashboard)
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
        total_eligible_students: students.length,
        in_app_notifications_pushed: inAppSent,
        outbound_emails_sent: emailsSent,
        outbound_emails_failed: emailsFailed,
        already_received_skipped: skippedCount
      },
      message: `Dispatched ${inAppSent} new survey reminders and ${emailsSent} emails! Skipped ${skippedCount} users who already had this reminder.`,
      logs
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
