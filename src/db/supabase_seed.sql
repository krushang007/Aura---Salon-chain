-- Aura Salon Marketplace: Supabase Seed Data (Surat Pilot)
-- All UUIDs are valid RFC 4122 hexadecimal strings

-- 1. Tenants
INSERT INTO "tenants" ("id", "name", "slug")
VALUES ('11111111-1111-1111-1111-111111111111', 'Salon Bonanza Chain', 'bonanza')
ON CONFLICT ("id") DO NOTHING;

-- 2. Stores (Surat Branches)
INSERT INTO "stores" ("id", "tenant_id", "name", "city", "address", "timezone", "opening_time", "closing_time", "total_styling_chairs")
VALUES
  ('22222222-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Salon Bonanza - Althan Branch', 'Surat', 'Shop 104-106, High Street, VIP Road, Althan, Surat', 'Asia/Kolkata', '09:00:00', '21:00:00', 5),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Salon Bonanza - Adajan Branch', 'Surat', '201 Prime Square, Near LP Savani Circle, Adajan, Surat', 'Asia/Kolkata', '09:00:00', '21:00:00', 4),
  ('22222222-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Salon Bonanza - Vesu Luxury Lounge', 'Surat', 'Ground Floor, Signature Galleria, University Road, Vesu, Surat', 'Asia/Kolkata', '10:00:00', '22:00:00', 6)
ON CONFLICT ("id") DO NOTHING;

-- 3. Users (Tenant Admin, Customer, Stylists)
INSERT INTO "users" ("id", "tenant_id", "email", "password_hash", "full_name", "phone", "role", "is_active")
VALUES
  ('33333333-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin@salonbonanza.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Mehul Patel', '+91 98250 11223', 'TENANT_ADMIN', true),
  ('33333333-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'sarah@example.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Sarah Jenkins', '+91 98765 43210', 'CUSTOMER', true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'rahul@salonbonanza.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Rahul Mehta', '+91 98250 12345', 'STAFF', true),
  ('33333333-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'priya@salonbonanza.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Priya Desai', '+91 98250 22334', 'STAFF', true),
  ('33333333-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'abc@gmail.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Rahul Sharma', '+91 98250 33445', 'STAFF', true),
  ('33333333-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'arjun@salonbonanza.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Arjun Mehta', '+91 98250 88990', 'STAFF', true),
  ('33333333-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'vikram@salonbonanza.com', '8bb586616239bc7a61d15258e77a29633e9d8e57ee2fbbebbdff6be39cb5ca31.d41d8cd98f00b204e9800998ecf8427e', 'Vikram Singhania', '+91 98250 99001', 'STAFF', true)
ON CONFLICT ("id") DO NOTHING;

-- 4. Staff Profiles
INSERT INTO "staff_profiles" ("id", "user_id", "tenant_id", "current_store_id", "title", "is_active")
VALUES
  ('44444444-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Master Stylist & Color Specialist', true),
  ('44444444-4444-4444-4444-444444444444', '33333333-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Senior Stylist & Texture Expert', true),
  ('44444444-5555-5555-5555-555555555555', '33333333-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Senior Stylist', true),
  ('44444444-6666-6666-6666-666666666666', '33333333-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Master Barber & Stylist', true),
  ('44444444-7777-7777-7777-777777777777', '33333333-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '22222222-3333-3333-3333-333333333333', 'Creative Director', true)
ON CONFLICT ("id") DO NOTHING;

-- 5. Services
INSERT INTO "services" ("id", "tenant_id", "store_id", "title", "description", "duration_minutes", "buffer_minutes", "price", "is_active")
VALUES
  ('55555555-1111-1111-1111-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Signature Precision Haircut', 'Consultation, scalp massage, bespoke cut and styling', 45, 5, 850.0, true),
  ('55555555-1111-1111-1111-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Balayage & Bespoke Glaze', 'Hand-painted dimensional highlights, toner glaze and luxury blowout', 120, 10, 4500.0, true),
  ('55555555-1111-1111-1111-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Beard Sculpting & Hot Towel Shave', 'Beard shaping, razor line-up, organic oil treatment', 30, 5, 450.0, true),
  ('55555555-1111-1111-1111-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Keratin Silk Infusion', 'Formaldehyde-free smoothing treatment for frizz control', 90, 10, 3800.0, true),
  ('55555555-1111-1111-1111-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Express Blowout & Style', 'Invigorating wash and blowout styling', 35, 5, 600.0, true),
  ('55555555-2222-2222-2222-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Signature Precision Haircut', 'Consultation, scalp massage, bespoke cut and styling', 45, 5, 850.0, true),
  ('55555555-2222-2222-2222-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Balayage & Bespoke Glaze', 'Hand-painted dimensional highlights, toner glaze and luxury blowout', 120, 10, 4500.0, true),
  ('55555555-3333-3333-3333-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-3333-3333-3333-333333333333', 'Signature Precision Haircut', 'Consultation, scalp massage, bespoke cut and styling', 45, 5, 850.0, true)
ON CONFLICT ("id") DO NOTHING;

-- 6. Staff Shifts (Monday = 1 through Sunday = 0 or 7, days 0 to 6)
INSERT INTO "staff_shifts" ("id", "staff_id", "store_id", "day_of_week", "shift_start", "shift_end", "is_working_day")
SELECT 
  gen_random_uuid(),
  s.id,
  s.current_store_id,
  d.day_num,
  '09:00:00'::time,
  '21:00:00'::time,
  true
FROM "staff_profiles" s
CROSS JOIN (SELECT generate_series(0, 6) AS day_num) d
ON CONFLICT DO NOTHING;

-- 7. Appointment (Demo booking for tomorrow)
INSERT INTO "appointments" ("id", "tenant_id", "store_id", "staff_id", "customer_id", "booked_by_user_id", "service_id", "slot_range", "assigned_chair", "status", "customer_notes")
VALUES (
  '66666666-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '22222222-1111-1111-1111-111111111111',
  '44444444-3333-3333-3333-333333333333',
  '33333333-2222-2222-2222-222222222222',
  '33333333-2222-2222-2222-222222222222',
  '55555555-1111-1111-1111-000000000001',
  tstzrange(NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 50 minutes', '[)'),
  3,
  'CONFIRMED',
  'Please keep scissor texture on top, low taper fade on sides.'
)
ON CONFLICT ("id") DO NOTHING;
