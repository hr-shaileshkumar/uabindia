# ==============================================================================
# UabIndia SaaS ERP - Production Cryptographic Secrets Generator
# Generates high-entropy random keys for JWT (512-bit), AES-256-GCM, and HMAC
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "UabIndia ERP - Cryptographic Production Secrets Generator" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Generate 512-bit (64-byte) Random JWT Secret Key
$jwtBytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($jwtBytes)
$jwtSecret = [Convert]::ToBase64String($jwtBytes)

# 2. Generate 256-bit (32-byte) AES-256-GCM Master Key
$aesBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($aesBytes)
$aesMasterKey = [Convert]::ToBase64String($aesBytes)

# 3. Generate 256-bit (32-byte) Blind Index HMAC Key
$hmacBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($hmacBytes)
$hmacKey = [Convert]::ToBase64String($hmacBytes)

# 4. Generate Random DB Password
$dbBytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($dbBytes)
$dbPassword = [Convert]::ToBase64String($dbBytes) -replace '[^a-zA-Z0-9]', ''
$dbPassword = $dbPassword + "!A1"

# 5. Generate Random Redis Password
$redisBytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($redisBytes)
$redisPassword = [Convert]::ToBase64String($redisBytes) -replace '[^a-zA-Z0-9]', ''

Write-Host "Generated High-Entropy Cryptographic Keys:" -ForegroundColor Green
Write-Host (" - JWT Secret (512-bit):        " + $jwtSecret.Substring(0, 16) + "...")
Write-Host (" - AES-256 Master Key:          " + $aesMasterKey.Substring(0, 16) + "...")
Write-Host (" - HMAC Blind Index Key:        " + $hmacKey.Substring(0, 16) + "...")
Write-Host (" - Generated DB Password:       " + $dbPassword.Substring(0, 10) + "...")
Write-Host (" - Generated Redis Password:    " + $redisPassword.Substring(0, 10) + "...")
Write-Host ""

$targetEnv = ".env.production"
if (Test-Path ".env.production.example") {
    $content = [System.IO.File]::ReadAllText(".env.production.example")
    $content = $content.Replace("CHANGE_THIS_TO_YOUR_SECURE_512_BIT_RANDOM_JWT_SECRET_KEY_MIN_64_CHARS", $jwtSecret)
    $content = $content.Replace("CHANGE_THIS_TO_YOUR_SECURE_256_BIT_AES_GCM_BASE64_KEY_32_BYTES", $aesMasterKey)
    $content = $content.Replace("CHANGE_THIS_TO_YOUR_SECURE_256_BIT_HMAC_SHA256_BASE64_KEY_32_BYTES", $hmacKey)
    $content = $content.Replace("YOUR_SECURE_COMPLEX_PASSWORD_HERE", $dbPassword)
    $content = $content.Replace("YOUR_REDIS_PASSWORD", $redisPassword)

    [System.IO.File]::WriteAllText($targetEnv, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Secrets successfully written to .env.production!" -ForegroundColor Green
    Write-Host "IMPORTANT: Keep .env.production secure and never commit it to git repository." -ForegroundColor Yellow
}
