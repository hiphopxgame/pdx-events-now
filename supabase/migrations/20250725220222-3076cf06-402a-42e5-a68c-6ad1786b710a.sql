-- Create or find the Mental Stamina user profile
INSERT INTO public.por_eve_profiles (id, email, display_name, username, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'mentalstamina@example.com',
  'Mental Stamina',
  'mental_stamina',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.por_eve_profiles 
  WHERE display_name = 'Mental Stamina' OR username = 'mental_stamina'
);

-- Get the Mental Stamina user ID for reference
DO $$
DECLARE
  mental_stamina_user_id UUID;
  venue_id UUID;
BEGIN
  -- Get or create Mental Stamina user
  SELECT id INTO mental_stamina_user_id 
  FROM public.por_eve_profiles 
  WHERE display_name = 'Mental Stamina' 
  LIMIT 1;
  
  -- If still not found, create with a known UUID
  IF mental_stamina_user_id IS NULL THEN
    mental_stamina_user_id := gen_random_uuid();
    INSERT INTO public.por_eve_profiles (id, email, display_name, username, created_at, updated_at)
    VALUES (
      mental_stamina_user_id,
      'mentalstamina@example.com',
      'Mental Stamina', 
      'mental_stamina',
      now(),
      now()
    );
  END IF;

  -- Insert venues
  -- Covert Cafe
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, youtube_url, status, created_at, updated_at)
  VALUES ('Covert Cafe', '803 SE 82nd Avenue', 'Portland', 'OR', '97216', 'https://thecovertcafe.com', 'https://www.facebook.com/profile.php?id=100094954831325', 'https://instagram.com/covertcafepdx', 'https://www.youtube.com/@CovertCafe', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    youtube_url = EXCLUDED.youtube_url,
    status = 'approved',
    updated_at = now();

  -- Laurelthirst Public House
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, status, created_at, updated_at)
  VALUES ('Laurelthirst Public House', '2958 NE Glisan Street', 'Portland', 'OR', '97232', 'https://laurelthirst.com', 'https://www.facebook.com/laurelthirstpub', 'https://instagram.com/laurelthirstpub', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- Barrel Room
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, twitter_url, status, created_at, updated_at)
  VALUES ('Barrel Room', '120 NW Couch Street', 'Portland', 'OR', '97209', 'https://www.barrelroompdx.com', 'https://www.facebook.com/BarrelRoomPDX', 'https://instagram.com/barrelroomportland', 'https://x.com/broompdx', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    twitter_url = EXCLUDED.twitter_url,
    status = 'approved',
    updated_at = now();

  -- Hostel Café
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, twitter_url, status, created_at, updated_at)
  VALUES ('Hostel Café', '1810 NW Glisan Street', 'Portland', 'OR', '97209', 'https://www.hostelcafepdx.com', 'https://www.facebook.com/PDXHostelCafe', 'https://instagram.com/pdxhostelcafe', 'https://x.com/HostelCafePDX', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    twitter_url = EXCLUDED.twitter_url,
    status = 'approved',
    updated_at = now();

  -- Rae Loft
  INSERT INTO public.venues (name, address, city, state, zip_code, website, instagram_url, status, created_at, updated_at)
  VALUES ('Rae Loft', '2222 NE Oregon Street Suite 207', 'Portland', 'OR', '97232', 'https://www.raeloftpdx.com', 'https://instagram.com/raeloftatthebakerybuilding', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- Starday Tavern
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, twitter_url, status, created_at, updated_at)
  VALUES ('Starday Tavern', '6517 SE Foster Road', 'Portland', 'OR', '97206', 'https://stardaytavern.com', 'https://www.facebook.com/TheStardayTavern', 'https://instagram.com/stardaytavern', 'https://x.com/Stardaytavern', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    twitter_url = EXCLUDED.twitter_url,
    status = 'approved',
    updated_at = now();

  -- Dullahan's Pizza Pub
  INSERT INTO public.venues (name, address, city, state, zip_code, website, instagram_url, status, created_at, updated_at)
  VALUES ('Dullahan''s Pizza Pub', '3813 SE Gladstone Street', 'Portland', 'OR', '97202', 'https://www.thedullahanpizzapub.com', 'https://instagram.com/thedullahanpizzapub', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- The Heist
  INSERT INTO public.venues (name, address, city, state, zip_code, website, instagram_url, status, created_at, updated_at)
  VALUES ('The Heist', '4727 SE Woodstock Boulevard #1', 'Portland', 'OR', '97206', 'https://theheistpdx.com', 'https://instagram.com/theheistpdx', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- The Nest Lounge
  INSERT INTO public.venues (name, address, city, state, zip_code, facebook_url, instagram_url, status, created_at, updated_at)
  VALUES ('The Nest Lounge', '2715 SE Belmont Street', 'Portland', 'OR', '97214', 'https://www.facebook.com/thenestloungepdx', 'https://instagram.com/nestloungepdx', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- Bear Paw Inn
  INSERT INTO public.venues (name, address, city, state, zip_code, facebook_url, instagram_url, status, created_at, updated_at)
  VALUES ('Bear Paw Inn', '3237 SE Milwaukie Avenue', 'Portland', 'OR', '97202', 'https://www.facebook.com/profile.php?id=100050615293630', 'https://instagram.com/bearpawinnpdx', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- The Eastburn
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, twitter_url, status, created_at, updated_at)
  VALUES ('The Eastburn', '1800 E Burnside Street', 'Portland', 'OR', '97214', 'https://theeastburn.com', 'https://www.facebook.com/theEastBurn/', 'https://instagram.com/theeastburn', 'https://x.com/EastBurn', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    twitter_url = EXCLUDED.twitter_url,
    status = 'approved',
    updated_at = now();

  -- Artichoke Music
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, twitter_url, youtube_url, status, created_at, updated_at)
  VALUES ('Artichoke Music', '2007 SE Powell Boulevard', 'Portland', 'OR', '97202', 'https://www.artichokemusic.org', 'https://www.facebook.com/artichoke.music', 'https://instagram.com/artichoke.music', 'https://x.com/artichokemusic', 'https://www.youtube.com/artichokemusic', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    twitter_url = EXCLUDED.twitter_url,
    youtube_url = EXCLUDED.youtube_url,
    status = 'approved',
    updated_at = now();

  -- The Trap Lounge
  INSERT INTO public.venues (name, address, city, state, zip_code, status, created_at, updated_at)
  VALUES ('The Trap Lounge', '3805 SE 52nd Avenue', 'Portland', 'OR', '97206', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    status = 'approved',
    updated_at = now();

  -- Alberta Abbey
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, youtube_url, status, created_at, updated_at)
  VALUES ('Alberta Abbey', '126 NE Alberta Street', 'Portland', 'OR', '97211', 'https://www.albertaabbey.org', 'https://www.facebook.com/AlbertaAbbeyPortland/', 'https://instagram.com/albertaabbeypdx', 'https://www.youtube.com/channel/UCVDqRdgAsf6V_6Rw4uvMr_g', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    youtube_url = EXCLUDED.youtube_url,
    status = 'approved',
    updated_at = now();

  -- Canton Phoenix Tigard
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, status, created_at, updated_at)
  VALUES ('Canton Phoenix Tigard', '14455 SW Pacific Hwy', 'Portland', 'OR', '97224', 'https://www.cantonphoenix.com', 'https://www.facebook.com/cantonphoenixlounge', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    status = 'approved',
    updated_at = now();

  -- Ale & Cider House
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, status, created_at, updated_at)
  VALUES ('Ale & Cider House', '1720 Willamette Falls Drive', 'West Linn', 'OR', '97068', 'https://aleandcider.com', 'https://www.facebook.com/aleandciderhouse', 'https://instagram.com/aleandciderhouse', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- Knights of Pythias Hall
  INSERT INTO public.venues (name, address, city, state, zip_code, status, created_at, updated_at)
  VALUES ('Knights of Pythias Hall', '151 SE Second Avenue #Upstairs', 'Hillsboro', 'OR', '97123', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    status = 'approved',
    updated_at = now();

  -- The Decoy
  INSERT INTO public.venues (name, address, city, state, zip_code, status, created_at, updated_at)
  VALUES ('The Decoy', '10710 NW St Helens Road', 'Portland', 'OR', '97231', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    status = 'approved',
    updated_at = now();

  -- Friends Share Community Space
  INSERT INTO public.venues (name, address, city, state, zip_code, facebook_url, instagram_url, youtube_url, status, created_at, updated_at)
  VALUES ('Friends Share Community Space', '14814 SE Powell Boulevard', 'Portland', 'OR', '97236', 'https://www.facebook.com/friendssharecommunityspace/', 'https://instagram.com/friendssharecommunityspace', 'https://www.youtube.com/@friendssharefilms', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    youtube_url = EXCLUDED.youtube_url,
    status = 'approved',
    updated_at = now();

  -- Harlow Hotel
  INSERT INTO public.venues (name, address, city, state, zip_code, website, facebook_url, instagram_url, status, created_at, updated_at)
  VALUES ('Harlow Hotel', '722 NW Glisan Street', 'Portland', 'OR', '97209', 'https://www.harlowhotelpdx.com', 'https://www.facebook.com/HarlowHotelAndCafe', 'https://instagram.com/harlowhotelpdx', 'approved', now(), now())
  ON CONFLICT (name) DO UPDATE SET
    address = EXCLUDED.address,
    website = EXCLUDED.website,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    status = 'approved',
    updated_at = now();

  -- Now insert events
  -- Covert Cafe - Every Sunday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Covert Cafe',
    'Weekly open mic at Covert Cafe',
    'music',
    'Covert Cafe',
    '803 SE 82nd Avenue',
    'Portland',
    'OR',
    '97216',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 0, -- Next Sunday
    '15:30:00',
    '18:00:00',
    true,
    'weekly',
    'weekly:0', -- Sunday = 0
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Laurelthirst - Every Sunday  
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Laurelthirst Public House',
    'Weekly open mic at Laurelthirst Public House',
    'music',
    'Laurelthirst Public House',
    '2958 NE Glisan Street',
    'Portland',
    'OR',
    '97232',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 0, -- Next Sunday
    '20:00:00',
    '23:30:00',
    true,
    'weekly',
    'weekly:0', -- Sunday = 0
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Barrel Room - 3rd Sunday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Barrel Room',
    'Monthly open mic at Barrel Room (3rd Sunday)',
    'music',
    'Barrel Room',
    '120 NW Couch Street',
    'Portland',
    'OR',
    '97209',
    CURRENT_DATE + INTERVAL '3 weeks' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 0, -- 3rd Sunday of next month
    '17:00:00',
    '20:00:00',
    true,
    'monthly',
    'monthly:third_sunday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Hostel Café - Every Monday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Hostel Café',
    'Weekly open mic at Hostel Café',
    'music',
    'Hostel Café',
    '1810 NW Glisan Street',
    'Portland',
    'OR',
    '97209',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, -- Next Monday
    '18:30:00',
    '22:00:00',
    true,
    'weekly',
    'weekly:1', -- Monday = 1
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Continue with remaining events...
  -- Rae Loft - 3rd Monday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Rae Loft',
    'Monthly open mic at Rae Loft (3rd Monday)',
    'music',
    'Rae Loft',
    '2222 NE Oregon Street Suite 207',
    'Portland',
    'OR',
    '97232',
    CURRENT_DATE + INTERVAL '3 weeks' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, -- 3rd Monday
    '18:00:00',
    '21:30:00',
    true,
    'monthly',
    'monthly:third_monday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Starday Tavern - Every Monday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Starday Tavern',
    'Weekly open mic at Starday Tavern',
    'music',
    'Starday Tavern',
    '6517 SE Foster Road',
    'Portland',
    'OR',
    '97206',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, -- Next Monday
    '18:30:00',
    '23:00:00',
    true,
    'weekly',
    'weekly:1', -- Monday = 1
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Add all remaining Tuesday events...
  -- Dullahan's Pizza Pub - Every Tuesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Dullahan''s Pizza Pub',
    'Weekly open mic at Dullahan''s Pizza Pub',
    'music',
    'Dullahan''s Pizza Pub',
    '3813 SE Gladstone Street',
    'Portland',
    'OR',
    '97202',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, -- Next Tuesday
    '18:30:00',
    '21:00:00',
    true,
    'weekly',
    'weekly:2', -- Tuesday = 2
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- The Heist - Every Tuesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at The Heist',
    'Weekly open mic at The Heist',
    'music',
    'The Heist',
    '4727 SE Woodstock Boulevard #1',
    'Portland',
    'OR',
    '97206',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, -- Next Tuesday
    '19:00:00',
    '22:00:00',
    true,
    'weekly',
    'weekly:2', -- Tuesday = 2
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- The Nest Lounge - Every Tuesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at The Nest Lounge',
    'Weekly open mic at The Nest Lounge',
    'music',
    'The Nest Lounge',
    '2715 SE Belmont Street',
    'Portland',
    'OR',
    '97214',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, -- Next Tuesday
    '19:00:00',
    '22:00:00',
    true,
    'weekly',
    'weekly:2', -- Tuesday = 2
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Bear Paw Inn - 1st Tuesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Bear Paw Inn (1st Tuesday)',
    'Monthly open mic at Bear Paw Inn (1st Tuesday)',
    'music',
    'Bear Paw Inn',
    '3237 SE Milwaukie Avenue',
    'Portland',
    'OR',
    '97202',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, -- Next Tuesday
    '19:00:00',
    '21:00:00',
    true,
    'monthly',
    'monthly:first_tuesday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Bear Paw Inn - 3rd Tuesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Bear Paw Inn (3rd Tuesday)',
    'Monthly open mic at Bear Paw Inn (3rd Tuesday)',
    'music',
    'Bear Paw Inn',
    '3237 SE Milwaukie Avenue',
    'Portland',
    'OR',
    '97202',
    CURRENT_DATE + INTERVAL '3 weeks' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 2, -- 3rd Tuesday
    '19:00:00',
    '21:00:00',
    true,
    'monthly',
    'monthly:third_tuesday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Continue with Wednesday events...
  -- The Eastburn - Every Wednesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at The Eastburn',
    'Weekly open mic at The Eastburn',
    'music',
    'The Eastburn',
    '1800 E Burnside Street',
    'Portland',
    'OR',
    '97214',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3, -- Next Wednesday
    '17:30:00',
    '21:00:00',
    true,
    'weekly',
    'weekly:3', -- Wednesday = 3
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Artichoke Music - Every Wednesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Artichoke Music',
    'Weekly open mic at Artichoke Music',
    'music',
    'Artichoke Music',
    '2007 SE Powell Boulevard',
    'Portland',
    'OR',
    '97202',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3, -- Next Wednesday
    '18:30:00',
    '21:00:00',
    true,
    'weekly',
    'weekly:3', -- Wednesday = 3
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- The Trap Lounge - Every Wednesday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at The Trap Lounge',
    'Weekly open mic at The Trap Lounge',
    'music',
    'The Trap Lounge',
    '3805 SE 52nd Avenue',
    'Portland',
    'OR',
    '97206',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3, -- Next Wednesday
    '18:30:00',
    '21:00:00',
    true,
    'weekly',
    'weekly:3', -- Wednesday = 3
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Thursday events...
  -- Alberta Abbey - 1st Thursday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Alberta Abbey',
    'Monthly open mic at Alberta Abbey (1st Thursday)',
    'music',
    'Alberta Abbey',
    '126 NE Alberta Street',
    'Portland',
    'OR',
    '97211',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 4, -- Next Thursday
    '17:00:00',
    '20:00:00',
    true,
    'monthly',
    'monthly:first_thursday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Canton Phoenix Tigard - Every Thursday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Canton Phoenix Tigard',
    'Weekly open mic at Canton Phoenix Tigard',
    'music',
    'Canton Phoenix Tigard',
    '14455 SW Pacific Hwy',
    'Portland',
    'OR',
    '97224',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 4, -- Next Thursday
    '18:30:00',
    '22:00:00',
    true,
    'weekly',
    'weekly:4', -- Thursday = 4
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Ale & Cider House - Every Thursday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Ale & Cider House',
    'Weekly open mic at Ale & Cider House',
    'music',
    'Ale & Cider House',
    '1720 Willamette Falls Drive',
    'West Linn',
    'OR',
    '97068',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 4, -- Next Thursday
    '18:30:00',
    '21:30:00',
    true,
    'weekly',
    'weekly:4', -- Thursday = 4
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Friday events...
  -- Knights of Pythias Hall - Every Friday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Knights of Pythias Hall',
    'Weekly open mic at Knights of Pythias Hall',
    'music',
    'Knights of Pythias Hall',
    '151 SE Second Avenue #Upstairs',
    'Hillsboro',
    'OR',
    '97123',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5, -- Next Friday
    '18:30:00',
    '21:00:00',
    true,
    'weekly',
    'weekly:5', -- Friday = 5
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- The Decoy - 2nd Friday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at The Decoy',
    'Monthly open mic at The Decoy (2nd Friday)',
    'music',
    'The Decoy',
    '10710 NW St Helens Road',
    'Portland',
    'OR',
    '97231',
    CURRENT_DATE + INTERVAL '2 weeks' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5, -- 2nd Friday
    '18:30:00',
    '21:30:00',
    true,
    'monthly',
    'monthly:second_friday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Harlow Hotel - Every Friday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Harlow Hotel',
    'Weekly open mic at Harlow Hotel',
    'music',
    'Harlow Hotel',
    '722 NW Glisan Street',
    'Portland',
    'OR',
    '97209',
    CURRENT_DATE + INTERVAL '1 week' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 5, -- Next Friday
    '19:30:00',
    '22:00:00',
    true,
    'weekly',
    'weekly:5', -- Friday = 5
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

  -- Saturday events...
  -- Friends Share Community Space - 2nd Saturday
  INSERT INTO public.user_events (
    title, description, category, venue_name, venue_address, venue_city, venue_state, venue_zip,
    start_date, start_time, end_time, is_recurring, recurrence_type, recurrence_pattern,
    status, created_by, created_at, updated_at
  ) VALUES (
    'Open Mic at Friends Share Community Space',
    'Monthly open mic at Friends Share Community Space (2nd Saturday)',
    'music',
    'Friends Share Community Space',
    '14814 SE Powell Boulevard',
    'Portland',
    'OR',
    '97236',
    CURRENT_DATE + INTERVAL '2 weeks' - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 6, -- 2nd Saturday
    '17:00:00',
    '22:00:00',
    true,
    'monthly',
    'monthly:second_saturday',
    'approved',
    mental_stamina_user_id,
    now(),
    now()
  );

END $$;