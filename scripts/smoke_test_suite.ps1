# ==============================================================================
# UabIndia Enterprise Suite - Automated Full-Stack Smoke Test Suite
# ==============================================================================
param(
    [string]$BaseUrl = "http://localhost:5000"
)

Write-Host "`n==============================================================================" -ForegroundColor Cyan
Write-Host " UABINDIA ENTERPRISE SUITE - AUTOMATED SMOKE TEST SUITE" -ForegroundColor Cyan
Write-Host " Testing against: $BaseUrl" -ForegroundColor Cyan
Write-Host "==============================================================================`n" -ForegroundColor Cyan

$testResults = @()

function Run-SmokeTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$Body = $null
    )

    $url = "$BaseUrl$Path"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $status = "FAIL"
    $statusCode = 0
    $details = ""

    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Accept" = "application/json"
            "X-Tenant-Id" = "4B71B061-6D66-4030-833F-16247CB924A7"
        }

        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 10 -ErrorAction Stop
            $statusCode = 200
        } else {
            $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $Body -TimeoutSec 10 -ErrorAction Stop
            $statusCode = 200
        }

        $sw.Stop()
        $status = "PASS"
        $details = "Latency: $($sw.ElapsedMilliseconds)ms"
    } catch {
        $sw.Stop()
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        } else {
            $statusCode = 503
        }
        $details = $_.Exception.Message
    }

    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host ("[{0}] {1,-38} -> HTTP {2} ({3})" -f $status, $Name, $statusCode, $details) -ForegroundColor $color

    return [PSCustomObject]@{
        Name = $Name
        Endpoint = $Path
        Method = $Method
        Status = $status
        StatusCode = $statusCode
        LatencyMs = $sw.ElapsedMilliseconds
    }
}

# 1. Health & Core Engine
$testResults += Run-SmokeTest -Name "System Health Check" -Method "GET" -Path "/health"
$testResults += Run-SmokeTest -Name "Swagger API Catalog" -Method "GET" -Path "/swagger/v1/swagger.json"

# 2. Platform Context & 9-Dots Launcher
$testResults += Run-SmokeTest -Name "App Context Summary (9-Dots)" -Method "GET" -Path "/api/v1/platform/app-context-summary"
$testResults += Run-SmokeTest -Name "Statutory Compliance Audit Run" -Method "POST" -Path "/api/v1/platform/run-compliance-audit"

# 3. Finance & Indian Taxation (MSME 43B(h) & TDS)
$testResults += Run-SmokeTest -Name "Indian TDS Form 26Q Summary" -Method "GET" -Path "/api/v1/finance/tds/summary"
$testResults += Run-SmokeTest -Name "MSME 45-Day Compliance Calendar" -Method "GET" -Path "/api/v1/finance/msme/compliance-calendar"

# 4. Inventory, FEFO & Serial Tracking
$testResults += Run-SmokeTest -Name "FEFO Batches Expiry Tracker" -Method "GET" -Path "/api/v1/inventory/batches"
$testResults += Run-SmokeTest -Name "Serial Numbers Hardware Registry" -Method "GET" -Path "/api/v1/inventory/serials"

# 5. Manufacturing & Subcontracting
$testResults += Run-SmokeTest -Name "Inward QC Inspection Lots" -Method "GET" -Path "/api/v1/quality/inspection-lots"
$testResults += Run-SmokeTest -Name "GST Rule 55 Delivery Challans" -Method "GET" -Path "/api/v1/manufacturing/subcontracting"

# 6. Connected Banking Payouts
$testResults += Run-SmokeTest -Name "Connected Banking Payout Batches" -Method "GET" -Path "/api/v1/finance/banking/disbursements"

# 7. Indian GST E-Invoicing & E-Way Bill
$testResults += Run-SmokeTest -Name "E-Invoice Pending List" -Method "GET" -Path "/api/v1/compliance/einvoice/pending"
$irnBody = '{"invoiceId":"00000000-0000-0000-0000-000000000000","supplierGstin":"07AAAAU1234A1Z5","recipientGstin":"27AAACZ1234A1Z1","documentType":"INV"}'
$testResults += Run-SmokeTest -Name "IRP 64-char IRN & QR Generation" -Method "POST" -Path "/api/v1/compliance/einvoice/generate-irn" -Body $irnBody
$ewbBody = '{"invoiceId":"00000000-0000-0000-0000-000000000000","transporterName":"Gati Logistics","vehicleNumber":"DL-01-AB-1234","distanceKm":350,"transportMode":"Road"}'
$testResults += Run-SmokeTest -Name "GST Distance E-Way Bill Generation" -Method "POST" -Path "/api/v1/compliance/einvoice/generate-ewaybill" -Body $ewbBody

Write-Host "`n==============================================================================" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$total = $testResults.Count
Write-Host " TEST SUITE SUMMARY: $passed / $total ENDPOINTS VERIFIED" -ForegroundColor (if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host "==============================================================================`n" -ForegroundColor Cyan

