-- STEP 2: Create Tables
-- Run this second in SQL Editor

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