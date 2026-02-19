export const scams = [
  // 1 — ICICI SMS phishing (iPhone Messages UI)
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
        text: 'Scammers create fake deadlines — "2 hours" — to stop you from thinking clearly and acting fast.',
      },
      {
        id: 'fake-link',
        label: 'Fake domain',
        text: 'ICICI Bank\'s real domain is icicibank.com — not "icici-verify.co". Banks never send login links via SMS.',
      },
    ],
    explanation: {
      short: 'A phishing SMS using urgency and a fake look-alike link.',
    },
  },

  // 2 — Amazon billing email phishing (Gmail UI)
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
        text: '"amaz0n-support.com" — the letter "o" is replaced with a zero. Amazon only emails from amazon.com.',
      },
      {
        id: 'attachment',
        label: 'Suspicious attachment',
        text: "Legitimate companies don't email you unsolicited invoices. Attachments from strangers can carry malware.",
      },
      {
        id: 'fake-link',
        label: 'Fake URL',
        text: "This link leads to a scammer's domain, not amazon.com. Never click billing or account links inside emails.",
      },
    ],
    explanation: {
      short:
        'An email impersonating Amazon with a spoofed sender and malicious link.',
    },
  },

  // 3 — WhatsApp KYC scam (WhatsApp UI with link preview card)
  {
    id: 3,
    type: 'whatsapp',
    verdict: 'phishing',
    sender: 'Jio Support',
    message: [
      { text: 'Dear customer, your SIM will be ', flag: null },
      { text: 'deactivated today', flag: 'authority' },
      {
        text: ' due to KYC not completed.\n\nComplete verification immediately:',
        flag: null,
      },
      { text: 'http://jio-kyc-update.in', flag: 'fake-link' },
    ],
    flags: [
      {
        id: 'authority',
        label: 'Fake authority',
        text: 'Jio never contacts customers on WhatsApp to demand KYC. This impersonates an official brand to create panic.',
      },
      {
        id: 'fake-link',
        label: 'Fake domain',
        text: 'Jio\'s real site is jio.com. The domain "jio-kyc-update.in" is fake — hyphenated unofficial domains are a major red flag.',
      },
    ],
    explanation: {
      short: 'A telecom impersonation scam using panic and a fake KYC link.',
    },
  },

  // 4 — Instagram collaboration DM scam (Instagram DM UI)
  {
    id: 4,
    type: 'instagram',
    verdict: 'phishing',
    sender: 'brand.collabs_official',
    followers: '1,284 followers',
    posts: '12 posts',
    message: [
      { text: 'Hello! We are selecting creators for a ', flag: null },
      { text: 'paid brand collaboration', flag: 'too-good' },
      {
        text: '. You have been shortlisted for a ₹85,000 campaign.\n\nTo confirm, register here:\n',
        flag: null,
      },
      { text: 'https://brand-collabs-verify.com/apply', flag: 'fake-link' },
      { text: '\n\nLimited slots. Respond ASAP.', flag: 'urgency' },
    ],
    flags: [
      {
        id: 'too-good',
        label: 'Too good to be true',
        text: 'Unsolicited ₹85,000 brand deals from unknown accounts are almost always scams. Real brands research you first.',
      },
      {
        id: 'fake-link',
        label: 'Shady domain',
        text: 'Legitimate brands onboard creators through official contracts and emails — not random "verify" links from DMs.',
      },
      {
        id: 'urgency',
        label: 'Fake urgency',
        text: '"Limited slots" and "Respond ASAP" are classic pressure tactics designed to stop you from verifying the offer.',
      },
    ],
    explanation: {
      short: 'A fake Instagram brand collab using unrealistic pay and urgency.',
    },
  },

  // 5 — Browser pop-up tech support scam (Windows dialog UI)
  {
    id: 5,
    type: 'popup',
    verdict: 'phishing',
    sender: 'System Alert',
    message: [
      {
        text: 'WARNING: Your device has been infected with malware.\n\n',
        flag: null,
      },
      {
        text: 'Immediate action required to prevent data loss and identity theft.\n\n',
        flag: 'fear',
      },
      {
        text: 'Call Microsoft Support NOW: +91-98XXXXXXX',
        flag: 'fake-support',
      },
    ],
    flags: [
      {
        id: 'fear',
        label: 'Fear tactic',
        text: 'Real OS security warnings never appear as browser popups. This dialog is designed to make you panic and act without thinking.',
      },
      {
        id: 'fake-support',
        label: 'Fake helpline',
        text: 'Microsoft never puts a phone number in a browser alert. Calling this number connects you to scammers who will ask for money or access.',
      },
    ],
    explanation: {
      short:
        'A fake Windows security popup using fear to push you to call scammers.',
    },
  },
];
