import { PrismaClient, Role } from '../apps/api/src/generated/prisma/client';

const prisma = new PrismaClient();

// Days-ago helper so each post gets a distinct, realistic publish date.
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d;
}

interface SeedPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: Date;
  isFeatured?: boolean;
}

const posts: SeedPost[] = [
  {
    slug: 'how-to-get-a-lost-suitcase-back-fast',
    title: 'How to Get a Lost Suitcase Back Fast',
    excerpt:
      'A missing bag is stressful. Here is exactly what to do in the first hour, and how a QR luggage tag gets you reconnected without printing your details for everyone to see.',
    category: 'Travel',
    tags: ['luggage tag', 'lost luggage', 'travel', 'lost and found'],
    coverImageUrl: '/images/products/luggage-tag.png',
    metaTitle: 'How to Get a Lost Suitcase Back Fast',
    metaDescription:
      'Lost your suitcase? Learn what to do in the first hour and how a QR luggage tag reconnects you with a finder privately, without an app.',
    publishedAt: daysAgo(35),
    content: `Losing a suitcase at an airport or on a train is one of travel's worst feelings. The good news is that most lost bags are found by someone honest who simply has no easy way to reach the owner. Closing that gap is the whole point of a QR luggage tag.

## What to do the moment a bag goes missing

Stay where you are for a minute and retrace the last place you definitely had it. Report it to the carrier or venue lost-and-found straight away and get a reference number. Then make sure the bag can speak for itself: a finder who picks it up should be able to contact you within seconds, not days.

## Put your contact on the bag - privately

The old advice was to write your phone number on a paper tag. That works, but it also shows your number to every stranger who walks past. A Scan2Call QR luggage tag flips that around. The finder scans the code with their phone camera, and they can call, text, or message you through an anonymous relay. They never see your real phone number, email, or address, and you never see theirs unless you reply.

## Why a QR tag beats a paper tag

Paper tags tear off, fade, and expose your details. A QR tag is durable, weatherproof, and private. There is no app for the finder to download - the scan opens a simple contact page in their browser. You also get a notification when your tag is scanned, including the approximate location, so you can coordinate getting your bag back.

## Set it and forget it

Activate the tag once, link it to your account, and choose how long you want it active at checkout. If you travel often, turn on auto-renewal so the QR never lapses between trips. The next time a bag goes wandering, the person who finds it has a one-tap way to reunite it with you.

Ready to protect your luggage? Browse luggage tags in the store and see how the anonymous relay works.`,
  },
  {
    slug: 'id-your-pet-without-a-microchip-scanner',
    title: 'The Best Way to ID Your Pet Without a Microchip Scanner',
    excerpt:
      'Microchips are great, but they need a vet or shelter with a scanner. A QR pet collar tag lets anyone who finds your pet reach you instantly with just their phone.',
    category: 'Pets',
    tags: ['pet collar tag', 'pet safety', 'microchip', 'lost pet'],
    coverImageUrl: '/images/products/pet-collar-tag.png',
    metaTitle: 'ID Your Pet Without a Microchip Scanner',
    metaDescription:
      'A microchip needs a scanner; a QR pet tag needs only a phone. See how a scannable collar tag reunites you with a lost pet faster - privately.',
    publishedAt: daysAgo(28),
    content: `Microchipping your pet is essential, but it has one catch: a microchip can only be read by a vet, shelter, or ranger with a special scanner. If a neighbour finds your dog wandering on a Saturday afternoon, that chip cannot help them in the moment. A QR pet collar tag fills that gap.

## A phone is the only scanner needed

A Scan2Call pet tag is a QR code on your pet's collar. Anyone who finds your pet can scan it with an ordinary phone camera and immediately reach you - call, SMS, or WhatsApp - through an anonymous relay. They never see your personal contact details, and you get an instant notification, often with the approximate scan location.

## Microchip and QR tag work together

This is not a replacement for a microchip; it is the fast, in-the-moment layer on top of it. The chip is your permanent backstop for shelters and vets. The QR tag is what gets your pet home the same hour, straight from the person standing over them.

## Find My built in

The Pet Collar tag also works with Apple Find My and Google Find My Device, so you have a location option as well as anonymous contact. It is a small, durable tag that clips to almost any collar.

## Setting it up takes a minute

Order the tag, scan it, and link it to your account. Add a friendly label like "If found, please call - reward offered" so finders know what to do. Choose how long you want the QR active, and turn on auto-renewal so it never lapses.

Give your pet a voice. Browse pet collar tags in the store and see how the relay keeps your details private.`,
  },
  {
    slug: 'found-lost-keys-how-to-return-them',
    title: "Found Someone's Lost Keys? Here's How to Return Them",
    excerpt:
      'You found a set of keys on the footpath. Here is the easiest way to get them back to their owner - and how to make sure your own keys are just as easy to return.',
    category: 'Lost & Found',
    tags: ['keychain tag', 'lost keys', 'lost and found', 'good samaritan'],
    coverImageUrl: '/images/products/keychain-tag.png',
    metaTitle: "Found Lost Keys? How to Return Them",
    metaDescription:
      "Found a lost set of keys? The fastest way to return them, and how a QR keychain tag makes your own keys easy to reunite - without sharing your number.",
    publishedAt: daysAgo(21),
    content: `Finding a stranger's keys puts you in an awkward spot. You want to do the right thing, but there is rarely a name or number attached. Here is how to handle it, whether or not the keys have a tag.

## If the keys have a QR tag

Look for a small tag with a QR code. Scan it with your phone camera - it opens a contact page in your browser, no app required. You can call or message the owner straight away through an anonymous relay. You will not see their personal number, and they will not see yours; you are simply connected long enough to hand the keys back.

## If there is no tag

Hand them in to a nearby shop, building reception, or your local police station, and note where you found them. If you found them near a car, you can leave a note - but resist the urge to wait around. Handing them to a fixed, trusted location is usually the surest path back to the owner.

## Make your own keys easy to return

The reason so many keys never make it home is that there is no safe way to contact the owner. A Scan2Call keychain tag fixes that. Clip it to your keyring, and anyone who finds your keys can reach you in one scan while your details stay private. You also get a notification with the approximate location when your tag is scanned.

## Quick to set up

Order a keychain tag, scan it, link it to your account, and you are protected. Pick how long you want the QR active and enable auto-renewal so it never expires on you.

Be the reason someone gets their keys back - and protect your own. Browse keychain tags in the store.`,
  },
  {
    slug: 'qr-windshield-sticker-vs-note-on-car',
    title: 'Anonymous Contact for Your Parked Car: Why a QR Sticker Beats a Note',
    excerpt:
      'Leaving your phone number on the dashboard invites spam and worse. A windshield QR sticker lets people reach you about your car without ever seeing your number.',
    category: 'Cars',
    tags: ['car sticker', 'parking', 'anonymous contact', 'lost and found'],
    coverImageUrl: '/images/products/car-sticker.png',
    metaTitle: 'QR Windshield Sticker vs a Note on Your Car',
    metaDescription:
      'A dashboard note exposes your number to everyone. See how a windshield QR sticker lets people contact you about your parked car privately.',
    publishedAt: daysAgo(14),
    content: `Sometimes people need to reach you about your parked car: a minor bump, a blocked driveway, lights left on, or a delivery that needs you to move. The usual fix is scribbling your number on a note behind the windscreen - but that hands your phone number to every passer-by.

## The problem with a paper note

A visible number is an open invitation for spam texts, scam calls, and unwanted attention. It also weathers badly and falls down. You are trading your privacy for a just-in-case.

## How a windshield QR sticker works

A Scan2Call car sticker sits discreetly on the glass. If someone needs to reach you, they scan the QR code and are connected to you through an anonymous relay - a call or message that protects both sides. They never see your number, and you decide whether to respond. You also get notified when the sticker is scanned.

## Privacy that works both ways

Because the relay sits in the middle, neither party exposes personal details. That is far safer than a handwritten note, especially for anyone who would rather not share a mobile number with strangers.

## Set up once

Apply the sticker, scan it, and link it to your account. Choose your QR term and switch on auto-renewal so it keeps working year after year. It is a small, low-profile way to stay reachable about your vehicle without giving up your privacy.

See car windshield stickers in the store and learn how the relay keeps you anonymous.`,
  },
  {
    slug: 'qr-tags-vs-bluetooth-trackers',
    title: 'QR Tags vs Bluetooth Trackers: Which Is Right for You?',
    excerpt:
      'Bluetooth trackers and QR tags solve different problems. Here is a clear, honest comparison so you can pick the right tool - or use both together.',
    category: 'Guides',
    tags: ['qr tags', 'bluetooth trackers', 'comparison', 'lost and found'],
    coverImageUrl: '/images/sca2callhero.png',
    metaTitle: 'QR Tags vs Bluetooth Trackers: Which to Choose',
    metaDescription:
      'A clear comparison of QR identity tags and Bluetooth trackers - how each works, range, battery, privacy, and cost - so you can choose the right one.',
    publishedAt: daysAgo(7),
    isFeatured: true,
    content: `"Should I get a Bluetooth tracker or a QR tag?" is one of the most common questions we hear. The honest answer is that they do different jobs, and for many people the best setup uses both.

## How each one actually works

A Bluetooth tracker pings nearby phones to estimate a location on a map. It is great for finding something you misplaced near you, or seeing roughly where a bag is. A QR identity tag works the other way around: when a person finds your item, they scan it and contact you directly through an anonymous relay. It connects you to the human who has your item right now.

## Range and battery

Bluetooth trackers depend on being within range of a phone in their network and need a battery that eventually runs flat. A QR tag has no battery and no range limit - it works anywhere a finder has a phone and a moment to scan, indefinitely.

## Privacy

This is where QR tags shine. With Scan2Call, a finder reaches you through a relay, so neither side sees the other's phone number, email, or address. There is no app for the finder to install. You stay in control of who can reach you and for how long.

## Cost

Trackers are a higher upfront cost per unit with batteries to replace. QR tags are inexpensive and priced per year, so you can put one on everything - pet collar, luggage, keys, car, passport - without spending much.

## Which should you choose?

If you want a live-ish map location for something near you, a Bluetooth tracker helps. If you want a stranger who finds your lost item to reunite it with you quickly and privately, a QR tag is the tool - and on items like pet collars you get both, since our Find My devices support Apple Find My and Google Find My Device.

Compare options on the pricing page, or browse the full range in the store.`,
  },
];

async function main() {
  console.log('Seeding blog posts...');

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true },
  });

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        coverImageUrl: post.coverImageUrl,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        isPublished: true,
        isFeatured: post.isFeatured ?? false,
        publishedAt: post.publishedAt,
        authorId: admin?.id ?? null,
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        coverImageUrl: post.coverImageUrl,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        isPublished: true,
        isFeatured: post.isFeatured ?? false,
        publishedAt: post.publishedAt,
        createdAt: post.publishedAt,
        authorId: admin?.id ?? null,
      },
    });
    console.log(`  ✓ ${post.slug} (${post.publishedAt.toISOString().slice(0, 10)})`);
  }

  console.log(`Done. Seeded ${posts.length} blog posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
