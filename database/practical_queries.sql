-- =====================================================================
-- SMART DISASTER MANAGEMENT & EMERGENCY RESPONSE SYSTEM
-- PRACTICAL SQL DEMONSTRATIONS (COLLEGE DBMS SYLLABUS ALIGNED)
-- Database Name: DisasterManagement
-- Every query operates on the actual project tables.
-- =====================================================================

USE DisasterManagement;

-- =====================================================================
-- 1. DDL: CREATE DATABASE & CREATE TABLE (Demonstration)
-- =====================================================================
-- Demonstrating CREATE TABLE with constraints
DROP TABLE IF EXISTS AUDIT_LOG;
CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    LogID       INT AUTO_INCREMENT PRIMARY KEY,
    TableName   VARCHAR(50) NOT NULL,
    Operation   ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    RecordID    INT NOT NULL,
    ActionBy    VARCHAR(100),
    Timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    Details     TEXT
) ENGINE=InnoDB;

-- =====================================================================
-- 2. DDL: ALTER TABLE
-- =====================================================================
-- Adding a column to AUDIT_LOG
ALTER TABLE AUDIT_LOG ADD COLUMN IPAddress VARCHAR(45) NULL AFTER ActionBy;

-- Modifying column definition
ALTER TABLE AUDIT_LOG MODIFY COLUMN Details VARCHAR(500);

-- Demonstrating ADD CONSTRAINT
ALTER TABLE AUDIT_LOG ADD CONSTRAINT chk_record_id CHECK (RecordID >= 1);

-- Cleaning up demonstration table
DROP TABLE IF EXISTS AUDIT_LOG;

-- =====================================================================
-- 3. DML: INSERT, SELECT, UPDATE, DELETE
-- =====================================================================
-- INSERT: Add a new citizen report
INSERT INTO DISASTER (DisasterType, Severity, Description, Location, City, Latitude, Longitude, Status, ReportedByCitizenID)
VALUES ('Building Collapse', 'High', 'Old residential structure partially collapsed due to rain.', 'Fort Area, Near GPO', 'Mumbai', 18.938800, 72.835400, 'Reported', 1);

-- SELECT: Retrieve the newly created disaster
SELECT DisasterID, DisasterType, Severity, Location, City, Status, ReportedAt
FROM DISASTER
WHERE Location LIKE '%Fort Area%';

-- UPDATE: Verify and escalate disaster status
UPDATE DISASTER
SET Status = 'Verified', Severity = 'Critical'
WHERE Location = 'Fort Area, Near GPO' AND Status = 'Reported';

-- DELETE: Remove temporary test record
DELETE FROM DISASTER
WHERE Location = 'Fort Area, Near GPO';

-- =====================================================================
-- 4. FILTERING: WHERE, AND, OR, NOT
-- =====================================================================
-- Find high or critical disasters in Mumbai or Delhi that are NOT closed
SELECT DisasterID, DisasterType, City, Severity, Status
FROM DISASTER
WHERE (Severity = 'High' OR Severity = 'Critical')
  AND (City = 'Mumbai' OR City = 'Delhi')
  AND NOT (Status = 'Closed');

-- =====================================================================
-- 5. OPERATORS: LIKE, IN, BETWEEN, IS NULL
-- =====================================================================
-- LIKE: Search for flood-related disaster descriptions or types
SELECT DisasterID, DisasterType, Description
FROM DISASTER
WHERE DisasterType LIKE '%Flood%' OR Description LIKE '%water%';

-- IN: Filter emergency requests by high-priority categories
SELECT RequestID, RequestType, Priority, Location, Status
FROM EMERGENCY_REQUEST
WHERE Priority IN ('High', 'Critical');

-- BETWEEN: Filter shelters with capacity between 300 and 700 persons
SELECT ShelterID, ShelterName, City, Capacity, Occupancy
FROM SHELTER
WHERE Capacity BETWEEN 300 AND 700;

-- IS NULL / IS NOT NULL: Find emergency requests not yet assigned to any rescue team
SELECT RequestID, RequestType, Location, PeopleCount, Status
FROM EMERGENCY_REQUEST
WHERE RescueTeamID IS NULL;

-- Find donations that are tied to a specific disaster
SELECT DonationID, ResourceName, Quantity, Unit, DisasterID
FROM NGO_DONATION
WHERE DisasterID IS NOT NULL;

-- =====================================================================
-- 6. SORTING: ORDER BY (ASC / DESC)
-- =====================================================================
-- List emergency requests ordered by priority severity and request time
SELECT RequestID, RequestType, Priority, PeopleCount, RequestTime, Status
FROM EMERGENCY_REQUEST
ORDER BY 
    CASE Priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END ASC,
    RequestTime DESC;

-- =====================================================================
-- 7. AGGREGATE FUNCTIONS: COUNT, SUM, AVG, MIN, MAX
-- =====================================================================
SELECT 
    COUNT(*) AS TotalDonations,
    SUM(MonetaryValue) AS TotalAidValueINR,
    AVG(MonetaryValue) AS AverageDonationValueINR,
    MIN(MonetaryValue) AS SmallestDonationINR,
    MAX(MonetaryValue) AS LargestDonationINR
FROM NGO_DONATION;

-- Shelter occupancy aggregates
SELECT 
    COUNT(ShelterID) AS TotalShelters,
    SUM(Capacity) AS TotalOverallCapacity,
    SUM(Occupancy) AS TotalShelteredVictims,
    AVG(Occupancy) AS AvgOccupancyPerShelter
FROM SHELTER;

-- =====================================================================
-- 8. GROUP BY AND HAVING
-- =====================================================================
-- Count of disasters grouped by Severity having more than 0 reports
SELECT Severity, COUNT(*) AS DisasterCount
FROM DISASTER
GROUP BY Severity
HAVING COUNT(*) >= 1
ORDER BY DisasterCount DESC;

-- Group NGO donations by NGO with total aid value exceeding 150,000 INR
SELECT 
    N.NGOName, 
    COUNT(D.DonationID) AS DonationTransactions,
    SUM(D.MonetaryValue) AS TotalMonetaryValue
FROM NGO N
INNER JOIN NGO_DONATION D ON N.NGOID = D.NGOID
GROUP BY N.NGOID, N.NGOName
HAVING SUM(D.MonetaryValue) > 150000;

-- =====================================================================
-- 9. JOINS: INNER JOIN AND LEFT JOIN
-- =====================================================================
-- INNER JOIN: Disasters with the name and phone of the citizen who reported it
SELECT 
    D.DisasterID,
    D.DisasterType,
    D.Severity,
    D.City,
    U.Name AS ReportedByCitizen,
    U.Phone AS ContactPhone,
    D.ReportedAt
FROM DISASTER D
INNER JOIN CITIZEN C ON D.ReportedByCitizenID = C.CitizenID
INNER JOIN USER U ON C.UserID = U.UserID;

-- LEFT JOIN: Emergency requests with their assigned rescue team (including unassigned)
SELECT 
    ER.RequestID,
    ER.RequestType,
    ER.Priority,
    ER.Location,
    ER.Status AS RequestStatus,
    COALESCE(RT.TeamName, 'Unassigned / Pending Dispatch') AS AssignedTeam,
    COALESCE(RT.LeaderName, 'N/A') AS TeamLeader,
    COALESCE(RT.Phone, 'N/A') AS TeamContact
FROM EMERGENCY_REQUEST ER
LEFT JOIN RESCUE_TEAM RT ON ER.RescueTeamID = RT.RescueTeamID
ORDER BY ER.RequestID;

-- LEFT JOIN: Shelters and the Shelter Manager's user account details
SELECT 
    S.ShelterName,
    S.City,
    S.Capacity,
    S.Occupancy,
    (S.Capacity - S.Occupancy) AS AvailableBeds,
    U.Name AS ManagerName,
    U.Email AS ManagerEmail
FROM SHELTER S
LEFT JOIN SHELTER_MANAGER SM ON S.ManagerID = SM.ManagerID
LEFT JOIN USER U ON SM.UserID = U.UserID;

-- =====================================================================
-- 10. NESTED SUBQUERIES
-- =====================================================================
-- Subquery in WHERE: Find all citizens who have submitted at least one 'Critical' priority emergency request
SELECT UserID, Name, Email, Phone, City
FROM USER
WHERE UserID IN (
    SELECT C.UserID
    FROM CITIZEN C
    WHERE C.CitizenID IN (
        SELECT ER.CitizenID
        FROM EMERGENCY_REQUEST ER
        WHERE ER.Priority = 'Critical'
    )
);

-- Subquery with Aggregate comparison: Shelters whose occupancy is strictly higher than average
SELECT ShelterName, City, Capacity, Occupancy
FROM SHELTER
WHERE Occupancy > (
    SELECT AVG(Occupancy) 
    FROM SHELTER
);

-- Correlated Subquery: Disasters along with total victims rescued for that disaster
SELECT 
    D.DisasterID,
    D.DisasterType,
    D.City,
    D.Severity,
    (
        SELECT COUNT(*)
        FROM VICTIM V
        WHERE V.DisasterID = D.DisasterID AND V.RescueStatus = 'Rescued'
    ) AS RescuedVictimsCount
FROM DISASTER D;

-- =====================================================================
-- 11. DATABASE VIEW
-- =====================================================================
-- Create an analytical view for Disaster Incident Summary
DROP VIEW IF EXISTS vw_disaster_incident_overview;
CREATE VIEW vw_disaster_incident_overview AS
SELECT 
    D.DisasterID,
    D.DisasterType,
    D.Severity,
    D.City,
    D.Status AS DisasterStatus,
    D.ReportedAt,
    COUNT(DISTINCT ER.RequestID) AS TotalEmergencyRequests,
    SUM(CASE WHEN ER.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingRequests,
    COUNT(DISTINCT V.VictimID) AS TotalVictimsReported,
    SUM(CASE WHEN V.RescueStatus = 'Rescued' THEN 1 ELSE 0 END) AS TotalVictimsRescued
FROM DISASTER D
LEFT JOIN EMERGENCY_REQUEST ER ON D.DisasterID = ER.DisasterID
LEFT JOIN VICTIM V ON D.DisasterID = V.DisasterID
GROUP BY D.DisasterID, D.DisasterType, D.Severity, D.City, D.Status, D.ReportedAt;

-- Query the view
SELECT * FROM vw_disaster_incident_overview;

-- =====================================================================
-- 12. TRANSACTION MANAGEMENT: COMMIT AND ROLLBACK
-- =====================================================================
-- Example A: Successful Transaction with COMMIT
START TRANSACTION;

-- Insert a new emergency request
INSERT INTO EMERGENCY_REQUEST (RequestType, Priority, PeopleCount, Location, Description, CitizenID, DisasterID, Status)
VALUES ('Food', 'Medium', 10, 'Bandra Reclamation Colony', 'Requesting ration packets for flood evacuees', 1, 1, 'Pending');

-- Commit the changes to make them permanent
COMMIT;

-- Example B: Transaction with ROLLBACK on Error or Simulation
START TRANSACTION;

-- Attempt an update
UPDATE SHELTER
SET Occupancy = Occupancy + 50
WHERE ShelterID = 1;

-- Rollback the changes safely without altering state
ROLLBACK;

-- Verify occupancy was unchanged
SELECT ShelterID, ShelterName, Occupancy FROM SHELTER WHERE ShelterID = 1;

-- =====================================================================
-- 13. TRIGGER DEMONSTRATION & TESTING
-- =====================================================================

-- TEST 1: Validation Trigger Rejection (Expect Failure: PeopleCount < 1)
-- UNCOMMENT TO TEST ERROR:
-- INSERT INTO EMERGENCY_REQUEST (RequestType, Priority, PeopleCount, Location, CitizenID, DisasterID)
-- VALUES ('Medical', 'Critical', 0, 'Invalid Test Location', 1, 1);
-- Result: SQLSTATE '45000': Validation Error: PeopleCount must be at least 1.

-- TEST 2: Rescue Team Availability Automation
-- Check team 4 initial status (Expected: 'Available')
SELECT RescueTeamID, TeamName, Status FROM RESCUE_TEAM WHERE RescueTeamID = 4;

-- Assign Team 4 to a new Emergency Request (Trigger will auto-switch Team 4 to 'Busy')
INSERT INTO EMERGENCY_REQUEST (RequestID, RequestType, Priority, PeopleCount, Location, CitizenID, DisasterID, RescueTeamID, Status)
VALUES (99, 'Rescue', 'High', 2, 'Kashmere Gate Bank Point', 2, 2, 4, 'Assigned');

-- Verify Team 4 is now 'Busy'
SELECT RescueTeamID, TeamName, Status FROM RESCUE_TEAM WHERE RescueTeamID = 4;

-- Complete Request 99 (Trigger will auto-switch Team 4 back to 'Available' as no other active requests remain)
UPDATE EMERGENCY_REQUEST
SET Status = 'Completed'
WHERE RequestID = 99;

-- Verify Team 4 is now 'Available' again
SELECT RescueTeamID, TeamName, Status FROM RESCUE_TEAM WHERE RescueTeamID = 4;

-- Clean up test request
DELETE FROM EMERGENCY_REQUEST WHERE RequestID = 99;

-- =====================================================================
-- END OF PRACTICAL DEMONSTRATION SCRIPT
-- =====================================================================
