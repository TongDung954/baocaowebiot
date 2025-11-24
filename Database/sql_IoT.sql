/* =====================================================================
   1️⃣ TẠO DATABASE (NẾU CHƯA CÓ)
===================================================================== */
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IoTMonitoring')
BEGIN
    CREATE DATABASE IoTMonitoring;
END;
GO

USE IoTMonitoring;
GO


/* =====================================================================
   2️⃣ BẢNG Devices – QUẢN LÝ THIẾT BỊ
===================================================================== */
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name='Devices' AND type='U')
BEGIN
    CREATE TABLE Devices (
        DeviceID INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Status BIT NOT NULL DEFAULT 1,         -- 1 = Online, 0 = Offline
        Temperature FLOAT NULL,                -- giá trị mới nhất
        Humidity FLOAT NULL,                   -- giá trị mới nhất
        UpdatedAt DATETIME NULL,               -- lần cập nhật cuối
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END;
GO


/* =====================================================================
   3️⃣ BẢNG Sensors – QUẢN LÝ LOẠI CẢM BIẾN
===================================================================== */
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name='Sensors' AND type='U')
BEGIN
    CREATE TABLE Sensors (
        SensorID INT IDENTITY(1,1) PRIMARY KEY,
        DeviceID INT NOT NULL,
        Type NVARCHAR(50) NOT NULL,        -- Temperature / Humidity
        Unit NVARCHAR(10) NOT NULL,        -- °C / %

        CONSTRAINT FK_Sensors_Devices
            FOREIGN KEY (DeviceID)
            REFERENCES Devices(DeviceID)
            ON DELETE CASCADE
    );
END;
GO


/* =====================================================================
   4️⃣ BẢNG SensorData – LỊCH SỬ DỮ LIỆU
===================================================================== */
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name='SensorData' AND type='U')
BEGIN
    CREATE TABLE SensorData (
        DataID INT IDENTITY(1,1) PRIMARY KEY,
        SensorID INT NOT NULL,
        Value FLOAT NOT NULL,
        Timestamp DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_SensorData_Sensors
            FOREIGN KEY (SensorID)
            REFERENCES Sensors(SensorID)
            ON DELETE CASCADE
    );
END;
GO


/* =====================================================================
   5️⃣ THÊM DỮ LIỆU MẪU (DEVICE + SENSORS)
===================================================================== */

-- Thêm thiết bị ESP8266_Main nếu chưa có
IF NOT EXISTS (SELECT * FROM Devices WHERE Name='ESP8266_Main')
BEGIN
    INSERT INTO Devices (Name, Status)
    VALUES ('ESP8266_Main', 1);
END;
GO

-- Lấy DeviceID
DECLARE @DevID INT;
SELECT @DevID = DeviceID FROM Devices WHERE Name='ESP8266_Main';


-- Thêm Sensor Temperature
IF NOT EXISTS (SELECT * FROM Sensors WHERE DeviceID=@DevID AND Type='Temperature')
BEGIN
    INSERT INTO Sensors (DeviceID, Type, Unit)
    VALUES (@DevID, 'Temperature', '°C');
END;

-- Thêm Sensor Humidity
IF NOT EXISTS (SELECT * FROM Sensors WHERE DeviceID=@DevID AND Type='Humidity')
BEGIN
    INSERT INTO Sensors (DeviceID, Type, Unit)
    VALUES (@DevID, 'Humidity', '%');
END;
GO


/* =====================================================================
   6️⃣ KIỂM TRA DỮ LIỆU
===================================================================== */
SELECT * FROM Devices;
SELECT * FROM Sensors;
SELECT TOP 20 * FROM SensorData ORDER BY Timestamp DESC;


/* =====================================================================
   7️⃣ TRUY VẤN PHỤC VỤ ĐỒ ÁN
===================================================================== */

-- ⭐ 7.1 — LẤY GIÁ TRỊ MỚI NHẤT (Temperature & Humidity)
SELECT 
    Temp.Value AS Temperature,
    Hum.Value AS Humidity,
    Temp.Timestamp
FROM 
    (SELECT TOP 1 Value, Timestamp 
     FROM SensorData 
     WHERE SensorID = (SELECT SensorID FROM Sensors WHERE Type='Temperature')
     ORDER BY Timestamp DESC) Temp,

    (SELECT TOP 1 Value 
     FROM SensorData 
     WHERE SensorID = (SELECT SensorID FROM Sensors WHERE Type='Humidity')
     ORDER BY Timestamp DESC) Hum;


-- ⭐ 7.2 — LẤY DỮ LIỆU TRONG 1 GIỜ GẦN NHẤT
SELECT *
FROM SensorData
WHERE Timestamp >= DATEADD(HOUR, -1, GETDATE())
ORDER BY Timestamp ASC;


-- ⭐ 7.3 — LẤY DỮ LIỆU TRONG 24 GIỜ
SELECT *
FROM SensorData
WHERE Timestamp >= DATEADD(DAY, -1, GETDATE())
ORDER BY Timestamp ASC;


-- ⭐ 7.4 — LẤY 20 RECORD MỚI NHẤT
SELECT TOP 20 *
FROM SensorData
ORDER BY Timestamp DESC;
GO
