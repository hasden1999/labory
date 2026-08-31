$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\azzez\Desktop\LabManager.lnk")
$Shortcut.TargetPath = "C:\Users\azzez\Desktop\LabManager.cmd"
$Shortcut.WorkingDirectory = "d:\lab"
$Shortcut.WindowStyle = 7
$Shortcut.Save()
Write-Host "Shortcut created successfully!"
