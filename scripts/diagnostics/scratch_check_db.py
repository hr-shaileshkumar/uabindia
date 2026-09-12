import subprocess

try:
    cmd = 'sqlcmd -S localhost\\SHAILESH -d UabIndia_HRMS_Dev -Q "SELECT Id, Name, Subdomain FROM dbo.Tenants; SELECT Id, TenantId, Name FROM dbo.Companies;"'
    out = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
    print(out)
except Exception as e:
    print("Error:", e)
