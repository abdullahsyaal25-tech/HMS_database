-- MySQL Remote Access Configuration
-- Run this SQL script in phpMyAdmin or MySQL command line to enable LAN access

-- Step 1: Create a user that can connect from any host (for LAN access)
-- Replace 'your_password' with your desired password

-- For specific IP range (recommended for security):
-- GRANT ALL PRIVILEGES ON hms_database.* TO 'hms_user'@'192.168.1.%' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;

-- For any host (less secure but easier setup):
GRANT ALL PRIVILEGES ON hms_database.* TO 'root'@'%' IDENTIFIED BY '';
FLUSH PRIVILEGES;

-- Step 2: Show current users and their hosts
SELECT user, host FROM mysql.user WHERE user IN ('root', 'hms_user');

-- Step 3: Verify the database permissions
SHOW GRANTS FOR 'root'@'%';
