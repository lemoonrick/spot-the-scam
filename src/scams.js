export const scams = [
  // 1 — ICICI SMS phishing
  {
    id: 1,
    type: 'sms',
    verdict: 'phishing',
    sender: 'ICICI Alerts',
    correctFlags: ['urgency', 'fake-link'],
    message: [
      { text: 'ICICI: Your account access will be ', flag: null },
      { text: 'restricted within 2 hours', flag: 'urgency' },
      { text: ' due to unusual login activity.\n\nVerify now:\n', flag: null },
      { text: 'https://icici-verify.co/login', flag: 'fake-link' },
    ],
    explanation: {
      short:
        'This is a phishing attempt using urgency and a look-alike domain.',
      points: [
        'Scammers create artificial deadlines to pressure quick action.',
        'The URL uses a fake domain. Banks do not use unofficial domains for verification.',
      ],
    },
  },

  // 2 — Amazon billing email phishing
  {
    id: 2,
    type: 'email',
    verdict: 'phishing',
    subject: 'Action required: Confirm your Amazon billing details',
    senderName: 'Amazon Billing',
    senderEmail: '<billing@amaz0n-support.com>',
    time: '9:14 AM',
    correctFlags: ['spoofed-sender', 'attachment-risk'],
    message: [
      { text: 'Hello,\n\n', flag: null },
      {
        text: 'We were unable to process your recent order due to a billing issue.\n\n',
        flag: null,
      },
      {
        text: 'Please review the attached invoice to avoid account suspension.\n\n',
        flag: 'attachment-risk',
      },
      { text: 'You can securely verify your information here:\n', flag: null },
      {
        text: 'https://amaz0n-support-verification.com/login\n\n',
        flag: 'spoofed-sender',
      },
      { text: 'Regards,\n', flag: null },
      { text: 'Amazon Billing Team', flag: null },
    ],
    explanation: {
      short:
        'This email impersonates Amazon using a fake sender domain and malicious link.',
      points: [
        'The sender domain contains a zero instead of the letter "o".',
        'Unexpected attachments and urgent billing threats are common phishing tactics.',
      ],
    },
  },

  // 3 — WhatsApp KYC scam
  {
    id: 3,
    type: 'whatsapp',
    verdict: 'phishing',
    sender: 'Jio Support',
    correctFlags: ['authority', 'fake-link'],
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
    explanation: {
      short: 'This is a telecom impersonation scam designed to create panic.',
      points: [
        'Scammers impersonate telecom providers to create urgency.',
        'Official companies do not use random hyphenated domains for verification.',
      ],
    },
  },

  // 4 — Instagram collaboration DM scam
  {
    id: 4,
    type: 'instagram',
    verdict: 'phishing',
    sender: 'brand.collabs_official',
    followers: '1,284 followers',
    posts: '12 posts',
    correctFlags: ['too-good', 'fake-link'],
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
        text: '. You have been shortlisted for ₹85,000 campaign.\n\nTo confirm participation, register here:\n',
        flag: null,
      },
      {
        text: 'https://brand-collabs-verify.com/apply',
        flag: 'fake-link',
      },
      {
        text: '\n\nLimited slots available. Respond ASAP.',
        flag: 'too-good',
      },
    ],
    explanation: {
      short:
        'This is a fake brand collaboration scam using unrealistic payment and a malicious link.',
      points: [
        'Unsolicited high-pay offers are commonly used to lure creators.',
        'Legitimate brands do not use suspicious third-party domains for onboarding.',
      ],
    },
  },

  // 5 — Browser pop-up tech support scam
  {
    id: 5,
    type: 'popup',
    verdict: 'phishing',
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
    explanation: {
      short: 'This is a fake tech support pop-up designed to scare users.',
      points: [
        'Legitimate companies do not display emergency phone numbers in browser pop-ups.',
        'Fear-based messaging is meant to override rational thinking.',
      ],
    },
  },
];
