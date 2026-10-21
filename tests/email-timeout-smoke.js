const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');

const runtimeRoot = process.env.APP_RUNTIME_ROOT;
if (!runtimeRoot) throw new Error('APP_RUNTIME_ROOT is required.');

(async () => {
  const fakeSmtp = net.createServer((socket) => {
    // Intentionally withhold the SMTP greeting. This local-only server never accepts or sends mail.
    socket.on('error', () => {});
  });

  await new Promise((resolve, reject) => {
    fakeSmtp.once('error', reject);
    fakeSmtp.listen(0, '127.0.0.1', resolve);
  });

  try {
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = String(fakeSmtp.address().port);
    process.env.SMTP_USER = 'smoke-test@example.invalid';
    process.env.SMTP_PASS = 'local-only-test-value';
    process.env.SMTP_CONNECTION_TIMEOUT_MS = '1000';
    process.env.SMTP_GREETING_TIMEOUT_MS = '500';
    process.env.SMTP_SOCKET_TIMEOUT_MS = '1000';

    const { sendEmail } = require(path.join(runtimeRoot, 'server', 'services', 'email.service'));
    const startedAt = Date.now();
    const sent = await sendEmail({ to: 'nobody@example.invalid', subject: 'smoke test', html: 'discarded' });
    const elapsed = Date.now() - startedAt;
    assert.equal(sent, false);
    assert.ok(elapsed < 4000, `SMTP timeout took too long (${elapsed} ms)`);
    console.log(`PASS configured SMTP timeout fails safely in ${elapsed} ms without sending email`);
  } finally {
    await new Promise((resolve) => fakeSmtp.close(resolve));
  }
})().catch((error) => {
  console.error(`FAIL SMTP timeout smoke test: ${error.message}`);
  process.exitCode = 1;
});
