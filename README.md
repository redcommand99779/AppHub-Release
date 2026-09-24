# AppHub

Eine einzelne HTML-Datei mit über 60 kleinen Apps und Spielen (Notizen, Kalender, Todo, Rechner, Passwort-Manager, Wetter, Monopoly, Schach, Tetris, und vieles mehr) — läuft komplett im Browser, kein Server/Backend nötig.

## Starten

Einfach `AppHub.html` doppelklicken — läuft direkt im Browser, auch ohne Server (die Dateien in `apps/` werden ganz normal per `<script src>` nachgeladen, das funktioniert auch bei `file://`).

**Komfortabler mit Auto-Update:** die Launcher-Skripte holen vor dem Start automatisch die neueste Version von GitHub (`git pull`), legen beim allerersten Mal automatisch eine Verknüpfung auf dem Schreibtisch an und öffnen die App danach als eigenes Fenster (ohne Adressleiste/Tabs):

- **Windows:** `AppHub starten.bat` doppelklicken. Legt automatisch eine `AppHub`-Verknüpfung auf dem Desktop an — ab dann reicht die.
- **Mac:** `launch-mac.command` doppelklicken (ggf. beim ersten Mal per Rechtsklick → Öffnen bestätigen, macOS blockiert unbekannte Skripte sonst). Legt automatisch eine `AppHub`-Verknüpfung auf dem Schreibtisch an. Passiert beim Doppelklick gar nichts (kommt vor, wenn die Datei aus einer ZIP von Windows kommt und die Ausführ-Berechtigung fehlt): einmal Terminal öffnen, in den entpackten Ordner wechseln und `chmod +x launch-mac.command` ausführen, danach normal doppelklicken.

### Auto-Update ohne Git und ohne Python

Der Launcher braucht **weder Git noch Python**:

- **Server:** Windows startet `server.ps1` (reines PowerShell), der Mac `server.pl` (Perl, ist vorinstalliert). Beide speichern alle Daten in `appdata.json` (mit täglichen Sicherungen in `backups/`), genau wie `server.py`.
- **Updates:** In einem Ordner **ohne** `.git` lädt der Launcher beim Start die neueste Version als ZIP aus dem öffentlichen Repo `redcommand99779/AppHub-Release` (`update.ps1` bzw. `update-mac.sh`). `appdata.json` und `backups/` bleiben dabei unberührt. Ist kein Internet da, startet einfach die vorhandene Version. Ein Ordner mit `.git` (Entwicklung) nutzt weiter `git pull` und wird nie überschrieben.

**Neue Version für alle veröffentlichen** (im App-Ordner, auf dem Entwicklungsrechner):

```powershell
powershell -File publish-release.ps1
```

Das Skript kopiert nur die App-Dateien (nie `appdata.json`/`backups/`) in einen lokalen Klon des Release-Repos, schreibt eine neue `version.txt` und pusht. Beim nächsten Start holen sich alle Installationen die neue Version.

Für Entwicklung/Testen mit lokalem Server geht auch:

```bash
npx http-server -p 8080 -c-1
```

Danach `http://localhost:8080/AppHub.html` öffnen.

## Struktur

- **`AppHub.html`** — die Hauptdatei: Startbildschirm, Navigation, Theme/Einstellungen und alles, was von mehreren Apps gemeinsam genutzt wird.
- **`apps/`** — eine Datei pro App/Spiel, siehe [`apps/README.md`](apps/README.md) für Details zur Struktur und wie man eine neue App hinzufügt.
- **`.claude/launch.json`** — Server-Konfiguration für die lokale Vorschau.

## Neue App hinzufügen

Siehe [`apps/README.md`](apps/README.md).
