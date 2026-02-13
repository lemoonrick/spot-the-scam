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
    subject: 'Action required: Confirm your Amazon billing details',
    senderName: 'Amazon Billing',
    senderEmail: '<billing@amaz0n-support.com>',
    time: '9:14 AM',

    correctFlags: ['spoofed-sender', 'attachment-risk', 'fake-link'],

    content: [
      {
        parts: [{ text: 'Hello,' }],
      },
      {
        parts: [
          { text: 'We were unable to process your recent order due to a ' },
          { text: 'billing issue', flagId: 'urgency' },
          { text: '.' },
        ],
      },
      {
        parts: [
          { text: 'Please review the attached invoice to avoid ' },
          { text: 'account suspension', flagId: 'attachment-risk' },
          { text: '.' },
        ],
      },
      {
        parts: [
          { text: 'You can securely verify your information here: ' },
          {
            text: 'https://amaz0n-support-verification.com/login',
            flagId: 'fake-link',
          },
        ],
      },
      {
        parts: [{ text: 'Regards,' }],
      },
      {
        parts: [{ text: 'Amazon Billing Team' }],
      },
    ],

    explanations: {
      'spoofed-sender':
        'The sender email uses a fake domain that imitates Amazon.',
      'attachment-risk':
        'Unexpected invoices and attachments are commonly used to deliver malware.',
      'fake-link':
        'The link contains a lookalike domain (amaz0n instead of amazon).',
      urgency:
        'Scammers create artificial urgency to pressure quick decisions.',
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
    profileName: 'Brand Collabs',
    followers: '1,284 followers',
    posts: '12 posts',
    correctFlags: ['too-good', 'impersonation', 'malicious-link'],
    message: [
      {
        text: 'Hello! We are selecting a few creators for a ',
        flag: null,
      },
      {
        text: 'paid brand collaboration',
        flag: 'too-good',
      },
      {
        text: '.\n\nYou have been shortlisted for ₹85,000 campaign.\n\n',
        flag: null,
      },
      {
        text: 'To confirm participation, register here:\n',
        flag: null,
      },
      {
        text: 'https://brand-collabs-verify.com/apply',
        flag: 'malicious-link',
      },
      {
        text: '\n\nLimited slots available. Respond ASAP.',
        flag: 'impersonation',
      },
    ],
    explanations: {
      'too-good':
        'Unsolicited high-paying offers are commonly used to lure victims.',
      impersonation:
        'Scammers pretend to be brand agencies without verification.',
      'malicious-link':
        'The link uses a suspicious domain unrelated to any real brand.',
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
