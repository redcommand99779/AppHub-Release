#!/bin/bash
# AppHub-Updater ohne Git: holt die neueste Version als ZIP aus dem oeffentlichen
# Release-Repo und ersetzt die App-Dateien. Eigene Daten (appdata.json, backups/) bleiben unangetastet.
# Wird von launch-mac.command beim Start im Hintergrund aufgerufen. Schlaegt etwas fehl
# (kein Internet, GitHub nicht erreichbar ...), passiert einfach nichts.
REPO="redcommand99779/AppHub-Release"
BRANCH="main"
DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"

# Ein Git-Entwicklungsordner wird nie ueberschrieben
[ -d "$DIR/.git" ] && exit 0

LOCAL=""
[ -f "$DIR/version.txt" ] && LOCAL="$(tr -d '[:space:]' < "$DIR/version.txt")"
REMOTE="$(curl -fsSL -m 8 "https://raw.githubusercontent.com/$REPO/$BRANCH/version.txt?t=$(date +%s)" 2>/dev/null | tr -d '[:space:]')"
[ -z "$REMOTE" ] && exit 0
[ "$REMOTE" = "$LOCAL" ] && exit 0

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
curl -fsSL -m 60 -o "$WORK/src.zip" "https://codeload.github.com/$REPO/zip/refs/heads/$BRANCH" || exit 0
unzip -q "$WORK/src.zip" -d "$WORK/x" || exit 0
SRC="$(find "$WORK/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
[ -f "$SRC/AppHub.html" ] || exit 0

# rsync ersetzt jede Datei ueber eine temporaere Kopie und Umbenennung - das ist auch fuer das
# gerade laufende Start-Skript sicher. Daten und Git-Kram bleiben unberuehrt.
rsync -a --exclude 'backups' --exclude '.git' --exclude 'appdata*' --exclude 'version.txt' "$SRC/" "$DIR/" || exit 0
# apps/ spiegeln, damit entfernte Apps auch lokal verschwinden
[ -d "$SRC/apps" ] && rsync -a --delete "$SRC/apps/" "$DIR/apps/"
chmod +x "$DIR/launch-mac.command" "$DIR/update-mac.sh" 2>/dev/null
printf '%s' "$REMOTE" > "$DIR/version.txt"
exit 0
