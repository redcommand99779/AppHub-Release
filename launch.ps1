# Legt beim ersten Ausfuehren automatisch eine Desktop-Verknuepfung an,
# holt danach die neueste Version (falls moeglich) und oeffnet
# AppHub.html als eigenes App-Fenster.
#
# Laeuft das Skript aus einem Downloads-Ordner (typischer Ort direkt
# nach dem Entpacken einer ZIP - wird irgendwann aufgeraeumt), wird der
# ganze Ordner einmalig nach %USERPROFILE%\AppHub kopiert, damit ein
# spaeteres Leeren von Downloads die App nicht mitreisst.
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = Join-Path $env:USERPROFILE "AppHub"

if ($here -like "*\Downloads\*" -and $here -ne $installDir) {
  if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
  }
  Copy-Item -Path (Join-Path $here '*') -Destination $installDir -Recurse -Force
  Start-Process powershell -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$installDir\launch.ps1`""
  exit
}

Set-Location $here

$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "AppHub.lnk"
if (-not (Test-Path $shortcutPath)) {
  $WshShell = New-Object -ComObject WScript.Shell
  $Shortcut = $WshShell.CreateShortcut($shortcutPath)
  $Shortcut.TargetPath = "powershell.exe"
  $Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$here\launch.ps1`""
  $Shortcut.WorkingDirectory = $here
  $Shortcut.Description = "AppHub starten (holt automatisch Updates)"
  $iconPath = Join-Path $here "icon.ico"
  if (Test-Path $iconPath) { $Shortcut.IconLocation = $iconPath }
  $Shortcut.Save()
}

# Updates holen laeuft parallel zum Server-Start (spart Wartezeit).
# Mit Git-Ordner: git pull. Sonst (Freunde ohne Git): update.ps1 laedt die neue Version als ZIP.
$newUpd = Join-Path $here "update.ps1.new"
if (Test-Path $newUpd) { try { Move-Item $newUpd (Join-Path $here "update.ps1") -Force } catch {} }
$hasGit = (Test-Path (Join-Path $here ".git")) -and (Get-Command git -ErrorAction SilentlyContinue)
if ($hasGit) {
  $pull = Start-Process git -ArgumentList "pull --ff-only" -WorkingDirectory $here -WindowStyle Hidden -PassThru
} elseif (Test-Path (Join-Path $here "update.ps1")) {
  $pull = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$here\update.ps1`" -Dir `"$here`"" -WindowStyle Hidden -PassThru
}

$htmlPath = Join-Path $here "AppHub.html"
$fileUrl = "file:///" + ($htmlPath -replace '\\', '/')
$port = 8080
$url = $fileUrl

# Lokalen Server starten (speichert alle Daten in appdata.json im App-Ordner).
# Laeuft komplett mit Windows-Bordmitteln (server.ps1) - kein Python noetig.
# Wichtig: immer ueber 127.0.0.1 pruefen - "localhost" versucht zuerst IPv6 und wartet dort ins Leere.
function Get-AppHubVersion {
  try {
    $req = [System.Net.WebRequest]::Create("http://127.0.0.1:$port/api/ping")
    $req.Proxy = $null
    $req.Timeout = 1500
    $resp = $req.GetResponse()
    $v = $resp.Headers['X-AppHub']
    $resp.Close()
    return $v
  } catch { return $null }
}
# Schneller Port-Test (ein fehlgeschlagener Verbindungsversuch dauert unter Windows sonst ~1 Sekunde)
function Test-Port {
  $c = New-Object System.Net.Sockets.TcpClient
  try { $t = $c.ConnectAsync('127.0.0.1', $port); return ($t.Wait(150) -and $c.Connected) } catch { return $false } finally { $c.Close() }
}
$v = $null
if (Test-Port) { $v = Get-AppHubVersion }
if ($v -eq '1') {
  # aelterer AppHub-Server laeuft noch (ohne IPv6-Fix) -> beenden und neu starten
  try {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | ForEach-Object {
      $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)"
      if ($proc.CommandLine -like '*server.py*') { Stop-Process -Id $_.OwningProcess -Force }
    }
  } catch {}
  Start-Sleep -Milliseconds 300
  $v = $null
}
if (-not $v -and (Test-Path (Join-Path $here "server.ps1"))) {
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$here\server.ps1`" -Port $port -IdleMinutes 45" -WindowStyle Hidden -WorkingDirectory $here
  for ($i = 0; $i -lt 100 -and -not (Test-Port); $i++) { Start-Sleep -Milliseconds 100 }
  $v = Get-AppHubVersion
}
if ($v) {
  # Beim ersten Mal: bisherige Browser-Daten (file://) einmalig in die Datei uebernehmen
  if (Test-Path (Join-Path $here "appdata.migrated")) { $url = "http://localhost:$port/AppHub.html" }
  else { $url = $fileUrl + "?migrate=1" }
}
if ($pull) { $pull.WaitForExit(8000) | Out-Null }

$candidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browser) {
  Start-Process $browser -ArgumentList "--app=$url"
} else {
  Start-Process $url
}
