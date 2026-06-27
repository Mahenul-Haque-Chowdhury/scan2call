export const faqCategories = [
  {
    title: 'Privacy & Security',
    faqs: [
      {
        question: 'How does Scan2Call protect my privacy?',
        answer:
          'All communication between a finder and tag owner is relayed through Scan2Call using Twilio Proxy sessions. The finder never sees your phone number, email, or name - at any point in the process.',
      },
      {
        question: 'Can the finder see my location?',
        answer:
          'No. However, when a tag is scanned you receive a notification showing the approximate scan location, helping you coordinate retrieval. The finder cannot see this - only you can.',
      },
      {
        question: 'Is my data stored in Australia?',
        answer:
          'Yes. All data is stored in the ap-southeast-2 (Sydney) region under the Australian Privacy Act.',
      },
      {
        question: 'How long does the anonymous relay session last?',
        answer:
          'Relay sessions auto-expire after a short window (typically 24 hours), after which the proxy number is recycled. You can also instantly disable any tag or block a contact from your dashboard.',
      },
    ],
  },
  {
    title: 'Using Your Tags',
    faqs: [
      {
        question: 'What happens when someone scans my tag?',
        answer:
          'They see a branded contact page with options to call, send an SMS, or message via WhatsApp. All channels route through our anonymous relay - no app download required on their end.',
      },
      {
        question: 'What kinds of tags are available?',
        answer:
          'We offer keychain tags, adhesive stickers, luggage tags, pet collar tags, and more. Browse our store for the full catalog.',
      },
      {
        question: 'How do I activate a tag?',
        answer:
          "After purchasing, scan the tag with your phone camera or enter the code on the packaging. You'll be guided through linking it to your account - the whole process takes under a minute.",
      },
      {
        question: 'Can I transfer a tag to someone else?',
        answer:
          'Yes. You can unlink a tag from your account at any time, after which it can be activated by another user.',
      },
    ],
  },
  {
    title: 'Pricing & Renewals',
    faqs: [
      {
        question: 'Do I need a subscription?',
        answer:
          'No. There is no subscription. The QR tag is the product: you buy a tag and choose how long you want it active, from 1 to 5 years. Stickers and tags are $7.25/year, the Medical ID Band is $14.49/year, and Find My devices are $29.99 (including the first year) plus $7.25/year after that.',
      },
      {
        question: 'How does auto-renewal work?',
        answer:
          'It is optional. Turn it on at checkout and we renew your QR for one more year before it expires, charging your saved card. We email you about a month before expiry, and you can turn auto-renewal off anytime.',
      },
      {
        question: 'What happens when my QR expires?',
        answer:
          'When a QR expires it stops relaying contact and scanning it shows a friendly message. Renew it (or have auto-renewal on) to bring it straight back. Your tag data is kept so renewing is instant.',
      },
      {
        question: 'I bought a tag in a supermarket. How do I use it?',
        answer:
          'Scan it and follow the prompts to claim it to your free account. It activates with the QR period included on the packaging. After that you can renew it like any other tag.',
      },
    ],
  },
] as const;
