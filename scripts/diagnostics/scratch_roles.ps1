$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SHAILESH;Database=UabIndia_HRMS_Dev;Integrated Security=True;TrustServerCertificate=True"
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT u.Email, u.FullName, u.IsSystemAdmin, r.Name as RoleName FROM dbo.Users u LEFT JOIN dbo.UserRoles ur ON u.Id = ur.UserId LEFT JOIN dbo.Roles r ON ur.RoleId = r.Id"
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    Write-Host "USER_ROLE:" $r["Email"] $r["FullName"] $r["IsSystemAdmin"] $r["RoleName"]
}
$r.Close()
$conn.Close()
