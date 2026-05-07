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
    title: 'Billing & Subscription',
    faqs: [
      {
        question: 'Do I need a subscription?',
        answer:
          'Yes. A single subscription ($9.99/mo AUD or $99.99/yr) unlocks all features including unlimited tags, unlimited scans, WhatsApp relay, location tracking, and access to the tag store.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          'Yes, with no penalty. Cancel from your account settings and your access continues until the end of your current billing period.',
      },
      {
        question: 'What happens to my tags if I cancel?',
        answer:
          'Your tags will stop relaying contacts until you resubscribe. Your tag data is retained for 30 days after cancellation so you can easily resume.',
      },
    ],
  },
] as const;
