# AppHub-Installer fuer Windows - ein Befehl, keine Downloads aus dem Browser noetig.
# In PowerShell einfuegen (Windows-Taste, "PowerShell" tippen, Enter):
#
#   irm https://raw.githubusercontent.com/redcommand99779/AppHub-Release/main/install.ps1 | iex
#
# Der Installer laedt die neueste Version selbst herunter. Dadurch tragen die Dateien keine
# "aus dem Internet geladen"-Markierung, und Windows (Smart App Control / SmartScreen) blockiert sie nicht.
# Installiert wird nach %USERPROFILE%\AppHub. Bei erneutem Ausfuehren wird die App aktualisiert;
# vorhandene Daten (appdata.json, backups\) bleiben erhalten.
#
# Nur fuer Tests: $env:APPHUB_INSTALL_DIR (anderer Zielordner), $env:APPHUB_NO_START=1 (nicht starten).

$Repo = 'redcommand99779/AppHub-Release'
$Branch = 'main'
$ErrorActionPreference = 'Stop'

$dir = $env:APPHUB_INSTALL_DIR
if (-not $dir) { $dir = Join-Path $env:USERPROFILE 'AppHub' }

Write-Host ''
Write-Host 'AppHub wird installiert ...' -ForegroundColor Cyan
Write-Host "Zielordner: $dir"

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }

$work = Join-Path $env:TEMP ('apphub-install-' + (Get-Random))
New-Item -ItemType Directory -Path $work -Force | Out-Null
try {
  $zip = Join-Path $work 'apphub.zip'
  Write-Host 'Lade die neueste Version herunter ...'
  Invoke-WebRequest "https://codeload.github.com/$Repo/zip/refs/heads/$Branch" -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath (Join-Path $work 'x') -Force
  $src = Get-ChildItem (Join-Path $work 'x') -Directory | Select-Object -First 1
  if (-not $src -or -not (Test-Path (Join-Path $src.FullName 'AppHub.html'))) { throw 'Das Download-Paket ist unvollstaendig.' }

  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  # Dateien kopieren; vorhandene Daten und Einstellungen bleiben unberuehrt
  robocopy $src.FullName $dir /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD backups .git /XF appdata.json appdata.json.tmp appdata.migrated | Out-Null
  if (Test-Path (Join-Path $src.FullName 'apps')) {
    robocopy (Join-Path $src.FullName 'apps') (Join-Path $dir 'apps') /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  }
  Write-Host 'Installation abgeschlossen.' -ForegroundColor Green
} finally {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}

if ($env:APPHUB_NO_START -eq '1') { Write-Host "Nicht gestartet (Testmodus). Start mit: $dir\AppHub starten.bat"; return }

Write-Host 'Starte AppHub - eine Verknuepfung auf dem Desktop wird angelegt ...'
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$dir\launch.ps1`"" -WindowStyle Hidden
Write-Host 'Fertig! Ab jetzt reicht die Verknuepfung "AppHub" auf dem Desktop. Updates kommen automatisch.' -ForegroundColor Green
