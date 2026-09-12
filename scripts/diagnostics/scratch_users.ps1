$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SHAILESH;Database=UabIndia_HRMS_Dev;Integrated Security=True;TrustServerCertificate=True"
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, TenantId, Email, FullName, IsSystemAdmin FROM dbo.Users"
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    Write-Host "USER:" $r["Id"] $r["TenantId"] $r["Email"] $r["FullName"] $r["IsSystemAdmin"]
}
$r.Close()
$conn.Close()
