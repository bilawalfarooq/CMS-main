import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mailService, storageService, smsService } from '../src/services/externalServices.js';

describe('Staging External Services & Infrastructure Readiness Tests', () => {
  it('1. Mail Service: dispatches transactional email with valid messageId in staging', async () => {
    const res = await mailService.sendMail({
      to: 'guardian.test@educore.edu',
      subject: 'Term 1 Enrollment Confirmation',
      text: 'Your student has been successfully enrolled.',
    });

    assert.equal(res.success, true);
    assert.match(res.messageId, /^<msg-\d+-\d+@educore\.edu>$/);
    assert.equal(res.recipient, 'guardian.test@educore.edu');
    assert.equal(res.sandbox, true);
  });

  it('2. Mail Service: rejects dispatch when recipient or subject is missing', async () => {
    await assert.rejects(
      async () => {
        await mailService.sendMail({ to: '', subject: 'No recipient' });
      },
      /requires valid recipient and subject/i
    );
  });

  it('3. Storage Service: accepts document under 2.0 MB ceiling', async () => {
    const res = await storageService.upload({
      key: 'vault/STU-2026-0101/birth_certificate.pdf',
      sizeBytes: 1024 * 750, // 750 KB
      mimeType: 'application/pdf',
    });

    assert.equal(res.success, true);
    assert.equal(res.key, 'vault/STU-2026-0101/birth_certificate.pdf');
    assert.match(res.storagePath, /educore-vault-staging/);
  });

  it('4. Storage Service: strictly rejects document exceeding 2.0 MB maximum ceiling', async () => {
    await assert.rejects(
      async () => {
        await storageService.upload({
          key: 'vault/STU-2026-0101/huge_scan.pdf',
          sizeBytes: 1024 * 1024 * 3, // 3.0 MB
          mimeType: 'application/pdf',
        });
      },
      /exceeds 2\.0 MB maximum ceiling/i
    );
  });

  it('5. Storage Service: generates valid secure retrieval URL', async () => {
    const url = await storageService.getDownloadUrl('vault/STU-2026-0101/report_card.pdf');
    assert.match(url, /^https:\/\/educore-vault-staging\.s3\.amazonaws\.com\/vault\/STU-2026-0101\/report_card\.pdf/);
  });

  it('6. SMS Service: queues urgent parental notification with verification SID', async () => {
    const res = await smsService.sendSms({
      to: '+1 (555) 441-9921',
      message: 'EduCore Attendance: Tariq was marked absent today without excuse note.',
    });

    assert.equal(res.success, true);
    assert.match(res.sid, /^SM\d+$/);
    assert.equal(res.to, '+1 (555) 441-9921');
    assert.equal(res.status, 'queued');
  });
});
