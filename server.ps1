# Lokaler AppHub-Server in reinem PowerShell (kein Python noetig, nur Windows-Bordmittel).
# Macht dasselbe wie server.py: liefert die App aus und speichert alle App-Daten in
# "appdata.json" in diesem Ordner (mit taeglichen Sicherungskopien in "backups/").
#
# Aufruf:  powershell -File server.ps1 [-Port 8080] [-IdleMinutes 45]
param([int]$Port = 8080, [int]$IdleMinutes = 0)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Data = Join-Path $Root 'appdata.json'
$Backups = Join-Path $Root 'backups'
$Mark = Join-Path $Root 'appdata.migrated'
$Utf8 = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Web.Extensions

$Mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.ico'='image/x-icon';
  '.webp'='image/webp'; '.txt'='text/plain; charset=utf-8'; '.md'='text/plain; charset=utf-8';
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.mp3'='audio/mpeg'; '.wav'='audio/wav'; '.ogg'='audio/ogg'
}

function Save-Data([byte[]]$body) {
  if (Test-Path $Data) {
    if (-not (Test-Path $Backups)) { New-Item -ItemType Directory -Path $Backups | Out-Null }
    $bk = Join-Path $Backups ('appdata-' + (Get-Date -Format 'yyyy-MM-dd') + '.json')
    if (-not (Test-Path $bk)) {
      Copy-Item $Data $bk
      Get-ChildItem $Backups -Filter 'appdata-*.json' | Sort-Object Name -Descending | Select-Object -Skip 14 |
        ForEach-Object { try { Remove-Item $_.FullName -Force } catch {} }
    }
  }
  $tmp = $Data + '.tmp'
  [System.IO.File]::WriteAllBytes($tmp, $body)
  [System.IO.File]::Copy($tmp, $Data, $true)
  [System.IO.File]::Delete($tmp)
}

function Send($ctx, [int]$status, [byte[]]$body, [string]$ctype = 'text/plain; charset=utf-8') {
  $r = $ctx.Response
  $r.StatusCode = $status
  $r.ContentType = $ctype
  $r.Headers['X-AppHub'] = '2'
  $r.Headers['Access-Control-Allow-Origin'] = '*'
  $r.Headers['Access-Control-Allow-Headers'] = 'Content-Type'
  $r.Headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, OPTIONS'
  $r.Headers['Access-Control-Allow-Private-Network'] = 'true'
  $r.Headers['Cache-Control'] = 'no-cache'
  if ($null -eq $body) { $body = [byte[]]@() }
  $r.ContentLength64 = $body.Length
  if ($ctx.Request.HttpMethod -ne 'HEAD' -and $body.Length -gt 0) { $r.OutputStream.Write($body, 0, $body.Length) }
  $r.OutputStream.Close()
}
function SendText($ctx, [int]$status, [string]$text) { Send $ctx $status $Utf8.GetBytes($text) }

function Get-Query([string]$q) {
  $h = @{}
  if ($q) { $q.TrimStart('?').Split('&') | ForEach-Object { $p = $_.Split('=', 2); if ($p[0]) { $h[$p[0]] = if ($p.Length -gt 1) { $p[1] } else { '' } } } }
  return $h
}

function Handle($ctx) {
  $req = $ctx.Request
  $method = $req.HttpMethod
  $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
  if ($method -eq 'OPTIONS') { return (Send $ctx 204 $null) }

  if ($method -eq 'GET' -or $method -eq 'HEAD') {
    if ($path -eq '/api/ping') { return (SendText $ctx 200 'ok') }
    if ($path -eq '/api/data') {
      if (Test-Path $Data) { return (Send $ctx 200 ([System.IO.File]::ReadAllBytes($Data)) 'application/json; charset=utf-8') }
      return (SendText $ctx 404 'no data')
    }
    if ($path -eq '/api/backups') {
      # Liste der taeglichen Sicherungen (neueste zuerst) als JSON
      $list = @()
      if (Test-Path $Backups) {
        Get-ChildItem $Backups -Filter 'appdata-*.json' | Sort-Object Name -Descending | ForEach-Object {
          $list += @{ name = $_.Name; size = $_.Length; t = [long]([DateTimeOffset]$_.LastWriteTimeUtc).ToUnixTimeMilliseconds() }
        }
      }
      $js = New-Object System.Web.Script.Serialization.JavaScriptSerializer
      return (Send $ctx 200 ($Utf8.GetBytes($js.Serialize(@($list)))) 'application/json; charset=utf-8')
    }
    if ($path.StartsWith('/api/backup/')) {
      $name = $path.Substring(12)
      if ($name -notmatch '^appdata-[0-9A-Za-z\-]+\.json$') { return (SendText $ctx 400 'bad name') }
      $bf = Join-Path $Backups $name
      if (-not (Test-Path $bf -PathType Leaf)) { return (SendText $ctx 404 'not found') }
      return (Send $ctx 200 ([System.IO.File]::ReadAllBytes($bf)) 'application/json; charset=utf-8')
    }
    if ($path -eq '/') { $path = '/AppHub.html' }
    $parts = @($path.Replace('\', '/').TrimStart('/').Split('/') | Where-Object { $_ })
    if (($parts | Where-Object { $_.StartsWith('.') }) -or ($parts.Count -gt 0 -and ($parts[0].StartsWith('appdata') -or $parts[0] -eq 'backups'))) {
      return (SendText $ctx 403 'forbidden')
    }
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root ($parts -join '\')))
    if (-not $full.StartsWith($Root) -or -not (Test-Path $full -PathType Leaf)) { return (SendText $ctx 404 'not found') }
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $ct = if ($Mime.ContainsKey($ext)) { $Mime[$ext] } else { 'application/octet-stream' }
    return (Send $ctx 200 ([System.IO.File]::ReadAllBytes($full)) $ct)
  }

  if ($method -eq 'POST' -and $path -eq '/api/update') {
    # Updater (update.ps1) anstossen und auf das Ergebnis warten; gibt die dann gueltige Version zurueck
    $upd = Join-Path $Root 'update.ps1'
    if (-not (Test-Path $upd)) { return (SendText $ctx 404 'no updater') }
    try { Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$upd`" -Dir `"$Root`"" -WindowStyle Hidden -Wait } catch { return (SendText $ctx 500 'update failed') }
    $vf = Join-Path $Root 'version.txt'
    return (SendText $ctx 200 $(if (Test-Path $vf) { (Get-Content $vf -Raw).Trim() } else { '' }))
  }
  if ($method -eq 'PUT' -or $method -eq 'POST') {
    if ($path -ne '/api/data') { return (SendText $ctx 404 'not found') }
    $ms = New-Object System.IO.MemoryStream
    $req.InputStream.CopyTo($ms)
    $body = $ms.ToArray()
    $q = Get-Query $req.Url.Query
    if ($q['ifmissing'] -eq '1' -and (Test-Path $Data)) { return (SendText $ctx 409 'exists') }
    $first = ($Utf8.GetString($body)).TrimStart()
    if (-not $first.StartsWith('{')) { return (SendText $ctx 400 'bad body') }
    if ($q['migrate'] -eq '1') {
      # einmalige Uebernahme der alten Browser-Daten: neue Werte gewinnen, vorhandene Zusatzschluessel bleiben
      if (Test-Path $Mark) { return (SendText $ctx 409 'already migrated') }
      try {
        $js = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $js.MaxJsonLength = [int]::MaxValue
        $js.RecursionLimit = 200
        $inc = $js.DeserializeObject($Utf8.GetString($body))
        $merged = @{}
        if (Test-Path $Data) {
          $old = $js.DeserializeObject($Utf8.GetString([System.IO.File]::ReadAllBytes($Data)))
          if ($old -and $old['data']) { foreach ($k in $old['data'].Keys) { $merged[$k] = $old['data'][$k] } }
        }
        if ($inc -and $inc['data']) { foreach ($k in $inc['data'].Keys) { $merged[$k] = $inc['data'][$k] } }
        $ts = [long]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
        $out = @{ v = 1; t = $ts; data = $merged }
        $body = $Utf8.GetBytes($js.Serialize($out))
      } catch { return (SendText $ctx 400 'bad json') }
      Save-Data $body
      [System.IO.File]::WriteAllText($Mark, 'ok')
      return (SendText $ctx 200 'migrated')
    }
    Save-Data $body
    return (SendText $ctx 200 'saved')
  }
  SendText $ctx 405 'method not allowed'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try { $listener.Start() } catch { Write-Host "Port $Port konnte nicht geoeffnet werden: $_"; exit 1 }
Write-Host "AppHub laeuft auf http://localhost:$Port/  (Daten: $Data)"
$last = Get-Date
try {
  while ($listener.IsListening) {
    $task = $listener.GetContextAsync()
    while (-not $task.Wait(30000)) {
      if ($IdleMinutes -gt 0 -and ((Get-Date) - $last).TotalMinutes -gt $IdleMinutes) { $listener.Stop(); exit 0 }
    }
    $last = Get-Date
    $ctx = $task.Result
    try { Handle $ctx } catch { try { $ctx.Response.Abort() } catch {} }
  }
} finally { try { $listener.Stop() } catch {} }
