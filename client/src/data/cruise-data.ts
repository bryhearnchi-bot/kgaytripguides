export interface ItineraryStop {
  key: string;
  date: string;
  port: string;
  arrive: string;
  depart: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  youtube?: string;
  linkedin?: string;
  linktree?: string;
}

export interface Talent {
  name: string;
  cat: string;
  role: string;
  knownFor: string;
  bio: string;
  img: string;
  social?: SocialLinks;
}

export interface DailyEvent {
  type: string;
  time: string;
  title: string;
  venue: string;
}

export interface DailySchedule {
  key: string;
  items: DailyEvent[];
}

export interface PartyTheme {
  key: string;
  desc: string;
  shortDesc: string;
}

export interface CityAttraction {
  city: string;
  topAttractions: string[];
  otherThingsToDo: string[];
  gayBars: string[];
}

export const ITINERARY: ItineraryStop[] = [
  { key: "2025-08-20", date: "Wed, Aug 20", port: "Athens, Greece", arrive: "Pre-Cruise", depart: "—" },
  { key: "2025-08-21", date: "Thu, Aug 21", port: "Athens, Greece (Embarkation Day)", arrive: "—", depart: "6:00 PM" },
  { key: "2025-08-22", date: "Fri, Aug 22", port: "Santorini, Greece", arrive: "9:00 AM", depart: "10:00 PM" },
  { key: "2025-08-23", date: "Sat, Aug 23", port: "Kuşadası, Turkey", arrive: "8:00 AM", depart: "3:00 PM" },
  { key: "2025-08-24", date: "Sun, Aug 24", port: "Istanbul, Turkey", arrive: "1:00 PM", depart: "Overnight" },
  { key: "2025-08-25", date: "Mon, Aug 25", port: "Istanbul, Turkey", arrive: "—", depart: "2:00 PM" },
  { key: "2025-08-26", date: "Tue, Aug 26", port: "Day at Sea", arrive: "—", depart: "—" },
  { key: "2025-08-27", date: "Wed, Aug 27", port: "Alexandria (Cairo), Egypt", arrive: "7:00 AM", depart: "12:00 AM" },
  { key: "2025-08-28", date: "Thu, Aug 28", port: "Day at Sea", arrive: "—", depart: "—" },
  { key: "2025-08-29", date: "Fri, Aug 29", port: "Mykonos, Greece", arrive: "9:00 AM", depart: "2:00 AM" },
  { key: "2025-08-30", date: "Sat, Aug 30", port: "Iraklion, Crete", arrive: "11:00 AM", depart: "6:00 PM" },
  { key: "2025-08-31", date: "Sun, Aug 31", port: "Athens, Greece (Disembarkation Day)", arrive: "7:00 AM", depart: "—" },
];

export const PARTY_THEMES: PartyTheme[] = [
  { 
    key: "Dog Tag T-Dance", 
    desc: "Longest-running afternoon party with military uniform inspiration. We provide souvenir dog tags; you bring the strength and style.",
    shortDesc: "Military uniform vibes with souvenir dog tags provided."
  },
  { 
    key: "UNITE", 
    desc: "Global community celebration with 60+ nations represented. Show off your country's colors and unite in fun, frolic, and friendship.",
    shortDesc: "Celebrate global unity wearing your country's colors."
  },
  { 
    key: "Empires", 
    desc: "Ancient world glamour featuring Greece, Egypt, Rome, and Ottoman empires. Golden togas, silks, and Cleopatra-level dazzle welcome.",
    shortDesc: "Ancient empire glamour from Greece to Ottoman sultans."
  },
  { 
    key: "Greek Isles: Here We Go Again!", 
    desc: "Mamma Mia fantasy with Greek island chic meets ABBA disco. Blue & white, sequins, platform boots, and Mediterranean drama.",
    shortDesc: "Mamma Mia meets Greek islands with ABBA disco energy."
  },
  { 
    key: "Lost At Sea", 
    desc: "Nautical silliness with sea creatures, pirates, and mythical characters. Cruise passengers and TV escapees welcome too.",
    shortDesc: "Nautical chaos with pirates, sea creatures, and myths."
  },
  { 
    key: "Neon Playground", 
    desc: "Fast, flashy, bright musical playground in the Red Room. Neon, sparkles, lights, and bouncy sounds that make you smile.",
    shortDesc: "Laser-bright neon playground with bouncy party vibes."
  },
  { 
    key: "Think Pink T-Dance", 
    desc: "Pink is in! It's everywhere and brings out the playful in all of us. From Barbie butch to fluffy fantastic, throw on your favorite interpretation for a hot afternoon of frivolous dolled up fun.",
    shortDesc: "Pink paradise - from Barbie butch to fluffy fantastic fun!"
  },
  { 
    key: "Virgin White", 
    desc: "Atlantis' pinnacle party in one perfect color. Be creative, sexy, irreverent, or simple in your favorite white outfit.",
    shortDesc: "The ultimate white party under Mediterranean stars."
  },
  { 
    key: "Revival! Classic Disco T-Dance", 
    desc: "Glory days of 70s disco with pure musical magic. Artificial fabrics, facial hair, oversized shoes, and obnoxious accessories welcome.",
    shortDesc: "70s disco revival with retro fabrics and accessories."
  },
  { 
    key: "Atlantis Classics", 
    desc: "Three decades of anthems & divas.",
    shortDesc: "Three decades of anthems & divas."
  },
  { 
    key: "Off-White After party", 
    desc: "Late-late afters post-White.",
    shortDesc: "Late-late afters post-White."
  },
  { 
    key: "Last Dance", 
    desc: "One last boogie into Athens.",
    shortDesc: "One last boogie into Athens."
  },
  { 
    key: "Welcome Party", 
    desc: "First night under the stars.",
    shortDesc: "First night under the stars."
  },
  { 
    key: "Sail-Away Party", 
    desc: "Top-deck vibes as we depart.",
    shortDesc: "Top-deck vibes as we depart."
  },
];

export const DAILY: DailySchedule[] = [
  { key: "2025-08-20", items: [
    { type: "social", time: "17:00", title: "Pre-Cruise Happy Hour by KGay Travel", venue: "Academias Hotel RoofTop Bar" },
  ]},
  { key: "2025-08-21", items: [
    { type: "party", time: "18:00", title: "Sail-Away Party", venue: "Aquatic Club" },
    { type: "show", time: "19:00", title: "First Time Cruisers Orientation", venue: "Red Room" },
    { type: "show", time: "19:30", title: "Monét X Change", venue: "Red Room" },
    { type: "show", time: "22:00", title: "Monét X Change", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Rob Houchen", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Gay Comedy Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
    { type: "lounge", time: "23:00", title: "Piano Bar with Brian Nash", venue: "On the Rocks" },
    { type: "party", time: "23:00", title: "Welcome Party", venue: "Aquatic Club" },
  ]},
  { key: "2025-08-22", items: [
    { type: "dining", time: "17:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
    { type: "show", time: "22:00", title: "Monét X Change", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Alyssa Wray", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
    { type: "party", time: "23:00", title: "UNITE", venue: "Aquatic Club" },
  ]},
  { key: "2025-08-23", items: [
    { type: "party", time: "17:00", title: "Dog Tag T-Dance", venue: "Aquatic Club" },
    { type: "show", time: "19:00", title: "Alexis Michelle", venue: "The Manor" },
    { type: "show", time: "19:30", title: "AirOtic", venue: "Red Room" },
    { type: "show", time: "22:00", title: "AirOtic", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Rob Houchen", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Gay Comedy Stars (Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
    { type: "party", time: "23:00", title: "Lost At Sea", venue: "Aquatic Club" },
    { type: "lounge", time: "23:00", title: "Piano Bar with William TN Hall", venue: "On the Rocks" },
  ]},
  { key: "2025-08-24", items: [
    { type: "show", time: "22:00", title: "AirOtic", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Leona Winter", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Rob Houchen", venue: "The Manor" },
    { type: "lounge", time: "23:00", title: "Piano Bar with Brandon James Gwinn", venue: "On the Rocks" },
    { type: "club", time: "23:00", title: "Atlantis Night Club", venue: "On the Rocks" },
  ]},
  { key: "2025-08-25", items: [
    { type: "dining", time: "17:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
    { type: "show", time: "19:30", title: "Persephone", venue: "Red Room" },
    { type: "show", time: "22:00", title: "Persephone", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Alyssa Wray", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Alexis Michelle", venue: "The Manor" },
    { type: "party", time: "23:00", title: "Empires", venue: "Aquatic Club" },
    { type: "lounge", time: "23:00", title: "Piano Bar with Brian Nash", venue: "On the Rocks" },
  ]},
  { key: "2025-08-26", items: [
    { type: "fun", time: "14:00", title: "Bingo with The Diva", venue: "Red Room" },
    { type: "party", time: "17:00", title: "Think Pink T-Dance", venue: "Aquatic Club" },
    { type: "show", time: "19:30", title: "Reuben Kaye", venue: "Red Room" },
    { type: "show", time: "22:00", title: "Reuben Kaye", venue: "Red Room" },
    { type: "show", time: "19:00", title: "Leona Winter", venue: "The Manor" },
    { type: "show", time: "21:00", title: "Comedy All-Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
    { type: "lounge", time: "23:00", title: "Piano Bar with William TN Hall", venue: "On the Rocks" },
    { type: "party", time: "00:30", title: "Neon Playground", venue: "Red Room" },
  ]},
  { key: "2025-08-27", items: [
    { type: "show", time: "22:00", title: "Persephone", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Comedy All-Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
    { type: "party", time: "23:00", title: "Greek Isles: Here We Go Again!", venue: "Aquatic Club" },
  ]},
  { key: "2025-08-28", items: [
    { type: "dining", time: "17:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
    { type: "show", time: "17:00", title: "Surprise Guest", venue: "Red Room" },
    { type: "show", time: "20:00", title: "Surprise Guest", venue: "Red Room" },
    { type: "show", time: "22:00", title: "Surprise Guest", venue: "Red Room" },
    { type: "show", time: "21:00", title: "Leona Winter", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Alyssa Wray", venue: "The Manor" },
    { type: "lounge", time: "23:00", title: "Piano Bar with William TN Hall", venue: "On the Rocks" },
    { type: "party", time: "23:00", title: "Atlantis Classics", venue: "Aquatic Club" },
  ]},
  { key: "2025-08-29", items: [
    { type: "dining", time: "19:00", title: "Another Rose (Dinner show)", venue: "The Manor" },
    { type: "show", time: "23:00", title: "Sherry Vine", venue: "The Manor" },
    { type: "lounge", time: "23:00", title: "Piano Bar with Brandon James Gwinn", venue: "On the Rocks" },
    { type: "party", time: "24:00", title: "Virgin White Party", venue: "Aquatic Club" },
    { type: "after", time: "05:00", title: "Off-White After party", venue: "The Manor" },
  ]},
  { key: "2025-08-30", items: [
    { type: "party", time: "17:00", title: "Revival! Classic Disco T-Dance", venue: "Aquatic Club" },
    { type: "show", time: "19:00", title: "Alexis Michelle", venue: "The Manor" },
    { type: "show", time: "21:00", title: "Alyssa Wray", venue: "The Manor" },
    { type: "show", time: "19:30", title: "Brad's Last Laugh (Brad Loekle)", venue: "Red Room" },
    { type: "show", time: "22:00", title: "Brad's Last Laugh (Brad Loekle)", venue: "Red Room" },
    { type: "lounge", time: "23:00", title: "Piano Bar with Brian Nash", venue: "On the Rocks" },
    { type: "party", time: "23:00", title: "Last Dance", venue: "The Manor" },
  ]},
  { key: "2025-08-31", items: []},
];

export const TALENT: Talent[] = [
  { 
    name: "Special Guest", 
    cat: "Surprise Performance", 
    role: "Mystery entertainer", 
    knownFor: "Surprise appearances", 
    bio: "A surprise guest performer will be announced during the cruise. This special entertainer will bring an unexpected element of excitement to our Mediterranean journey.", 
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAhFBMVEX/AAD/////SUn/9vb/8/P/+/v/6+v/7u7/5ub/4uL/3d3/2dn/1tb/zMz/yMj/w8P/vb3/ubn/srL/rq7/p6f/oaH/nJz/lZX/i4v/hIT/fn7/dXX/bW3/Y2P/WVn/T0//RUX/Ozv/MjL/KSn/Hx//FhT/DAr/BQP/+vr/8PD/6Oj/3t7/1NT/x8f/tbX/qqr/mpr/kJD/iYn/gYH/eXn/b2//ZGT/Wlr/UVH/SEj/Pj7/NTX/LCz/IiL/GRn/EBD/Bgb/AQH///7//v7//f3//Pz/+fn/9/f/9fX/8vL/7+//7Oz/6en/5+f/5OT/4OD/3Nz/2tr/19f/09P/0dH/z8//zc3/ysr/yMj/xsb/w8P/wMD/vr7/u7v/ubm/t7f/tLT/sbH/r6//rKz/qan/p6f/pKT/oqL/n5//nZ3/mpq/mJj/lJT/kpL/j4//jY3/ior/h4f/hYX/goL/f3//fX3/e3v/eHj/dnd/c3P/cXH/bm7/a2v/aGj/ZWX/YmL/X1//XFz/Wlr/V1f/VFT/UlL/T0//TU3/Skr/R0f/RET/QkL/Pz//PDz/Ojo/Njb/MzP/MTH/Ly//LCz/Kir/KCj/JSX/IiL/Hx//HBz/Ghr/Fxf/FBT/ERH/Dw//DAz/CQn/Bwf/BAT/AQL/AAD///8=",
    social: {}
  },
  { 
    name: "Monét X Change", 
    cat: "Drag & Variety", 
    role: "Drag icon & comic", 
    knownFor: "RPDR All Stars 4 winner", 
    bio: "Born in New York City, Monét is a classically trained performer who won RuPaul's Drag Race All Stars 4. With her signature wit and powerful vocals, she's become a beloved figure in drag culture and comedy.", 
    img: "https://www.billboard.com/wp-content/uploads/media/03-2-Monet-X-Change-rupauls-drag-race-s10-billboard-a-1548.jpg",
    social: {
      instagram: "https://www.instagram.com/monetxchange/",
      twitter: "https://x.com/monetxchange",
      website: "https://www.monetxchange.com"
    }
  },
  { 
    name: "Alexis Michelle", 
    cat: "Drag & Variety", 
    role: "Singer & RPDR favorite", 
    knownFor: "Glam cabaret", 
    bio: "Broadway-trained drag performer who placed 5th on RuPaul's Drag Race Season 9. Known for her theatrical performances and cabaret shows at venues like Feinstein's/54 Below.", 
    img: "https://i.redd.it/azxnlnbuql9b1.jpg",
    social: {
      instagram: "https://www.instagram.com/alexismichelleofficial/",
      tiktok: "https://www.tiktok.com/@alexismichelleofficial"
    }
  },
  { 
    name: "Leona Winter", 
    cat: "Vocalists", 
    role: "Vocalist", 
    knownFor: "Queen of the Universe", 
    bio: "French drag queen and countertenor baritone with a three-octave range. Known for her appearances on Queen of the Universe and The Voice France in 2019.", 
    img: "https://www.out.com/media-library/image.jpg?id=34885895&width=1200&height=600&coordinates=0%2C39%2C0%2C39",
    social: {
      instagram: "https://www.instagram.com/leonawinter16/",
      tiktok: "https://www.tiktok.com/@leonawinterofficiel"
    }
  },
  { 
    name: "Sherry Vine", 
    cat: "Drag & Variety", 
    role: "Comedy & vocals", 
    knownFor: "Parody legend", 
    bio: "Legendary NYC drag icon with over 35 years in entertainment. Known for her hilarious parody songs and has been a fixture of NYC nightlife since the 1990s.", 
    img: "http://static1.squarespace.com/static/5e2256cf72c72a5f12f1fdfe/t/63cc50edf5765a4e44b610f1/1580806649356/sherry-web-social.png?format=1500w",
    social: {
      instagram: "https://www.instagram.com/misssherryvine/"
    }
  },
  { 
    name: "Reuben Kaye", 
    cat: "Drag & Variety", 
    role: "Comic performer", 
    knownFor: "Cabaret provocateur", 
    bio: "Award-winning Australian comedian, cabaret host, and writer known for pushing boundaries. Nominated for Best Show at the 2024 Edinburgh Comedy Awards.", 
    img: "https://encoremelbourne.com/wp-content/uploads/2024/09/Reuben-Kaye-c-Alan-Moyle-scaled-e1727080187482.jpg",
    social: {
      instagram: "https://www.instagram.com/reubenkayeofficial/",
      twitter: "https://x.com/reubenkaye",
      website: "https://www.reubenkaye.com/about"
    }
  },
  { 
    name: "Rob Houchen", 
    cat: "Vocalists", 
    role: "West End star", 
    knownFor: "Les Misérables, Titanique", 
    bio: "British stage actor and producer best known for playing Marius in Les Misérables. Also starred in musicals including Titanique, South Pacific, and The Light in the Piazza.", 
    img: "http://www.digitaljournal.com/wp-content/uploads/2024/10/Rob-Houchen-Photo-e1728160861225.jpg",
    social: {
      instagram: "https://www.instagram.com/robhouchen/"
    }
  },
  { 
    name: "Alyssa Wray", 
    cat: "Vocalists", 
    role: "Vocalist", 
    knownFor: "American Idol Top 9", 
    bio: "Singer and performer from Kentucky who made it to the Top 9 on American Idol. Katy Perry called her a 'once in a generation' performer.", 
    img: "https://s.yimg.com/ny/api/res/1.2/B32A9JNeo3IpS.FKxuffIQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyMDA7aD02NzY7Y2Y9d2VicA--/https://s.yimg.com/os/creatr-uploaded-images/2021-03/1a562ab0-7ee4-11eb-afce-ac7a09171992",
    social: {
      instagram: "https://www.instagram.com/itsalyssawray/"
    }
  },
  { 
    name: "Brad Loekle", 
    cat: "Comedy", 
    role: "Comedian", 
    knownFor: "Atlantis favorite", 
    bio: "American stand-up comedian from Upstate New York who was a regular on premium cable comedy shows. Known for his appearances at Pride events, circuit parties, and cruise ships.", 
    img: "https://images.squarespace-cdn.com/content/v1/62b20e5c24737a3005ebe5e1/1701816763654-IG6NG6UERJXYU354L1ZU/brad-loekle-web.jpg?format=2500w",
    social: {
      instagram: "https://www.instagram.com/bradloekle/",
      website: "https://www.bradloekle.com"
    }
  },
  { 
    name: "Rachel Scanlon", 
    cat: "Comedy", 
    role: "Comedian", 
    knownFor: "Two Dykes and a Mic", 
    bio: "LA-based stand-up comedian and co-host of the popular podcast 'Two Dykes and a Mic'. Known for her sharp queer humor and sex-positive comedy.", 
    img: "https://www.empirecomedyme.com/img/comedians/Rachel-Scanlon-Primary-Headshot-da5f117a-main-image.png",
    social: {
      instagram: "https://www.instagram.com/rachelscanloncomedy/",
      linktree: "https://linktr.ee/rachelscanlon"
    }
  },
  { 
    name: "Daniel Webb", 
    cat: "Comedy", 
    role: "Comedian", 
    knownFor: "Opened for Margaret Cho", 
    bio: "Texas-born LA-based comedian who currently tours as the opening act for Margaret Cho. Featured in the documentary 'Queer Riot' and released his hour-long special 'Hoe's Parade: Live at the Rose Bowl' in 2021.", 
    img: "https://images.squarespace-cdn.com/content/v1/62b20e5c24737a3005ebe5e1/1668557899908-6Z03ZHA1FY8Y9ANSKMJ9/daniel-webb-web.jpg?format=2500w",
    social: {
      instagram: "https://www.instagram.com/the_danielwebb/",
      website: "https://www.thedanielwebb.com"
    }
  },
  { 
    name: "AirOtic", 
    cat: "Productions", 
    role: "Acrobatic spectacle", 
    knownFor: "Les Farfadais production", 
    bio: "High-energy circus cabaret show created by Les Farfadais featuring aerial acrobatics, dance, and stunning costumes.", 
    img: "https://airoticcirquesoiree.com/assets/img/info/info_love-3.6a496b70.webp",
    social: {
      instagram: "https://www.instagram.com/airoticshow/"
    }
  },
  { 
    name: "Another Rose", 
    cat: "Productions", 
    role: "Immersive dinner show", 
    knownFor: "Interactive feast", 
    bio: "Virgin Voyages' premium dinner theater experience featuring interactive storytelling and culinary artistry in an immersive setting.", 
    img: "https://s3.amazonaws.com/a-us.storyblok.com/f/1005231/594cc18563/virgin-voyages_resilient-lady_persepone-and-hades_entertainment_kyle-valenta_18913661.jpg"
  },
  { 
    name: "Persephone", 
    cat: "Productions", 
    role: "Virgin production", 
    knownFor: "High-energy acrobatics", 
    bio: "Virgin Voyages' signature acrobatic production show featuring aerial performances and theatrical storytelling for an adult-oriented entertainment experience.", 
    img: "https://i0.wp.com/thehoteljournal.com/wp-content/uploads/2024/05/Virgin-Voyages-Cruise-Review-Show.jpg?resize=798%2C599&ssl=1"
  },
  { 
    name: "The Diva (Bingo)", 
    cat: "Productions", 
    role: "Host", 
    knownFor: "Camp bingo chaos", 
    bio: "Virgin Voyages' drag bingo experience featuring outrageous hosts, ridiculous prizes, and camp chaos in a uniquely entertaining format.", 
    img: "https://attractionsmagazine.com/wp-content/uploads/2025/01/IMG_8480-3-1.jpeg"
  },
  { 
    name: "Abel", 
    cat: "DJs", 
    role: "DJ", 
    knownFor: "Miami sound", 
    bio: "Grammy-nominated DJ and producer from Miami, half of the electronic duo Abel. Known for producing tracks for Madonna, Rihanna, and Jennifer Lopez.", 
    img: "https://bosphilly.com/wp-content/uploads/2023/01/ABEL-SPINNING-scaled-1.jpg",
    social: {
      instagram: "https://www.instagram.com/djabelaguilera/"
    }
  },
  { 
    name: "Dan Slater", 
    cat: "DJs", 
    role: "DJ", 
    knownFor: "Sydney to global", 
    bio: "Australian DJ and producer based in the United States, with a career spanning over two decades and collaborations with major artists.", 
    img: "https://chicago.gopride.com/c/I/52051-156158.jpg",
    social: {
      instagram: "https://www.instagram.com/danielsl8r/",
      website: "https://www.djdanSlater.com"
    }
  },
  { 
    name: "DJ Suri", 
    cat: "DJs", 
    role: "DJ", 
    knownFor: "Madrid", 
    bio: "Valencia-born DJ specializing in electronic and house music. Known for his performances at major clubs worldwide and his ability to blend various electronic music subgenres.", 
    img: "https://jceventsinternational.com/wp-content/uploads/2018/12/DJ-profile-pic_0002_DJSuri.jpg",
    social: {
      instagram: "https://www.instagram.com/djsurimusic/",
      youtube: "https://www.youtube.com/suridj"
    }
  },
  { 
    name: "GSP", 
    cat: "DJs", 
    role: "DJ", 
    knownFor: "Athens/Atlanta", 
    bio: "Greek-born international DJ and producer George Spiliopoulos. Has performed in over 30 countries and produced remixes for Ariana Grande and Lil Nas X.", 
    img: "https://geo-media.beatport.com/image_size/590x404/b4e28817-74b7-4868-9d60-34d0e944fe01.jpg",
    social: {
      instagram: "https://www.instagram.com/gspdj/"
    }
  },
  { 
    name: "William TN Hall", 
    cat: "Piano Bar", 
    role: "Piano entertainer", 
    knownFor: "Showtunes & pop", 
    bio: "NYC-based composer, arranger, and piano entertainer who specializes in Broadway music and pop standards. Has worked with artists including Sharon Needles and the late Joan Rivers.", 
    img: "https://shows.donttellmamanyc.com/images/performers/William_TN_Hallnew.jpg",
    social: {
      instagram: "https://www.instagram.com/williamtnhall?igsh=MXJjZnR1aGl0MmpxMQ==",
      twitter: "https://x.com/williamtnhall"
    }
  },
  { 
    name: "Brian Nash", 
    cat: "Piano Bar", 
    role: "Piano entertainer", 
    knownFor: "Musical director", 
    bio: "Award-winning pianist, singer, and musical director from Nashville. Serves as entertainment coordinator and resident MD for Atlantis Events worldwide.", 
    img: "https://cdn1.sixthman.net/2025/broadway/images/artists/brian_nash_-_brd_-_1500x1000_982140.jpg",
    social: {
      instagram: "https://www.instagram.com/brianjnash/"
    }
  },
  { 
    name: "Brandon James Gwinn", 
    cat: "Piano Bar", 
    role: "Piano entertainer", 
    knownFor: "Late night fun", 
    bio: "Piano bar entertainer and vocalist known for his late-night performances and ability to take audience requests for an engaging experience.", 
    img: "https://eghcszbxego.exactdn.com/wp-content/uploads/2025/07/Brandon-James-Gwinn-photo-by-Michael-Hull.jpg",
    social: {
      instagram: "https://www.instagram.com/brandonjamesg",
      twitter: "https://x.com/brandonjamesg",
      website: "https://www.brandonjamesgwinn.com"
    }
  }
];

export const CITY_ATTRACTIONS: CityAttraction[] = [
  {
    city: "Athens, Greece",
    topAttractions: [
      "Acropolis & Parthenon",
      "Acropolis Museum", 
      "Plaka District"
    ],
    otherThingsToDo: [
      "Panathenaic Stadium",
      "Mount Lycabettus",
      "Local tavernas in Monastiraki"
    ],
    gayBars: [
      "Sodade2: Triptolemou 10, Athens 11854, Greece",
      "Big Bar: Falaisias 12, Gazi, Athens 11854, Greece",
      "Del Sol Cafe: Voutadon 44, Athens 11854, Greece",
      "Rooster Cafe: Plateia Agias Eirinis 4, Athens 10560, Greece"
    ]
  },
  {
    city: "Santorini, Greece",
    topAttractions: [
      "Oia Village (sunsets & blue domes)",
      "Akrotiri Archaeological Site",
      "Red Beach"
    ],
    otherThingsToDo: [
      "Boat trip to the volcano",
      "Wine tasting tours",
      "Hike from Fira to Oia"
    ],
    gayBars: [
      "Tropical Bar: Fira, Santorini 84700, Greece",
      "Murphy's Bar: Erithrou Stavrou, Fira, Santorini 84700, Greece", 
      "Crystal Cocktail Bar: Fira, Santorini 84700, Greece"
    ]
  },
  {
    city: "Kuşadası, Turkey",
    topAttractions: [
      "Ancient City of Ephesus",
      "Pigeon Island (Kusadasi Castle)",
      "Ladies Beach"
    ],
    otherThingsToDo: [
      "Priene archaeological site",
      "Dilek Peninsula National Park",
      "Bazaar shopping"
    ],
    gayBars: [
      "Love Sensation Club: Sakarya Sokak No:22, Kaleici (Old Town), Kusadasi 09400, Turkey",
      "Fistik Bar: Camikebir Mah., Sakarya Sokak No:15, Kusadasi 09400, Turkey",
      "Roof Lounge Bar: Turkmen Mahallesi, Ataturk Bulvari No:40/13, Kusadasi 09400, Turkey"
    ]
  },
  {
    city: "Istanbul, Turkey",
    topAttractions: [
      "Hagia Sophia",
      "Blue Mosque",
      "Topkapi Palace"
    ],
    otherThingsToDo: [
      "Grand Bazaar shopping",
      "Spice Market",
      "Bosphorus cruise"
    ],
    gayBars: [
      "Tekyön Club: Sıraselviler Cd. No:63/1, Beyoğlu, Istanbul 34250, Turkey",
      "Love Dance Point: Ergenekon Mah. Cumhuriyet Cad., Hastane Sok. No:349 D:1, Şişli, Istanbul 34250, Turkey",
      "SuperFabric Club: Harbiye Mah., Cumhuriyet Cad. No:42 Elmadağ, Şişli, Istanbul 34367, Turkey"
    ]
  },
  {
    city: "Alexandria (Cairo), Egypt",
    topAttractions: [
      "Bibliotheca Alexandrina (Library of Alexandria)",
      "Citadel of Qaitbay",
      "Alexandria Corniche"
    ],
    otherThingsToDo: [
      "Roman Amphitheatre",
      "Montazah Palace & Gardens",
      "Local seafood restaurants"
    ],
    gayBars: []
  },
  {
    city: "Mykonos, Greece",
    topAttractions: [
      "Little Venice",
      "Windmills of Mykonos (Kato Mili)",
      "Delos Island (day trip)"
    ],
    otherThingsToDo: [
      "Elia Beach",
      "Paraportiani Church",
      "Nightlife & sunset bars"
    ],
    gayBars: [
      "Jackie O' Town Bar: Paraportiani Waterfront, Mykonos 84600, Greece",
      "Porta Bar: Chora (Porta Aigialou area), Mykonos 84600, Greece",
      "Lola Bar: Zanni Pitaraki 4, Mykonos Town 84600, Greece",
      "Jackie O' Beach Club: Super Paradise Beach, Mykonos 84600, Greece (Evening Drag Shows from 6pm)"
    ]
  },
  {
    city: "Iraklion (Heraklion), Crete",
    topAttractions: [
      "Palace of Knossos",
      "Heraklion Archaeological Museum",
      "Koules Fortress (Castello del Molo)"
    ],
    otherThingsToDo: [
      "Matala Beach (famous caves)",
      "Local winery tours",
      "Explore the Old Town & Venetian fountains"
    ],
    gayBars: [
      "La Brasserie: Korai 15, Heraklion 71202, Crete, Greece",
      "YOLO Bar: Limani, Kastroy 1, Hersonissos 70014, Crete, Greece",
      "Klik Bar: Sourmelis 2, Chania 73132, Crete, Greece"
    ]
  }
];
