// Rural-financial scam examples for Maharashtra Gramin Bank (MGB).
// Audience: rural Maharashtra, low digital literacy. Content is bilingual — every
// user-facing string is stored as { en, mr }. Marathi uses simple everyday words.
//
// A resolver (src/i18n/localizeScam.js) flattens these to plain strings for the active
// locale BEFORE they reach the presentational components, so the components stay
// language-agnostic. Rules:
//   • `verdict` is a machine value — keep it exactly 'phishing' | 'legitimate'.
//   • `flag` ids inside message segments must match a flags[].id — never translate ids.
//   • `linkSite` is a URL string (not translated); `linkTitle` is translatable.
//
// article URLs point to real official resources for follow-up (cybercrime helpline 1930,
// pmkisan.gov.in, mahadiscom.in).

export const scams = [
  // 1 — SMS — OTP fraud (phishing)
  {
    id: 1,
    type: 'sms',
    verdict: 'phishing',
    sender: { en: 'MGB-ALERT', mr: 'MGB-ALERT' },
    guideText: {
      en: 'This text just arrived on your phone. Should you do what it says?',
      mr: 'हा मेसेज आत्ताच तुमच्या फोनवर आला. यात सांगितलं तसं करावं का?',
    },
    message: {
      en: [
        { text: 'Your Maharashtra Gramin Bank account will be ', flag: null },
        { text: 'closed today', flag: 'urgency' },
        { text: '. To keep it active, ', flag: null },
        { text: 'share the OTP', flag: 'share-otp' },
        { text: ' our officer sends you. Call ', flag: null },
        { text: '90XXXXXXXX', flag: 'fake-number' },
        { text: ' now.', flag: null },
      ],
      mr: [
        { text: 'तुमचं महाराष्ट्र ग्रामीण बँक खातं ', flag: null },
        { text: 'आज बंद होणार', flag: 'urgency' },
        { text: ' आहे. ते चालू ठेवण्यासाठी आमचा अधिकारी पाठवेल तो ', flag: null },
        { text: 'ओटीपी सांगा', flag: 'share-otp' },
        { text: '. लगेच ', flag: null },
        { text: '९०XXXXXXXX', flag: 'fake-number' },
        { text: ' वर कॉल करा.', flag: null },
      ],
    },
    flags: [
      {
        id: 'urgency',
        label: { en: 'Creates panic', mr: 'घाबरवतं' },
        text: {
          en: 'Scammers say "today" or "now" so you act before you think. Your bank never closes your account through an SMS.',
          mr: 'फसवणारे "आज" किंवा "लगेच" म्हणतात, म्हणजे तुम्ही विचार न करता कृती करता. बँक कधीही एसएमएसने खातं बंद करत नाही.',
        },
      },
      {
        id: 'share-otp',
        label: { en: 'Asks for your OTP', mr: 'ओटीपी मागतं' },
        text: {
          en: 'No bank or officer EVER asks for your OTP. Anyone who asks you to share an OTP is a thief. The OTP is only for you to type yourself.',
          mr: 'कोणतीही बँक किंवा अधिकारी कधीही ओटीपी मागत नाही. जो कोणी ओटीपी मागतो तो चोर असतो. ओटीपी फक्त तुम्ही स्वतः टाकायचा असतो.',
        },
      },
      {
        id: 'fake-number',
        label: { en: 'Unknown mobile number', mr: 'अनोळखी मोबाईल नंबर' },
        text: {
          en: 'A real bank does not ask you to call a random personal mobile number. This call goes straight to the fraudster.',
          mr: 'खरी बँक तुम्हाला अनोळखी मोबाईल नंबरवर कॉल करायला सांगत नाही. हा कॉल थेट फसवणाऱ्याकडे जातो.',
        },
      },
    ],
    article: {
      title: {
        en: 'Cheated? Call 1930 or visit cybercrime.gov.in',
        mr: 'फसवणूक झाली? 1930 वर कॉल करा',
      },
      url: 'https://cybercrime.gov.in',
    },
    explanation: {
      short: {
        en: 'A phishing SMS using panic and a fake number to steal your OTP.',
        mr: 'घाबरवून आणि खोट्या नंबरने ओटीपी चोरणारा फसवा एसएमएस.',
      },
    },
  },

  // 2 — WhatsApp — Fake PM-Kisan / crop subsidy (phishing)
  {
    id: 2,
    type: 'whatsapp',
    verdict: 'phishing',
    sender: { en: 'PM-Kisan Yojana', mr: 'पीएम-किसान योजना' },
    guideText: {
      en: 'A message about your farmer subsidy arrives on WhatsApp. Is it genuine?',
      mr: 'तुमच्या शेतकरी अनुदानाबद्दल व्हॉट्सॲपवर मेसेज आला. तो खरा आहे का?',
    },
    message: {
      en: [
        { text: 'Dear farmer, your PM-Kisan installment of ', flag: null },
        { text: '₹2,000 is on hold', flag: 'authority' },
        { text: '. Complete your e-KYC before ', flag: null },
        { text: 'tonight', flag: 'urgency' },
        { text: ' to receive it:\n', flag: null },
        { text: 'https://pmkisan-kyc-update.in/verify', flag: 'fake-link' },
      ],
      mr: [
        { text: 'प्रिय शेतकरी, तुमचा पीएम-किसानचा ', flag: null },
        { text: '₹२,००० चा हप्ता अडकला', flag: 'authority' },
        { text: ' आहे. तो मिळवण्यासाठी ', flag: null },
        { text: 'आज रात्रीपूर्वी', flag: 'urgency' },
        { text: ' ई-केवायसी करा:\n', flag: null },
        { text: 'https://pmkisan-kyc-update.in/verify', flag: 'fake-link' },
      ],
    },
    linkSite: 'pmkisan-kyc-update.in',
    linkTitle: { en: 'PM-Kisan e-KYC Verification', mr: 'पीएम-किसान ई-केवायसी' },
    flags: [
      {
        id: 'authority',
        label: { en: 'Fake government message', mr: 'खोटा सरकारी मेसेज' },
        text: {
          en: 'Schemes like PM-Kisan are never handled through WhatsApp links. Real updates come from the official pmkisan.gov.in site or your bank.',
          mr: 'पीएम-किसानसारख्या योजना कधीही व्हॉट्सॲप लिंकवरून चालत नाहीत. खरी माहिती फक्त अधिकृत pmkisan.gov.in किंवा बँकेकडून येते.',
        },
      },
      {
        id: 'urgency',
        label: { en: 'False deadline', mr: 'खोटी मुदत' },
        text: {
          en: '"Before tonight" is pressure to make you hurry. Your subsidy does not disappear in one night.',
          mr: '"आज रात्रीपूर्वी" म्हणजे तुम्हाला घाई करायला लावतात. तुमचं अनुदान एका रात्रीत नाहीसं होत नाही.',
        },
      },
      {
        id: 'fake-link',
        label: { en: 'Fake website', mr: 'खोटी वेबसाइट' },
        text: {
          en: 'The real portal is pmkisan.gov.in. A hyphenated address like "pmkisan-kyc-update.in" is fake and steals your Aadhaar and bank details.',
          mr: 'खरी वेबसाइट pmkisan.gov.in आहे. "pmkisan-kyc-update.in" सारखा पत्ता खोटा असतो आणि तुमचा आधार व बँक तपशील चोरतो.',
        },
      },
    ],
    article: {
      title: {
        en: 'Check only on the official pmkisan.gov.in',
        mr: 'फक्त अधिकृत pmkisan.gov.in वर तपासा',
      },
      url: 'https://pmkisan.gov.in',
    },
    explanation: {
      short: {
        en: 'A fake subsidy message using a look-alike link to steal your details.',
        mr: 'तुमचा तपशील चोरण्यासाठी खोट्या लिंकचा वापर करणारा फसवा मेसेज.',
      },
    },
  },

  // 3 — WhatsApp — Fake subsidized loan scheme (phishing)
  {
    id: 3,
    type: 'whatsapp',
    verdict: 'phishing',
    sender: { en: 'MGB Loan Yojana', mr: 'MGB कर्ज योजना' },
    guideText: {
      en: 'You never applied, but this loan offer arrives. Should you trust it?',
      mr: 'तुम्ही अर्जच केला नाही, तरी हे कर्जाचं ऑफर आलं. यावर विश्वास ठेवावा का?',
    },
    message: {
      en: [
        { text: 'Congratulations! Maharashtra Gramin Bank has ', flag: null },
        {
          text: 'pre-approved your ₹50,000 loan at 0% interest',
          flag: 'too-good',
        },
        { text: '. To release it, first ', flag: null },
        { text: 'pay a ₹499 processing fee', flag: 'advance-fee' },
        { text: ' and register here:\n', flag: null },
        { text: 'https://mgb-loan-subsidy.in/apply', flag: 'fake-link' },
      ],
      mr: [
        { text: 'अभिनंदन! महाराष्ट्र ग्रामीण बँकेने तुमचं ', flag: null },
        {
          text: '₹५०,००० चं कर्ज ०% व्याजाने मंजूर केलं',
          flag: 'too-good',
        },
        { text: ' आहे. ते मिळवण्यासाठी आधी ', flag: null },
        { text: '₹४९९ प्रोसेसिंग फी भरा', flag: 'advance-fee' },
        { text: ' आणि इथे नोंदणी करा:\n', flag: null },
        { text: 'https://mgb-loan-subsidy.in/apply', flag: 'fake-link' },
      ],
    },
    linkSite: 'mgb-loan-subsidy.in',
    linkTitle: {
      en: 'MGB Subsidy Loan Registration',
      mr: 'MGB अनुदान कर्ज नोंदणी',
    },
    flags: [
      {
        id: 'too-good',
        label: { en: 'Too good to be true', mr: 'खरं वाटण्याइतकं चांगलं' },
        text: {
          en: 'A ₹50,000 loan at 0% interest that you never applied for is bait. No bank pre-approves loans over WhatsApp.',
          mr: 'तुम्ही अर्जच केला नाही असं ₹५०,००० चं ०% व्याजाचं कर्ज म्हणजे आमिष. कोणतीही बँक व्हॉट्सॲपवर कर्ज आधी मंजूर करत नाही.',
        },
      },
      {
        id: 'advance-fee',
        label: { en: 'Asks for money first', mr: 'आधी पैसे मागतं' },
        text: {
          en: 'A real bank cuts any fee from the loan — it never asks you to pay first. "Pay ₹499 to get ₹50,000" is the classic advance-fee trap.',
          mr: 'खरी बँक फी कर्जातूनच कापते — आधी पैसे मागत नाही. "₹५०,००० मिळवण्यासाठी ₹४९९ भरा" हा जुनाच फसवा सापळा आहे.',
        },
      },
      {
        id: 'fake-link',
        label: { en: 'Fake website', mr: 'खोटी वेबसाइट' },
        text: {
          en: 'Maharashtra Gramin Bank uses its official website and branches, not a random site like "mgb-loan-subsidy.in".',
          mr: 'महाराष्ट्र ग्रामीण बँक फक्त अधिकृत वेबसाइट व शाखा वापरते, "mgb-loan-subsidy.in" सारखी अनोळखी साइट नाही.',
        },
      },
    ],
    article: {
      title: {
        en: 'Never pay to receive a loan — report at cybercrime.gov.in',
        mr: 'कर्ज मिळवण्यासाठी कधीही पैसे भरू नका',
      },
      url: 'https://cybercrime.gov.in',
    },
    explanation: {
      short: {
        en: 'A fake loan offer that traps you with an upfront "processing fee".',
        mr: '"प्रोसेसिंग फी"च्या नावाखाली आधी पैसे उकळणारं खोटं कर्ज ऑफर.',
      },
    },
  },

  // 4 — SMS — Fake electricity bill disconnection (phishing)
  {
    id: 4,
    type: 'sms',
    verdict: 'phishing',
    sender: { en: 'VM-MSEB', mr: 'VM-MSEB' },
    guideText: {
      en: 'A warning about your electricity bill arrives late at night. Is it real?',
      mr: 'रात्री उशिरा वीज बिलाबद्दल इशारा देणारा मेसेज आला. तो खरा आहे का?',
    },
    message: {
      en: [
        { text: 'Dear customer, your electricity will be ', flag: null },
        { text: 'disconnected tonight at 9:30 PM', flag: 'urgency' },
        {
          text: ' as your previous bill is not updated. Immediately contact our officer ',
          flag: null,
        },
        { text: '76XXXXXXXX', flag: 'fake-number' },
        { text: '. -MSEB', flag: null },
      ],
      mr: [
        { text: 'प्रिय ग्राहक, तुमचं मागचं बिल अपडेट न झाल्याने ', flag: null },
        { text: 'आज रात्री ९:३० वाजता वीज कापली जाईल', flag: 'urgency' },
        { text: '. लगेच आमच्या अधिकाऱ्याशी संपर्क करा ', flag: null },
        { text: '७६XXXXXXXX', flag: 'fake-number' },
        { text: '. -MSEB', flag: null },
      ],
    },
    flags: [
      {
        id: 'urgency',
        label: { en: 'Threat with a deadline', mr: 'धमकी आणि मुदत' },
        text: {
          en: 'A "tonight at 9:30" cut-off is meant to scare you into calling fast. The real electricity board gives written notice, not midnight threats.',
          mr: '"आज रात्री ९:३०" ही मुदत तुम्हाला घाबरवून लगेच कॉल करायला लावते. खरं वीज मंडळ लेखी सूचना देतं, रात्रीची धमकी नाही.',
        },
      },
      {
        id: 'fake-number',
        label: { en: 'Personal mobile number', mr: 'खाजगी मोबाईल नंबर' },
        text: {
          en: 'MSEDCL never asks you to call a personal 10-digit mobile number. That number goes straight to the scammer, who will ask you to pay through a link or app.',
          mr: 'महावितरण कधीही खाजगी १० अंकी मोबाईल नंबरवर कॉल करायला सांगत नाही. तो नंबर थेट फसवणाऱ्याकडे जातो, जो लिंक किंवा ॲपने पैसे भरायला सांगतो.',
        },
      },
    ],
    article: {
      title: {
        en: 'Pay electricity bills only on mahadiscom.in',
        mr: 'वीज बिल फक्त mahadiscom.in वर भरा',
      },
      url: 'https://www.mahadiscom.in',
    },
    explanation: {
      short: {
        en: 'A fake power-cut threat pushing you to call a scammer.',
        mr: 'फसवणाऱ्याला कॉल करायला भाग पाडणारी खोटी वीज-कपात धमकी.',
      },
    },
  },

  // 5 — SMS — Genuine MGB OTP (legitimate)
  {
    id: 5,
    type: 'sms',
    verdict: 'legitimate',
    sender: { en: 'VK-MGBANK', mr: 'VK-MGBANK' },
    guideText: {
      en: 'You just started a money transfer in your bank app, and this arrives. Is it safe?',
      mr: 'तुम्ही आत्ताच बँक ॲपमध्ये पैसे पाठवायला सुरुवात केली, आणि हा मेसेज आला. तो सुरक्षित आहे का?',
    },
    message: {
      en: [
        { text: 'MGB: ', flag: null },
        { text: '452318', flag: 'otp-code' },
        { text: ' is your OTP for ', flag: null },
        { text: '₹500 transfer to Ramesh K', flag: 'real-context' },
        { text: '. Valid 5 min. ', flag: null },
        { text: 'Do NOT share it with anyone', flag: 'protect-otp' },
        { text: '. -Maharashtra Gramin Bank', flag: null },
      ],
      mr: [
        { text: 'MGB: ', flag: null },
        { text: '४५२३१८', flag: 'otp-code' },
        { text: ' हा तुमचा ओटीपी आहे — ', flag: null },
        { text: 'रमेश के. यांना ₹५०० पाठवण्यासाठी', flag: 'real-context' },
        { text: '. ५ मिनिटं वैध. ', flag: null },
        { text: 'हा कोणालाही सांगू नका', flag: 'protect-otp' },
        { text: '. -महाराष्ट्र ग्रामीण बँक', flag: null },
      ],
    },
    flags: [
      {
        id: 'real-context',
        label: { en: 'Matches what you did', mr: 'तुमच्या कृतीशी जुळतं' },
        text: {
          en: 'It names the exact amount and the person you are paying. Genuine OTP messages describe your real transaction — fake ones stay vague.',
          mr: 'यात नेमकी रक्कम आणि तुम्ही कोणाला पैसे देताय ते नाव आहे. खरे ओटीपी मेसेज तुमच्या खऱ्या व्यवहाराचा उल्लेख करतात — खोटे मोघम असतात.',
        },
      },
      {
        id: 'otp-code',
        label: { en: 'A code to type, not a link', mr: 'टाकायचा कोड, लिंक नाही' },
        text: {
          en: 'The bank sends a number for YOU to enter in the app. It does not ask you to click a link or call anyone.',
          mr: 'बँक तुम्हाला ॲपमध्ये टाकण्यासाठी एक नंबर पाठवते. लिंकवर क्लिक करा किंवा कॉल करा असं सांगत नाही.',
        },
      },
      {
        id: 'protect-otp',
        label: { en: 'Tells you to protect it', mr: 'जपायला सांगतं' },
        text: {
          en: 'Real bank messages remind you never to share the OTP. Scammers do the opposite — they beg you to share it.',
          mr: 'खरे बँक मेसेज ओटीपी कोणालाही सांगू नका असं सांगतात. फसवणारे उलट — तो सांगण्यासाठी विनवणी करतात.',
        },
      },
    ],
    article: {
      title: {
        en: 'Golden rule: never share your OTP with anyone',
        mr: 'सोनेरी नियम: ओटीपी कोणालाही सांगू नका',
      },
      url: 'https://cybercrime.gov.in',
    },
    explanation: {
      short: {
        en: 'A genuine bank OTP — specific, link-free, and it tells you to protect it.',
        mr: 'खरा बँक ओटीपी — नेमका, लिंकशिवाय, आणि तो जपायला सांगणारा.',
      },
    },
  },
];
