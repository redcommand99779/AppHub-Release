# apps/

Jede Datei hier enthält den kompletten JavaScript-Code einer einzelnen App aus dem Hub (`AppHub.html`). Eine Datei = eine App, benannt nach dem deutschen Anzeigenamen der Kachel.

## Einbindung

`AppHub.html` bindet jede Datei per `<script src="apps/xyz.js"></script>` an der Stelle ein, an der früher der Inline-Code stand. Ladereihenfolge entspricht der Reihenfolge der Kacheln/Screens in der Datei. Das ist wichtig: manche Apps rufen beim Klick auf ihre Kachel eine Init-Funktion auf (siehe `goTo()` in `AppHub.html`), die zu diesem Zeitpunkt schon geladen sein muss — daher niemals ein `<script src="apps/...">`-Tag einfach verschieben, ohne zu prüfen, ob es vorher noch verwendet wird.

## Was bleibt bewusst im Hub (`AppHub.html`), nicht in `apps/`

Diese Dinge werden von mehreren Apps gemeinsam benutzt und dürfen nicht in eine einzelne App-Datei wandern:

- `goTo(id)` — der Router, der beim Wechsel der Kachel die passende Init-Funktion aufruft
- `escHtml()`, `showToast()`, `appConfirm()` — überall verwendete Helfer
- Theme/Design, Sprache (`setLang`), Kachelgröße, Akzentfarbe, Favoriten (`favApps`)
- Das Wecker-/Ton-System (`setAlarmTone`, `armAlarm`, `playToneLoop` usw.) — wird von mehreren Timer-artigen Apps gebraucht
- Tastenbelegung/Keybind-Remapping (`customKeys`, `DEFAULT_KEYS`) — aktuell nur von Pac-Man/Snake/Tetris genutzt, aber als generisches Einstellungen-Feature angelegt

## Eine neue App hinzufügen

1. Kachel + Screen-HTML in `AppHub.html` wie gewohnt anlegen.
2. JS-Logik in eine neue Datei `apps/dein-app-name.js` schreiben.
3. An der Stelle, wo der Code sonst inline stünde, `<script src="apps/dein-app-name.js"></script>` einfügen (innerhalb des bestehenden Script-Bereichs — vorher `</script>`, danach `<script>`, falls nötig).
4. In `goTo()` die passende `if(id==='dein-app-name') deinInit();`-Zeile ergänzen, falls die App eine Init-Funktion braucht.

## Eine bestehende App bearbeiten

Einfach die jeweilige Datei in `apps/` öffnen und bearbeiten — nichts an der Einbindung in `AppHub.html` muss angefasst werden, solange keine Funktionen umbenannt werden, die von `goTo()` oder anderen Apps aufgerufen werden.
