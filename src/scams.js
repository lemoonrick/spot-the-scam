export const scams = [
  // 1 — ICICI SMS phishing
  {
    id: 1,
    type: 'sms',
    verdict: 'phishing',
    sender: 'ICICI Alerts',
    message: [
      { text: 'ICICI: Your account access will be ', flag: null },
      { text: 'restricted within 2 hours', flag: 'urgency' },
      { text: ' due to unusual login activity.\n\nVerify now:\n', flag: null },
      { text: 'https://icici-verify.co/login', flag: 'fake-link' },
    ],
    flags: [
      {
        id: 'urgency',
        label: 'Urgency tactic',
        text: 'Scammers create fake deadlines to pressure you into acting without thinking.',
      },
      {
        id: 'fake-link',
        label: 'Fake domain',
        text: 'ICICI\'s real domain is icicibank.com — not "icici-verify.co". Banks never send links like this.',
      },
    ],
    explanation: {
      short: 'This is a phishing SMS using urgency and a fake look-alike link.',
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
    message: [
      { text: 'Hello,\n\n', flag: null },
      {
        text: 'We were unable to process your recent order due to a billing issue.\n\n',
        flag: null,
      },
      {
        text: 'Please review the attached invoice to avoid account suspension.\n\n',
        flag: 'attachment',
      },
      { text: 'You can securely verify your information here:\n', flag: null },
      {
        text: 'https://amaz0n-support-verification.com/login\n\n',
        flag: 'fake-link',
      },
      { text: 'Regards,\nAmazon Billing Team', flag: null },
    ],
    flags: [
      {
        id: 'spoofed-sender',
        label: 'Spoofed sender',
        text: '"amaz0n-support.com" — the "o" is a zero. Amazon only emails from amazon.com.',
      },
      {
        id: 'attachment',
        label: 'Suspicious attachment',
        text: "Real companies don't send unsolicited invoices. Attachments can carry malware.",
      },
      {
        id: 'fake-link',
        label: 'Fake URL',
        text: "This link goes to a scammer's site, not amazon.com. Never click billing links in emails.",
      },
    ],
    explanation: {
      short:
        'This email impersonates Amazon using a spoofed sender and malicious link.',
    },
  },

  // 3 — WhatsApp KYC scam
  {
    id: 3,
    type: 'whatsapp',
    verdict: 'phishing',
    sender: 'Jio Support',
    message: [
      {
        text: 'Dear customer, your SIM will be deactivated today due to ',
        flag: null,
      },
      { text: 'KYC not completed', flag: 'authority' },
      { text: '.\n\nComplete verification immediately:\n', flag: null },
      { text: 'http://jio-kyc-update.in', flag: 'fake-link' },
    ],
    flags: [
      {
        id: 'authority',
        label: 'Fake authority',
        text: 'Jio never messages you on WhatsApp to demand KYC. This impersonates an official brand.',
      },
      {
        id: 'fake-link',
        label: 'Fake domain',
        text: 'Jio\'s real site is jio.com — not "jio-kyc-update.in". Hyphenated domains are a red flag.',
      },
    ],
    explanation: {
      short: 'A telecom impersonation scam designed to create panic.',
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
    message: [
      { text: 'Hello! We are selecting a few creators for a ', flag: null },
      { text: 'paid brand collaboration', flag: 'too-good' },
      {
        text: '. You have been shortlisted for ₹85,000 campaign.\n\nTo confirm participation, register here:\n',
        flag: null,
      },
      { text: 'https://brand-collabs-verify.com/apply', flag: 'fake-link' },
      { text: '\n\nLimited slots available. Respond ASAP.', flag: 'urgency' },
    ],
    flags: [
      {
        id: 'too-good',
        label: 'Too good to be true',
        text: 'Unsolicited ₹85,000 collab offers from unknown accounts are almost always scams.',
      },
      {
        id: 'fake-link',
        label: 'Shady domain',
        text: 'Legitimate brands onboard creators through official channels — not random third-party links.',
      },
      {
        id: 'urgency',
        label: 'Fake urgency',
        text: '"Limited slots" and "Respond ASAP" are pressure tactics to stop you from thinking clearly.',
      },
    ],
    explanation: {
      short:
        'A fake brand collab DM using unrealistic pay and a malicious link.',
    },
  },

  // 5 — Browser pop-up tech support scam
  {
    id: 5,
    type: 'popup',
    verdict: 'phishing',
    sender: 'System Alert',
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
    flags: [
      {
        id: 'fear',
        label: 'Fear tactic',
        text: "Real security warnings don't appear as browser pop-ups. This is designed to make you panic.",
      },
      {
        id: 'fake-support',
        label: 'Fake helpline',
        text: 'Microsoft never puts a support number in a browser alert. This leads to scammers.',
      },
    ],
    explanation: {
      short: 'A fake browser pop-up using fear to push you to call scammers.',
    },
  },
];
