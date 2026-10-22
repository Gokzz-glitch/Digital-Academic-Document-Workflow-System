/*
 * End-to-end smoke test for the local academic document workflow.
 * Requires a running app plus TEST_MONGO_URI and APP_RUNTIME_ROOT so every
 * temporary user, request, notification, document type, and generated PDF can
 * be removed after the run.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const API = process.env.TEST_API_URL || 'http://127.0.0.1:5000/api';
const runtimeRoot = process.env.APP_RUNTIME_ROOT;
const mongoUri = process.env.TEST_MONGO_URI;
const dataRoot = process.env.APP_DATA_DIR || path.join(process.env.LOCALAPPDATA || '', 'DigitalAcademicDocumentWorkflowSystem');
if (!runtimeRoot || !mongoUri) {
  throw new Error('Set APP_RUNTIME_ROOT and TEST_MONGO_URI. The runner uses them to clean up temporary test data.');
}

const mongoose = require(path.join(runtimeRoot, 'server', 'node_modules', 'mongoose'));
const User = require(path.join(runtimeRoot, 'server', 'models', 'User'));
const Request = require(path.join(runtimeRoot, 'server', 'models', 'Request'));
const DocumentType = require(path.join(runtimeRoot, 'server', 'models', 'DocumentType'));
const Notification = require(path.join(runtimeRoot, 'server', 'models', 'Notification'));
const GeneratedDocument = require(path.join(runtimeRoot, 'server', 'models', 'GeneratedDocument'));
const jwt = require(path.join(runtimeRoot, 'server', 'node_modules', 'jsonwebtoken'));

const stamp = `${Date.now()}-${process.pid}`;
const testStudentEmail = `workflow-student-${stamp}@example.com`;
const testAdvisorEmail = `workflow-advisor-${stamp}@example.com`;
const testStaffEmail = `workflow-staff-${stamp}@example.com`;
const testStaffCreatedEmail = `workflow-staff-created-${stamp}@example.com`;
const testOtherStudentEmail = `workflow-other-${stamp}@example.com`;
const documentTypeName = `Workflow Smoke Test ${stamp}`;
const unassignedDocumentTypeName = `Workflow Unassigned Test ${stamp}`;
const testEmails = [testStudentEmail, testAdvisorEmail, testStaffEmail, testStaffCreatedEmail, testOtherStudentEmail];
const results = [];
let adminToken;
let adminId;
let studentToken;
let otherStudentToken;
let advisorToken;
let staffToken;
let studentId;
let advisorId;
let documentTypeId;
let requestId;

async function call(method, route, token, body) {
  const response = await fetch(`${API}${route}`, {
    method,
    signal: AbortSignal.timeout(10000),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.arrayBuffer();
  return { response, data };
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
    throw error;
  }
}

async function cleanup() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const users = await User.find({ email: { $in: testEmails } }).select('_id');
  const userIds = users.map((user) => user._id);
  const requests = await Request.find({ $or: [
    { student: { $in: userIds } },
    ...(requestId ? [{ _id: requestId }] : []),
  ] }).select('_id generatedDocument');
  const requestIds = requests.map((request) => request._id);
  const generated = await GeneratedDocument.find({ $or: [
    { request: { $in: requestIds } },
    { student: { $in: userIds } },
  ] });
  for (const doc of generated) {
    const filePath = path.join(dataRoot, 'uploads', 'documents', path.basename(doc.filePath || ''));
    if (doc.filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await Notification.deleteMany({ $or: [
    { recipient: { $in: userIds } },
    { relatedRequest: { $in: requestIds } },
  ] });
  await GeneratedDocument.deleteMany({ _id: { $in: generated.map((doc) => doc._id) } });
  await Request.deleteMany({ _id: { $in: requestIds } });
  await DocumentType.deleteMany({ name: documentTypeName });
  await DocumentType.deleteMany({ name: unassignedDocumentTypeName });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.disconnect();
}

(async () => {
  let cleanupError;
  try {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    assert.ok(adminEmail && adminPassword, 'The isolated test runner must provide temporary admin credentials');

    await test('health endpoint reports ready', async () => {
      const { response, data } = await call('GET', '/health');
      assert.equal(response.status, 200);
      assert.equal(data.status, 'ready');
    });

    await test('admin sign-in returns a super-admin session', async () => {
      const { response, data } = await call('POST', '/auth/login', null, { email: adminEmail, password: adminPassword });
      assert.equal(response.status, 200, JSON.stringify(data));
      assert.equal(data.user.role, 'super_admin');
      adminToken = data.token;
      adminId = data.user._id;
    });

    await test('protected API rejects missing authentication', async () => {
      const { response } = await call('GET', '/admin/users');
      assert.equal(response.status, 401);
      const invalidToken = await call('GET', '/auth/me', 'not-a-valid-token');
      assert.equal(invalidToken.response.status, 401);
      const expiredToken = jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: -1 });
      const expired = await call('GET', '/auth/me', expiredToken);
      assert.equal(expired.response.status, 401);
    });

    await test('admin dashboard and seeded document types load', async () => {
      const stats = await call('GET', '/admin/dashboard-stats', adminToken);
      const types = await call('GET', '/admin/document-types', adminToken);
      assert.equal(stats.response.status, 200);
      assert.equal(types.response.status, 200);
      assert.ok(types.data.count >= 4);
    });

    await test('student registration and sign-in work; duplicate registration is rejected', async () => {
      const body = { name: 'Smoke Test Student', email: testStudentEmail, password: 'TestStudent#42', department: 'AIML', year: 'Year 4', section: 'T', rollNumber: `SMOKE-${stamp}` };
      const invalid = await call('POST', '/auth/register', null, { ...body, email: 'not-an-email' });
      assert.equal(invalid.response.status, 400);
      const registered = await call('POST', '/auth/register', null, body);
      assert.equal(registered.response.status, 201, JSON.stringify(registered.data));
      const duplicate = await call('POST', '/auth/register', null, body);
      assert.equal(duplicate.response.status, 400);
      const caseVariantDuplicate = await call('POST', '/auth/register', null, { ...body, email: testStudentEmail.toUpperCase() });
      assert.equal(caseVariantDuplicate.response.status, 400);
      const badPassword = await call('POST', '/auth/login', null, { email: testStudentEmail, password: 'DefinitelyWrong#42' });
      assert.equal(badPassword.response.status, 401);
      const login = await call('POST', '/auth/login', null, { email: testStudentEmail.toUpperCase(), password: body.password });
      assert.equal(login.response.status, 200);
      assert.equal(login.data.user.rollNumber, body.rollNumber);
      assert.equal(Object.hasOwn(login.data.user, 'password'), false);
      studentToken = login.data.token;
      studentId = login.data.user._id;
      const me = await call('GET', '/auth/me', studentToken);
      assert.equal(me.response.status, 200);
      assert.equal(me.data.data.email, testStudentEmail);
    });

    await test('forgot-password does not claim success when outbound email is unavailable', async () => {
      const { response, data } = await call('POST', '/auth/forgot-password', null, { email: testStudentEmail });
      assert.equal(response.status, 503, JSON.stringify(data));
    });

    await test('reset-password accepts a valid one-time token and the new password signs in', async () => {
      const rawToken = `reset-${stamp}`;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      await User.updateOne({ email: testStudentEmail }, {
        $set: { passwordResetToken: tokenHash, passwordResetExpires: new Date(Date.now() + 60_000) },
      });
      await mongoose.disconnect();

      const reset = await call('PUT', `/auth/reset-password/${rawToken}`, null, { password: 'StudentReset#42' });
      assert.equal(reset.response.status, 200, JSON.stringify(reset.data));
      const login = await call('POST', '/auth/login', null, { email: testStudentEmail, password: 'StudentReset#42' });
      assert.equal(login.response.status, 200);
      const oldLogin = await call('POST', '/auth/login', null, { email: testStudentEmail, password: 'TestStudent#42' });
      assert.equal(oldLogin.response.status, 401);
      const reusedToken = await call('PUT', `/auth/reset-password/${rawToken}`, null, { password: 'AnotherPassword#42' });
      assert.equal(reusedToken.response.status, 400);
      const expiredRawToken = `expired-${stamp}`;
      const expiredHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      await User.updateOne({ email: testStudentEmail }, {
        $set: { passwordResetToken: expiredHash, passwordResetExpires: new Date(Date.now() - 60_000) },
      });
      await mongoose.disconnect();
      const expired = await call('PUT', `/auth/reset-password/${expiredRawToken}`, null, { password: 'AnotherPassword#42' });
      assert.equal(expired.response.status, 400);
    });

    await test('role-based access blocks students from admin APIs', async () => {
      const { response } = await call('GET', '/admin/users', studentToken);
      assert.equal(response.status, 403);
    });

    await test('admin can create an approver and a two-stage document type', async () => {
      const advisor = await call('POST', '/admin/users', adminToken, {
        name: 'Smoke Test Advisor', email: testAdvisorEmail, password: 'TestAdvisor#42',
        role: 'class_advisor', department: 'AIML', year: 'Year 4', section: 'T',
      });
      assert.equal(advisor.response.status, 201, JSON.stringify(advisor.data));
      advisorId = advisor.data.data._id;
      const login = await call('POST', '/auth/login', null, { email: testAdvisorEmail, password: 'TestAdvisor#42' });
      assert.equal(login.response.status, 200);
      advisorToken = login.data.token;

      const type = await call('POST', '/admin/document-types', adminToken, {
        name: documentTypeName, category: 'Automated test', description: 'Temporary functional test document type.',
        customFields: [
          { fieldName: 'purpose', label: 'Purpose', fieldType: 'text', required: true },
          { fieldName: 'copies', label: 'Number of copies', fieldType: 'number', required: true },
          { fieldName: 'deliveryFormat', label: 'Delivery format', fieldType: 'select', required: false, options: ['digital', 'printed'] },
          { fieldName: 'submissionDate', label: 'Submission date', fieldType: 'date', required: false },
        ],
        approvalChain: [
          { stage: 1, stageName: 'Advisor review', role: 'class_advisor' },
          { stage: 2, stageName: 'Academic office', role: 'super_admin' },
        ],
        isActive: true,
      });
      assert.equal(type.response.status, 201, JSON.stringify(type.data));
      documentTypeId = type.data.data._id;

      const staff = await call('POST', '/admin/users', adminToken, {
        name: 'Smoke Test Office Staff', email: testStaffEmail, password: 'TestStaff#42',
        role: 'admin_staff', department: 'Administration',
      });
      assert.equal(staff.response.status, 201, JSON.stringify(staff.data));
      assert.equal(Object.hasOwn(staff.data.data, 'password'), false);
      const staffLogin = await call('POST', '/auth/login', null, { email: testStaffEmail, password: 'TestStaff#42' });
      assert.equal(staffLogin.response.status, 200);
      staffToken = staffLogin.data.token;

      const unassignedType = await call('POST', '/admin/document-types', adminToken, {
        name: unassignedDocumentTypeName, category: 'Automated test', description: 'No active approver.',
        customFields: [{ fieldName: 'purpose', label: 'Purpose', fieldType: 'text', required: true }],
        approvalChain: [{ stage: 1, stageName: 'Unassigned dean', role: 'dean' }], isActive: true,
      });
      assert.equal(unassignedType.response.status, 201, JSON.stringify(unassignedType.data));
    });

    await test('admin user CRUD protects role, password, and credential fields', async () => {
      const user = await call('GET', `/admin/users/${adminId}`, adminToken);
      assert.equal(user.response.status, 200);
      assert.equal(Object.hasOwn(user.data.data, 'password'), false);
      const filtered = await call('GET', '/admin/users?role=admin_staff&search=workflow-staff', adminToken);
      assert.equal(filtered.response.status, 200);
      assert.ok(filtered.data.data.some((entry) => entry.email === testStaffEmail));
      const regexSearch = await call('GET', '/admin/users?search=%5B', adminToken);
      assert.equal(regexSearch.response.status, 200);

      const escalation = await call('PUT', `/admin/users/${adminId}`, staffToken, { role: 'super_admin' });
      assert.equal(escalation.response.status, 403);
      const createSuperAdmin = await call('POST', '/admin/users', staffToken, {
        name: 'Forbidden Super Admin', email: `forbidden-${stamp}@example.com`, password: 'Forbidden#42',
        role: 'super_admin', department: 'Administration',
      });
      assert.equal(createSuperAdmin.response.status, 403);
      const staffCreated = await call('POST', '/admin/users', staffToken, {
        name: 'Staff Created Student', email: testStaffCreatedEmail, password: 'StaffStudent#42',
        role: 'student', department: 'AIML', year: 'Year 4', section: 'T', rollNumber: `STAFF-${stamp}`,
      });
      assert.equal(staffCreated.response.status, 201, JSON.stringify(staffCreated.data));
      const passwordMutation = await call('PUT', `/admin/users/${adminId}`, adminToken, { password: 'InjectedPassword#42' });
      assert.equal(passwordMutation.response.status, 400);
      const harmless = await call('PUT', `/admin/users/${advisorId}`, adminToken, { phone: '5550133', role: 'hod' });
      assert.equal(harmless.response.status, 200, JSON.stringify(harmless.data));
      assert.equal(harmless.data.data.role, 'hod');
      assert.equal(harmless.data.data.phone, '5550133');
      const restoreRole = await call('PUT', `/admin/users/${advisorId}`, adminToken, { role: 'class_advisor' });
      assert.equal(restoreRole.response.status, 200);
    });

    await test('document type detail and update persist changes', async () => {
      const detail = await call('GET', `/admin/document-types/${documentTypeId}`, adminToken);
      assert.equal(detail.response.status, 200);
      assert.equal(detail.data.data.name, documentTypeName);
      const update = await call('PUT', `/admin/document-types/${documentTypeId}`, adminToken, { description: 'Updated by automated test.' });
      assert.equal(update.response.status, 200, JSON.stringify(update.data));
      assert.equal(update.data.data.description, 'Updated by automated test.');
    });

    await test('student sees active types and can submit a request into the approval queue', async () => {
      console.log('  Checking active document types...');
      const types = await call('GET', '/requests/document-types', studentToken);
      assert.equal(types.response.status, 200);
      assert.ok(types.data.data.some((type) => type._id === documentTypeId));
      const missingRequired = await call('POST', '/requests', studentToken, { documentTypeId, formData: {} });
      assert.equal(missingRequired.response.status, 400);
      const noDetails = await call('POST', '/requests', studentToken, { documentTypeId, formData: null });
      assert.equal(noDetails.response.status, 400);
      const missingCopies = await call('POST', '/requests', studentToken, { documentTypeId, formData: { purpose: 'Required field check' } });
      assert.equal(missingCopies.response.status, 400);
      const invalidCopies = await call('POST', '/requests', studentToken, { documentTypeId, formData: { purpose: 'Type check', copies: 'many' } });
      assert.equal(invalidCopies.response.status, 400);
      const invalidChoice = await call('POST', '/requests', studentToken, { documentTypeId, formData: { purpose: 'Choice check', copies: 1, deliveryFormat: 'fax' } });
      assert.equal(invalidChoice.response.status, 400);
      const invalidDate = await call('POST', '/requests', studentToken, { documentTypeId, formData: { purpose: 'Date check', copies: 1, submissionDate: 'not-a-date' } });
      assert.equal(invalidDate.response.status, 400);
      const noApprover = await call('POST', '/requests', studentToken, {
        documentTypeId: (await call('GET', '/admin/document-types', adminToken)).data.data.find((item) => item.name === unassignedDocumentTypeName)._id,
        formData: { purpose: 'No approver test' },
      });
      assert.equal(noApprover.response.status, 409);
      console.log('  Submitting a request...');
      const created = await call('POST', '/requests', studentToken, { documentTypeId, formData: { purpose: 'Functional test', copies: 2, deliveryFormat: 'digital', submissionDate: '2026-10-22' } });
      assert.equal(created.response.status, 201, JSON.stringify(created.data));
      requestId = created.data.data._id;
      assert.equal(created.data.data.status, 'submitted');
      assert.equal(String(created.data.data.currentApprover), String(advisorId));
      console.log('  Checking the approver queue...');
      const pending = await call('GET', '/requests/pending', advisorToken);
      assert.equal(pending.response.status, 200);
      assert.ok(pending.data.data.requests.some((request) => request._id === requestId));
      const mine = await call('GET', '/requests/my?page=1&limit=5', studentToken);
      assert.equal(mine.response.status, 200);
      assert.ok(mine.data.data.requests.some((request) => request._id === requestId));
    });

    await test('request detail enforces ownership', async () => {
      const other = await call('POST', '/auth/register', null, {
        name: 'Smoke Test Other Student', email: testOtherStudentEmail, password: 'TestOther#42', department: 'AIML', year: 'Year 4', section: 'T', rollNumber: `OTHER-${stamp}`,
      });
      assert.equal(other.response.status, 201);
      const login = await call('POST', '/auth/login', null, { email: testOtherStudentEmail, password: 'TestOther#42' });
      otherStudentToken = login.data.token;
      const { response } = await call('GET', `/requests/${requestId}`, otherStudentToken);
      assert.equal(response.status, 403);
    });

    await test('approver cannot decide out of turn; revision requires comments', async () => {
      const wrongActor = await call('PUT', `/approvals/${requestId}/approve`, adminToken, {});
      assert.equal(wrongActor.response.status, 403);
      const missingComments = await call('PUT', `/approvals/${requestId}/revision`, advisorToken, {});
      assert.equal(missingComments.response.status, 400);
      const revision = await call('PUT', `/approvals/${requestId}/revision`, advisorToken, { comments: 'Please clarify the purpose.' });
      assert.equal(revision.response.status, 200, JSON.stringify(revision.data));
      assert.equal(revision.data.data.status, 'revision_requested');
    });

    await test('student can revise and resubmit to the first approver', async () => {
      const invalidResubmission = await call('PUT', `/approvals/${requestId}/resubmit`, studentToken, { formData: { purpose: 'Missing copies' } });
      assert.equal(invalidResubmission.response.status, 400);
      const resubmitted = await call('PUT', `/approvals/${requestId}/resubmit`, studentToken, { formData: { purpose: 'Updated functional test purpose', copies: 3, deliveryFormat: 'printed' } });
      assert.equal(resubmitted.response.status, 200, JSON.stringify(resubmitted.data));
      assert.equal(resubmitted.data.data.status, 'submitted');
      assert.equal(resubmitted.data.data.currentStage, 1);
    });

    await test('approvals advance stages and the final approval generates a verifiable PDF', async () => {
      const stage1 = await call('PUT', `/approvals/${requestId}/approve`, advisorToken, { comments: 'Advisor approved.' });
      assert.equal(stage1.response.status, 200, JSON.stringify(stage1.data));
      assert.equal(stage1.data.data.status, 'in_review');
      assert.equal(String(stage1.data.data.currentApprover), String(adminId));

      const final = await call('PUT', `/approvals/${requestId}/approve`, adminToken, { comments: 'Academic office approved.' });
      assert.equal(final.response.status, 200, JSON.stringify(final.data));
      assert.equal(final.data.data.status, 'completed');
      const doubleApproval = await call('PUT', `/approvals/${requestId}/approve`, adminToken, { comments: 'Duplicate decision.' });
      assert.equal(doubleApproval.response.status, 409);
      const lateRejection = await call('PUT', `/approvals/${requestId}/reject`, adminToken, { comments: 'Late decision.' });
      assert.equal(lateRejection.response.status, 409);
      const lateRevision = await call('PUT', `/approvals/${requestId}/revision`, adminToken, { comments: 'Late revision.' });
      assert.equal(lateRevision.response.status, 409);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      const issued = await GeneratedDocument.findOne({ request: requestId });
      assert.ok(issued, 'Generated document record should exist');
      const verified = await call('GET', `/documents/verify/${issued.documentUid}`);
      assert.equal(verified.response.status, 200);
      assert.equal(verified.data.data.isValid, true);
      const downloaded = await call('GET', `/documents/${requestId}/download`, studentToken);
      assert.equal(downloaded.response.status, 200);
      assert.equal(downloaded.response.headers.get('content-type'), 'application/pdf');
      assert.ok(downloaded.data.byteLength > 1000, 'PDF download should contain document bytes');
      const deniedDownload = await call('GET', `/documents/${requestId}/download`, otherStudentToken);
      assert.equal(deniedDownload.response.status, 403);
      const invalidVerification = await call('GET', '/documents/verify/not-a-real-document-uid');
      assert.equal(invalidVerification.response.status, 404);
      await mongoose.disconnect();
    });

    await test('admin request list supports status and text search filters', async () => {
      const all = await call('GET', `/requests/all?search=SMOKE-${stamp}`, adminToken);
      assert.equal(all.response.status, 200);
      assert.ok(all.data.data.requests.some((request) => request._id === requestId));
      const completed = await call('GET', '/requests/all?status=completed', adminToken);
      assert.equal(completed.response.status, 200);
      assert.ok(completed.data.data.requests.some((request) => request._id === requestId));
      const regexSearch = await call('GET', '/requests/all?search=%5B', adminToken);
      assert.equal(regexSearch.response.status, 200);
    });

    await test('admin can deactivate and reactivate a document type and staff account', async () => {
      const inactiveType = await call('PUT', `/admin/document-types/${documentTypeId}/toggle-status`, adminToken);
      assert.equal(inactiveType.response.status, 200);
      assert.equal(inactiveType.data.data.isActive, false);
      const activeTypes = await call('GET', '/requests/document-types', studentToken);
      assert.ok(!activeTypes.data.data.some((type) => type._id === documentTypeId));
      const activeType = await call('PUT', `/admin/document-types/${documentTypeId}/toggle-status`, adminToken);
      assert.equal(activeType.data.data.isActive, true);

      const inactiveUser = await call('PUT', `/admin/users/${advisorId}/toggle-status`, adminToken);
      assert.equal(inactiveUser.response.status, 200);
      assert.equal(inactiveUser.data.data.isActive, false);
      const inactiveLogin = await call('POST', '/auth/login', null, { email: testAdvisorEmail, password: 'TestAdvisor#42' });
      assert.equal(inactiveLogin.response.status, 403);
      const inactiveToken = await call('GET', '/auth/me', advisorToken);
      assert.equal(inactiveToken.response.status, 401);
      const activeUser = await call('PUT', `/admin/users/${advisorId}/toggle-status`, adminToken);
      assert.equal(activeUser.data.data.isActive, true);
      const activeLogin = await call('POST', '/auth/login', null, { email: testAdvisorEmail, password: 'TestAdvisor#42' });
      assert.equal(activeLogin.response.status, 200, 'Deactivation must not alter the password hash');
      const activeToken = await call('GET', '/auth/me', advisorToken);
      assert.equal(activeToken.response.status, 200);
    });

    await test('approver can reject a request with a reason; student stats reflect it', async () => {
      const created = await call('POST', '/requests', studentToken, { documentTypeId, formData: { purpose: 'Rejection test', copies: 1 } });
      assert.equal(created.response.status, 201, JSON.stringify(created.data));
      const rejected = await call('PUT', `/approvals/${created.data.data._id}/reject`, advisorToken, { comments: 'Rejected in automated smoke test.' });
      assert.equal(rejected.response.status, 200, JSON.stringify(rejected.data));
      assert.equal(rejected.data.data.status, 'rejected');
      assert.equal(rejected.data.data.rejectionReason, 'Rejected in automated smoke test.');
      const stats = await call('GET', '/requests/stats', studentToken);
      assert.equal(stats.response.status, 200);
      assert.equal(stats.data.data.rejected, 1);
    });

    await test('notifications support listing and mark-all-read', async () => {
      const notifications = await call('GET', '/notifications', studentToken);
      assert.equal(notifications.response.status, 200);
      assert.ok(notifications.data.count >= 2);
      const firstNotification = notifications.data.data[0];
      const markedOne = await call('PUT', `/notifications/${firstNotification._id}/read`, studentToken);
      assert.equal(markedOne.response.status, 200);
      const advisorNotifications = await call('GET', '/notifications', advisorToken);
      assert.equal(advisorNotifications.response.status, 200);
      const deniedDelete = await call('DELETE', `/notifications/${advisorNotifications.data.data[0]._id}`, studentToken);
      assert.equal(deniedDelete.response.status, 403);
      const marked = await call('PUT', '/notifications/mark-all-read', studentToken);
      assert.equal(marked.response.status, 200);
      const unread = await call('GET', '/notifications/unread-count', studentToken);
      assert.equal(unread.response.status, 200);
      assert.equal(unread.data.count, 0);
      const deleted = await call('DELETE', `/notifications/${firstNotification._id}`, studentToken);
      assert.equal(deleted.response.status, 200);
    });

    await test('profile update saves editable profile fields', async () => {
      const updated = await call('PUT', '/auth/profile', studentToken, { phone: '5550100', section: 'T' });
      assert.equal(updated.response.status, 200, JSON.stringify(updated.data));
      assert.equal(updated.data.data.phone, '5550100');
      const wrongCurrent = await call('PUT', '/auth/change-password', studentToken, { currentPassword: 'not-current', newPassword: 'StudentNew#42' });
      assert.equal(wrongCurrent.response.status, 400);
      const shortPassword = await call('PUT', '/auth/change-password', studentToken, { currentPassword: 'StudentReset#42', newPassword: '123' });
      assert.equal(shortPassword.response.status, 400);
      const changed = await call('PUT', '/auth/change-password', studentToken, { currentPassword: 'StudentReset#42', newPassword: 'StudentNew#42' });
      assert.equal(changed.response.status, 200, JSON.stringify(changed.data));
      const oldPassword = await call('POST', '/auth/login', null, { email: testStudentEmail, password: 'StudentReset#42' });
      assert.equal(oldPassword.response.status, 401);
      const newPassword = await call('POST', '/auth/login', null, { email: testStudentEmail, password: 'StudentNew#42' });
      assert.equal(newPassword.response.status, 200);
    });

    console.log('\nAll required functional smoke tests passed.');
  } catch (error) {
    process.exitCode = 1;
  } finally {
    try { await cleanup(); }
    catch (error) { cleanupError = error; process.exitCode = 1; }
    if (cleanupError) console.error(`CLEANUP FAILED: ${cleanupError.message}`);
    console.log('\nTest summary:');
    for (const result of results) console.log(`${result.status} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
    if (process.exitCode) console.error(`Temporary test emails use prefix workflow-*-${stamp}; inspect database cleanup if necessary.`);
  }
})();
