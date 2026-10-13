-- =====================================================================
-- SMART DISASTER MANAGEMENT & EMERGENCY RESPONSE SYSTEM
-- MySQL 8 Database Triggers
-- Database Name: DisasterManagement
-- =====================================================================

USE DisasterManagement;

DELIMITER $$

-- =====================================================================
-- Trigger 1: Emergency Request Validation
-- Fires BEFORE INSERT on EMERGENCY_REQUEST
-- Validates PeopleCount, Priority, RequestType, and Location.
-- Rejects invalid operations with SIGNAL SQLSTATE '45000'.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_validate_emergency_request_insert$$
CREATE TRIGGER trg_validate_emergency_request_insert
BEFORE INSERT ON EMERGENCY_REQUEST
FOR EACH ROW
BEGIN
    -- Validate PeopleCount
    IF NEW.PeopleCount IS NULL OR NEW.PeopleCount < 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: PeopleCount must be at least 1.';
    END IF;

    -- Validate RequestType
    IF NEW.RequestType NOT IN ('Medical', 'Rescue', 'Food', 'Water', 'Transport', 'Shelter', 'Other') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Invalid RequestType provided.';
    END IF;

    -- Validate Priority
    IF NEW.Priority NOT IN ('Low', 'Medium', 'High', 'Critical') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Invalid Priority level provided.';
    END IF;

    -- Validate Location
    IF NEW.Location IS NULL OR TRIM(NEW.Location) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Location cannot be empty.';
    END IF;
END$$

-- Also validate on UPDATE to guarantee data integrity across edits
DROP TRIGGER IF EXISTS trg_validate_emergency_request_update$$
CREATE TRIGGER trg_validate_emergency_request_update
BEFORE UPDATE ON EMERGENCY_REQUEST
FOR EACH ROW
BEGIN
    IF NEW.PeopleCount IS NULL OR NEW.PeopleCount < 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: PeopleCount must be at least 1.';
    END IF;

    IF NEW.RequestType NOT IN ('Medical', 'Rescue', 'Food', 'Water', 'Transport', 'Shelter', 'Other') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Invalid RequestType provided.';
    END IF;

    IF NEW.Priority NOT IN ('Low', 'Medium', 'High', 'Critical') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Invalid Priority level provided.';
    END IF;

    IF NEW.Location IS NULL OR TRIM(NEW.Location) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Validation Error: Location cannot be empty.';
    END IF;
END$$

-- =====================================================================
-- Trigger 2: Rescue Team Availability (INSERT)
-- When a request is created with an assigned team and active status,
-- mark that rescue team as 'Busy'.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_rescue_team_assigned_insert$$
CREATE TRIGGER trg_rescue_team_assigned_insert
AFTER INSERT ON EMERGENCY_REQUEST
FOR EACH ROW
BEGIN
    IF NEW.RescueTeamID IS NOT NULL AND NEW.Status IN ('Pending', 'Assigned', 'In Progress') THEN
        UPDATE RESCUE_TEAM
        SET Status = 'Busy'
        WHERE RescueTeamID = NEW.RescueTeamID;
    END IF;
END$$

-- =====================================================================
-- Trigger 3: Rescue Team Availability (UPDATE)
-- Handles assignment, reassignment, completion, and cancellation:
-- 1. Marks new team as 'Busy' if assigned an active request.
-- 2. If reassigned away from old team, marks old team 'Available' ONLY if no other active requests remain.
-- 3. If request is completed/cancelled, marks team 'Available' ONLY if no other active requests remain.
-- 4. If request is re-opened, marks team 'Busy'.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_rescue_team_status_update$$
CREATE TRIGGER trg_rescue_team_status_update
AFTER UPDATE ON EMERGENCY_REQUEST
FOR EACH ROW
BEGIN
    DECLARE old_team_active_count INT DEFAULT 0;
    DECLARE current_team_active_count INT DEFAULT 0;

    -- CASE 1: Reassigned to a different team
    IF (OLD.RescueTeamID IS NOT NULL AND NEW.RescueTeamID IS NOT NULL AND OLD.RescueTeamID <> NEW.RescueTeamID)
       OR (OLD.RescueTeamID IS NOT NULL AND NEW.RescueTeamID IS NULL) THEN
        -- Check if OLD team has any other active requests
        SELECT COUNT(*) INTO old_team_active_count
        FROM EMERGENCY_REQUEST
        WHERE RescueTeamID = OLD.RescueTeamID
          AND RequestID <> NEW.RequestID
          AND Status IN ('Pending', 'Assigned', 'In Progress');

        IF old_team_active_count = 0 THEN
            UPDATE RESCUE_TEAM
            SET Status = 'Available'
            WHERE RescueTeamID = OLD.RescueTeamID;
        END IF;
    END IF;

    -- If newly assigned or reassigned to a team with active status
    IF NEW.RescueTeamID IS NOT NULL AND (OLD.RescueTeamID IS NULL OR OLD.RescueTeamID <> NEW.RescueTeamID) THEN
        IF NEW.Status IN ('Pending', 'Assigned', 'In Progress') THEN
            UPDATE RESCUE_TEAM
            SET Status = 'Busy'
            WHERE RescueTeamID = NEW.RescueTeamID;
        END IF;
    END IF;

    -- CASE 2: Status changed to Completed or Cancelled
    IF NEW.RescueTeamID IS NOT NULL 
       AND NEW.Status IN ('Completed', 'Cancelled')
       AND OLD.Status NOT IN ('Completed', 'Cancelled') THEN
        -- Check if team still has any other active requests
        SELECT COUNT(*) INTO current_team_active_count
        FROM EMERGENCY_REQUEST
        WHERE RescueTeamID = NEW.RescueTeamID
          AND RequestID <> NEW.RequestID
          AND Status IN ('Pending', 'Assigned', 'In Progress');

        IF current_team_active_count = 0 THEN
            UPDATE RESCUE_TEAM
            SET Status = 'Available'
            WHERE RescueTeamID = NEW.RescueTeamID;
        END IF;
    END IF;

    -- CASE 3: Status reopened to an active state from Completed/Cancelled
    IF NEW.RescueTeamID IS NOT NULL
       AND NEW.Status IN ('Pending', 'Assigned', 'In Progress')
       AND OLD.Status IN ('Completed', 'Cancelled') THEN
        UPDATE RESCUE_TEAM
        SET Status = 'Busy'
        WHERE RescueTeamID = NEW.RescueTeamID;
    END IF;
END$$

DELIMITER ;
