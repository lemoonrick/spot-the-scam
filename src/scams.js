// article: { title, url } — real articles from myfactree.org
// If no exact match exists, closest relevant article is used.

export const scams = [
  // 1 — SMS — ICICI phishing
  {
    id: 1,
    type: 'sms',
    verdict: 'phishing',
    article: {
      title: 'Beware of Scam Calls in the Name of TRAI',
      url: 'https://myfactree.org/beware-of-scam-calls-in-the-name-of-trai/',
    },
    sender: 'ICICI Alerts',
    guideText:
      'You just received this text message. Does the timing and the link look suspicious?',
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

  // 2 — SMS — SBI OTP (legit)
  {
    id: 2,
    type: 'sms',
    verdict: 'legitimate',
    article: {
      title: 'Electricity Bill Scam: The Midnight Power-Cut Panic',
      url: 'https://myfactree.org/electricity-bill-scam-the-midnight-power-cut-panic/',
    },
    sender: 'SBI Bank',
    guideText:
      'You initiated a transaction and this arrives. Does this message check out?',
    message: [
      { text: 'SBI: Your OTP for transaction of ', flag: null },
      { text: '₹499 at Swiggy', flag: 'real-context' },
      { text: ' is ', flag: null },
      { text: '738291', flag: 'otp' },
      { text: '. Valid for 10 mins. ', flag: null },
      { text: 'Do not share this OTP with anyone.', flag: 'otp-warning' },
    ],
    flags: [
      {
        id: 'real-context',
        label: 'Specific context',
        text: 'The message states the exact merchant and amount. Legitimate OTP messages reference your actual transaction — vague messages do not.',
      },
      {
        id: 'otp',
        label: 'OTP, not a link',
        text: 'Real banks send a one-time code for you to enter — they never ask you to click a link to "verify" a transaction.',
      },
      {
        id: 'otp-warning',
        label: 'Warns you to protect it',
        text: 'Legitimate bank messages remind you not to share the OTP. Scammers do the opposite — they ask you to share it.',
      },
    ],
    explanation: {
      short:
        'A genuine OTP from your bank — specific, link-free, and protective.',
    },
  },

  // 3 — Email — Amazon phishing
  {
    id: 3,
    type: 'email',
    verdict: 'phishing',
    article: {
      title: 'Social Engineering: Why Smart People Fall for Scams',
      url: 'https://myfactree.org/social-engineering-why-smart-people-fall-for-scams/',
    },
    subject: 'Action required: Confirm your Amazon billing details',
    senderName: 'Amazon Billing',
    senderEmail: '<billing@amaz0n-support.com>',
    guideText:
      'Amazon has reached out regarding a billing issue. Check the sender before clicking anything.',
    time: '9:14 AM',
    message: [
      { text: 'Hello {name|there},\n\n', flag: null },
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

  // 4 — Email — Netflix (legit, rich HTML)
  {
    id: 4,
    type: 'email',
    emailStyle: 'rich',
    verdict: 'legitimate',
    article: {
      title: 'Social Engineering: Why Smart People Fall for Scams',
      url: 'https://myfactree.org/social-engineering-why-smart-people-fall-for-scams/',
    },
    subject: 'Now on Netflix: Demon Slayer: Kimetsu no Yaiba',
    senderName: 'Netflix',
    senderEmail: '<info@mailer.netflix.com>',
    guideText:
      'Netflix sent you an email. Is this a legitimate marketing email or a phishing attempt?',
    time: '8:45 AM',
    richHero: {
      bgColor: '#141414',
      tagline: 'Now on Netflix',
      title: 'Demon Slayer: Kimetsu no Yaiba',
      subtitle: 'Swordsmith Village Arc',
      meta: '2023  ·  U/A 16+  ·  11 Episodes',
      body: 'While in Swordsmith Village to repair his damaged blade, Tanjiro is joined by the Love and Mist Hashiras in their fight against a new demonic threat.',
      ctaText: 'Watch Now',
      ctaColor: '#E50914',
    },
    message: [
      { text: 'info@mailer.netflix.com', flag: 'official-domain' },
      {
        text: 'Watch Now → https://www.netflix.com/title/81091393',
        flag: 'real-link',
      },
      { text: 'No password or payment info requested', flag: 'no-ask' },
    ],
    flags: [
      {
        id: 'official-domain',
        label: 'Verified sender',
        text: '"mailer.netflix.com" is Netflix\'s official email marketing subdomain. Phishing emails use domains like "netflix-billing.com" or misspellings.',
      },
      {
        id: 'real-link',
        label: 'Link goes to netflix.com',
        text: 'The CTA button links directly to netflix.com — the real domain. You can hover any link to verify the destination before clicking.',
      },
      {
        id: 'no-ask',
        label: 'Asks for nothing sensitive',
        text: 'This is a content recommendation email. It asks you to watch — not to verify your payment, reset your password, or log in via a link.',
      },
    ],
    explanation: {
      short:
        'A genuine Netflix marketing email — correct domain, real links, asks for nothing.',
    },
  },

  // 5 — WhatsApp — Jio KYC (phishing)
  {
    id: 5,
    type: 'whatsapp',
    verdict: 'phishing',
    article: {
      title: 'Beware of Scam Calls in the Name of TRAI',
      url: 'https://myfactree.org/beware-of-scam-calls-in-the-name-of-trai/',
    },
    sender: 'Jio Support',
    guideText:
      'Your mobile service is at risk according to this message. Is this an official communication?',
    message: [
      { text: 'Dear {name|customer}, your SIM will be ', flag: null },
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

  // 6 — WhatsApp — Swiggy order update (legit)
  {
    id: 6,
    type: 'whatsapp',
    verdict: 'legitimate',
    article: {
      title:
        'Fake Delivery Calls: When "Your Parcel Is Stuck" Becomes a Threat',
      url: 'https://myfactree.org/fake-delivery-calls-when-your-parcel-is-stuck-becomes-a-threat/',
    },
    sender: 'Swiggy',
    guideText:
      'You just placed a food order and this WhatsApp message arrives. Is it genuine?',
    message: [
      { text: 'Hi! Your Swiggy order ', flag: null },
      { text: '#SW-48291', flag: 'order-id' },
      { text: ' from ', flag: null },
      { text: 'Pizza Hut, Koramangala', flag: 'merchant' },
      { text: ' has been confirmed.\n\n', flag: null },
      { text: 'Estimated delivery: 35 mins.', flag: 'eta' },
      { text: '\n\nTrack your order in the Swiggy app.', flag: 'no-link' },
    ],
    flags: [
      {
        id: 'order-id',
        label: 'Specific order ID',
        text: 'A real confirmation includes your actual order number. Generic messages without order details are a red flag.',
      },
      {
        id: 'merchant',
        label: 'Exact merchant details',
        text: 'The restaurant and location match what you ordered. Scam messages are always vague about specifics.',
      },
      {
        id: 'no-link',
        label: 'Directs to the app',
        text: 'Swiggy tells you to track in their app — not via a link in the message. Legitimate services use their own app, not SMS links.',
      },
    ],
    explanation: {
      short:
        'A genuine Swiggy order update — specific, no shady links, matches your actual order.',
    },
  },

  // 7 — Instagram — brand collab (phishing)
  {
    id: 7,
    type: 'instagram',
    verdict: 'phishing',
    article: {
      title: 'Investment Scam: The "Guaranteed Return" That Guarantees a Loss',
      url: 'https://myfactree.org/investment-scam-the-guaranteed-return-that-guarantees-a-loss/',
    },
    sender: 'brand.collabs_official',
    followers: '1,284 followers',
    posts: '12 posts',
    guideText:
      "A brand wants to pay you for a collaboration. Does the offer match the account's credibility?",
    message: [
      { text: 'Hello {name|there}! We are selecting creators for a ', flag: null },
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

  // 8 — Popup — Windows alert (phishing)
  {
    id: 8,
    type: 'popup',
    verdict: 'phishing',
    article: {
      title: 'Social Engineering: Why Smart People Fall for Scams',
      url: 'https://myfactree.org/social-engineering-why-smart-people-fall-for-scams/',
    },
    sender: 'System Alert',
    guideText:
      'A sudden warning appears while browsing. Is this your operating system or a website trick?',
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

  // 9 — Email — FactTree impact report (legit)
  {
    id: 9,
    type: 'email',
    verdict: 'legitimate',
    article: {
      title: 'What is Lateral Reading?',
      url: 'https://myfactree.org/what-is-lateral-reading/',
    },
    subject: 'Your Monthly FactTree Impact Report',
    senderName: 'FactTree Team',
    senderEmail: '<hello@myfactree.org>',
    guideText:
      'A trusted organization sent you an impact report. Check the sender details carefully.',
    time: '10:30 AM',
    message: [
      { text: 'Hi {name|there},\n\n', flag: null },
      {
        text: 'Your monthly impact report is ready! Thanks to your support, we reached 5,000 students this month.\n\n',
        flag: null,
      },
      {
        text: 'You can view the full report on our official dashboard:\n',
        flag: null,
      },
      { text: 'https://myfactree.org/dashboard', flag: 'safe-link' },
      { text: '\n\nBest,\nThe FactTree Team', flag: null },
    ],
    flags: [
      {
        id: 'official-domain',
        label: 'Verified sender',
        text: 'The email comes from the official "myfactree.org" domain, matching the organization exactly.',
      },
      {
        id: 'safe-link',
        label: 'Official link',
        text: 'The URL leads directly to the main website with no strange hyphens or misspellings.',
      },
    ],
    explanation: {
      short: 'A genuine update from a verified organization domain.',
    },
  },

  // 10 — UPI — Fake "accidental" collect request (phishing)
  {
    id: 10,
    type: 'upi',
    verdict: 'phishing',
    article: {
      title: 'QR Code Scam: The New Face of Everyday Fraud',
      url: 'https://myfactree.org/qr-code-restaurant-parking-scam-the-new-face-of-everyday-fraud/',
    },
    sender: 'Rahul Sharma',
    upiId: 'refund.support@okaxis',
    amount: '₹1',
    note: 'Flipkart refund for order #FL-9920183. Accept to receive ₹4,800 back.',
    guideText:
      'Someone says they sent you a refund on GPay. This screen appears asking for your UPI PIN. What do you do?',
    flags: [
      {
        id: 'collect-not-receive',
        label: '"Paying" means money LEAVES your account',
        text: 'This screen says "Paying" — not "Receiving". A UPI collect request debits YOU. You never need to enter your PIN to receive money. If someone says "enter your PIN to get a refund", it\'s a scam.',
      },
      {
        id: 'fake-upi-id',
        label: 'No company sends refunds from personal UPI IDs',
        text: 'Flipkart refunds go directly to your original payment method. "refund.support@okaxis" is a personal/fraudulent ID — no e-commerce brand uses a handle like this.',
      },
      {
        id: 'small-amount-trick',
        label: '₹1 is a test — bigger amounts follow',
        text: "Scammers start small to make you comfortable. Once you've entered your PIN for ₹1, they know it works and immediately send another request for thousands. Each approval also teaches them your pattern.",
      },
    ],
    explanation: {
      short:
        'A fake GPay collect request disguised as a Flipkart refund. Entering your PIN sends money — it never receives it.',
    },
  },
];
