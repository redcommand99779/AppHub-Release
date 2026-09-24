# AppHub-Updater ohne Git: holt die neueste Version als ZIP aus dem oeffentlichen
# Release-Repo und ersetzt die App-Dateien. Eigene Daten (appdata.json, backups/) bleiben unangetastet.
# Wird von launch.ps1 beim Start im Hintergrund aufgerufen. Schlaegt etwas fehl
# (kein Internet, GitHub nicht erreichbar ...), passiert einfach nichts.
param([string]$Dir = $PSScriptRoot)

$Repo = 'redcommand99779/AppHub-Release'
$Branch = 'main'
$ErrorActionPreference = 'Stop'

try {
  # Ein Git-Entwicklungsordner wird nie ueberschrieben
  if (Test-Path (Join-Path $Dir '.git')) { exit 0 }
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  $verFile = Join-Path $Dir 'version.txt'
  $local = if (Test-Path $verFile) { (Get-Content $verFile -Raw).Trim() } else { '' }
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $remote = (Invoke-WebRequest "https://raw.githubusercontent.com/$Repo/$Branch/version.txt?t=$stamp" -UseBasicParsing -TimeoutSec 8).Content.Trim()
  if (-not $remote -or $remote -eq $local) { exit 0 }

  $work = Join-Path $env:TEMP ('apphub-update-' + $stamp)
  New-Item -ItemType Directory -Path $work -Force | Out-Null
  $zip = Join-Path $work 'src.zip'
  Invoke-WebRequest "https://codeload.github.com/$Repo/zip/refs/heads/$Branch" -OutFile $zip -UseBasicParsing -TimeoutSec 60
  Expand-Archive -Path $zip -DestinationPath (Join-Path $work 'x') -Force
  $src = Get-ChildItem (Join-Path $work 'x') -Directory | Select-Object -First 1
  if (-not $src -or -not (Test-Path (Join-Path $src.FullName 'AppHub.html'))) { exit 0 }

  # Dateien ersetzen (Daten und Git-Kram ausnehmen; sich selbst erst beim naechsten Start tauschen)
  robocopy $src.FullName $Dir /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD backups .git /XF appdata.json appdata.json.tmp appdata.migrated version.txt update.ps1 | Out-Null
  # apps\ spiegeln, damit entfernte Apps auch lokal verschwinden
  if (Test-Path (Join-Path $src.FullName 'apps')) {
    robocopy (Join-Path $src.FullName 'apps') (Join-Path $Dir 'apps') /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  }
  $self = Join-Path $src.FullName 'update.ps1'
  if (Test-Path $self) { Copy-Item $self (Join-Path $Dir 'update.ps1.new') -Force }
  Set-Content -Path $verFile -Value $remote -NoNewline
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
} catch {
  exit 0
}
