#!/bin/bash
# Legt beim ersten Ausfuehren automatisch eine Verknuepfung auf dem
# Schreibtisch an, holt danach Updates und oeffnet AppHub.html als
# eigenes App-Fenster.
#
# Laeuft das Skript aus einem Downloads-Ordner (typischer Ort direkt
# nach dem Entpacken einer ZIP - wird irgendwann aufgeraeumt), wird der
# ganze Ordner einmalig nach ~/AppHub kopiert, damit ein spaeteres
# Leeren von Downloads die App nicht mitreisst.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/AppHub"

if [[ "$HERE" == *"/Downloads/"* ]] && [ "$HERE" != "$INSTALL_DIR" ]; then
  mkdir -p "$INSTALL_DIR"
  cp -R "$HERE"/. "$INSTALL_DIR"/
  exec "$INSTALL_DIR/launch-mac.command"
fi

cd "$HERE"

# Ein vom Updater bereitgestelltes neues Start-Skript uebernehmen und neu starten
if [ -f "$HERE/launch-mac.command.new" ]; then
  mv -f "$HERE/launch-mac.command.new" "$HERE/launch-mac.command" && chmod +x "$HERE/launch-mac.command"
  exec "$HERE/launch-mac.command"
fi

LINK="$HOME/Desktop/AppHub.command"
if [ ! -e "$LINK" ]; then
  ln -s "$HERE/launch-mac.command" "$LINK"
fi

# Updates holen laeuft parallel zum Server-Start.
# Mit Git-Ordner: git pull. Sonst (Freunde ohne Git): update-mac.sh laedt die neue Version als ZIP.
if [ -d "$HERE/.git" ] && command -v git >/dev/null 2>&1; then
  git pull --ff-only >/dev/null 2>&1 &
  PULL_PID=$!
elif [ -f "$HERE/update-mac.sh" ]; then
  bash "$HERE/update-mac.sh" "$HERE" >/dev/null 2>&1 &
  PULL_PID=$!
fi

URL="file://$HERE/AppHub.html"

# Lokalen Server starten (speichert alle Daten in appdata.json im App-Ordner).
PORT=8080
# Perl ist auf jedem Mac vorinstalliert (Python nicht unbedingt) - deshalb laeuft der Server in Perl.
PERL="$(command -v perl)"
ping_ok() { curl -s -m 1 -D - -o /dev/null "http://127.0.0.1:$PORT/api/ping" 2>/dev/null | grep -qi "x-apphub"; }
if [ -n "$PERL" ] && [ -f "$HERE/server.pl" ]; then
  if ! ping_ok; then
    nohup "$PERL" "$HERE/server.pl" --port $PORT --idle-minutes 45 >/dev/null 2>&1 &
    for i in 1 2 3 4 5 6 7 8 9 10; do ping_ok && break; sleep 0.3; done
  fi
  if ping_ok; then
    [ -n "$PULL_PID" ] && wait $PULL_PID 2>/dev/null
    if [ -f "$HERE/appdata.migrated" ]; then URL="http://localhost:$PORT/AppHub.html"; else URL="$URL?migrate=1"; fi
  fi
fi

# Wichtig: Chrome/Edge direkt als Programm starten (nicht ueber "open -a").
# "open -a ... --args" wird ignoriert, wenn der Browser schon im Hintergrund
# laeuft - dann oeffnet sich nur ein normaler Tab statt eines App-Fensters.
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHROME_BIN_USER="$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
EDGE_BIN="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
EDGE_BIN_USER="$HOME/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

if [ -x "$CHROME_BIN" ]; then
  "$CHROME_BIN" --app="$URL" &
elif [ -x "$CHROME_BIN_USER" ]; then
  "$CHROME_BIN_USER" --app="$URL" &
elif [ -x "$EDGE_BIN" ]; then
  "$EDGE_BIN" --app="$URL" &
elif [ -x "$EDGE_BIN_USER" ]; then
  "$EDGE_BIN_USER" --app="$URL" &
else
  open "$URL"
fi
