-- Insert missing venues that are referenced in events but don't exist in venues table
INSERT INTO venues (name, status, city, state) VALUES
('Barrel Room', 'approved', 'Portland', 'Oregon'),
('Hostel Cafe', 'approved', 'Portland', 'Oregon'), 
('Laurelthirst Public House', 'approved', 'Portland', 'Oregon'),
('Rae Loft', 'approved', 'Portland', 'Oregon');