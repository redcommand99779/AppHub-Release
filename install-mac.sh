#!/bin/bash
# AppHub-Installer fuer den Mac - ein Befehl, keine Downloads aus dem Browser noetig.
# Im Terminal einfuegen (Cmd+Leertaste, "Terminal" tippen, Enter):
#
#   curl -fsSL https://raw.githubusercontent.com/redcommand99779/AppHub-Release/main/install-mac.sh | bash
#
# Der Installer laedt die neueste Version selbst herunter. Dadurch tragen die Dateien keine
# Quarantaene-Markierung, und macOS (Gatekeeper) blockiert das Start-Skript nicht.
# Installiert wird nach ~/AppHub. Bei erneutem Ausfuehren wird die App aktualisiert;
# vorhandene Daten (appdata.json, backups/) bleiben erhalten.
REPO="redcommand99779/AppHub-Release"
BRANCH="main"
DIR="${APPHUB_INSTALL_DIR:-$HOME/AppHub}"

echo
echo "AppHub wird installiert ..."
echo "Zielordner: $DIR"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "Lade die neueste Version herunter ..."
curl -fsSL -o "$WORK/apphub.zip" "https://codeload.github.com/$REPO/zip/refs/heads/$BRANCH" || { echo "Download fehlgeschlagen - ist Internet da?"; exit 1; }
unzip -q "$WORK/apphub.zip" -d "$WORK/x" || { echo "Entpacken fehlgeschlagen."; exit 1; }
SRC="$(find "$WORK/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
[ -f "$SRC/AppHub.html" ] || { echo "Das Download-Paket ist unvollstaendig."; exit 1; }

mkdir -p "$DIR"
# Dateien kopieren; vorhandene Daten und Einstellungen bleiben unberuehrt
rsync -a --exclude 'backups' --exclude '.git' --exclude 'appdata*' "$SRC/" "$DIR/"
[ -d "$SRC/apps" ] && rsync -a --delete "$SRC/apps/" "$DIR/apps/"
chmod +x "$DIR/launch-mac.command" "$DIR/update-mac.sh" 2>/dev/null
echo "Installation abgeschlossen."

if [ "$APPHUB_NO_START" = "1" ]; then
  echo "Nicht gestartet (Testmodus). Start mit: $DIR/launch-mac.command"
  exit 0
fi

echo "Starte AppHub - eine Verknuepfung auf dem Schreibtisch wird angelegt ..."
nohup "$DIR/launch-mac.command" >/dev/null 2>&1 &
echo "Fertig! Ab jetzt reicht die Verknuepfung \"AppHub\" auf dem Schreibtisch. Updates kommen automatisch."
