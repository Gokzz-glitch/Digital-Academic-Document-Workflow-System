const transporter = require('../config/email');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.info('Email notification skipped: SMTP is not configured.');
    return false;
  }
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

exports.sendEmail = sendEmail;
exports.isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>Dear ${user.name},</p>
    <p>Use the link below within 10 minutes to choose a new password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>If you did not request this change, you can ignore this email.</p>
  `;
  return sendEmail({ to: user.email, subject: 'Reset your academic workspace password', html });
};

exports.sendRequestSubmittedEmail = async (student, request) => {
  const html = `
    <h2>Request Submitted Successfully</h2>
    <p>Dear ${student.name},</p>
    <p>Your request (ID: ${request.documentId}) has been successfully submitted and is pending review.</p>
    <p>You can track its status in your dashboard.</p>
  `;
  await sendEmail({ to: student.email, subject: 'Request Submitted', html });
};

exports.sendApprovalEmail = async (student, request, approver, stage) => {
  const html = `
    <h2>Request Approved</h2>
    <p>Dear ${student.name},</p>
    <p>Your request (ID: ${request.documentId}) has been approved at stage ${stage} by ${approver.name}.</p>
    <p>It is now moving to the next stage or completed.</p>
  `;
  await sendEmail({ to: student.email, subject: `Request Approved - Stage ${stage}`, html });
};

exports.sendRejectionEmail = async (student, request, rejector, reason) => {
  const html = `
    <h2>Request Rejected</h2>
    <p>Dear ${student.name},</p>
    <p>Unfortunately, your request (ID: ${request.documentId}) has been rejected by ${rejector.name}.</p>
    <p><strong>Reason:</strong> ${reason}</p>
  `;
  await sendEmail({ to: student.email, subject: 'Request Rejected', html });
};

exports.sendCompletionEmail = async (student, request) => {
  const html = `
    <h2>Document Ready</h2>
    <p>Dear ${student.name},</p>
    <p>Great news! Your request (ID: ${request.documentId}) has been fully approved.</p>
    <p>Your document has been generated and is ready for download in your dashboard.</p>
  `;
  await sendEmail({ to: student.email, subject: 'Document Ready for Download', html });
};

exports.sendRevisionEmail = async (student, request, reviewer, comments) => {
  const html = `
    <h2>Revision Requested</h2>
    <p>Dear ${student.name},</p>
    <p>A revision has been requested for your request (ID: ${request.documentId}) by ${reviewer.name}.</p>
    <p><strong>Comments:</strong> ${comments}</p>
    <p>Please update your request and resubmit.</p>
  `;
  await sendEmail({ to: student.email, subject: 'Action Required: Revision Requested', html });
};
