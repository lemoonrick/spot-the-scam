export const scams = [
  {
    id: 1,
    type: 'whatsapp',
    sender: 'ICICI Bank',
    correctFlags: ['urgency', 'fake-link'],
    message: [
      {
        text: 'Your account will be ',
        flag: null,
      },
      {
        text: 'blocked in 24 hours',
        flag: 'urgency',
      },
      {
        text: ' due to suspicious activity.\n\nPlease verify immediately:\n',
        flag: null,
      },
      {
        text: 'http://icici-secure-verification.com',
        flag: 'fake-link',
      },
    ],
    explanations: {
      urgency: 'Scammers create urgency so you panic and act without thinking.',
      'fake-link': 'The website URL is not an official ICICI domain.',
    },
  },

  {
    id: 2,
    type: 'instagram',
    sender: 'brand_collab',
    correctFlags: ['impersonation', 'too-good'],
    message: [
      {
        text: 'Hey! We loved your profile and want to offer you a ',
        flag: null,
      },
      {
        text: 'paid brand collaboration',
        flag: 'too-good',
      },
      {
        text: '. Please DM us your email to proceed.\n\n',
        flag: null,
      },
      {
        text: 'This is an official brand account.',
        flag: 'impersonation',
      },
    ],
    explanations: {
      impersonation:
        'Scammers often pretend to be brands without verification.',
      'too-good': 'Unsolicited offers that sound too good are often scams.',
    },
  },
];
