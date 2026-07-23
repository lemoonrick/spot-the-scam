// UI-chrome strings (everything that is NOT scam content — that lives in scams.js).
// Two locales: en (English) and mr (Marathi, simple everyday words — not formal).
// Use {placeholder} tokens for values interpolated at render time via t(key, params).

export const strings = {
  en: {
    // Start screen
    'start.eyebrow': 'Scam Awareness · Maharashtra Gramin Bank',
    'start.headlineMain': 'Spot the Scam.',
    'start.headlineSub': 'Before it spots you.',
    'start.body':
      'Real examples — fake SMS and WhatsApp messages. Learn to spot the tricks before someone uses them on you.',
    'start.pillTime': 'About 3 minutes',
    'start.pillNoSignup': 'No sign-up',
    'start.cta': 'Start',
    'start.ctaHint': 'Free · Works on mobile · No account needed',
    'start.bankName': 'Maharashtra Gramin Bank',
    'start.footerHelp': 'Cheated online? Call the fraud helpline 1930.',
    'start.heroBadge': 'Safe banking for every village',
    'start.heroAlt': 'Farmers working together in a green paddy field',
    'start.pillFree': 'Free',

    // Quiz controls
    'scam.correct': 'Correct!',
    'scam.incorrect': 'Not quite.',
    'scam.verdictPhishing': 'Scam',
    'scam.verdictLegit': 'Safe',
    'scam.showMe': 'Show me',

    // Flag card
    'flag.seeScore': 'See my score',
    'flag.nextExample': 'Next example',
    'flag.next': 'Next',

    // Results screen
    'an.yourResults': 'Your Results',
    'an.tally': '{correct} correct out of {total}',
    'an.tryAgain': 'Try Again',
    'an.breakdownTitle': 'Question Breakdown',
    'an.youSaid': 'You said:',
    'an.correctMark': 'Correct',
    'an.wrongWas': 'Wrong. It was {verdict}',
    'an.feedbackHigh': 'Hard to fool. Great instincts!',
    'an.feedbackMid': 'Good — but stay sharp.',
    'an.feedbackLow': "You're reacting too fast. Be careful.",

    // Channel labels
    'type.sms': 'SMS',
    'type.whatsapp': 'WhatsApp',
    'type.email': 'Email',
    'type.instagram': 'Instagram',
    'type.popup': 'Browser Popup',
    'type.upi': 'UPI / GPay',
  },

  mr: {
    // Start screen
    'start.eyebrow': 'फसवणूक जागरूकता · महाराष्ट्र ग्रामीण बँक',
    'start.headlineMain': 'फसवणूक ओळखा.',
    'start.headlineSub': 'सावध तोच सुरक्षित!',
    'start.body':
      'खरेखुरे मेसेज बघा, त्यातली चलाखी ओळखा — आणि पुढच्या वेळी बिनधास्त "नाही" म्हणा.',
    'start.pillTime': 'फक्त ३ मिनिटं',
    'start.pillNoSignup': 'लॉगिन नको',
    'start.cta': 'सुरू करा',
    'start.ctaHint': 'फुकट · मोबाईलवर चालतं · खातं-बितं काही नको',
    'start.bankName': 'महाराष्ट्र ग्रामीण बँक',
    'start.footerHelp': 'ऑनलाइन फसवणूक झाली? लगेच 1930 वर फोन करा.',
    'start.heroBadge': 'गावागावात सुरक्षित बँकिंग',
    'start.heroAlt': 'हिरव्या शेतात एकत्र काम करणारे शेतकरी',
    'start.pillFree': 'मोफत',

    // Quiz controls
    'scam.correct': 'अगदी बरोबर!',
    'scam.incorrect': 'अरेरे, चुकलं!',
    'scam.verdictPhishing': 'फसवणूक',
    'scam.verdictLegit': 'खरे',
    'scam.showMe': 'दाखवा',

    // Flag card
    'flag.seeScore': 'माझा स्कोअर बघा',
    'flag.nextExample': 'पुढचं उदाहरण',
    'flag.next': 'पुढे',

    // Results screen
    'an.yourResults': 'तुमचा निकाल',
    'an.tally': '{total} पैकी {correct} बरोबर',
    'an.tryAgain': 'पुन्हा खेळा',
    'an.breakdownTitle': 'एकेक प्रश्न बघा',
    'an.youSaid': 'तुम्ही म्हणालात:',
    'an.correctMark': 'बरोबर',
    'an.wrongWas': 'चूक. ते खरं तर {verdict} होतं',
    'an.feedbackHigh': 'तुम्हाला फसवणं अवघड! एकदम हुशार.',
    'an.feedbackMid': 'छान चाललंय — पण गाफील राहू नका.',
    'an.feedbackLow': 'जरा घाई होतेय. निवांत विचार करा.',

    // Channel labels
    'type.sms': 'एसएमएस',
    'type.whatsapp': 'व्हॉट्सॲप',
    'type.email': 'ईमेल',
    'type.instagram': 'इन्स्टाग्राम',
    'type.popup': 'पॉपअप',
    'type.upi': 'यूपीआय',
  },
};

export const LOCALES = ['en', 'mr'];
