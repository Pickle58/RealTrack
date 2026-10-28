-- Seed data for local D1: 15 properties across two placeholder Clerk owners, all four statuses.
-- Load with (the grep drops these comments so the SQL starts with a statement):
--   cf d1 raw DB-real-estate-tracker --local --persist-to .cloudflare/state --sql "$(grep -v "^--" scripts/seed.sql)"
-- Re-runnable: the seeded owners rows (and their media, by cascade) are replaced.
-- Swap an owner_id for your own Clerk user ID to see the rows on your dashboard.

DELETE FROM properties WHERE owner_id IN ('seed_agent_a', 'seed_agent_b');

INSERT INTO properties (
  id, owner_id, address_line_1, address_line_2, city, state_province, postal_code, country,
  latitude, longitude, bedrooms, bathrooms, price_cents, currency, status, created_at, updated_at
) VALUES
  ('25be70cf-fcb6-4410-abf6-ce0e840cb620', 'seed_agent_a', '4821 N Hermitage Ave', NULL, 'Chicago', 'IL', '60640', 'US', 41.9691, -87.6721, 4, 3.5, 129500000, 'USD', 'active', 1792929600000, 1793016000000),
  ('a0d824c5-1821-4935-8d94-cc54318e6b95', 'seed_agent_a', '1804 S Congress Ave', NULL, 'Austin', 'TX', '78704', 'US', 30.2452, -97.7565, 3, 2, 74990000, 'USD', 'active', 1792756800000, 1792843200000),
  ('4676c65a-b19b-4a8b-aca3-17befb034f09', 'seed_agent_a', '2211 NE Alberta St', NULL, 'Portland', 'OR', '97211', 'US', 45.559, -122.6431, 3, 2, 61500000, 'USD', 'draft', 1792584000000, 1792670400000),
  ('74e89653-fc52-42ba-98a6-a5d7fa98b537', 'seed_agent_b', '88 Beacon St', 'Apt 4B', 'Boston', 'MA', '02108', 'US', 42.3571, -71.0636, 2, 1.5, 89900000, 'USD', 'active', 1792411200000, 1792497600000),
  ('ffb1a38a-d12c-4ea7-89d9-8c51a82ff383', 'seed_agent_b', '1402 Elm St', NULL, 'Dallas', 'TX', '75201', 'US', 32.7863, -96.7991, 4, 3, 115000000, 'USD', 'sold', 1792324800000, 1792411200000),
  ('879e1bed-1a66-411f-ae31-ce3584d8259d', 'seed_agent_a', '900 NW 8th Ave', NULL, 'Miami', 'FL', '33136', 'US', 25.7862, -80.2037, 2, 2, 54500000, 'USD', 'active', 1792152000000, 1792238400000),
  ('ac11e95a-16ca-4449-8d55-5d49ebb970ac', 'seed_agent_b', '3560 N Halsted St', 'Unit 2', 'Chicago', 'IL', '60657', 'US', 41.9479, -87.6493, 3, 2.5, 87500000, 'USD', 'off_market', 1792065600000, 1792152000000),
  ('0c15a144-ae3a-4761-9ef0-aa1e09cfdf14', 'seed_agent_b', '512 W 24th St', NULL, 'New York', 'NY', '10011', 'US', 40.7488, -74.0007, 2, 1, 142500000, 'USD', 'active', 1791892800000, 1791979200000),
  ('0c297164-2b8b-49df-bc59-5194e237e936', 'seed_agent_a', '77 Massachusetts Ave', NULL, 'Cambridge', 'MA', '02139', 'US', NULL, NULL, 3, 2, 133000000, 'USD', 'active', 1791720000000, 1791806400000),
  ('e3f1fa7d-514f-4ed8-ae48-4d2a0112f31b', 'seed_agent_b', '1100 Congress Ave', NULL, 'Austin', 'TX', '78701', 'US', 30.2747, -97.7404, 1, 1, 41500000, 'USD', 'draft', 1791460800000, 1791547200000),
  ('343e17aa-0f37-49ad-9691-889a48de25f7', 'seed_agent_a', '2035 SE Clinton St', NULL, 'Portland', 'OR', '97202', 'US', 45.5035, -122.6438, 4, 3, 98500000, 'USD', 'active', 1791115200000, 1791201600000),
  ('4e181145-41d6-44b2-8d2f-7e67649a77b7', 'seed_agent_b', '640 S Grand Ave', 'Suite 12', 'Los Angeles', 'CA', '90017', 'US', 34.0505, -118.256, 2, 2, 78000000, 'USD', 'sold', 1790942400000, 1791028800000),
  ('c5908f8b-51e0-40ca-b9af-230d31c43e1f', 'seed_agent_b', '1201 3rd Ave', 'Apt 1802', 'Seattle', 'WA', '98101', 'US', 47.6074, -122.3366, 2, 2, 94500000, 'USD', 'active', 1790683200000, 1790769600000),
  ('3bb59e3f-2397-4cf9-ac25-d2dc796e8128', 'seed_agent_a', '415 E 6th St', NULL, 'Austin', 'TX', '78701', 'US', NULL, NULL, 3, 2.5, 69000000, 'USD', 'off_market', 1790424000000, 1790510400000),
  ('e0ec676f-09e6-4a1d-8d06-80e2ca2d670e', 'seed_agent_b', '700 Colorado Blvd', NULL, 'Denver', 'CO', '80206', 'US', 39.7209, -104.9407, 5, 4, 185000000, 'USD', 'active', 1790164800000, 1790251200000);

INSERT INTO property_media (id, property_id, r2_key, mime_type, size_bytes, alt_text, is_cover, uploaded_at)
VALUES
  ('a7ee3b96-5107-4b97-bfe1-f7221dac1d97', '25be70cf-fcb6-4410-abf6-ce0e840cb620', 'properties/25be70cf-fcb6-4410-abf6-ce0e840cb620/media/a7ee3b96-5107-4b97-bfe1-f7221dac1d97', 'image/jpeg', 1884160, '4 bed, 3.5 bath home at 4821 N Hermitage Ave, Chicago, IL', 1, 1792929600000),
  ('d97f0d0f-3822-4d39-bda5-02f853b4c850', '25be70cf-fcb6-4410-abf6-ce0e840cb620', 'properties/25be70cf-fcb6-4410-abf6-ce0e840cb620/media/d97f0d0f-3822-4d39-bda5-02f853b4c850', 'image/png', 3184640, '4 bed, 3.5 bath home at 4821 N Hermitage Ave, Chicago, IL', 0, 1792929660000),
  ('078ff887-55a7-4f08-902d-7370b85cbfbc', '25be70cf-fcb6-4410-abf6-ce0e840cb620', 'properties/25be70cf-fcb6-4410-abf6-ce0e840cb620/media/078ff887-55a7-4f08-902d-7370b85cbfbc', 'image/webp', 1003520, '4 bed, 3.5 bath home at 4821 N Hermitage Ave, Chicago, IL', 0, 1792929720000),
  ('828a8f22-8230-42ac-8995-75cd323817c4', 'a0d824c5-1821-4935-8d94-cc54318e6b95', 'properties/a0d824c5-1821-4935-8d94-cc54318e6b95/media/828a8f22-8230-42ac-8995-75cd323817c4', 'image/jpeg', 1884160, '3 bed, 2 bath home at 1804 S Congress Ave, Austin, TX', 1, 1792756800000),
  ('6c4d7749-1818-42a1-bc42-1c50a4783150', 'a0d824c5-1821-4935-8d94-cc54318e6b95', 'properties/a0d824c5-1821-4935-8d94-cc54318e6b95/media/6c4d7749-1818-42a1-bc42-1c50a4783150', 'image/png', 3184640, '3 bed, 2 bath home at 1804 S Congress Ave, Austin, TX', 0, 1792756860000),
  ('651a2b5c-9a29-4a57-a260-aa6ceb6d6540', '4676c65a-b19b-4a8b-aca3-17befb034f09', 'properties/4676c65a-b19b-4a8b-aca3-17befb034f09/media/651a2b5c-9a29-4a57-a260-aa6ceb6d6540', 'image/jpeg', 1884160, '3 bed, 2 bath home at 2211 NE Alberta St, Portland, OR', 1, 1792584000000),
  ('6d82f2c7-ee84-454a-ac26-cab29f2e559f', '74e89653-fc52-42ba-98a6-a5d7fa98b537', 'properties/74e89653-fc52-42ba-98a6-a5d7fa98b537/media/6d82f2c7-ee84-454a-ac26-cab29f2e559f', 'image/jpeg', 1884160, '2 bed, 1.5 bath home at 88 Beacon St, Boston, MA', 1, 1792411200000),
  ('0e26adfb-b50b-4092-b0c2-e1dd62358dcf', '74e89653-fc52-42ba-98a6-a5d7fa98b537', 'properties/74e89653-fc52-42ba-98a6-a5d7fa98b537/media/0e26adfb-b50b-4092-b0c2-e1dd62358dcf', 'image/png', 3184640, '2 bed, 1.5 bath home at 88 Beacon St, Boston, MA', 0, 1792411260000),
  ('024d25d0-441d-4b98-a792-0e905a159510', '879e1bed-1a66-411f-ae31-ce3584d8259d', 'properties/879e1bed-1a66-411f-ae31-ce3584d8259d/media/024d25d0-441d-4b98-a792-0e905a159510', 'image/jpeg', 1884160, '2 bed, 2 bath home at 900 NW 8th Ave, Miami, FL', 1, 1792152000000),
  ('be299ac3-1152-4f61-aef2-faf9a3949c8e', '879e1bed-1a66-411f-ae31-ce3584d8259d', 'properties/879e1bed-1a66-411f-ae31-ce3584d8259d/media/be299ac3-1152-4f61-aef2-faf9a3949c8e', 'application/pdf', 634880, 'Floor plan for 900 NW 8th Ave, Miami, FL', 0, 1792152060000),
  ('e5bfcd56-8792-4b2d-9a74-5bd59b0a21f9', 'ac11e95a-16ca-4449-8d55-5d49ebb970ac', 'properties/ac11e95a-16ca-4449-8d55-5d49ebb970ac/media/e5bfcd56-8792-4b2d-9a74-5bd59b0a21f9', 'image/jpeg', 1884160, '3 bed, 2.5 bath home at 3560 N Halsted St, Chicago, IL', 1, 1792065600000),
  ('84c892b2-bcca-4fd5-a3a0-d8867e72ee68', '0c15a144-ae3a-4761-9ef0-aa1e09cfdf14', 'properties/0c15a144-ae3a-4761-9ef0-aa1e09cfdf14/media/84c892b2-bcca-4fd5-a3a0-d8867e72ee68', 'image/jpeg', 1884160, '2 bed, 1 bath home at 512 W 24th St, New York, NY', 1, 1791892800000),
  ('d0816843-f8cc-4dba-b631-480dbfbf641d', '0c15a144-ae3a-4761-9ef0-aa1e09cfdf14', 'properties/0c15a144-ae3a-4761-9ef0-aa1e09cfdf14/media/d0816843-f8cc-4dba-b631-480dbfbf641d', 'image/png', 3184640, '2 bed, 1 bath home at 512 W 24th St, New York, NY', 0, 1791892860000),
  ('dd4c4c5d-5185-4381-977d-1eb2dee82440', '0c297164-2b8b-49df-bc59-5194e237e936', 'properties/0c297164-2b8b-49df-bc59-5194e237e936/media/dd4c4c5d-5185-4381-977d-1eb2dee82440', 'image/jpeg', 1884160, '3 bed, 2 bath home at 77 Massachusetts Ave, Cambridge, MA', 1, 1791720000000),
  ('558c1878-0f2d-48a8-91a9-cd5cf5a0bcf9', '343e17aa-0f37-49ad-9691-889a48de25f7', 'properties/343e17aa-0f37-49ad-9691-889a48de25f7/media/558c1878-0f2d-48a8-91a9-cd5cf5a0bcf9', 'image/jpeg', 1884160, '4 bed, 3 bath home at 2035 SE Clinton St, Portland, OR', 1, 1791115200000),
  ('b84a9c31-76a3-4925-b8da-1e71e8e0f170', '343e17aa-0f37-49ad-9691-889a48de25f7', 'properties/343e17aa-0f37-49ad-9691-889a48de25f7/media/b84a9c31-76a3-4925-b8da-1e71e8e0f170', 'application/pdf', 634880, 'Floor plan for 2035 SE Clinton St, Portland, OR', 0, 1791115260000),
  ('9e015c0a-f5ec-4487-b1ee-2972f5a3684e', '4e181145-41d6-44b2-8d2f-7e67649a77b7', 'properties/4e181145-41d6-44b2-8d2f-7e67649a77b7/media/9e015c0a-f5ec-4487-b1ee-2972f5a3684e', 'image/jpeg', 1884160, '2 bed, 2 bath home at 640 S Grand Ave, Los Angeles, CA', 1, 1790942400000),
  ('e4934104-a66a-4af5-adc5-273fb08280cb', 'c5908f8b-51e0-40ca-b9af-230d31c43e1f', 'properties/c5908f8b-51e0-40ca-b9af-230d31c43e1f/media/e4934104-a66a-4af5-adc5-273fb08280cb', 'image/jpeg', 1884160, '2 bed, 2 bath home at 1201 3rd Ave, Seattle, WA', 1, 1790683200000),
  ('b29e92d5-2eb2-4b23-9056-14042b477df6', 'e0ec676f-09e6-4a1d-8d06-80e2ca2d670e', 'properties/e0ec676f-09e6-4a1d-8d06-80e2ca2d670e/media/b29e92d5-2eb2-4b23-9056-14042b477df6', 'image/jpeg', 1884160, '5 bed, 4 bath home at 700 Colorado Blvd, Denver, CO', 1, 1790164800000),
  ('905d73aa-3bc9-4110-b1c2-ac305add80ec', 'e0ec676f-09e6-4a1d-8d06-80e2ca2d670e', 'properties/e0ec676f-09e6-4a1d-8d06-80e2ca2d670e/media/905d73aa-3bc9-4110-b1c2-ac305add80ec', 'image/png', 3184640, '5 bed, 4 bath home at 700 Colorado Blvd, Denver, CO', 0, 1790164860000);
