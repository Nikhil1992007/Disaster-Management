-- =====================================================================
-- SMART DISASTER MANAGEMENT & EMERGENCY RESPONSE SYSTEM
-- Complete 11-Table Schema for MySQL 8
-- Database Name: DisasterManagement
-- =====================================================================

DROP DATABASE IF EXISTS DisasterManagement;
CREATE DATABASE DisasterManagement CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE DisasterManagement;

-- =====================================================================
-- 1. USER
-- Superclass entity for authentication and common profile attributes
-- =====================================================================
CREATE TABLE USER (
    UserID       INT AUTO_INCREMENT PRIMARY KEY,
    Name         VARCHAR(100) NOT NULL,
    Email        VARCHAR(100) NOT NULL UNIQUE,
    Phone        VARCHAR(20)  NOT NULL,
    Password     VARCHAR(255) NOT NULL,
    UserType     ENUM('Citizen', 'Volunteer', 'NGO', 'ShelterManager', 'Admin') NOT NULL DEFAULT 'Citizen',
    Address      VARCHAR(255),
    City         VARCHAR(100),
    Status       ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
    CreatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 2. CITIZEN
-- One-to-one subtype of USER
-- =====================================================================
CREATE TABLE CITIZEN (
    CitizenID        INT AUTO_INCREMENT PRIMARY KEY,
    UserID           INT NOT NULL UNIQUE,
    EmergencyContact VARCHAR(20),
    CONSTRAINT fk_citizen_user
        FOREIGN KEY (UserID) REFERENCES USER(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3. SHELTER_MANAGER
-- One-to-one subtype of USER
-- =====================================================================
CREATE TABLE SHELTER_MANAGER (
    ManagerID        INT AUTO_INCREMENT PRIMARY KEY,
    UserID           INT NOT NULL UNIQUE,
    Qualification    VARCHAR(100),
    ManagedSince     DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_manager_user
        FOREIGN KEY (UserID) REFERENCES USER(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. SHELTER
-- Shelter managed by SHELTER_MANAGER (one-to-many relationship)
-- =====================================================================
CREATE TABLE SHELTER (
    ShelterID        INT AUTO_INCREMENT PRIMARY KEY,
    ShelterName      VARCHAR(150) NOT NULL,
    Location         VARCHAR(255) NOT NULL,
    City             VARCHAR(100) NOT NULL,
    Capacity         INT NOT NULL CHECK (Capacity >= 0),
    Occupancy        INT NOT NULL DEFAULT 0 CHECK (Occupancy >= 0),
    Facilities       VARCHAR(255),
    FoodStock        INT NOT NULL DEFAULT 0 CHECK (FoodStock >= 0),
    WaterStock       INT NOT NULL DEFAULT 0 CHECK (WaterStock >= 0),
    MedicineStock    INT NOT NULL DEFAULT 0 CHECK (MedicineStock >= 0),
    BlanketStock     INT NOT NULL DEFAULT 0 CHECK (BlanketStock >= 0),
    Contact          VARCHAR(20),
    Status           ENUM('Open', 'Full', 'Closed') NOT NULL DEFAULT 'Open',
    ManagerID        INT NULL,
    CONSTRAINT fk_shelter_manager
        FOREIGN KEY (ManagerID) REFERENCES SHELTER_MANAGER(ManagerID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 5. DISASTER
-- Reported by a CITIZEN (one-to-many relationship)
-- =====================================================================
CREATE TABLE DISASTER (
    DisasterID          INT AUTO_INCREMENT PRIMARY KEY,
    DisasterType        VARCHAR(100) NOT NULL,
    Severity            ENUM('Low', 'Moderate', 'High', 'Critical') NOT NULL,
    Description         TEXT,
    Location            VARCHAR(255) NOT NULL,
    City                VARCHAR(100) NOT NULL,
    Latitude            DECIMAL(9,6),
    Longitude           DECIMAL(9,6),
    ReportedAt          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status              ENUM('Reported', 'Verified', 'Ongoing', 'Resolved', 'Closed') NOT NULL DEFAULT 'Reported',
    ReportedByCitizenID INT NOT NULL,
    CONSTRAINT fk_disaster_citizen
        FOREIGN KEY (ReportedByCitizenID) REFERENCES CITIZEN(CitizenID)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 6. RESCUE_TEAM
-- Standalone team dispatched for emergency requests
-- =====================================================================
CREATE TABLE RESCUE_TEAM (
    RescueTeamID    INT AUTO_INCREMENT PRIMARY KEY,
    TeamName        VARCHAR(150) NOT NULL,
    LeaderName      VARCHAR(100) NOT NULL,
    Phone           VARCHAR(20)  NOT NULL,
    Specialization  VARCHAR(150) NOT NULL,
    MembersCount    INT NOT NULL DEFAULT 1 CHECK (MembersCount >= 1),
    Equipment       VARCHAR(255),
    CurrentLocation VARCHAR(255),
    Status          ENUM('Available', 'Busy', 'Off Duty') NOT NULL DEFAULT 'Available'
) ENGINE=InnoDB;

-- =====================================================================
-- 7. VOLUNTEER
-- One-to-one subtype of USER; assigned to 0 or 1 DISASTER
-- =====================================================================
CREATE TABLE VOLUNTEER (
    VolunteerID        INT AUTO_INCREMENT PRIMARY KEY,
    UserID             INT NOT NULL UNIQUE,
    Skills             VARCHAR(255),
    Availability       ENUM('Available', 'Unavailable') NOT NULL DEFAULT 'Available',
    CurrentDisasterID  INT NULL,
    AssignedLocation   VARCHAR(255),
    Status             ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_volunteer_user
        FOREIGN KEY (UserID) REFERENCES USER(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_volunteer_disaster
        FOREIGN KEY (CurrentDisasterID) REFERENCES DISASTER(DisasterID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. NGO
-- One-to-one subtype of USER
-- =====================================================================
CREATE TABLE NGO (
    NGOID           INT AUTO_INCREMENT PRIMARY KEY,
    UserID          INT NOT NULL UNIQUE,
    NGOName         VARCHAR(150) NOT NULL,
    ContactPerson   VARCHAR(100) NOT NULL,
    Phone           VARCHAR(20)  NOT NULL,
    Email           VARCHAR(100) NOT NULL,
    Address         VARCHAR(255),
    Specialization  VARCHAR(150),
    CONSTRAINT fk_ngo_user
        FOREIGN KEY (UserID) REFERENCES USER(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 9. VICTIM
-- Connected to DISASTER, SHELTER (optional), and RESCUE_TEAM (optional)
-- =====================================================================
CREATE TABLE VICTIM (
    VictimID       INT AUTO_INCREMENT PRIMARY KEY,
    Name           VARCHAR(100) NOT NULL,
    Age            INT CHECK (Age >= 0 AND Age <= 130),
    Gender         ENUM('Male', 'Female', 'Other') NOT NULL,
    `Condition`    ENUM('Safe', 'Injured', 'Critical', 'Missing') NOT NULL DEFAULT 'Safe',
    MedicalNeeds   VARCHAR(255),
    RescueStatus   ENUM('Pending', 'Rescued', 'Missing') NOT NULL DEFAULT 'Pending',
    ShelterID      INT NULL,
    DisasterID     INT NOT NULL,
    RescueTeamID   INT NULL,
    RegisteredAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_victim_shelter
        FOREIGN KEY (ShelterID) REFERENCES SHELTER(ShelterID)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_victim_disaster
        FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_victim_rescueteam
        FOREIGN KEY (RescueTeamID) REFERENCES RESCUE_TEAM(RescueTeamID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 10. EMERGENCY_REQUEST
-- Submitted by CITIZEN, tied to DISASTER, optional RESCUE_TEAM assignment
-- =====================================================================
CREATE TABLE EMERGENCY_REQUEST (
    RequestID     INT AUTO_INCREMENT PRIMARY KEY,
    RequestType   ENUM('Medical', 'Rescue', 'Food', 'Water', 'Transport', 'Shelter', 'Other') NOT NULL,
    Priority      ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    PeopleCount   INT NOT NULL DEFAULT 1 CHECK (PeopleCount >= 1),
    Location      VARCHAR(255) NOT NULL,
    Description   TEXT,
    CitizenID     INT NOT NULL,
    DisasterID    INT NOT NULL,
    RescueTeamID  INT NULL,
    RequestTime   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status        ENUM('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    CONSTRAINT fk_request_citizen
        FOREIGN KEY (CitizenID) REFERENCES CITIZEN(CitizenID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_request_disaster
        FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_request_rescueteam
        FOREIGN KEY (RescueTeamID) REFERENCES RESCUE_TEAM(RescueTeamID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 11. NGO_DONATION
-- Contributed by NGO, optionally associated with a specific DISASTER
-- =====================================================================
CREATE TABLE NGO_DONATION (
    DonationID     INT AUTO_INCREMENT PRIMARY KEY,
    DonationType   ENUM('Money', 'Food', 'Water', 'Medicine', 'Clothes', 'Equipment', 'Other') NOT NULL,
    ResourceName   VARCHAR(150) NOT NULL,
    Quantity       DECIMAL(10,2) NOT NULL CHECK (Quantity > 0),
    Unit           VARCHAR(50)  NOT NULL,
    MonetaryValue  DECIMAL(12,2) DEFAULT 0.00 CHECK (MonetaryValue >= 0),
    NGOID          INT NOT NULL,
    DisasterID     INT NULL,
    DonationDate   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Purpose        VARCHAR(255),
    CONSTRAINT fk_donation_ngo
        FOREIGN KEY (NGOID) REFERENCES NGO(NGOID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donation_disaster
        FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
