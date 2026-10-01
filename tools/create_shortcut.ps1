$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath 'نظام المختبر المحدث - Labryo LIMS.lnk'
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = 'D:\lab\launch-updated-lab.bat'
$Shortcut.WorkingDirectory = 'D:\lab'
$Shortcut.Description = 'تشغيل نظام المختبر الطبي المحدث (145 تحليلا مع البحث الفوري)'
if (Test-Path 'D:\lab\apps\desktop\assets\app.ico') {
    $Shortcut.IconLocation = 'D:\lab\apps\desktop\assets\app.ico, 0'
}
$Shortcut.Save()
Write-Host "Created Arabic shortcut successfully at: $ShortcutPath"

$EngShortcutPath = Join-Path $DesktopPath 'Labryo LIMS Pro - Live.lnk'
$EngShortcut = $WshShell.CreateShortcut($EngShortcutPath)
$EngShortcut.TargetPath = 'D:\lab\launch-updated-lab.bat'
$EngShortcut.WorkingDirectory = 'D:\lab'
$EngShortcut.Description = 'Launch updated Labryo LIMS system directly'
if (Test-Path 'D:\lab\apps\desktop\assets\app.ico') {
    $EngShortcut.IconLocation = 'D:\lab\apps\desktop\assets\app.ico, 0'
}
$EngShortcut.Save()
Write-Host "Created English shortcut successfully at: $EngShortcutPath"
