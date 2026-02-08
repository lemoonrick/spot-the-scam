export const scams = [
  // 1. iPhone SMS / iMessage-style bank alert
  {
    id: 1,
    type: 'sms',
    sender: 'ICICI Alerts',
    correctFlags: ['urgency', 'fake-link'],
    message: [
      { text: 'ICICI: Your account access will be ', flag: null },
      { text: 'restricted within 2 hours', flag: 'urgency' },
      { text: ' due to unusual login.\n\nVerify now: ', flag: null },
      { text: 'https://icici-verify.co/login', flag: 'fake-link' },
    ],
    explanations: {
      urgency:
        'Banks use official app notifications, not time-pressure SMS threats.',
      'fake-link':
        'Scammers use lookalike domains that are not owned by the real bank.',
    },
  },

  // 2. Gmail-style email (job / invoice scam)
  {
    id: 2,
    type: 'email',
    sender: 'Billing Team <billing@amaz0n-support.com>',
    correctFlags: ['spoofed-sender', 'attachment-risk'],
    message: [
      {
        text: 'Hello,\n\nYour recent order could not be processed.\n\n',
        flag: null,
      },
      {
        text: 'Please review the attached invoice to avoid cancellation.\n\n',
        flag: 'attachment-risk',
      },
      { text: 'Regards,\nAmazon Billing Team', flag: null },
    ],
    explanations: {
      'spoofed-sender':
        'The sender address uses a lookalike domain to impersonate a real company.',
      'attachment-risk':
        'Unexpected attachments are a common way to deliver malware.',
    },
  },

  // 3. WhatsApp KYC / SIM block scam
  {
    id: 3,
    type: 'whatsapp',
    sender: 'Jio Support',
    correctFlags: ['authority', 'fake-link'],
    message: [
      {
        text: 'Dear customer, your SIM will be deactivated today due to ',
        flag: null,
      },
      { text: 'KYC not completed', flag: 'authority' },
      { text: '.\n\nComplete verification immediately:\n', flag: null },
      { text: 'http://jio-kyc-update.in', flag: 'fake-link' },
    ],
    explanations: {
      authority:
        'Scammers pretend to be telecom providers to scare users into compliance.',
      'fake-link':
        'Official companies do not use random .in or hyphenated domains.',
    },
  },

  // 4. Instagram DM brand collaboration scam
  {
    id: 4,
    type: 'instagram',
    sender: 'brand.collabs_official',
    correctFlags: ['impersonation', 'too-good'],
    message: [
      {
        text: 'Hey! We loved your profile and would like to offer you a ',
        flag: null,
      },
      { text: 'paid collaboration opportunity', flag: 'too-good' },
      {
        text: '.\n\nKindly share your email to proceed. This is an official brand partnership.',
        flag: 'impersonation',
      },
    ],
    explanations: {
      impersonation:
        'Scammers often claim to be official without verification badges.',
      'too-good':
        'Unsolicited paid offers are a common hook used to gain trust.',
    },
  },

  // 5. Tech support pop-up / system alert scam
  {
    id: 5,
    type: 'popup',
    sender: 'System Alert',
    correctFlags: ['fear', 'fake-support'],
    message: [
      {
        text: '⚠️ WARNING: Your device has been infected with malware.\n\n',
        flag: null,
      },
      {
        text: 'Immediate action is required to prevent data loss.\n\n',
        flag: 'fear',
      },
      {
        text: 'Call Microsoft Support now: +91-98XXXXXXX',
        flag: 'fake-support',
      },
    ],
    explanations: {
      fear: 'Scammers use fear to stop you from thinking critically.',
      'fake-support':
        'Legitimate companies never show phone numbers in random pop-ups.',
    },
  },
];
