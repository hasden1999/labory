# ==============================================================================
# Labryo LIMS - WhatsApp Smart Auto-Paste Automation Script (v6.0 - Image + Caption Guaranteed)
#
# Critical Capabilities:
# 1) Switches process station to WinSta0 and thread desktop to Default.
# 2) Puts the report PNG onto the interactive clipboard (Bitmap, PNG stream, FileDropList)
#    and NEVER overwrites the clipboard with plain text.
# 3) Uses Screen.FromHandle(root).WorkingArea so clicks NEVER hit the Windows Taskbar
#    when WhatsApp Desktop is maximized.
# 4) Focuses the chat input box above the taskbar and sends Ctrl+V to attach the report image
#    alongside the pre-filled text caption, then dispatches via Enter.
# ==============================================================================
param(
    [string]$Phone = "",
    [string]$ImagePath = "",
    [string]$ImagePaths = "",
    [string]$CaptionFile = "",
    [string]$Caption = "",
    [switch]$SkipProtocolLaunch
)

$ErrorActionPreference = "SilentlyContinue"
$logFile = Join-Path $env:TEMP "labryo-whatsapp-paste.log"
function Log($m) { 
    $line = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss.fff"), $m
    Add-Content -Path $logFile -Value $line -Encoding UTF8 
}

Log "=== WhatsApp Auto-Share & Auto-Paste Started (v6.1 - Multi-Image Supported) ==="
Log "Params: Phone='$Phone' ImagePath='$ImagePath' ImagePaths='$ImagePaths' CaptionFile='$CaptionFile' SkipLaunch='$SkipProtocolLaunch'"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing, System.Windows.Forms @"
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

public class WaMasterAutomator {
  [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);
  [DllImport("user32.dll", SetLastError = true)] public static extern bool SetProcessWindowStation(IntPtr hWinSta);
  [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
  [DllImport("user32.dll", SetLastError = true)] public static extern bool SetThreadDesktop(IntPtr hDesktop);
  [DllImport("user32.dll", SetLastError = true)] public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumProc lpfn, IntPtr lParam);
  public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll", SetLastError = true)] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

  const uint MOUSEEVENTF_LEFTDOWN = 0x02;
  const uint MOUSEEVENTF_LEFTUP = 0x04;

  public static void SendKeyCombination(byte mod, byte key) {
    keybd_event(mod, 0, 0, 0);
    Thread.Sleep(60);
    keybd_event(key, 0, 0, 0);
    Thread.Sleep(90);
    keybd_event(key, 0, 2, 0);
    Thread.Sleep(60);
    keybd_event(mod, 0, 2, 0);
  }

  public static void SendKey(byte key, byte scan) {
    keybd_event(key, scan, 0, 0);
    Thread.Sleep(70);
    keybd_event(key, scan, 2, 0);
  }

  public static void LeftClick(int x, int y) {
    SetCursorPos(x, y);
    Thread.Sleep(90);
    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    Thread.Sleep(90);
    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
  }

  private static void PutImagesOnClipboard(Image img, MemoryStream pngStream, string[] imagePaths) {
    var dataObj = new DataObject();
    if (img != null) {
      dataObj.SetImage(img);
    }
    var files = new System.Collections.Specialized.StringCollection();
    if (imagePaths != null) {
      foreach (var p in imagePaths) {
        if (!string.IsNullOrEmpty(p) && File.Exists(p)) {
          files.Add(p);
        }
      }
    }
    if (files.Count > 0) {
      dataObj.SetFileDropList(files);
    }
    if (pngStream != null) {
      pngStream.Position = 0;
      dataObj.SetData("PNG", pngStream);
    }
    Clipboard.SetDataObject(dataObj, true);
  }

  public static bool Run(string[] imagePaths, string caption, string phone, bool skipLaunch) {
    bool success = false;
    Thread t = new Thread(() => {
      Image heldImg = null;
      MemoryStream heldMs = null;
      try {
        IntPtr hWinsta = OpenWindowStation("WinSta0", false, 0x037F);
        if (hWinsta != IntPtr.Zero) SetProcessWindowStation(hWinsta);
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

        // 1. Load primary image and keep it alive in memory
        string primaryPath = (imagePaths != null && imagePaths.Length > 0) ? imagePaths[0] : "";
        if (!string.IsNullOrEmpty(primaryPath) && File.Exists(primaryPath)) {
          byte[] rawBytes = File.ReadAllBytes(primaryPath);
          heldMs = new MemoryStream();
          heldMs.Write(rawBytes, 0, rawBytes.Length);
          heldMs.Position = 0;
          using (var tempStream = new MemoryStream(rawBytes)) {
            heldImg = new Bitmap(tempStream);
          }
          PutImagesOnClipboard(heldImg, heldMs, imagePaths);
        }

        // 2. Launch WhatsApp protocol (with caption pre-filled in URL so clipboard stays 100% image!)
        if (!skipLaunch && !string.IsNullOrEmpty(phone)) {
          string encodedCap = !string.IsNullOrEmpty(caption) ? "&text=" + Uri.EscapeDataString(caption) : "";
          Process.Start(new ProcessStartInfo {
            FileName = "whatsapp://send?phone=" + phone + encodedCap,
            UseShellExecute = true
          });
        }

        // 3. Find WhatsApp window
        IntPtr root = IntPtr.Zero;
        for (int i = 0; i < 35; i++) {
          Thread.Sleep(250);
          EnumDesktopWindows(hDesk, (h, l) => {
            if (!IsWindowVisible(h)) return true;
            uint pid = 0;
            GetWindowThreadProcessId(h, out pid);
            string proc = "";
            try { proc = Process.GetProcessById((int)pid).ProcessName; } catch {}
            if (proc.IndexOf("WhatsApp", StringComparison.OrdinalIgnoreCase) >= 0 && root == IntPtr.Zero) {
              root = h;
            }
            return true;
          }, IntPtr.Zero);
          if (root != IntPtr.Zero) break;
        }

        if (root == IntPtr.Zero) return;

        // 4. Activate WhatsApp and wait for chat + pre-filled caption text to settle
        ShowWindow(root, 9); // SW_RESTORE
        ShowWindow(root, 5); // SW_SHOW
        SetForegroundWindow(root);
        SwitchToThisWindow(root, true);
        Thread.Sleep(2800);

        // Re-assert images on clipboard right before pasting
        if (heldImg != null && heldMs != null) {
          PutImagesOnClipboard(heldImg, heldMs, imagePaths);
          Thread.Sleep(120);
        }

        RECT r;
        GetWindowRect(root, out r);
        Rectangle workArea = Screen.FromHandle(root).WorkingArea;

        int effectiveLeft = Math.Max(r.Left, workArea.Left);
        int effectiveRight = Math.Min(r.Right, workArea.Right);
        int effectiveBottom = Math.Min(r.Bottom, workArea.Bottom);
        int winW = Math.Max(400, effectiveRight - effectiveLeft);

        // 5. Click safely inside the chat compose input box (48px above WorkingArea bottom, NEVER on Taskbar!)
        int inputX = effectiveLeft + (winW / 3);
        int inputY = effectiveBottom - 48;

        int totalImgs = (imagePaths != null) ? imagePaths.Length : 0;
        for (int imgIdx = 0; imgIdx < totalImgs; imgIdx++) {
          string curPath = imagePaths[imgIdx];
          if (string.IsNullOrEmpty(curPath) || !File.Exists(curPath)) continue;

          byte[] curBytes = File.ReadAllBytes(curPath);
          using (var curMs = new MemoryStream()) {
            curMs.Write(curBytes, 0, curBytes.Length);
            curMs.Position = 0;
            using (var tmpStream = new MemoryStream(curBytes))
            using (var curBmp = new Bitmap(tmpStream)) {
              PutImagesOnClipboard(curBmp, curMs, new string[] { curPath });
              Thread.Sleep(150);

              SetForegroundWindow(root);
              LeftClick(inputX, inputY);
              Thread.Sleep(250);

              // Send Ctrl+V to paste this individual report image
              SendKeyCombination(0x11, 0x56);

              // Wait 2.1s for WhatsApp's Image Preview modal to open and render
              Thread.Sleep(2100);

              // Send Enter to dispatch this independent image
              SendKey(0x0D, 0x1C);
              Thread.Sleep(900);
            }
          }
        }

        // Re-assert images on clipboard so user can also Ctrl+V manually if needed
        if (heldImg != null && heldMs != null) {
          PutImagesOnClipboard(heldImg, heldMs, imagePaths);
        }

        success = true;
      } catch {}
      finally {
        if (heldImg != null) { try { heldImg.Dispose(); } catch {} }
        if (heldMs != null) { try { heldMs.Dispose(); } catch {} }
      }
    });

    t.SetApartmentState(ApartmentState.STA);
    t.Start();
    t.Join();
    return success;
  }
}
"@

try {
    # 1. Resolve permanent image cache (supports single and multiple images)
    $reportsDir = Join-Path $env:TEMP "labryo_reports"
    if (-not (Test-Path $reportsDir)) { New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null }

    $allRawPaths = @()
    if ($ImagePaths) {
        $allRawPaths = $ImagePaths.Split('|;,', [System.StringSplitOptions]::RemoveEmptyEntries)
    } elseif ($ImagePath) {
        $allRawPaths = @($ImagePath)
    }

    $finalImagePaths = @()
    foreach ($p in $allRawPaths) {
        $cleanP = $p.Trim().Trim('"').Trim("'")
        if ($cleanP -and (Test-Path $cleanP)) {
            $perm = Join-Path $reportsDir (Split-Path $cleanP -Leaf)
            Copy-Item -Path $cleanP -Destination $perm -Force -ErrorAction SilentlyContinue
            $finalImagePaths += $perm
        }
    }

    # 2. Resolve Caption
    $captionText = $Caption
    if (-not $captionText -and $CaptionFile -and (Test-Path $CaptionFile)) {
        $captionText = [System.IO.File]::ReadAllText($CaptionFile, [System.Text.Encoding]::UTF8)
    }

    # 3. Clean Phone
    $cleanPhone = $Phone -replace '[^0-9]', ''
    if ($cleanPhone.StartsWith("07") -and $cleanPhone.Length -eq 11) { $cleanPhone = "964" + $cleanPhone.Substring(1) }
    elseif ($cleanPhone.StartsWith("7") -and $cleanPhone.Length -eq 10) { $cleanPhone = "964" + $cleanPhone }

    $capSnippet = if ($captionText) { $captionText.Substring(0, [Math]::Min(35, $captionText.Length)) } else { "none" }
    Log "Invoking WaMasterAutomator v6.1: Phone='$cleanPhone' TotalImages=$($finalImagePaths.Count) Caption='$capSnippet' SkipLaunch=$($SkipProtocolLaunch.IsPresent)"
    $res = [WaMasterAutomator]::Run([string[]]$finalImagePaths, $captionText, $cleanPhone, $SkipProtocolLaunch.IsPresent)
    Log "WaMasterAutomator v6.1 finished with result: $res"
} catch {
    Log ("ERROR in auto-paste: " + $_.Exception.Message)
}
