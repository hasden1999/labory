# Test native paste on WinSta0\Default
$logFile = "$env:TEMP\labryo-test-paste.log"
function Log($m) { Add-Content -Path $logFile -Value ("[{0}] {1}" -f (Get-Date -Format "HH:mm:ss.fff"), $m) -Encoding UTF8 }

Log "=== test_native_paste started ==="

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class NativeTest {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();

  public static void Force(IntPtr hWnd) {
    if (IsIconic(hWnd)) { ShowWindow(hWnd, 9); } else { ShowWindow(hWnd, 5); }
    uint cur = GetCurrentThreadId();
    uint target = 0;
    GetWindowThreadProcessId(hWnd, out target);
    if (cur != target && target != 0) {
      AttachThreadInput(cur, target, true);
      keybd_event(0x12, 0, 0, 0);
      keybd_event(0x12, 0, 2, 0);
      SetForegroundWindow(hWnd);
      BringWindowToTop(hWnd);
      AttachThreadInput(cur, target, false);
    } else {
      SetForegroundWindow(hWnd);
      BringWindowToTop(hWnd);
    }
  }

  public static void SendCtrlV() {
    keybd_event(0x11, 0, 0, 0); // CTRL down
    keybd_event(0x56, 0, 0, 0); // 'V' down
    Thread.Sleep(80);
    keybd_event(0x56, 0, 2, 0); // 'V' up
    keybd_event(0x11, 0, 2, 0); // CTRL up
  }
}
"@

try {
    # Check if test image exists
    $testImg = "$env:TEMP\test-report.png"
    if (-not (Test-Path $testImg)) {
        $bmp = New-Object System.Drawing.Bitmap 300, 300
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.Clear([System.Drawing.Color]::PaleGreen)
        $g.DrawString("LABRYO REPORT TEST", (New-Object System.Drawing.Font "Arial", 16), [System.Drawing.Brushes]::Black, 20, 100)
        $g.Dispose()
        $bmp.Save($testImg, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    }

    $img = [System.Drawing.Image]::FromFile($testImg)
    [System.Windows.Forms.Clipboard]::SetImage($img)
    $img.Dispose()
    Log "Image set to clipboard"

    # Find WhatsApp window
    $procs = Get-Process -Name "*WhatsApp*" -ErrorAction SilentlyContinue
    $hwnd = [IntPtr]::Zero
    foreach ($p in $procs) {
        if ($p.MainWindowHandle -ne [IntPtr]::Zero) {
            $hwnd = $p.MainWindowHandle
            break
        }
    }
    if ($hwnd -eq [IntPtr]::Zero) {
        $hwnd = [IntPtr]132510
    }

    Log "Target HWND: $hwnd"
    [NativeTest]::Force($hwnd)
    Start-Sleep -Milliseconds 600

    Log "Sending Ctrl+V..."
    [NativeTest]::SendCtrlV()
    Log "Sent Ctrl+V"

    Start-Sleep -Milliseconds 1500
    [System.Windows.Forms.Clipboard]::SetText("نتائج فحص تجريبية للمريض - مع التحية")
    [NativeTest]::Force($hwnd)
    Start-Sleep -Milliseconds 300
    [NativeTest]::SendCtrlV()
    Log "Sent Caption Ctrl+V"

    Log "DONE"
} catch {
    Log ("ERROR: " + $_.Exception.Message)
}
