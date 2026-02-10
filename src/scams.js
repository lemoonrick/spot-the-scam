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
      { text: ' due to unusual login.\n\nVerify now:\n', flag: null },
      { text: 'https://icici-verify.co/login', flag: 'fake-link' },
    ],
    explanations: {
      urgency:
        'Banks do not threaten immediate action over SMS to pressure users.',
      'fake-link':
        'The URL is a lookalike domain and not an official ICICI website.',
    },
  },

  // 2. Gmail-style email (invoice / billing scam)
  {
    id: 2,
    type: 'email',
    subject: 'Invoice pending for your recent order',
    senderName: 'Amazon Billing',
    sender: 'billing@amaz0n-support.com',
    correctFlags: ['spoofed-sender', 'attachment-risk'],
    message: [
      {
        text: 'Hello,\n\nWe were unable to process your recent order due to a billing issue.\n\n',
        flag: null,
      },
      {
        text: 'Please review the attached invoice to avoid cancellation.\n\n',
        flag: 'attachment-risk',
      },
      {
        text: 'Regards,\nAmazon Billing Team',
        flag: null,
      },
    ],
    explanations: {
      'spoofed-sender':
        'The sender email uses a fake domain that closely imitates Amazon.',
      'attachment-risk':
        'Unexpected attachments are commonly used to deliver malware.',
    },
  },

  // 3. WhatsApp KYC / SIM deactivation scam
  {
    id: 3,
    type: 'whatsapp',
    sender: 'Jio Support',
    correctFlags: ['authority', 'fake-link', 'cta'],
    message: [
      {
        text: 'Dear customer, your SIM will be deactivated today due to ',
        flag: null,
      },
      {
        text: 'KYC not completed',
        flag: 'authority',
      },
      {
        text: '.\n\nComplete verification immediately:\n',
        flag: null,
      },
      {
        text: 'http://jio-kyc-update.in',
        flag: 'fake-link',
      },
    ],
    explanations: {
      authority: 'Scammers impersonate telecom providers to create panic.',
      'fake-link':
        'Official companies do not use unofficial or hyphenated domains.',
      cta: 'The call-to-action link is designed to rush users into clicking.',
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
      {
        text: 'paid collaboration opportunity',
        flag: 'too-good',
      },
      {
        text: '.\n\nKindly share your email to proceed. This is an official brand partnership.',
        flag: 'impersonation',
      },
    ],
    explanations: {
      impersonation:
        'There is no verification or proof this account represents a real brand.',
      'too-good': 'Unsolicited paid offers are commonly used to bait victims.',
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
      fear: 'Scammers rely on fear to stop users from thinking clearly.',
      'fake-support':
        'Legitimate companies do not display phone numbers in pop-up alerts.',
    },
  },
];
