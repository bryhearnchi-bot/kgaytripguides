-- Supabase Migration Script
-- This script prepares the Railway database for import into Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Railway Database Export
-- Generated: 2025-09-16T01:49:52.320Z

-- Drop existing tables
DROP TABLE IF EXISTS cruise_talent CASCADE;
DROP TABLE IF EXISTS trip_info_sections CASCADE;
DROP TABLE IF EXISTS event_talent CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS itinerary CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS ports CASCADE;
DROP TABLE IF EXISTS talent CASCADE;
DROP TABLE IF EXISTS cruises CASCADE;

-- Table: cruises
CREATE TABLE cruises (
  id integer NOT NULL DEFAULT nextval('cruises_id_seq'::regclass),
  name text NOT NULL,
  slug character varying(255) NOT NULL,
  ship_name text NOT NULL,
  cruise_line text,
  trip_type text NOT NULL DEFAULT 'cruise'::text,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  status text DEFAULT 'upcoming'::text,
  hero_image_url text,
  description text,
  highlights jsonb,
  includes_info jsonb,
  pricing jsonb,
  created_by character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: talent
CREATE TABLE talent (
  id integer NOT NULL DEFAULT nextval('talent_id_seq'::regclass),
  name text NOT NULL,
  category text NOT NULL,
  bio text,
  known_for text,
  profile_image_url text,
  social_links jsonb,
  website text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: ports
CREATE TABLE ports (
  id integer NOT NULL DEFAULT nextval('ports_id_seq'::regclass),
  name character varying(255) NOT NULL,
  country character varying(100) NOT NULL,
  region character varying(100),
  port_type character varying(20) DEFAULT 'port'::character varying,
  coordinates jsonb,
  description text,
  image_url text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: parties
CREATE TABLE parties (
  id integer NOT NULL DEFAULT nextval('parties_id_seq'::regclass),
  name character varying(255) NOT NULL,
  theme text,
  venue_type character varying(20) DEFAULT 'deck'::character varying,
  capacity integer,
  duration_hours numeric(3,1),
  requirements jsonb,
  image_url text,
  usage_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: itinerary
CREATE TABLE itinerary (
  id integer NOT NULL DEFAULT nextval('itinerary_id_seq'::regclass),
  cruise_id integer NOT NULL,
  date timestamp without time zone NOT NULL,
  day integer NOT NULL,
  port_name text NOT NULL,
  country text,
  arrival_time text,
  departure_time text,
  all_aboard_time text,
  port_image_url text,
  description text,
  highlights jsonb,
  order_index integer NOT NULL,
  segment text DEFAULT 'main'::text,
  port_id integer
);

-- Table: events
CREATE TABLE events (
  id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  cruise_id integer NOT NULL,
  date timestamp without time zone NOT NULL,
  time text NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  venue text NOT NULL,
  deck text,
  description text,
  short_description text,
  image_url text,
  theme_description text,
  dress_code text,
  capacity integer,
  requires_reservation boolean DEFAULT false,
  talent_ids jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  party_id integer
);

-- Table: event_talent
CREATE TABLE event_talent (
  id integer NOT NULL DEFAULT nextval('event_talent_id_seq'::regclass),
  event_id integer NOT NULL,
  talent_id integer NOT NULL,
  role character varying(50) DEFAULT 'performer'::character varying,
  performance_order integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: trip_info_sections
CREATE TABLE trip_info_sections (
  id integer NOT NULL DEFAULT nextval('trip_info_sections_id_seq'::regclass),
  cruise_id integer NOT NULL,
  title text NOT NULL,
  content text,
  order_index integer NOT NULL,
  updated_by character varying,
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: cruise_talent
CREATE TABLE cruise_talent (
  cruise_id integer NOT NULL,
  talent_id integer NOT NULL,
  role text,
  performance_count integer,
  notes text,
  created_at timestamp without time zone DEFAULT now()
);

-- Constraints
ALTER TABLE cruise_talent ADD CONSTRAINT cruise_talent_cruise_id_cruises_id_fk FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE cruise_talent ADD CONSTRAINT cruise_talent_cruise_id_talent_id_pk PRIMARY KEY (cruise_id, cruise_id, talent_id, talent_id);
ALTER TABLE cruise_talent ADD CONSTRAINT cruise_talent_talent_id_talent_id_fk FOREIGN KEY (talent_id) REFERENCES talent(id);
ALTER TABLE cruises ADD CONSTRAINT cruises_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE cruises ADD CONSTRAINT cruises_pkey PRIMARY KEY (id);
ALTER TABLE cruises ADD CONSTRAINT cruises_slug_unique UNIQUE (slug);
ALTER TABLE event_talent ADD CONSTRAINT event_talent_event_id_talent_id_key UNIQUE (event_id, event_id, talent_id, talent_id);
ALTER TABLE event_talent ADD CONSTRAINT event_talent_pkey PRIMARY KEY (id);
ALTER TABLE events ADD CONSTRAINT events_cruise_id_cruises_id_fk FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE itinerary ADD CONSTRAINT itinerary_cruise_id_cruises_id_fk FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE itinerary ADD CONSTRAINT itinerary_pkey PRIMARY KEY (id);
ALTER TABLE parties ADD CONSTRAINT parties_name_key UNIQUE (name);
ALTER TABLE parties ADD CONSTRAINT parties_pkey PRIMARY KEY (id);
ALTER TABLE ports ADD CONSTRAINT ports_name_key UNIQUE (name);
ALTER TABLE ports ADD CONSTRAINT ports_pkey PRIMARY KEY (id);
ALTER TABLE talent ADD CONSTRAINT talent_pkey PRIMARY KEY (id);
ALTER TABLE trip_info_sections ADD CONSTRAINT trip_info_sections_cruise_id_cruises_id_fk FOREIGN KEY (cruise_id) REFERENCES cruises(id);
ALTER TABLE trip_info_sections ADD CONSTRAINT trip_info_sections_pkey PRIMARY KEY (id);
ALTER TABLE trip_info_sections ADD CONSTRAINT trip_info_sections_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES users(id);

-- Indexes
CREATE INDEX cruise_info_cruise_idx ON trip_info_sections (CREATE INDEX cruise_info_cruise_idx ON trip_info_sections USING btree (cruise_id));
CREATE INDEX trip_info_order_idx ON trip_info_sections (CREATE INDEX trip_info_order_idx ON trip_info_sections USING btree (cruise_id, order_index));
CREATE INDEX cruise_talent_cruise_idx ON cruise_talent (CREATE INDEX cruise_talent_cruise_idx ON cruise_talent USING btree (cruise_id));
CREATE INDEX cruise_talent_talent_idx ON cruise_talent (CREATE INDEX cruise_talent_talent_idx ON cruise_talent USING btree (talent_id));
CREATE INDEX trip_status_idx ON cruises (CREATE INDEX trip_status_idx ON cruises USING btree (status));
CREATE INDEX trip_slug_idx ON cruises (CREATE INDEX trip_slug_idx ON cruises USING btree (slug));
CREATE INDEX trip_trip_type_idx ON cruises (CREATE INDEX trip_trip_type_idx ON cruises USING btree (trip_type));
CREATE INDEX events_cruise_idx ON events (CREATE INDEX events_cruise_idx ON events USING btree (cruise_id));
CREATE INDEX events_date_idx ON events (CREATE INDEX events_date_idx ON events USING btree (date));
CREATE INDEX events_type_idx ON events (CREATE INDEX events_type_idx ON events USING btree (type));
CREATE INDEX itinerary_cruise_idx ON itinerary (CREATE INDEX itinerary_cruise_idx ON itinerary USING btree (cruise_id));
CREATE INDEX itinerary_date_idx ON itinerary (CREATE INDEX itinerary_date_idx ON itinerary USING btree (date));
CREATE INDEX talent_name_idx ON talent (CREATE INDEX talent_name_idx ON talent USING btree (name));
CREATE INDEX talent_category_idx ON talent (CREATE INDEX talent_category_idx ON talent USING btree (category));


-- Data Export

-- Data for cruises
INSERT INTO cruises (id, name, slug, ship_name, cruise_line, trip_type, start_date, end_date, status, hero_image_url, description, highlights, includes_info, pricing, created_by, created_at, updated_at) VALUES (1, 'Greek Isles Atlantis Cruise', 'greek-isles-2025', 'Virgin Resilient Lady', 'Virgin Voyages', 'cruise', '2025-08-21T10:00:00.000Z', '2025-08-31T10:00:00.000Z', 'upcoming', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757884822/resillent_lady_ijl8cr.jpg', 'Join us for an unforgettable journey through the Greek Isles aboard the Virgin Resilient Lady. Experience ancient wonders, stunning beaches, and legendary Atlantis parties.', '["Visit iconic Greek islands including Mykonos and Santorini","Explore ancient ruins in Athens and Ephesus","Legendary Atlantis parties and entertainment","World-class talent and performances","All-gay vacation experience"]', '{"included":["Accommodation in your selected cabin category","All meals and entertainment onboard","Access to all ship facilities","Atlantis parties and events","Talent performances and shows"],"notIncluded":["Airfare","Shore excursions","Alcoholic beverages","Gratuities","Spa services"]}', NULL, NULL, '2025-09-14T12:35:36.999Z', '2025-09-14T12:35:36.999Z');
INSERT INTO cruises (id, name, slug, ship_name, cruise_line, trip_type, start_date, end_date, status, hero_image_url, description, highlights, includes_info, pricing, created_by, created_at, updated_at) VALUES (7, 'Drag Stars at Sea 2025', 'drag-stars-at-sea-2025', 'Valiant Lady', 'Virgin Voyages', 'cruise', '2025-10-15T05:00:00.000Z', '2025-10-19T05:00:00.000Z', 'upcoming', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757901426/drag_stars_ngd64u.jpg', 'An unforgettable 4-night drag extravaganza featuring world-class performers including Bianca Del Rio, Bob the Drag Queen, and Trinity the Tuck aboard Virgin Voyages'' Valiant Lady.', '["Headlining performances by RuPaul''s Drag Race stars","Multiple performance venues and poolside shows","Themed events and spontaneous performances","Premium Virgin Voyages amenities included","Produced by Atlantis Events with 35+ years experience"]', '{"fitness":"Fitness classes included","beverages":"Basic non-alcoholic beverages included","basic_wifi":"Included","gratuities":"All gratuities included","premium_dining":"All restaurants included"}', '{"currency":"USD","duration":"4 nights","pricing_note":"Starting price for interior cabin","starting_price":"$699"}', 'e3b2cdea-d3ac-4bfa-9f97-4cc1d624c5ac', '2025-09-14T20:03:54.000Z', '2025-09-15T08:01:12.134Z');

-- Data for talent
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (1, 'Audra McDonald', 'Broadway Legend', 'Six-time Tony Award winner and Grammy Award recipient, Audra McDonald is one of Broadway''s most celebrated performers. Known for her powerful voice and versatility across musical theater, opera, and television.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/audra-mcdonald.jpg', '{"twitter":"https://x.com/AudraEqualityMc","instagram":"https://www.instagram.com/audramcdonald/"}', NULL, '2025-09-11T13:11:43.502Z', '2025-09-14T07:15:54.634Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (2, 'Monét X Change', 'Drag & Variety', 'Born in New York City, Monét is a classically trained performer who won RuPaul''s Drag Race All Stars 4. With her signature wit and powerful vocals, she''s become a beloved figure in drag culture and comedy.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/monet-x-change.jpg', '{"twitter":"https://x.com/monetxchange","website":"https://www.monetxchange.com","instagram":"https://www.instagram.com/monetxchange/"}', NULL, '2025-09-11T13:11:43.502Z', '2025-09-14T07:15:56.263Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (3, 'Alexis Michelle', 'Drag & Variety', 'Broadway-trained drag performer who placed 5th on RuPaul''s Drag Race Season 9. Known for her theatrical performances and cabaret shows at venues like Feinstein''s/54 Below.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/alexis-michelle.jpg', '{"tiktok":"https://www.tiktok.com/@alexismichelleofficial","instagram":"https://www.instagram.com/alexismichelleofficial/"}', NULL, '2025-09-11T13:11:43.502Z', '2025-09-14T07:15:54.022Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (4, 'Leona Winter', 'Vocalists', 'French drag queen and countertenor baritone with a three-octave range. Known for her appearances at Queen of the Universe and The Voice France in 2019.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/leona-winter.jpg', '{"tiktok":"https://www.tiktok.com/@leonawinterofficiel","instagram":"https://www.instagram.com/leonawinter16/"}', NULL, '2025-09-11T13:11:43.502Z', '2025-09-14T07:15:56.090Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (5, 'Sherry Vine', 'Drag & Variety', 'Legendary NYC drag icon with over 35 years in entertainment. Known for her hilarious parody songs and has been a fixture of NYC nightlife since the 1990s.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/sherry-vine.jpg', '{"instagram":"https://www.instagram.com/misssherryvine/"}', NULL, '2025-09-11T13:14:55.262Z', '2025-09-14T07:15:57.103Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (6, 'Reuben Kaye', 'Drag & Variety', 'Award-winning Australian comedian, cabaret host, and writer known for pushing boundaries. Nominated for Best Show at the 2024 Edinburgh Comedy Awards.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/reuben-kaye.jpg', '{"twitter":"https://x.com/reubenkaye","website":"https://www.reubenkaye.com/about","instagram":"https://www.instagram.com/reubenkayeofficial/"}', NULL, '2025-09-11T13:14:55.262Z', '2025-09-14T07:15:56.816Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (7, 'Rob Houchen', 'Vocalists', 'British stage actor and producer best known for playing Marius in Les Misérables. Also starred in musicals including Titanique, South Pacific, and The Light in the Piazza.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/rob-houchen.jpg', '{"instagram":"https://www.instagram.com/robhouchen/"}', NULL, '2025-09-11T13:14:55.262Z', '2025-09-14T07:15:56.974Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (8, 'Alyssa Wray', 'Vocalists', 'Singer and performer from Kentucky who made it to the Top 9 on American Idol. Katy Perry called her a ''once in a generation'' performer.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/alyssa-wray.jpg', '{"instagram":"https://www.instagram.com/itsalyssawray/"}', NULL, '2025-09-11T13:14:55.262Z', '2025-09-14T07:15:54.308Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (9, 'Brad Loekle', 'Comedy', 'American stand-up comedian from Upstate New York who was a regular on premium cable comedy shows. Known for his appearances at Pride events, circuit parties, and cruise ships.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/brad-loekle.jpg', '{"website":"https://www.bradloekle.com","instagram":"https://www.instagram.com/bradloekle/"}', NULL, '2025-09-11T13:14:55.262Z', '2025-09-14T07:15:54.846Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (10, 'Rachel Scanlon', 'Comedy', 'LA-based stand-up comedian and co-host of the popular podcast ''Two Dykes and a Mic''. Known for her sharp queer humor and sex-positive comedy.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/rachel-scanlon.jpg', '{"linktree":"https://linktr.ee/rachelscanlon","instagram":"https://www.instagram.com/rachelscanloncomedy/"}', NULL, '2025-09-11T13:14:55.262Z', '2025-09-14T07:15:56.670Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (11, 'Daniel Webb', 'Comedy', 'Texas-born LA-based comedian who currently tours as the opening act for Margaret Cho. Featured in the documentary ''Queer Riot'' and released his hour-long special ''Hoe''s Parade: Live at the Rose Bowl'' in 2021.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/daniel-webb.jpg', '{"website":"https://www.thedanielwebb.com","instagram":"https://www.instagram.com/the_danielwebb/"}', NULL, '2025-09-11T13:15:19.754Z', '2025-09-14T07:15:55.750Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (12, 'AirOtic', 'Productions', 'High-energy circus cabaret show created by Les Farfadais featuring aerial acrobatics, dance, and stunning costumes.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/airotic.jpg', '{"instagram":"https://www.instagram.com/airoticshow/"}', NULL, '2025-09-11T13:15:19.754Z', '2025-09-14T07:15:53.864Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (13, 'Another Rose', 'Productions', 'Virgin Voyages'' premium dinner theater experience featuring interactive storytelling and culinary artistry in an immersive setting.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/another-rose.jpg', '{}', NULL, '2025-09-11T13:15:19.754Z', '2025-09-14T07:15:54.445Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (14, 'Persephone', 'Productions', 'Virgin Voyages'' signature acrobatic production show featuring aerial performances and theatrical storytelling for an adult-oriented entertainment experience.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/persephone.jpg', '{}', NULL, '2025-09-11T13:15:19.754Z', '2025-09-14T07:15:56.445Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (15, 'The Diva (Bingo)', 'Productions', 'Virgin Voyages'' drag bingo experience featuring outrageous hosts, ridiculous prizes, and camp chaos in a uniquely entertaining format.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/the-diva-bingo.jpg', '{}', NULL, '2025-09-11T13:15:19.754Z', '2025-09-14T07:15:57.256Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (16, 'Abel', 'DJs', 'Grammy-nominated DJ and producer from Miami, half of the electronic duo Abel. Known for producing tracks for Madonna, Rihanna, and Jennifer Lopez.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/abel.jpg', '{"instagram":"https://www.instagram.com/djabelaguilera/"}', NULL, '2025-09-11T13:15:19.754Z', '2025-09-14T07:15:53.688Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (17, 'Dan Slater', 'DJs', 'Australian DJ and producer based in the United States, with a career spanning over two decades and collaborations with major artists.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/dan-slater.jpg', '{"website":"https://www.djdanSlater.com","instagram":"https://www.instagram.com/danielsl8r/"}', NULL, '2025-09-11T13:15:45.979Z', '2025-09-14T07:15:55.581Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (18, 'DJ Suri', 'DJs', 'Valencia-born DJ specializing in electronic and house music. Known for his performances at major clubs worldwide and his ability to blend various electronic music subgenres.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/dj-suri.jpg', '{"youtube":"https://www.youtube.com/suridj","instagram":"https://www.instagram.com/djsurimusic/"}', NULL, '2025-09-11T13:15:45.979Z', '2025-09-14T07:15:55.365Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (19, 'GSP', 'DJs', 'Greek-born international DJ and producer George Spiliopoulos. Has performed in over 30 countries and produced remixes for Ariana Grande and Lil Nas X.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/gsp.jpg', '{"instagram":"https://www.instagram.com/gspdj/"}', NULL, '2025-09-11T13:15:45.979Z', '2025-09-14T07:15:55.951Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (20, 'William TN Hall', 'Piano Bar', 'NYC-based composer, arranger, and piano entertainer who specializes in Broadway music and pop standards. Has worked with artists including Sharon Needles and the late Joan Rivers.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/william-tn-hall.jpg', '{"twitter":"https://x.com/williamtnhall","instagram":"https://www.instagram.com/williamtnhall?igsh=MXJjZnR1aGl0MmpxMQ=="}', NULL, '2025-09-11T13:15:45.979Z', '2025-09-14T07:15:57.446Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (21, 'Brian Nash', 'Piano Bar', 'Award-winning pianist, singer, and musical director from Nashville. Serves as entertainment coordinator and resident MD for Atlantis Events worldwide.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/brian-nash.jpg', '{"instagram":"https://www.instagram.com/brianjnash/"}', NULL, '2025-09-11T13:15:45.979Z', '2025-09-14T07:15:55.215Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (22, 'Brandon James Gwinn', 'Piano Bar', 'Piano bar entertainer and vocalist known for his late-night performances and ability to take audience requests for an engaging experience.', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757789604/cruise-app/talent/brandon-james-gwinn.jpg', '{"twitter":"https://x.com/brandonjamesg","website":"https://www.brandonjamesgwinn.com","instagram":"https://www.instagram.com/brandonjamesg"}', NULL, '2025-09-11T13:15:45.979Z', '2025-09-14T07:15:55.002Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (24, 'Bob the Drag Queen', 'Drag', 'Winner of RuPaul''s Drag Race Season 8, comedian, musician, and activist.', 'RuPaul''s Drag Race Season 8 Winner, Comedy, Music', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903567/bob_sl4ox8.jpg', NULL, NULL, '2025-09-15T06:03:54.853Z', '2025-09-15T07:35:18.945Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (25, 'Trinity the Tuck', 'Drag', 'RuPaul''s Drag Race All Stars 4 Winner, known for her pageant excellence and performance skills.', 'RuPaul''s Drag Race All Stars 4 Winner, Pageant Excellence', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903567/trinity_pxalyq.jpg', NULL, NULL, '2025-09-15T06:03:54.931Z', '2025-09-15T07:34:58.866Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (26, 'Alyssa Edwards', 'Drag', 'Fan favorite from RuPaul''s Drag Race, dance teacher, and entertainer extraordinaire.', 'RuPaul''s Drag Race, Dancing Queen, Viral Memes', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903567/alyssa_ecvvvx.jpg', NULL, NULL, '2025-09-15T06:03:55.009Z', '2025-09-15T07:34:58.830Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (28, 'Plasma', 'Drag', 'Fierce drag performer known for high-energy performances and stunning looks.', 'RuPaul''s Drag Race, High-Energy Performances', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903568/plasma_g6ajyj.jpg', NULL, NULL, '2025-09-15T06:03:55.170Z', '2025-09-15T07:34:31.376Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (29, 'Jackie Cox', 'Drag', 'Persian-American drag queen known for her political activism and stunning runway looks.', 'RuPaul''s Drag Race Season 12, Political Activism', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903569/jackie_eheucy.jpg', NULL, NULL, '2025-09-15T06:03:55.240Z', '2025-09-15T07:34:07.523Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (30, 'House of Avalon', 'Drag', 'Dynamic drag house known for group performances and collaborative artistry.', 'Group Performances, Drag House Collective', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903568/avalon_fav1qd.jpg', NULL, NULL, '2025-09-15T06:03:55.310Z', '2025-09-15T07:34:31.328Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (31, 'Bianca del Rio', 'Drag', 'The self-proclaimed ''Joan Rivers of drag,'' Bianca del Rio won RuPaul''s Drag Race Season 6 with her razor-sharp tongue and impeccable fashion sense. Known for her quick wit and brutal honesty, she has released multiple comedy specials, written books, and toured worldwide with her stand-up comedy shows.', 'RuPaul''s Drag Race Season 6 Winner, Comedy Queen', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903570/bianca_jh9ojg.jpg', '{"twitter":"https://twitter.com/biancadelrio","website":"https://www.biancadelrio.com","instagram":"https://www.instagram.com/thebiancadelrio"}', NULL, '2025-09-15T07:10:18.466Z', '2025-09-15T07:33:27.516Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (32, 'Sugar', 'Drag', 'One half of the dynamic twin duo from RuPaul''s Drag Race Season 15, Sugar brings sweetness with a side of spice to every performance. Known for her bubbly personality, stunning looks, and strong sisterly bond with Spice, she represents the new generation of drag excellence.', 'RuPaul''s Drag Race Season 15 Contestant', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903570/sugar_vpd0ut.jpg', '{"twitter":null,"website":null,"instagram":"https://www.instagram.com/sugarrush.drag"}', NULL, '2025-09-15T07:10:18.934Z', '2025-09-15T07:33:48.224Z');
INSERT INTO talent (id, name, category, bio, known_for, profile_image_url, social_links, website, created_at, updated_at) VALUES (33, 'Spice', 'Drag', 'The fiercer half of the twin duo from RuPaul''s Drag Race Season 15, Spice brings attitude and glamour to every stage. Along with her sister Sugar, she made history as part of the first twin contestants on the show, showcasing both individual talent and unbreakable sisterly bonds.', 'RuPaul''s Drag Race Season 15 Contestant', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/v1757903570/sugar_vpd0ut.jpg', '{"twitter":null,"website":null,"instagram":"https://www.instagram.com/spicerush.drag"}', NULL, '2025-09-15T07:10:19.090Z', '2025-09-15T07:33:48.277Z');

-- Data for ports
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (1, 'Athens (Piraeus)', 'Greece', 'Mediterranean', 'port', '{"lat":37.9838,"lng":23.7275}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310851/destinations/athens_vxwqrt.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.366Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (2, 'Santorini', 'Greece', 'Mediterranean', 'port', '{"lat":36.3932,"lng":25.4615}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310853/destinations/santorini_hjrjcm.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.406Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (3, 'Mykonos', 'Greece', 'Mediterranean', 'port', '{"lat":37.4467,"lng":25.3289}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310853/destinations/mykonos_bpyakq.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.445Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (4, 'Istanbul', 'Turkey', 'Mediterranean', 'port', '{"lat":41.0082,"lng":28.9784}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310852/destinations/istanbul_xdymjj.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.484Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (5, 'Kuşadası', 'Turkey', 'Mediterranean', 'port', '{"lat":37.8579,"lng":27.261}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310852/destinations/kusadasi_f3n5ak.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.522Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (6, 'Alexandria', 'Egypt', 'Mediterranean', 'port', '{"lat":31.2001,"lng":29.9187}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310850/destinations/alexandria_wrmtfk.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.560Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (7, 'Iraklion', 'Greece', 'Mediterranean', 'port', '{"lat":35.3387,"lng":25.1442}', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310851/destinations/iraklion_siyuhr.jpg', '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.600Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (8, 'Sea Day', '', 'At Sea', 'sea_day', NULL, NULL, NULL, '2025-09-16T05:06:14.620Z', '2025-09-16T05:06:14.620Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (9, 'Embarkation', 'Greece', 'Mediterranean', 'embark', '{"lat":37.9838,"lng":23.7275}', NULL, NULL, '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.288Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (10, 'Disembarkation', 'Greece', 'Mediterranean', 'disembark', '{"lat":37.9838,"lng":23.7275}', NULL, NULL, '2025-09-16T05:06:14.620Z', '2025-09-16T05:07:16.328Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (31, 'TEST_Athens', 'Greece', 'Mediterranean', 'port', '{"lat":37.9838,"lng":23.7275}', 'Capital of Greece', 'https://example.com/athens.jpg', '2025-09-16T05:21:25.007Z', '2025-09-16T05:21:25.007Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (32, 'TEST_Santorini', 'Greece', 'Mediterranean', 'port', NULL, NULL, NULL, '2025-09-16T05:21:25.085Z', '2025-09-16T05:21:25.085Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (33, 'TEST_Istanbul', 'Turkey', 'Mediterranean', 'port', '{"lat":41.0082,"lng":28.9784}', 'Where East meets West', NULL, '2025-09-16T05:21:25.223Z', '2025-09-16T05:21:25.291Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (34, 'TEST_ToDelete', 'Test', 'Test', 'port', NULL, NULL, NULL, '2025-09-16T05:21:25.361Z', '2025-09-16T05:21:25.361Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (35, 'TEST_Port1', 'Greece', 'Mediterranean', 'port', NULL, NULL, NULL, '2025-09-16T05:21:25.499Z', '2025-09-16T05:21:25.499Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (36, 'TEST_Port2', 'Greece', 'Mediterranean', 'sea_day', NULL, NULL, NULL, '2025-09-16T05:21:25.565Z', '2025-09-16T05:21:25.565Z');
INSERT INTO ports (id, name, country, region, port_type, coordinates, description, image_url, created_at, updated_at) VALUES (37, 'TEST_Mykonos', 'Greece', 'Mediterranean', 'port', NULL, NULL, NULL, '2025-09-16T05:21:25.633Z', '2025-09-16T05:21:25.633Z');

-- Data for parties
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (1, 'Red Dress Pool Party', 'Everyone wears red for this iconic pool party', 'pool', 500, '3.0', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310795/events/red-dress_kpmzqr.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.648Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (2, 'Pride of the Seven Seas', 'Sunset pride celebration on deck', 'deck', 300, '2.5', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310794/events/pride-at-sea_vktggj.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.688Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (3, 'Ancient Treasures', 'Egyptian themed costume party', 'theater', 250, '2.0', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310792/events/ancient-treasures_e6miwp.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.728Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (4, 'Glow Party', 'UV and neon dance party', 'club', 400, '4.0', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310792/events/glow_tqrfho.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.764Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (5, 'Dog Tag Tea Dance', 'Classic tea dance with military theme', 'deck', 350, '3.0', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310792/events/dog-tag_rbcb8k.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.800Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (6, 'Cocktails and Canapés', 'Elegant evening reception', 'lounge', 150, '2.0', NULL, NULL, 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:06:14.692Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (7, 'White Party', 'All-white dress code dance party', 'pool', 500, '4.0', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310796/events/white-party_mxwl1e.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.838Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (8, 'Mediterranean Night', 'Cultural celebration', 'theater', 300, '2.5', NULL, NULL, 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:06:14.692Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (9, 'Farewell Gala', 'Final night celebration', 'theater', 400, '3.0', NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1734310793/events/farewell_yxlhwd.jpg', 0, '2025-09-16T05:06:14.692Z', '2025-09-16T05:07:16.886Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (28, 'TEST_White Party', 'All White Attire', 'pool', 500, '4.0', '["DJ","Sound System","Lighting"]', 'https://example.com/white-party.jpg', 0, '2025-09-16T05:21:25.707Z', '2025-09-16T05:21:25.707Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (29, 'TEST_Glow Party', 'UV Lights', 'club', 400, '5.0', NULL, NULL, 0, '2025-09-16T05:21:25.775Z', '2025-09-16T05:21:25.843Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (30, 'TEST_Popular Party', 'Test', 'deck', NULL, NULL, NULL, NULL, 0, '2025-09-16T05:21:25.913Z', '2025-09-16T05:21:25.913Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (31, 'TEST_Original', 'Original Theme', 'pool', 200, NULL, '["DJ","Bar"]', NULL, 0, '2025-09-16T05:21:25.981Z', '2025-09-16T05:21:25.981Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (32, 'TEST_Copy', 'Original Theme', 'pool', 200, NULL, '["DJ","Bar"]', NULL, 0, '2025-09-16T05:21:26.123Z', '2025-09-16T05:21:26.123Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (33, 'TEST_Pool Party', NULL, 'pool', NULL, NULL, NULL, NULL, 0, '2025-09-16T05:21:26.189Z', '2025-09-16T05:21:26.189Z');
INSERT INTO parties (id, name, theme, venue_type, capacity, duration_hours, requirements, image_url, usage_count, created_at, updated_at) VALUES (34, 'TEST_Club Party', NULL, 'club', NULL, NULL, NULL, NULL, 0, '2025-09-16T05:21:26.257Z', '2025-09-16T05:21:26.257Z');

-- Data for itinerary
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (1, 1, '2025-08-20T15:00:00.000Z', 1, 'Athens, Greece', '', 'Pre-Cruise', '', '', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880780/cruise-app/itinerary/cruise-app/itinerary/athens-greece-port-scenic-0bfb845f.png', '', NULL, 0, 'main', 9);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (2, 1, '2025-08-21T15:00:00.000Z', 2, 'Athens, Greece (Embarkation Day)', '', '', '6:00 PM', '6:00 PM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880780/cruise-app/itinerary/cruise-app/itinerary/athens-greece-port-scenic-0bfb845f.png', '', NULL, 1, 'main', 1);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (3, 1, '2025-08-22T15:00:00.000Z', 3, 'Santorini, Greece', '', '9:00 AM', '10:00 PM', '10:00 PM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880793/cruise-app/itinerary/cruise-app/itinerary/santorini-greece-cruise-port-ed3e2e0a.png', '', NULL, 2, 'main', 2);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (4, 1, '2025-08-23T15:00:00.000Z', 4, 'Kuşadası, Turkey', '', '8:00 AM', '3:00 PM', '3:00 PM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880789/cruise-app/itinerary/cruise-app/itinerary/kusadasi-turkey-port-scenic-cf0f15d9.png', '', NULL, 3, 'main', 8);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (5, 1, '2025-08-24T15:00:00.000Z', 5, 'Istanbul, Turkey', '', '1:00 PM', 'Overnight', '', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880787/cruise-app/itinerary/cruise-app/itinerary/istanbul-turkey-cruise-port-e82f2c8b.png', '', NULL, 4, 'main', 6);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (6, 1, '2025-08-25T15:00:00.000Z', 6, 'Istanbul, Turkey', '', '', '2:00 PM', '2:00 PM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880787/cruise-app/itinerary/cruise-app/itinerary/istanbul-turkey-cruise-port-e82f2c8b.png', '', NULL, 5, 'main', 5);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (7, 1, '2025-08-26T15:00:00.000Z', 7, 'Day at Sea', '', '', '', '', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757773863/cruise-app/assets/celebrity-cruise-lines_celebrity-solstice_wake_article_article-2997_5685_1757732437578_cuv35p.jpg', 'Enjoy a relaxing day at sea with all the ship amenities and Atlantis activities.', NULL, 6, 'main', 4);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (8, 1, '2025-08-27T15:00:00.000Z', 8, 'Alexandria (Cairo), Egypt', '', '7:00 AM', '12:00 AM', '12:00 AM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880778/cruise-app/itinerary/cruise-app/itinerary/alexandria-egypt-cruise-port-764a37c8.png', '', NULL, 7, 'main', 8);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (9, 1, '2025-08-28T15:00:00.000Z', 9, 'Day at Sea', '', '', '', '', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757773863/cruise-app/assets/celebrity-cruise-lines_celebrity-solstice_wake_article_article-2997_5685_1757732437578_cuv35p.jpg', 'Enjoy a relaxing day at sea with all the ship amenities and Atlantis activities.', NULL, 8, 'main', 3);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (10, 1, '2025-08-29T15:00:00.000Z', 10, 'Mykonos, Greece', '', '9:00 AM', '2:00 AM', '2:00 AM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880791/cruise-app/itinerary/cruise-app/itinerary/mykonos-greece-cruise-port-ae350664.png', '', NULL, 9, 'main', 7);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (11, 1, '2025-08-30T15:00:00.000Z', 11, 'Iraklion, Crete', '', '11:00 AM', '6:00 PM', '6:00 PM', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880786/cruise-app/itinerary/cruise-app/itinerary/iraklion-crete-cruise-port-faa24cff.png', '', NULL, 10, 'main', 10);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (12, 1, '2025-08-31T15:00:00.000Z', 12, 'Athens, Greece (Disembarkation Day)', '', '7:00 AM', '', '', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757880780/cruise-app/itinerary/cruise-app/itinerary/athens-greece-port-scenic-0bfb845f.png', '', NULL, 11, 'main', 9);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (13, 7, '2025-10-15T22:00:00.000Z', 1, 'Miami', 'United States', '—', '17:00', '16:30', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/471674-Miami_zorh0h.webp', 'Embarkation day in the vibrant city of Miami', '["Embarkation","Ship exploration","Welcome activities"]', 1, 'main', 9);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (14, 7, '2025-10-16T17:00:00.000Z', 2, 'Day at Sea', NULL, '—', '—', '—', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/Sunrise-at-sea-Easter-morning_smdnce.jpg', 'Slay Day at Sea - Full day of drag performances and activities', '["Drag performances","Poolside shows","Themed events","Ship amenities"]', 2, 'main', 1);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (15, 7, '2025-10-17T13:00:00.000Z', 3, 'Key West', 'United States', '08:00', '17:00', '16:30', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901418/keywest_bly8wt.png', 'Explore the colorful island paradise of Key West, Florida', '["Duval Street","Hemingway House","Mallory Square sunset","Local bars and restaurants"]', 3, 'main', 2);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (16, 7, '2025-10-18T14:00:00.000Z', 4, 'Bimini', 'Bahamas', '09:00', '18:00', '17:30', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/bimini_k3wdwc.avif', 'Beautiful Bahamian island with pristine beaches and crystal waters', '["Beach time","Water activities","Local culture","Duty-free shopping"]', 4, 'main', 8);
INSERT INTO itinerary (id, cruise_id, date, day, port_name, country, arrival_time, departure_time, all_aboard_time, port_image_url, description, highlights, order_index, segment, port_id) VALUES (17, 7, '2025-10-19T12:00:00.000Z', 5, 'Miami', 'United States', '07:00', '—', '—', 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757901417/miami_2_deyzec.jpg', 'Disembarkation in Miami - end of cruise', '["Disembarkation","Farewell breakfast","Luggage collection"]', 5, 'main', 6);

-- Data for events
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (1, 1, '2025-08-20T15:00:00.000Z', '17:00', 'Pre-Cruise Happy Hour by KGay Travel', 'social', 'Academias Hotel RoofTop Bar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:37.723Z', '2025-09-14T12:35:37.723Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (2, 1, '2025-08-21T15:00:00.000Z', '18:00', 'Sail-Away Party', 'party', 'Aquatic Club', NULL, 'Top-deck vibes as we depart.', 'Top-deck vibes as we depart.', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757805135/sailaway_m3tnsb.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:37.770Z', '2025-09-14T12:35:37.770Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (4, 1, '2025-08-21T15:00:00.000Z', '19:30', 'Monét X Change', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[2]', '2025-09-14T12:35:37.855Z', '2025-09-14T12:35:37.855Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (5, 1, '2025-08-21T15:00:00.000Z', '22:00', 'Monét X Change', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[2]', '2025-09-14T12:35:37.895Z', '2025-09-14T12:35:37.895Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (6, 1, '2025-08-21T15:00:00.000Z', '21:00', 'Rob Houchen', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[7]', '2025-09-14T12:35:37.933Z', '2025-09-14T12:35:37.933Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (7, 1, '2025-08-21T15:00:00.000Z', '23:00', 'Gay Comedy Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[9,10,11]', '2025-09-14T12:35:37.975Z', '2025-09-14T12:35:37.975Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (8, 1, '2025-08-21T15:00:00.000Z', '23:00', 'Piano Bar with Brian Nash', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[21]', '2025-09-14T12:35:38.015Z', '2025-09-14T12:35:38.015Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (9, 1, '2025-08-21T15:00:00.000Z', '23:00', 'Welcome Party', 'party', 'Aquatic Club', NULL, 'First night under the stars.', 'First night under the stars.', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757805129/welcome_lwr9md.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:38.055Z', '2025-09-14T12:35:38.055Z', 6);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (10, 1, '2025-08-22T15:00:00.000Z', '17:00', 'Another Rose (Dinner show)', 'dining', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[13]', '2025-09-14T12:35:38.097Z', '2025-09-14T12:35:38.097Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (11, 1, '2025-08-22T15:00:00.000Z', '22:00', 'Monét X Change', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[2]', '2025-09-14T12:35:38.137Z', '2025-09-14T12:35:38.137Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (12, 1, '2025-08-22T15:00:00.000Z', '21:00', 'Alyssa Wray', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[8]', '2025-09-14T12:35:38.179Z', '2025-09-14T12:35:38.179Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (13, 1, '2025-08-22T15:00:00.000Z', '23:00', 'Sherry Vine', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[5]', '2025-09-14T12:35:38.221Z', '2025-09-14T12:35:38.221Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (14, 1, '2025-08-22T15:00:00.000Z', '23:00', 'UNITE', 'party', 'Aquatic Club', NULL, 'Global community celebration with 60+ nations represented. Show off your country''s colors and unite in fun, frolic, and friendship.', 'Global community celebration with 60+ nations represented. Show off your country''s colors and unite ...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804284/unite_af3vyi.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:38.263Z', '2025-09-14T12:35:38.263Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (15, 1, '2025-08-23T15:00:00.000Z', '17:00', 'Dog Tag T-Dance', 'party', 'Aquatic Club', NULL, 'Longest-running afternoon party with military uniform inspiration. We provide souvenir dog tags; you bring the strength and style.', 'Longest-running afternoon party with military uniform inspiration. We provide souvenir dog tags; you...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804284/dogtag_gcui6m.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:38.307Z', '2025-09-14T12:35:38.307Z', 5);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (16, 1, '2025-08-23T15:00:00.000Z', '19:00', 'Alexis Michelle', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[3]', '2025-09-14T12:35:38.347Z', '2025-09-14T12:35:38.347Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (17, 1, '2025-08-23T15:00:00.000Z', '19:30', 'AirOtic', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[12]', '2025-09-14T12:35:38.387Z', '2025-09-14T12:35:38.387Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (18, 1, '2025-08-23T15:00:00.000Z', '22:00', 'AirOtic', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[12]', '2025-09-14T12:35:38.425Z', '2025-09-14T12:35:38.425Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (19, 1, '2025-08-23T15:00:00.000Z', '21:00', 'Rob Houchen', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[7]', '2025-09-14T12:35:38.463Z', '2025-09-14T12:35:38.463Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (20, 1, '2025-08-23T15:00:00.000Z', '23:00', 'Gay Comedy Stars (Rachel Scanlon, Daniel Webb)', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[10,11]', '2025-09-14T12:35:38.505Z', '2025-09-14T12:35:38.505Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (21, 1, '2025-08-23T15:00:00.000Z', '23:00', 'Lost At Sea', 'party', 'Aquatic Club', NULL, 'Nautical silliness with sea creatures, pirates, and mythical characters. Cruise passengers and TV escapees welcome too.', 'Nautical silliness with sea creatures, pirates, and mythical characters. Cruise passengers and TV es...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804283/sea_dyhgwy.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:38.546Z', '2025-09-14T12:35:38.546Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (22, 1, '2025-08-23T15:00:00.000Z', '23:00', 'Piano Bar with William TN Hall', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[20]', '2025-09-14T12:35:38.587Z', '2025-09-14T12:35:38.587Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (23, 1, '2025-08-24T15:00:00.000Z', '22:00', 'AirOtic', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[12]', '2025-09-14T12:35:38.629Z', '2025-09-14T12:35:38.629Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (24, 1, '2025-08-24T15:00:00.000Z', '21:00', 'Leona Winter', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[4]', '2025-09-14T12:35:38.671Z', '2025-09-14T12:35:38.671Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (25, 1, '2025-08-24T15:00:00.000Z', '23:00', 'Rob Houchen', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[7]', '2025-09-14T12:35:38.711Z', '2025-09-14T12:35:38.711Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (26, 1, '2025-08-24T15:00:00.000Z', '23:00', 'Piano Bar with Brandon James Gwinn', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[22]', '2025-09-14T12:35:38.753Z', '2025-09-14T12:35:38.753Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (27, 1, '2025-08-24T15:00:00.000Z', '23:00', 'Atlantis Night Club', 'party', 'On the Rocks', NULL, NULL, NULL, 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757881308/IMG-ENT-Never-Sleep-Alone-The-Manor-V1_1361-3000x1700-1-800x600_w62xm0.webp', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:38.795Z', '2025-09-14T12:35:38.795Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (28, 1, '2025-08-25T15:00:00.000Z', '17:00', 'Another Rose (Dinner show)', 'dining', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[13]', '2025-09-14T12:35:38.837Z', '2025-09-14T12:35:38.837Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (29, 1, '2025-08-25T15:00:00.000Z', '19:30', 'Persephone', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[14]', '2025-09-14T12:35:38.877Z', '2025-09-14T12:35:38.877Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (30, 1, '2025-08-25T15:00:00.000Z', '22:00', 'Persephone', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[14]', '2025-09-14T12:35:38.919Z', '2025-09-14T12:35:38.919Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (31, 1, '2025-08-25T15:00:00.000Z', '21:00', 'Alyssa Wray', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[8]', '2025-09-14T12:35:38.959Z', '2025-09-14T12:35:38.959Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (32, 1, '2025-08-25T15:00:00.000Z', '23:00', 'Alexis Michelle', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[3]', '2025-09-14T12:35:39.001Z', '2025-09-14T12:35:39.001Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (33, 1, '2025-08-25T15:00:00.000Z', '23:00', 'Empires', 'party', 'Aquatic Club', NULL, 'Ancient world glamour featuring Greece, Egypt, Rome, and Ottoman empires. Golden togas, silks, and Cleopatra-level dazzle welcome.', 'Ancient world glamour featuring Greece, Egypt, Rome, and Ottoman empires. Golden togas, silks, and C...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804647/empires_cpd6zo.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:39.043Z', '2025-09-14T12:35:39.043Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (34, 1, '2025-08-25T15:00:00.000Z', '23:00', 'Piano Bar with Brian Nash', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[21]', '2025-09-14T12:35:39.085Z', '2025-09-14T12:35:39.085Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (35, 1, '2025-08-26T15:00:00.000Z', '14:00', 'Bingo with The Diva', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[15]', '2025-09-14T12:35:39.125Z', '2025-09-14T12:35:39.125Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (36, 1, '2025-08-26T15:00:00.000Z', '17:00', 'Think Pink T-Dance', 'party', 'Aquatic Club', NULL, 'Pink is in! It''s everywhere and brings out the playful in all of us. From Barbie butch to fluffy fantastic, throw on your favorite interpretation for a hot afternoon of frivolous dolled up fun.', 'Pink is in! It''s everywhere and brings out the playful in all of us. From Barbie butch to fluffy fan...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804284/pink_fotvpt.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:39.167Z', '2025-09-14T12:35:39.167Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (37, 1, '2025-08-26T15:00:00.000Z', '19:30', 'Reuben Kaye', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[6]', '2025-09-14T12:35:39.207Z', '2025-09-14T12:35:39.207Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (38, 1, '2025-08-26T15:00:00.000Z', '22:00', 'Reuben Kaye', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[6]', '2025-09-14T12:35:39.251Z', '2025-09-14T12:35:39.251Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (39, 1, '2025-08-26T15:00:00.000Z', '19:00', 'Leona Winter', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[4]', '2025-09-14T12:35:39.293Z', '2025-09-14T12:35:39.293Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (40, 1, '2025-08-26T15:00:00.000Z', '21:00', 'Comedy All-Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[9,10,11]', '2025-09-14T12:35:39.333Z', '2025-09-14T12:35:39.333Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (41, 1, '2025-08-26T15:00:00.000Z', '23:00', 'Sherry Vine', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[5]', '2025-09-14T12:35:39.376Z', '2025-09-14T12:35:39.376Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (42, 1, '2025-08-26T15:00:00.000Z', '23:00', 'Piano Bar with William TN Hall', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[20]', '2025-09-14T12:35:39.417Z', '2025-09-14T12:35:39.417Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (43, 1, '2025-08-26T15:00:00.000Z', '23:00', 'Atlantis Classics', 'party', 'Aquatic Club', NULL, 'Three decades of anthems & divas.', 'Three decades of anthems & divas.', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804281/classics_thqbx2.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:39.459Z', '2025-09-14T12:35:39.459Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (44, 1, '2025-08-27T15:00:00.000Z', '22:00', 'Persephone', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[14]', '2025-09-14T12:35:39.507Z', '2025-09-14T12:35:39.507Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (45, 1, '2025-08-27T15:00:00.000Z', '21:00', 'Comedy All-Stars (Brad Loekle, Rachel Scanlon, Daniel Webb)', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[9,10,11]', '2025-09-14T12:35:39.549Z', '2025-09-14T12:35:39.549Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (46, 1, '2025-08-27T15:00:00.000Z', '23:00', 'Sherry Vine', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[5]', '2025-09-14T12:35:39.591Z', '2025-09-14T12:35:39.591Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (47, 1, '2025-08-27T15:00:00.000Z', '23:00', 'Greek Isles: Here We Go Again!', 'party', 'Aquatic Club', NULL, 'Mamma Mia fantasy with Greek island chic meets ABBA disco. Blue & white, sequins, platform boots, and Mediterranean drama.', 'Mamma Mia fantasy with Greek island chic meets ABBA disco. Blue & white, sequins, platform boots, an...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804284/greek_proadv.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:39.631Z', '2025-09-14T12:35:39.631Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (48, 1, '2025-08-28T15:00:00.000Z', '17:00', 'Another Rose (Dinner show)', 'dining', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[13]', '2025-09-14T12:35:39.677Z', '2025-09-14T12:35:39.677Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (49, 1, '2025-08-28T15:00:00.000Z', '17:00', 'Audra McDonald', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[1]', '2025-09-14T12:35:39.718Z', '2025-09-14T12:35:39.718Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (50, 1, '2025-08-28T15:00:00.000Z', '20:00', 'Audra McDonald', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[1]', '2025-09-14T12:35:39.761Z', '2025-09-14T12:35:39.761Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (51, 1, '2025-08-28T15:00:00.000Z', '22:00', 'Audra McDonald', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[1]', '2025-09-14T12:35:39.803Z', '2025-09-14T12:35:39.803Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (52, 1, '2025-08-28T15:00:00.000Z', '21:00', 'Leona Winter', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[4]', '2025-09-14T12:35:39.845Z', '2025-09-14T12:35:39.845Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (53, 1, '2025-08-28T15:00:00.000Z', '23:00', 'Alyssa Wray', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[8]', '2025-09-14T12:35:39.889Z', '2025-09-14T12:35:39.889Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (54, 1, '2025-08-28T15:00:00.000Z', '23:00', 'Piano Bar with William TN Hall', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[20]', '2025-09-14T12:35:39.929Z', '2025-09-14T12:35:39.929Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (55, 1, '2025-08-29T15:00:00.000Z', '00:30', 'Neon Playground', 'party', 'Red Room', NULL, 'Fast, flashy, bright musical playground in the Red Room. Neon, sparkles, lights, and bouncy sounds that make you smile. This event happens at 12:30am on Friday morning.', 'Fast, flashy, bright musical playground in the Red Room. Neon, sparkles, lights, and bouncy sounds t...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804282/neon_cqdmz3.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:39.969Z', '2025-09-14T12:35:39.969Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (56, 1, '2025-08-29T15:00:00.000Z', '19:00', 'Another Rose (Dinner show)', 'dining', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[13]', '2025-09-14T12:35:40.011Z', '2025-09-14T12:35:40.011Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (57, 1, '2025-08-29T15:00:00.000Z', '23:00', 'Sherry Vine', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[5]', '2025-09-14T12:35:40.051Z', '2025-09-14T12:35:40.051Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (58, 1, '2025-08-29T15:00:00.000Z', '23:00', 'Piano Bar with Brandon James Gwinn', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[22]', '2025-09-14T12:35:40.093Z', '2025-09-14T12:35:40.093Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (59, 1, '2025-08-29T15:00:00.000Z', '24:00', 'Virgin White Party', 'party', 'Aquatic Club', NULL, 'Atlantis'' pinnacle party in one perfect color. Be creative, sexy, irreverent, or simple in your favorite white outfit.', 'Atlantis'' pinnacle party in one perfect color. Be creative, sexy, irreverent, or simple in your favo...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804283/white_wcg2hw.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:40.135Z', '2025-09-14T12:35:40.135Z', 7);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (60, 1, '2025-08-29T15:00:00.000Z', '05:00', 'Off-White After party', 'party', 'The Manor', NULL, 'Late-late afters post-White.', 'Late-late afters post-White.', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804283/off-white_yvcnsq.jpg', NULL, NULL, NULL, true, NULL, '2025-09-14T12:35:40.177Z', '2025-09-14T12:35:40.177Z', 7);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (61, 1, '2025-08-30T15:00:00.000Z', '17:00', 'Revival! Classic Disco T-Dance', 'party', 'Aquatic Club', NULL, 'Glory days of 70s disco with pure musical magic. Artificial fabrics, facial hair, oversized shoes, and obnoxious accessories welcome.', 'Glory days of 70s disco with pure musical magic. Artificial fabrics, facial hair, oversized shoes, a...', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804281/classics_thqbx2.jpg', NULL, NULL, NULL, false, NULL, '2025-09-14T12:35:40.219Z', '2025-09-14T12:35:40.219Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (62, 1, '2025-08-30T15:00:00.000Z', '19:00', 'Alexis Michelle', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[3]', '2025-09-14T12:35:40.261Z', '2025-09-14T12:35:40.261Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (63, 1, '2025-08-30T15:00:00.000Z', '21:00', 'Alyssa Wray', 'show', 'The Manor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '[8]', '2025-09-14T12:35:40.301Z', '2025-09-14T12:35:40.301Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (64, 1, '2025-08-30T15:00:00.000Z', '19:30', 'Brad''s Last Laugh (Brad Loekle)', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[9]', '2025-09-14T12:35:40.353Z', '2025-09-14T12:35:40.353Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (65, 1, '2025-08-30T15:00:00.000Z', '22:00', 'Brad''s Last Laugh (Brad Loekle)', 'show', 'Red Room', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[9]', '2025-09-14T12:35:40.403Z', '2025-09-14T12:35:40.403Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (66, 1, '2025-08-30T15:00:00.000Z', '23:00', 'Piano Bar with Brian Nash', 'lounge', 'On the Rocks', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '[21]', '2025-09-14T12:35:40.445Z', '2025-09-14T12:35:40.445Z', NULL);
INSERT INTO events (id, cruise_id, date, time, title, type, venue, deck, description, short_description, image_url, theme_description, dress_code, capacity, requires_reservation, talent_ids, created_at, updated_at, party_id) VALUES (67, 1, '2025-08-30T15:00:00.000Z', '23:00', 'Last Dance', 'party', 'The Manor', NULL, 'One last boogie into Athens.', 'One last boogie into Athens.', 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804283/sea_dyhgwy.jpg', NULL, NULL, NULL, true, NULL, '2025-09-14T12:35:40.484Z', '2025-09-14T12:35:40.484Z', NULL);

-- Data for trip_info_sections
INSERT INTO trip_info_sections (id, cruise_id, title, content, order_index, updated_by, updated_at) VALUES (1, 1, 'Entertainment Booking', 'Booking Start: 5:00 PM Thursday in Virgin Voyages App\nWalk-ins: Available - ''Sold out'' only means no reservations available\nStandby Release: 10 minutes before showtime\nRockstar Suites: Reserved space held until 10 minutes before showtime', 1, NULL, '2025-09-15T04:55:16.144Z');
INSERT INTO trip_info_sections (id, cruise_id, title, content, order_index, updated_by, updated_at) VALUES (2, 1, 'Dining Information', 'Reservations: Limited but not necessary\nWalk-ins: 40% of tables reserved for walk-ins after 7 PM\nIncluded: All restaurants included in cruise fare\nLate Night: Several late-night options available', 2, NULL, '2025-09-15T04:55:16.144Z');
INSERT INTO trip_info_sections (id, cruise_id, title, content, order_index, updated_by, updated_at) VALUES (3, 1, 'First Day Tips', '1. Look for Atlantis team members in polo shirts with name badges\n2. Use meal times to meet other guests at shared seating\n3. Don''t try to do everything on day 1 - pace yourself\n4. Luggage takes time to arrive - pack carry-on essentials', 3, NULL, '2025-09-15T04:55:16.144Z');
INSERT INTO trip_info_sections (id, cruise_id, title, content, order_index, updated_by, updated_at) VALUES (4, 1, 'Virgin Voyages App', 'Registration Steps: 6\nNote: Must register in app - cannot register online', 4, NULL, '2025-09-15T04:55:16.144Z');

-- Data for cruise_talent
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 24, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:13.707Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 31, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:13.868Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 26, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.040Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 30, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.212Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 32, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.330Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 33, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.454Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 25, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.622Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 28, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.828Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (7, 29, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:14.974Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 16, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.122Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 12, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.187Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 3, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.241Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 8, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.287Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 13, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.348Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 1, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.431Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 9, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.511Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 22, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.570Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 21, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.624Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 11, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.686Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 17, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.739Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 18, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.784Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 19, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.830Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 4, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.872Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 2, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.917Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 14, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.963Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 10, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:15.998Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 6, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:16.035Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 7, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:16.088Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 5, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:16.126Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 15, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:16.164Z');
INSERT INTO cruise_talent (cruise_id, talent_id, role, performance_count, notes, created_at) VALUES (1, 20, 'Featured Performer', NULL, NULL, '2025-09-15T07:24:16.200Z');



-- Enable Row Level Security on all tables
ALTER TABLE cruises ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_info_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruise_talent ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust as needed)

-- Policy for cruises
CREATE POLICY "Enable read access for all users" ON cruises
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON cruises
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cruises
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON cruises
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for talent
CREATE POLICY "Enable read access for all users" ON talent
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON talent
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON talent
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON talent
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for ports
CREATE POLICY "Enable read access for all users" ON ports
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON ports
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON ports
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for parties
CREATE POLICY "Enable read access for all users" ON parties
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON parties
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON parties
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON parties
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for itinerary
CREATE POLICY "Enable read access for all users" ON itinerary
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON itinerary
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON itinerary
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON itinerary
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for events
CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON events
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for event_talent
CREATE POLICY "Enable read access for all users" ON event_talent
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON event_talent
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON event_talent
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON event_talent
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for trip_info_sections
CREATE POLICY "Enable read access for all users" ON trip_info_sections
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON trip_info_sections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON trip_info_sections
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON trip_info_sections
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policy for cruise_talent
CREATE POLICY "Enable read access for all users" ON cruise_talent
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON cruise_talent
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cruise_talent
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON cruise_talent
  FOR DELETE USING (auth.role() = 'authenticated');

