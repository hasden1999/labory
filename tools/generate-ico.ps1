Add-Type -AssemblyName System.Drawing

$imgFile = "D:\lab\apps\desktop\assets\icon.png"
$icoFile = "D:\lab\apps\desktop\assets\app.ico"

if (Test-Path $imgFile) {
    $bmp = [System.Drawing.Bitmap]::FromFile($imgFile)
    $thumb = New-Object System.Drawing.Bitmap $bmp, 256, 256
    $hIcon = $thumb.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    
    $fs = New-Object System.IO.FileStream $icoFile, ([System.IO.FileMode]::Create)
    $icon.Save($fs)
    $fs.Close()
    
    $bmp.Dispose()
    $thumb.Dispose()
    $icon.Dispose()
    
    Write-Output "ICO successfully generated at $icoFile"
} else {
    Write-Output "Image file not found"
}
