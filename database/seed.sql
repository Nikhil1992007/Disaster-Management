-- =====================================================================
-- SMART DISASTER MANAGEMENT & EMERGENCY RESPONSE SYSTEM
-- Realistic Sample Records for All 11 Tables
-- Database Name: DisasterManagement
-- Default password for all users: "password123"
-- Default password for admin user: "admin123"
-- =====================================================================

USE DisasterManagement;

-- Disable foreign key checks momentarily for clean reload if needed
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE NGO_DONATION;
TRUNCATE TABLE EMERGENCY_REQUEST;
TRUNCATE TABLE VICTIM;
TRUNCATE TABLE VOLUNTEER;
TRUNCATE TABLE NGO;
TRUNCATE TABLE SHELTER;
TRUNCATE TABLE SHELTER_MANAGER;
TRUNCATE TABLE DISASTER;
TRUNCATE TABLE RESCUE_TEAM;
TRUNCATE TABLE CITIZEN;
TRUNCATE TABLE USER;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. USER
-- Passwords:
-- admin@disaster.gov: 'admin123' -> scrypt:32768:8:1$HbvSAvH02gu3rhzy$9c7d1163005a5401307d334bb1702ba43d430a384b75c580a78aa022524b90b393a5c539cdfbb510972ecae0daca920c4ba56ed2d49004d575c50eaac3abfd3d
-- all others: 'password123'      -> scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd
-- =====================================================================
INSERT INTO USER (UserID, Name, Email, Phone, Password, UserType, Address, City, Status, CreatedAt) VALUES
(1, 'Admin Controller', 'admin@disaster.gov', '+91-9876543210', 'scrypt:32768:8:1$HbvSAvH02gu3rhzy$9c7d1163005a5401307d334bb1702ba43d430a384b75c580a78aa022524b90b393a5c539cdfbb510972ecae0daca920c4ba56ed2d49004d575c50eaac3abfd3d', 'Admin', 'Central Disaster Management HQ', 'New Delhi', 'Active', '2026-01-01 08:00:00'),
(2, 'Rahul Sharma', 'rahul.sharma@example.com', '+91-9811122233', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'Citizen', 'Flat 402, Sea Green Apts, Bandra West', 'Mumbai', 'Active', '2026-02-10 10:15:00'),
(3, 'Priya Patel', 'priya.patel@example.com', '+91-9822233344', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'Citizen', '12 Lake View Road, Civil Lines', 'Delhi', 'Active', '2026-02-12 11:30:00'),
(4, 'Amit Kumar', 'amit.kumar@example.com', '+91-9833344455', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'Citizen', '74 Marina Coastal Road, Mylapore', 'Chennai', 'Active', '2026-02-15 09:00:00'),
(5, 'Sneha Deshmukh', 'sneha.deshmukh@example.com', '+91-9844455566', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'Citizen', '33 Valley Enclave, Rajpur Road', 'Dehradun', 'Active', '2026-02-18 14:20:00'),
(6, 'Vikram Singh', 'vikram.singh@volunteer.org', '+91-9855566677', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'Volunteer', 'Sector 15, Vashi', 'Navi Mumbai', 'Active', '2026-02-01 10:00:00'),
(7, 'Ananya Roy', 'ananya.roy@volunteer.org', '+91-9866677788', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'Volunteer', 'Pocket B, Mayur Vihar', 'Delhi', 'Active', '2026-02-02 11:00:00'),
(8, 'Red Cross Society', 'contact@redcross-response.org', '+91-11-23716441', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'NGO', '1 Red Cross Road', 'New Delhi', 'Active', '2026-01-15 09:30:00'),
(9, 'Care India Foundation', 'relief@careindia.org', '+91-120-4048200', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'NGO', 'Plot 48, Sector 44', 'Gurugram', 'Active', '2026-01-20 10:45:00'),
(10, 'Rajesh Verma', 'rajesh.verma@shelter.gov', '+91-9877788899', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'ShelterManager', 'Community Center, Rohini', 'Delhi', 'Active', '2026-01-10 08:30:00'),
(11, 'Sunita Nair', 'sunita.nair@shelter.gov', '+91-9888899900', 'scrypt:32768:8:1$RjAZE0aY6GTlcrXs$84fcca8d291aa81f86c5fb07711d827a1ebb4d1f2e6b04d92e6d4e91c67822ba424c3ee3bc9108ae1d365230f0e8315178186ab1f408e7d82ed9d29de17043fd', 'ShelterManager', 'Andheri Sports Complex', 'Mumbai', 'Active', '2026-01-12 09:15:00');

-- =====================================================================
-- 2. CITIZEN
-- =====================================================================
INSERT INTO CITIZEN (CitizenID, UserID, EmergencyContact) VALUES
(1, 2, '+91-9811199999'),
(2, 3, '+91-9822288888'),
(3, 4, '+91-9833377777'),
(4, 5, '+91-9844466666');

-- =====================================================================
-- 3. SHELTER_MANAGER
-- =====================================================================
INSERT INTO SHELTER_MANAGER (ManagerID, UserID, Qualification, ManagedSince) VALUES
(1, 10, 'Certified Disaster Logistics Officer', '2025-06-01'),
(2, 11, 'Senior Public Health Administrator', '2025-08-15');

-- =====================================================================
-- 4. SHELTER
-- =====================================================================
INSERT INTO SHELTER (ShelterID, ShelterName, Location, City, Capacity, Occupancy, Facilities, FoodStock, WaterStock, MedicineStock, BlanketStock, Contact, Status, ManagerID) VALUES
(1, 'Rohini Community Relief Shelter', 'Sector 11 Community Center', 'Delhi', 500, 120, 'Medical Desk, Clean Water, Dining Hall, Beds', 450, 1200, 180, 500, '+91-11-27551000', 'Open', 1),
(2, 'Andheri Sports Complex Relief Camp', 'Veera Desai Road, Andheri West', 'Mumbai', 800, 340, 'Mass Kitchen, Emergency First Aid, Power Backup', 900, 2500, 320, 850, '+91-22-26732000', 'Open', 2),
(3, 'Mylapore Community Center Shelter', 'Kutchery Road, Mylapore', 'Chennai', 350, 90, 'Rest Area, Childcare, Drinking Water', 300, 800, 110, 350, '+91-44-24643000', 'Open', 1),
(4, 'Dehradun Foothills Relief Center', 'Sahastradhara Road', 'Dehradun', 400, 0, 'Heated Dormitories, Ration Depot', 500, 1500, 200, 450, '+91-135-2604000', 'Open', 2);

-- =====================================================================
-- 5. DISASTER
-- =====================================================================
INSERT INTO DISASTER (DisasterID, DisasterType, Severity, Description, Location, City, Latitude, Longitude, ReportedAt, Status, ReportedByCitizenID) VALUES
(1, 'Urban Flood', 'Critical', 'Severe waterlogging exceeding 5 feet following 240mm torrential downpour. Ground floors submerged.', 'Kurla and Chunabhatti Lowlands', 'Mumbai', 19.065700, 72.879400, '2026-03-01 06:30:00', 'Ongoing', 1),
(2, 'Riverine Flood', 'High', 'Yamuna water level crossed danger mark of 205.33 meters. Floodplains inundated.', 'Yamuna Khadar, Old Railway Bridge', 'Delhi', 28.656200, 77.241000, '2026-03-02 08:45:00', 'Verified', 2),
(3, 'Cyclone Storm Surge', 'High', 'Cyclonic coastal winds touching 95 km/h with heavy tidal surges affecting fishing settlements.', 'Marina Beach Coastal Belt', 'Chennai', 13.047500, 80.282400, '2026-03-03 14:15:00', 'Ongoing', 3),
(4, 'Flash Landslide', 'Moderate', 'Hill slope failure blocking arterial highway connecting to hill towns; 2 vehicles stuck.', 'Mussoorie Bypass Highway KM 18', 'Dehradun', 30.387200, 78.076600, '2026-03-04 11:20:00', 'Reported', 4),
(5, 'Industrial Chemical Smoke', 'Low', 'Subsided electrical transformer fire near chemical warehouse, controlled quickly.', 'MIDC Industrial Estate, Kurla', 'Mumbai', 19.072800, 72.882600, '2026-02-25 15:00:00', 'Resolved', 1);

-- =====================================================================
-- 6. RESCUE_TEAM
-- =====================================================================
INSERT INTO RESCUE_TEAM (RescueTeamID, TeamName, LeaderName, Phone, Specialization, MembersCount, Equipment, CurrentLocation, Status) VALUES
(1, 'NDRF Alpha Rapid Flood Unit', 'Capt. Vikram Rathore', '+91-9411100001', 'Flood Inundation & Swift Water Rescue', 12, 'Inflatable Gemini Boats, Lifejackets, OBM Engines', 'Kurla West Junction', 'Available'),
(2, 'NDRF Bravo Trauma Medical Unit', 'Dr. Alok Verma', '+91-9411100002', 'Emergency Triage & Paramedic Evacuation', 8, 'Mobile Ambulances, Defibrillators, Oxygen Concentrators', 'BKC Medical Base', 'Available'),
(3, 'SDRF Urban Collapse Squad', 'Insp. Manoj Kulkarni', '+91-9411100003', 'Confined Space & Structural Debris Rescue', 15, 'Acoustic Sensors, Hydraulic Cutters, Drones', 'Dadar Fire Station', 'Available'),
(4, 'Delhi Fire & River Rescue Echo', 'Officer Rajesh Tanwar', '+91-9411100004', 'River Evacuation & High-line Rope Rescue', 10, 'Jet Skis, Diving Gear, Search Floodlights', 'Kashmere Gate Boat Club', 'Available'),
(5, 'Coastal Guard Marine Lifesaver', 'Lt. Commander K. Selvam', '+91-9411100005', 'High-sea Rescue & Storm Surge Response', 14, 'Rigid Hull Boats, Helo Winches, Thermal Cameras', 'Chennai Port Anchorage', 'Available');

-- =====================================================================
-- 7. VOLUNTEER
-- =====================================================================
INSERT INTO VOLUNTEER (VolunteerID, UserID, Skills, Availability, CurrentDisasterID, AssignedLocation, Status) VALUES
(1, 6, 'First Aid, Heavy Vehicle Driving, Swimming', 'Available', 1, 'Kurla Relief Staging Area', 'Active'),
(2, 7, 'Food Logistics, Psychological First Aid, Hindi/English Translation', 'Available', 2, 'Mayur Vihar Relief Camp', 'Active');

-- =====================================================================
-- 8. NGO
-- =====================================================================
INSERT INTO NGO (NGOID, UserID, NGOName, ContactPerson, Phone, Email, Address, Specialization) VALUES
(1, 8, 'Indian Red Cross Society', 'Dr. V. K. Malhotra', '+91-11-23716441', 'contact@redcross-response.org', '1 Red Cross Road, New Delhi', 'Disaster Medicine, Blood Bank, Emergency Relief Packs'),
(2, 9, 'Care India Humanitarian Mission', 'Meenakshi Sundaram', '+91-120-4048200', 'relief@careindia.org', 'Sector 44, Gurugram', 'Shelter Reconstruction, Hygiene Kits, Food Security');

-- =====================================================================
-- 9. VICTIM
-- =====================================================================
INSERT INTO VICTIM (VictimID, Name, Age, Gender, `Condition`, MedicalNeeds, RescueStatus, ShelterID, DisasterID, RescueTeamID, RegisteredAt) VALUES
(1, 'Ramesh Rao', 45, 'Male', 'Injured', 'Fractured left arm requiring plaster', 'Rescued', 2, 1, 1, '2026-03-01 10:30:00'),
(2, 'Meena Rao', 42, 'Female', 'Safe', 'General dehydration and fatigue', 'Rescued', 2, 1, 1, '2026-03-01 10:30:00'),
(3, 'Rohan Rao', 12, 'Male', 'Critical', 'Asthma exacerbation under water contact', 'Rescued', 2, 1, 2, '2026-03-01 11:15:00'),
(4, 'Sunita Devi', 68, 'Female', 'Injured', 'Hypertension and foot laceration', 'Rescued', 1, 2, 4, '2026-03-02 12:00:00'),
(5, 'Arvind Joshi', 34, 'Male', 'Safe', 'None', 'Pending', NULL, 2, NULL, '2026-03-02 13:00:00'),
(6, 'Deepa Das', 28, 'Female', 'Missing', 'Unknown - last seen near shoreline', 'Missing', NULL, 3, NULL, '2026-03-03 16:30:00');

-- =====================================================================
-- 10. EMERGENCY_REQUEST
-- Note: Insertion triggers will update assigned Rescue Teams to 'Busy'!
-- =====================================================================
INSERT INTO EMERGENCY_REQUEST (RequestID, RequestType, Priority, PeopleCount, Location, Description, CitizenID, DisasterID, RescueTeamID, RequestTime, Status) VALUES
(1, 'Medical', 'Critical', 3, 'Bldg 4, Near Kurla Railway Station West', 'Family stranded on first floor with elderly heart patient needing immediate oxygen supply.', 1, 1, 1, '2026-03-01 07:15:00', 'In Progress'),
(2, 'Rescue', 'High', 6, 'LBS Marg Near Phoenix Mall Gate 2', 'Two families trapped on building roof due to rapid water level rise; current is strong.', 1, 1, 3, '2026-03-01 08:30:00', 'Assigned'),
(3, 'Food', 'Medium', 15, 'Yamuna Khadar Tent Colony Cluster 4', 'Ration stocks submerged; clean drinking water and baby food urgently required for children.', 2, 2, NULL, '2026-03-02 09:20:00', 'Pending'),
(4, 'Medical', 'High', 2, 'Old Railway Bridge Camp, Bank 2', 'High fever and hypothermia reported in children sheltered in temporary canvas tents.', 2, 2, NULL, '2026-03-02 10:05:00', 'Pending'),
(5, 'Rescue', 'Critical', 4, 'Marina Lighthouse Shoreline Hamlet', 'Small fishing skiff overturned near breakers; 4 fishermen holding onto floating marker.', 3, 3, 5, '2026-03-03 15:00:00', 'In Progress');

-- =====================================================================
-- 11. NGO_DONATION
-- =====================================================================
INSERT INTO NGO_DONATION (DonationID, DonationType, ResourceName, Quantity, Unit, MonetaryValue, NGOID, DisasterID, DonationDate, Purpose) VALUES
(1, 'Water', 'Purified Mineral Water Crates (24x1L)', 5000.00, 'Bottles', 100000.00, 1, 1, '2026-03-01 12:00:00', 'Immediate hydration relief for flooded Kurla households'),
(2, 'Medicine', 'Emergency Trauma & First Aid Triage Kits', 350.00, 'Kits', 175000.00, 1, 1, '2026-03-01 13:30:00', 'Supplied to mobile ambulance team in Mumbai'),
(3, 'Food', 'Nutritional Dry Food and Biscuit Ration Packs', 2500.00, 'Packs', 125000.00, 2, 2, '2026-03-02 14:00:00', 'Distributed among Yamuna floodplain evacuees'),
(4, 'Clothes', 'Warm Thermal Blankets & Rain Ponchos', 1200.00, 'Units', 240000.00, 2, 2, '2026-03-02 15:30:00', 'Bedding support for Rohini Community Relief Shelter'),
(5, 'Money', 'Direct Disaster Relief Grant Fund', 500000.00, 'INR', 500000.00, 2, NULL, '2026-03-04 10:00:00', 'Unallocated emergency fund for ongoing national relief mobilization');
