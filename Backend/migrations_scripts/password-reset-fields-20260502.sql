-- Add password reset fields to Users table
-- Migration: password-reset-fields-20260502.sql

ALTER TABLE Users
ADD PasswordResetToken NVARCHAR(512) NULL,
    PasswordResetExpires DATETIME2 NULL;

-- Add index for password reset token for performance
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_PasswordResetToken' AND object_id = OBJECT_ID(N'dbo.Users')
)
BEGIN
    CREATE INDEX IX_Users_PasswordResetToken ON dbo.Users(PasswordResetToken)
    WHERE PasswordResetToken IS NOT NULL;
END;

-- Add index for password reset expiration for cleanup queries
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_PasswordResetExpires' AND object_id = OBJECT_ID(N'dbo.Users')
)
BEGIN
    CREATE INDEX IX_Users_PasswordResetExpires ON dbo.Users(PasswordResetExpires)
    WHERE PasswordResetExpires IS NOT NULL;
END;