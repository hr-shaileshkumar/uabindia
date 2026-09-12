$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SHAILESH;Database=UabIndia_HRMS_Dev;Integrated Security=True;TrustServerCertificate=True"
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Name, Subdomain FROM dbo.Tenants"
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    Write-Host "TENANT:" $r["Id"] $r["Name"] $r["Subdomain"]
}
$r.Close()

$cmd.CommandText = "SELECT Id, TenantId, Name FROM dbo.Companies"
$r2 = $cmd.ExecuteReader()
while ($r2.Read()) {
    Write-Host "COMPANY:" $r2["Id"] $r2["TenantId"] $r2["Name"]
}
$r2.Close()
$conn.Close()
