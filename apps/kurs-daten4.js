/* ══════════════════════════════════
   PROGRAMMIERKURSE – SQL (10 Lektionen, läuft über SQLite in Pyodide), Git (9 Lektionen, Befehle werden geprüft und mit Beispielantworten
   „ausgeführt“) und Fehlersuche in Python und JavaScript (je 8 Aufgaben mit absichtlich kaputtem Code).
   SQL-Lektionen haben ein Feld setup (SQL, das die Beispieldatenbank anlegt). Die Ausgabe einer Abfrage ist eine Tabelle: erste Zeile die Spalten,
   danach je Zeile die Werte, getrennt durch „ | “ (Kommazahlen auf 2 Stellen gerundet); Anweisungen ohne Ergebnis melden „OK“.
   Git-Lektionen werden mit kursGitCheck (Reihenfolge von Mustern) geprüft; die Fehlersuche prüft wie die anderen Kurse die Ausgabe.
══════════════════════════════════ */
(() => {
const { c, ex, tip, warn, lines, expectOutput } = window.KURS_HELP;

/* ====================================================================== */
/*  SQL                                                                     */
/* ====================================================================== */
const SQL_SETUP = [
  "CREATE TABLE besitzer (id INTEGER PRIMARY KEY, name TEXT, stadt TEXT);",
  "INSERT INTO besitzer VALUES (1, 'Anna', 'Berlin'), (2, 'Ben', 'Wien'), (3, 'Clara', 'Berlin');",
  "CREATE TABLE tiere (id INTEGER PRIMARY KEY, name TEXT, art TEXT, jahre INTEGER, gewicht REAL, besitzer_id INTEGER);",
  "INSERT INTO tiere VALUES (1, 'Rex', 'Hund', 5, 28.5, 1), (2, 'Mia', 'Katze', 3, 4.2, 2), (3, 'Bello', 'Hund', 8, 31.0, 3),",
  "  (4, 'Luna', 'Katze', 1, 3.1, 1), (5, 'Hoppel', 'Hase', 2, 2.4, 2), (6, 'Flocke', 'Hase', 4, 2.9, 3), (7, 'Max', 'Hund', 2, 12.0, 1);",
].join("\n");
const SCHEMA = ex("tiere\n  id | name   | art   | jahre | gewicht | besitzer_id\n   1 | Rex    | Hund  |   5   |  28.5   | 1\n   2 | Mia    | Katze |   3   |   4.2   | 2\n   3 | Bello  | Hund  |   8   |  31.0   | 3\n   4 | Luna   | Katze |   1   |   3.1   | 1\n   5 | Hoppel | Hase  |   2   |   2.4   | 2\n   6 | Flocke | Hase  |   4   |   2.9   | 3\n   7 | Max    | Hund  |   2   |  12.0   | 1\n\nbesitzer\n  id | name  | stadt\n   1 | Anna  | Berlin\n   2 | Ben   | Wien\n   3 | Clara | Berlin");
const sqlLesson = (title, content, task, starter, hint, solution, expected, need) => ({
  title, content, task, setup: SQL_SETUP, starter, hint, solution,
  check: ({ output, code }) => {
    if (need && !need.re.test(code)) return need.msg;
    return expectOutput(output, expected);
  },
});
const TIERE_ALLE = ["id | name | art | jahre | gewicht | besitzer_id", "1 | Rex | Hund | 5 | 28.5 | 1", "2 | Mia | Katze | 3 | 4.2 | 2", "3 | Bello | Hund | 8 | 31.0 | 3", "4 | Luna | Katze | 1 | 3.1 | 1", "5 | Hoppel | Hase | 2 | 2.4 | 2", "6 | Flocke | Hase | 4 | 2.9 | 3", "7 | Max | Hund | 2 | 12.0 | 1"];

window.KURS_COURSES.push({
  id: "sql",
  lang: "sql",
  langLabel: "SQL (SQLite)",
  emoji: "🗃️",
  title: "SQL: Datenbanken abfragen",
  desc: "Mit SQL holst du Daten aus Tabellen: auswählen, filtern, sortieren, zählen, gruppieren, ändern und Tabellen verbinden. Eine kleine Tierdatenbank liegt bereit.",
  lessons: [
    sqlLesson("Daten abfragen mit SELECT",
      `
        <p>Eine <b>Datenbank</b> speichert Daten in <b>Tabellen</b> (Zeilen und Spalten wie in einer Tabellenkalkulation). <b>SQL</b> („Structured Query Language“) ist die Sprache, mit der du Daten abfragst und veränderst. Fast jede App und Webseite nutzt sie im Hintergrund.</p>
        <p>In diesem Kurs gibt es zwei Tabellen, die immer schon bereitliegen:</p>
        ${SCHEMA}
        <p>Mit ${c("SELECT")} fragst du Daten ab. Der Stern ${c("*")} bedeutet „alle Spalten“, nach ${c("FROM")} steht die Tabelle. Jede Anweisung endet mit einem <b>Semikolon</b>.</p>
        ${ex("SELECT * FROM besitzer;")}
        ${tip("SQL-Schlüsselwörter schreibt man üblicherweise GROSS, Tabellen und Spalten klein. Es geht aber auch klein, SQL achtet darauf nicht.")}`,
      "Zeige <b>alle Spalten aller Zeilen</b> der Tabelle <code>tiere</code> an.",
      "-- schreibe hier deine Abfrage\n",
      "SELECT * FROM tiere;",
      "SELECT * FROM tiere;",
      TIERE_ALLE,
      { re: /select/i, msg: "Beginne mit SELECT." }),
    sqlLesson("Bestimmte Spalten wählen",
      `
        <p>Meist brauchst du nicht alle Spalten. Dann schreibst du die gewünschten <b>Spaltennamen</b> statt des Sterns, durch Kommas getrennt. Die Reihenfolge bestimmst du selbst:</p>
        ${ex("SELECT name, art FROM tiere;\nSELECT art, name FROM tiere;   -- andere Reihenfolge")}
        <p>Mit ${c("AS")} gibst du einer Spalte im Ergebnis einen anderen Namen (einen <b>Alias</b>):</p>
        ${ex("SELECT name AS tier, jahre AS alter_in_jahren FROM tiere;")}
        ${tip("Das ändert nur die Anzeige im Ergebnis, nicht die Tabelle selbst.")}`,
      "Zeige nur die Spalten <code>name</code> und <code>art</code> aller Tiere.",
      "-- SELECT ... FROM tiere;\n",
      "SELECT name, art FROM tiere;",
      "SELECT name, art FROM tiere;",
      ["name | art", "Rex | Hund", "Mia | Katze", "Bello | Hund", "Luna | Katze", "Hoppel | Hase", "Flocke | Hase", "Max | Hund"],
      null),
    sqlLesson("Filtern mit WHERE",
      `
        <p>Mit ${c("WHERE")} wählst du nur die Zeilen aus, die eine <b>Bedingung</b> erfüllen:</p>
        ${ex("SELECT name FROM tiere WHERE art = 'Hund';\nSELECT name, jahre FROM tiere WHERE jahre > 3;")}
        <ul>
          <li>Vergleiche: ${c("=")}, ${c("!=")} (ungleich), ${c("<")}, ${c(">")}, ${c("<=")}, ${c(">=")}.</li>
          <li><b>Texte</b> stehen in <b>einfachen</b> Anführungszeichen: ${c("'Hund'")}.</li>
          <li>Zahlen stehen ohne Anführungszeichen.</li>
        </ul>
        ${warn("In SQL vergleichst du mit einem <b>einzelnen</b> <code>=</code> (nicht <code>==</code> wie in Python oder JavaScript).")}`,
      "Zeige <code>name</code> und <code>jahre</code> aller Tiere, die <b>älter als 3 Jahre</b> sind.",
      "-- SELECT name, jahre FROM tiere WHERE ...;\n",
      "SELECT name, jahre FROM tiere WHERE jahre > 3;",
      "SELECT name, jahre FROM tiere WHERE jahre > 3;",
      ["name | jahre", "Rex | 5", "Bello | 8", "Flocke | 4"],
      { re: /where/i, msg: "Benutze WHERE." }),
    sqlLesson("Sortieren und Begrenzen",
      `
        <p>Die Reihenfolge der Zeilen bestimmst du mit ${c("ORDER BY")}: aufsteigend (${c("ASC")}, Standard) oder absteigend (${c("DESC")}). Mit ${c("LIMIT")} begrenzt du, wie viele Zeilen du zurückbekommst:</p>
        ${ex("SELECT name, jahre FROM tiere ORDER BY jahre DESC;          -- älteste zuerst\nSELECT name, jahre FROM tiere ORDER BY jahre DESC LIMIT 2;   -- nur die 2 ältesten")}
        <p>Die Reihenfolge der Teile ist fest: erst ${c("SELECT … FROM")}, dann ${c("WHERE")}, dann ${c("ORDER BY")}, zuletzt ${c("LIMIT")}.</p>
        ${tip("Ohne <code>ORDER BY</code> gibt SQL keine Garantie für die Reihenfolge der Zeilen. Wenn sie wichtig ist, sortiere immer ausdrücklich.")}`,
      "Zeige <code>name</code> und <code>gewicht</code> der <b>3 schwersten</b> Tiere, das schwerste zuerst.",
      "-- ORDER BY ... LIMIT ...\n",
      "SELECT name, gewicht FROM tiere ORDER BY gewicht DESC LIMIT 3;",
      "SELECT name, gewicht FROM tiere ORDER BY gewicht DESC LIMIT 3;",
      ["name | gewicht", "Bello | 31.0", "Rex | 28.5", "Max | 12.0"],
      { re: /order\s+by/i, msg: "Benutze ORDER BY." }),
    sqlLesson("AND, OR und LIKE",
      `
        <p>Bedingungen lassen sich verbinden: ${c("AND")} (beide müssen stimmen), ${c("OR")} (mindestens eine) und ${c("NOT")} (Umkehrung). Bei gemischten Bedingungen helfen <b>Klammern</b>.</p>
        ${ex("SELECT name FROM tiere WHERE art = 'Hund' AND jahre < 5;\nSELECT name FROM tiere WHERE art = 'Hase' OR art = 'Katze';")}
        <p>Mit ${c("LIKE")} suchst du nach Textmustern. Das Zeichen ${c("%")} steht für „beliebig viele beliebige Zeichen“:</p>
        ${ex("SELECT name FROM tiere WHERE name LIKE 'M%';    -- beginnt mit M\nSELECT name FROM tiere WHERE name LIKE '%l';    -- endet auf l")}`,
      "Zeige die <code>name</code>-Spalte aller Tiere, deren Name mit <code>M</code> beginnt <b>oder</b> die Hasen sind, alphabetisch sortiert.",
      "-- SELECT name FROM tiere WHERE ... OR ... ORDER BY name;\n",
      "SELECT name FROM tiere WHERE name LIKE 'M%' OR art = 'Hase' ORDER BY name;",
      "SELECT name FROM tiere WHERE name LIKE 'M%' OR art = 'Hase' ORDER BY name;",
      ["name", "Flocke", "Hoppel", "Max", "Mia"],
      { re: /like/i, msg: "Benutze LIKE für den Anfangsbuchstaben." }),
    sqlLesson("Zählen und Rechnen: COUNT, SUM, AVG",
      `
        <p>Mit <b>Aggregatfunktionen</b> fasst du viele Zeilen zu einem Wert zusammen:</p>
        <ul>
          <li>${c("COUNT(*)")}: die Anzahl der Zeilen.</li>
          <li>${c("SUM(spalte)")}: die Summe, ${c("AVG(spalte)")}: der Durchschnitt.</li>
          <li>${c("MIN(spalte)")} und ${c("MAX(spalte)")}: kleinster und größter Wert.</li>
        </ul>
        ${ex("SELECT COUNT(*) AS anzahl FROM tiere;\nSELECT MAX(gewicht) AS schwerstes FROM tiere;\nSELECT COUNT(*) AS hunde FROM tiere WHERE art = 'Hund';")}
        <p>Mit ${c("ROUND(zahl, stellen)")} rundest du: ${c("ROUND(AVG(gewicht), 1)")} gibt eine Nachkommastelle.</p>`,
      "Zeige in einer Zeile die <b>Anzahl</b> der Tiere (<code>anzahl</code>) und das <b>durchschnittliche Gewicht</b> auf eine Nachkommastelle gerundet (<code>durchschnitt</code>).",
      "-- SELECT COUNT(*) AS anzahl, ROUND(AVG(...), 1) AS durchschnitt FROM tiere;\n",
      "SELECT COUNT(*) AS anzahl, ROUND(AVG(gewicht), 1) AS durchschnitt FROM tiere;",
      "SELECT COUNT(*) AS anzahl, ROUND(AVG(gewicht), 1) AS durchschnitt FROM tiere;",
      ["anzahl | durchschnitt", "7 | 12.0"],
      { re: /count/i, msg: "Benutze COUNT(*)." }),
    sqlLesson("Gruppieren mit GROUP BY",
      `
        <p>Mit ${c("GROUP BY")} bildest du <b>Gruppen</b> und wendest die Aggregatfunktion auf jede Gruppe einzeln an. Beispiel: Wie viele Tiere gibt es <b>je Art</b>?</p>
        ${ex("SELECT art, COUNT(*) AS anzahl\nFROM tiere\nGROUP BY art;")}
        <p>Das Ergebnis hat je Gruppe eine Zeile. Du kannst es wie gewohnt sortieren (${c("ORDER BY")}) und mit ${c("HAVING")} Gruppen nach dem Aggregat filtern (${c("WHERE")} filtert <i>vorher</i> die Zeilen, ${c("HAVING")} <i>nachher</i> die Gruppen).</p>
        ${ex("SELECT art, COUNT(*) AS anzahl\nFROM tiere\nGROUP BY art\nHAVING COUNT(*) >= 3;")}`,
      "Zeige für jede <code>art</code> die Anzahl der Tiere (<code>anzahl</code>), alphabetisch nach <code>art</code> sortiert.",
      "-- SELECT art, COUNT(*) AS anzahl FROM tiere GROUP BY ... ORDER BY ...;\n",
      "SELECT art, COUNT(*) AS anzahl FROM tiere GROUP BY art ORDER BY art;",
      "SELECT art, COUNT(*) AS anzahl FROM tiere GROUP BY art ORDER BY art;",
      ["art | anzahl", "Hase | 2", "Hund | 3", "Katze | 2"],
      { re: /group\s+by/i, msg: "Benutze GROUP BY." }),
    sqlLesson("Daten ändern: INSERT, UPDATE, DELETE",
      `
        <p>Mit SQL fügst du Daten nicht nur ein, du änderst sie auch:</p>
        ${ex("INSERT INTO besitzer VALUES (4, 'Dora', 'Graz');          -- neue Zeile\nUPDATE tiere SET jahre = 6 WHERE name = 'Rex';             -- Zeilen ändern\nDELETE FROM tiere WHERE name = 'Max';                      -- Zeilen löschen")}
        <p>Diese Anweisungen liefern keine Tabelle, der Kurs zeigt dafür <b>OK</b>. Danach kannst du mit einem ${c("SELECT")} nachsehen, was sich geändert hat.</p>
        ${warn("Vergisst du bei <code>UPDATE</code> oder <code>DELETE</code> das <code>WHERE</code>, betrifft die Anweisung <b>alle Zeilen</b> der Tabelle! Prüfe vorher mit einem SELECT, welche Zeilen getroffen werden.")}
        <p>Hier startet die Datenbank bei jedem Ausführen frisch, deine Änderungen bleiben also nicht erhalten. Das macht Ausprobieren gefahrlos.</p>`,
      "Füge ein neues Tier ein: <code>(8, 'Kiwi', 'Vogel', 1, 0.1, 2)</code>. Lösche dann <code>Bello</code> (<code>DELETE</code>), setze <code>Rex</code> auf <code>6</code> Jahre (<code>UPDATE</code>) und zähle am Ende die Tiere (<code>anzahl</code>). Erwartet: dreimal <code>OK</code>, dann <code>anzahl | 7</code>.",
      "-- INSERT INTO tiere VALUES (...);\n-- DELETE FROM tiere WHERE ...;\n-- UPDATE tiere SET ... WHERE ...;\n-- SELECT COUNT(*) AS anzahl FROM tiere;\n",
      "INSERT INTO tiere VALUES (8, 'Kiwi', 'Vogel', 1, 0.1, 2);\nDELETE FROM tiere WHERE name = 'Bello';\nUPDATE tiere SET jahre = 6 WHERE name = 'Rex';\nSELECT COUNT(*) AS anzahl FROM tiere;",
      "INSERT INTO tiere VALUES (8, 'Kiwi', 'Vogel', 1, 0.1, 2);\nDELETE FROM tiere WHERE name = 'Bello';\nUPDATE tiere SET jahre = 6 WHERE name = 'Rex';\nSELECT COUNT(*) AS anzahl FROM tiere;",
      ["OK", "OK", "OK", "anzahl", "7"],
      { re: /insert[\s\S]*delete[\s\S]*update|insert[\s\S]*update[\s\S]*delete|delete[\s\S]*insert[\s\S]*update|delete[\s\S]*update[\s\S]*insert|update[\s\S]*insert[\s\S]*delete|update[\s\S]*delete[\s\S]*insert/i, msg: "Benutze INSERT, DELETE und UPDATE." }),
    sqlLesson("Tabellen verbinden mit JOIN",
      `
        <p>Jedes Tier gehört einem Besitzer. In der Tabelle ${c("tiere")} steht dazu nur dessen Nummer in der Spalte ${c("besitzer_id")}. Mit einem ${c("JOIN")} verbindest du beide Tabellen und holst Daten aus beiden:</p>
        ${ex("SELECT tiere.name AS tier, besitzer.name AS besitzer\nFROM tiere\nJOIN besitzer ON tiere.besitzer_id = besitzer.id;")}
        <ul>
          <li>${c("JOIN tabelle ON bedingung")} sagt, <b>welche Zeilen zusammengehören</b>: hier wenn ${c("besitzer_id")} gleich ${c("id")} ist.</li>
          <li>Gibt es in beiden Tabellen eine Spalte ${c("name")}, schreibst du ${c("tabelle.spalte")}, damit klar ist, welche du meinst.</li>
        </ul>
        ${tip("Der Schlüssel in der einen Tabelle (<code>besitzer.id</code>) und der Verweis in der anderen (<code>tiere.besitzer_id</code>) heißen <b>Primär-</b> und <b>Fremdschlüssel</b>. So hängen Tabellen zusammen, ohne Daten doppelt zu speichern.")}`,
      "Zeige für jedes Tier seinen Namen (<code>tier</code>) und den Namen seines Besitzers (<code>besitzer</code>), alphabetisch nach dem Tiernamen sortiert.",
      "-- SELECT tiere.name AS tier, besitzer.name AS besitzer FROM tiere JOIN besitzer ON ... ORDER BY ...;\n",
      "SELECT tiere.name AS tier, besitzer.name AS besitzer FROM tiere JOIN besitzer ON tiere.besitzer_id = besitzer.id ORDER BY tiere.name;",
      "SELECT tiere.name AS tier, besitzer.name AS besitzer FROM tiere JOIN besitzer ON tiere.besitzer_id = besitzer.id ORDER BY tiere.name;",
      ["tier | besitzer", "Bello | Clara", "Flocke | Clara", "Hoppel | Ben", "Luna | Anna", "Max | Anna", "Mia | Ben", "Rex | Anna"],
      { re: /join/i, msg: "Benutze JOIN." }),
    sqlLesson("Mini-Projekt: Auswertung",
      `
        <p>Zum Abschluss kombinierst du alles: Verbinden, Gruppieren, Rechnen und Sortieren. Die Frage: <b>Wie viele Tiere hat jeder Besitzer, und wie viel wiegen sie zusammen?</b></p>
        <p>Dein Plan:</p>
        <ol>
          <li>Verbinde ${c("besitzer")} mit ${c("tiere")} (${c("JOIN")}).</li>
          <li>Gruppiere nach dem Namen des Besitzers (${c("GROUP BY")}).</li>
          <li>Zähle die Tiere (${c("COUNT(*)")}) und addiere die Gewichte (${c("SUM(tiere.gewicht)")}).</li>
          <li>Sortiere nach dem Gesamtgewicht, das größte zuerst (${c("ORDER BY … DESC")}).</li>
        </ol>
        ${tip("Du kannst im <code>ORDER BY</code> den Alias aus dem <code>SELECT</code> verwenden, zum Beispiel <code>ORDER BY gewicht DESC</code>.")}`,
      "Zeige je Besitzer: <code>besitzer</code> (Name), <code>tiere</code> (Anzahl) und <code>gewicht</code> (Summe der Gewichte, auf 1 Nachkommastelle gerundet), das größte Gesamtgewicht zuerst.",
      "-- verbinde, gruppiere, zähle, summiere, sortiere\n",
      "SELECT besitzer.name AS besitzer, COUNT(*) AS tiere, ROUND(SUM(tiere.gewicht), 1) AS gewicht\nFROM besitzer\nJOIN tiere ON tiere.besitzer_id = besitzer.id\nGROUP BY besitzer.name\nORDER BY gewicht DESC;",
      "SELECT besitzer.name AS besitzer, COUNT(*) AS tiere, ROUND(SUM(tiere.gewicht), 1) AS gewicht\nFROM besitzer\nJOIN tiere ON tiere.besitzer_id = besitzer.id\nGROUP BY besitzer.name\nORDER BY gewicht DESC;",
      ["besitzer | tiere | gewicht", "Anna | 3 | 43.6", "Clara | 2 | 33.9", "Ben | 2 | 6.6"],
      { re: /join[\s\S]*group\s+by|group\s+by[\s\S]*join/i, msg: "Du brauchst JOIN und GROUP BY." }),
  ],
});
window.KURS_HINTS.sql = [
  "SELECT, dann ein Stern für alle Spalten, dann FROM und der Tabellenname. Am Ende ein Semikolon.",
  "Schreibe die zwei Spaltennamen mit einem Komma dazwischen statt des Sterns.",
  "Die Bedingung steht nach WHERE. Zahlen vergleichst du ohne Anführungszeichen, zum Beispiel mit größer-als.",
  "Sortiere nach dem Gewicht absteigend (DESC) und begrenze mit LIMIT auf drei Zeilen.",
  "Verbinde beide Bedingungen mit OR. Der Anfangsbuchstabe geht mit LIKE und dem Prozentzeichen. Am Ende ORDER BY name.",
  "COUNT(*) zählt die Zeilen, AVG(gewicht) bildet den Durchschnitt. Mit ROUND(…, 1) rundest du. Benenne beide Spalten mit AS.",
  "Gruppiere nach der Spalte art und zähle mit COUNT(*). Sortiere die Gruppen nach art.",
  "Drei einzelne Anweisungen mit Semikolon: INSERT INTO, DELETE FROM mit WHERE und UPDATE mit SET und WHERE. Danach das Zählen.",
  "Verbinde mit JOIN … ON tiere.besitzer_id = besitzer.id. Wähle beide Namen mit dem Tabellennamen davor und gib ihnen Aliase.",
  "Verbinde, gruppiere nach dem Besitzernamen und sortiere nach dem Alias gewicht absteigend. Die Summe rundest du mit ROUND.",
];

/* ====================================================================== */
/*  Git                                                                     */
/* ====================================================================== */
/* Prüft Git-Befehle: code = der Text aus dem Editor; patterns = Reihenfolge von regulären Ausdrücken, die auf (bereinigte) Zeilen passen müssen.
   Jedes Muster muss nach dem vorigen vorkommen; weitere Zeilen dazwischen sind erlaubt. */
const gitLines = (code) => code.split("\n").map((l) => l.replace(/#.*$/, "").trim().replace(/\s+/g, " ")).filter(Boolean);
const gitSeq = (code, patterns) => {
  const ls = gitLines(code);
  let from = 0;
  for (const [re, msg] of patterns) {
    const i = ls.findIndex((l, k) => k >= from && re.test(l));
    if (i === -1) return msg;
    from = i + 1;
  }
  return true;
};
window.KURS_GITHELP = { gitLines, gitSeq };
const git = (title, content, task, starter, hint, solution, patterns, replies) => ({
  title, content, task, starter, hint, solution, replies: replies || [],
  check: ({ code }) => (typeof patterns === "function" ? patterns(code) : gitSeq(code, patterns)),
});
window.KURS_COURSES.push({
  id: "git",
  lang: "git",
  langLabel: "Terminal (Git)",
  emoji: "🌿",
  title: "Git: Versionsverwaltung",
  desc: "Änderungen speichern, Verlauf ansehen, Branches und Merge, Zusammenarbeit mit anderen: Die Grundlagen von Git zum Üben im Terminal.",
  lessons: [
    git("Was ist Git? Repository anlegen",
      `
        <p><b>Git</b> ist ein Programm, das <b>alle Versionen</b> deiner Dateien speichert. Du kannst jederzeit zu einem früheren Stand zurück, siehst, was sich wann geändert hat, und arbeitest mit anderen zusammen, ohne Dateien hin- und herzuschicken. Fast jedes Softwareprojekt der Welt nutzt Git.</p>
        <p>Ein Ordner, den Git verwaltet, heißt <b>Repository</b> („Lager“, kurz Repo). Du legst es mit einem Befehl im Terminal an:</p>
        ${ex("mkdir mein-projekt      # neuen Ordner anlegen\ncd mein-projekt         # in den Ordner wechseln\ngit init                # hier ein Repository anlegen")}
        <p>Danach gibt es im Ordner einen versteckten Ordner ${c(".git")}: Dort steckt die gesamte Geschichte. Du löschst oder veränderst ihn nie von Hand.</p>
        <p>In diesem Kurs tippst du die Befehle in den Editor, eine Zeile pro Befehl. Zeilen mit ${c("#")} sind Kommentare. Beim Ausführen zeigt der Kurs, was Git antworten würde.</p>
        ${tip("Das Terminal (Kommandozeile) nimmt Befehle als Text entgegen. <code>mkdir</code> legt Ordner an, <code>cd</code> wechselt hinein, <code>ls</code> listet Dateien auf.")}`,
      "Lege einen Ordner <code>mein-projekt</code> an, wechsle hinein und initialisiere ein Git-Repository.",
      "# ein Befehl pro Zeile\n",
      "mkdir mein-projekt\ncd mein-projekt\ngit init",
      "mkdir mein-projekt\ncd mein-projekt\ngit init",
      [[/^mkdir mein-projekt$/, "Lege den Ordner mit mkdir mein-projekt an."], [/^cd mein-projekt$/, "Wechsle danach mit cd mein-projekt in den Ordner."], [/^git init$/, "Initialisiere das Repository mit git init."]]),
    git("Dateien speichern: add und commit",
      `
        <p>Git speichert Änderungen in zwei Schritten:</p>
        <ol>
          <li>${c("git add")}: Du wählst aus, welche Änderungen in die nächste Version kommen (die <b>Staging-Area</b>, wie ein Warenkorb).</li>
          <li>${c("git commit")}: Du speicherst die ausgewählten Änderungen als neue <b>Version</b> mit einer Nachricht.</li>
        </ol>
        ${ex('git add datei.txt                    # eine Datei vormerken\ngit add .                            # alles Geänderte vormerken\ngit commit -m "Erste Version"        # speichern mit Nachricht')}
        <p>Eine gespeicherte Version heißt <b>Commit</b>. Die Nachricht hinter ${c("-m")} beschreibt kurz, <i>was</i> sich geändert hat, damit du später im Verlauf findest, was du suchst.</p>
        ${warn("Ohne <code>-m \"…\"</code> öffnet Git einen Texteditor für die Nachricht. Das ist für Anfänger oft verwirrend. Gib die Nachricht lieber direkt mit <code>-m</code> an.")}
        ${tip("Gute Commit-Nachrichten sind kurz und in der Gegenwart: „Login-Seite hinzugefügt“, „Rechtschreibfehler korrigiert“.")}`,
      "Merke die Datei <code>datei.txt</code> vor und speichere sie mit der Nachricht <code>Erste Version</code>.",
      "# git add ...\n# git commit -m \"...\"\n",
      'git add datei.txt\ngit commit -m "Erste Version"',
      'git add datei.txt\ngit commit -m "Erste Version"',
      [[/^git add (datei\.txt|\.|-A|--all)$/, "Merke die Datei zuerst mit git add datei.txt vor."], [/^git commit -m "Erste Version"$/, 'Speichere mit git commit -m "Erste Version".']]),
    git("Status und Verlauf",
      `
        <p>Zwei Befehle brauchst du ständig:</p>
        <ul>
          <li>${c("git status")}: Was ist gerade los? Zeigt geänderte Dateien, vorgemerkte Änderungen und den aktuellen Branch.</li>
          <li>${c("git log")}: Der <b>Verlauf</b> aller Commits, neueste zuerst, mit Nachricht, Autor und Datum.</li>
        </ul>
        ${ex("git status\ngit log                # ausführlich\ngit log --oneline      # eine Zeile pro Commit (kurz)")}
        <p>In der Kurzform siehst du pro Commit die ersten Zeichen seiner <b>Kennung</b> (ein Hash wie ${c("3f2a9c1")}) und die Nachricht. Mit dieser Kennung kannst du später auf genau diesen Stand verweisen.</p>
        ${tip("Bei Unsicherheit gilt: erst <code>git status</code>! Der Befehl verändert nichts und sagt dir oft sogar, welcher Befehl als Nächstes passt.")}`,
      "Zeige den aktuellen Zustand (<code>git status</code>) und danach den Verlauf in Kurzform (<code>git log --oneline</code>).",
      "# git status\n# git log --oneline\n",
      "git status\ngit log --oneline",
      "git status\ngit log --oneline",
      [[/^git status$/, "Zeige zuerst mit git status den Zustand."], [/^git log --oneline$/, "Zeige danach den Verlauf mit git log --oneline."]]),
    git("Änderungen ansehen und zurücknehmen",
      `
        <p>Du hast eine Datei verändert und willst wissen, <i>was</i> genau? ${c("git diff")} zeigt die Unterschiede zwischen dem letzten Commit und deinem aktuellen Stand, Zeile für Zeile (rot = entfernt, grün = hinzugefügt).</p>
        ${ex("git diff                 # alle Änderungen ansehen\ngit diff datei.txt      # nur eine Datei")}
        <p>Gefällt dir die Änderung nicht, nimmst du sie zurück:</p>
        ${ex("git restore datei.txt           # Datei auf den letzten Commit zurücksetzen\ngit restore --staged datei.txt  # nur aus der Staging-Area nehmen (Änderung bleibt)")}
        ${warn("<code>git restore datei.txt</code> verwirft deine Änderungen <b>endgültig</b>, denn sie wurden nie als Commit gespeichert. Prüfe vorher mit <code>git diff</code>.")}
        <p>Ältere Anleitungen nutzen für dasselbe ${c("git checkout -- datei.txt")}. Das funktioniert noch, ${c("git restore")} ist aber die klarere, neuere Schreibweise.</p>`,
      "Sieh dir die Änderungen an <code>datei.txt</code> an (<code>git diff</code>) und verwirf sie dann (<code>git restore datei.txt</code>).",
      "# git diff datei.txt\n# git restore datei.txt\n",
      "git diff datei.txt\ngit restore datei.txt",
      "git diff datei.txt\ngit restore datei.txt",
      [[/^git diff( datei\.txt)?$/, "Sieh dir die Änderungen mit git diff an."], [/^git restore datei\.txt$/, "Verwirf die Änderungen mit git restore datei.txt."]]),
    git("Branches: parallel arbeiten",
      `
        <p>Ein <b>Branch</b> („Zweig“) ist eine eigene Linie der Entwicklung. Du kannst eine neue Funktion in einem Branch ausprobieren, ohne den stabilen Hauptzweig (meist ${c("main")}) zu stören. Funktioniert alles, führst du die Arbeit später wieder zusammen.</p>
        ${ex("git branch                  # alle Branches anzeigen (* = aktueller)\ngit branch login            # neuen Branch „login“ anlegen\ngit switch login            # zu diesem Branch wechseln\ngit switch -c login         # anlegen UND wechseln in einem Schritt")}
        <p>Statt ${c("git switch")} liest du oft ${c("git checkout")}: Das ist der ältere Befehl, der beides konnte (Branches wechseln und Dateien zurücksetzen). ${c("git checkout -b login")} entspricht ${c("git switch -c login")}.</p>
        ${tip("Branches sind in Git sehr billig und schnell. Lege ruhig für jede Aufgabe einen eigenen an.")}`,
      "Lege einen neuen Branch <code>login</code> an und wechsle zu ihm (in einem oder in zwei Schritten).",
      "# git switch -c ...\n",
      "git switch -c login",
      "git switch -c login",
      (code) => (gitLines(code).some((l) => /^(git switch -c login|git checkout -b login)$/.test(l)) ? true : gitSeq(code, [[/^git branch login$/, "Lege den Branch login an: entweder in einem Schritt (git switch -c login) oder mit git branch login."], [/^(git switch login|git checkout login)$/, "Wechsle danach mit git switch login zum Branch."]]))),
    git("Branches zusammenführen: merge",
      `
        <p>Ist die Arbeit im Branch fertig, holst du sie in den Hauptzweig. Das heißt <b>Merge</b> („Verschmelzen“). Du gehst dazu <b>in den Branch, der die Änderungen bekommen soll</b>, und sagst, welchen Branch du hineinholen willst:</p>
        ${ex("git switch main        # zuerst in den Zielbranch wechseln\ngit merge login        # die Arbeit aus „login“ hineinholen")}
        <p>Hat sich im Hauptzweig seit dem Abzweigen nichts geändert, spult Git einfach vor (<b>Fast-Forward</b>). Haben beide Zweige Änderungen, legt Git einen eigenen <b>Merge-Commit</b> an.</p>
        <p>Berühren beide Seiten <b>dieselbe Zeile</b> einer Datei, kann Git nicht entscheiden, welche gilt: Es entsteht ein <b>Merge-Konflikt</b>. Git markiert die Stelle in der Datei, du wählst die richtige Fassung, speicherst und machst einen Commit. Das klingt dramatisch, ist aber Alltag.</p>
        ${tip("Nach dem Merge brauchst du den Branch nicht mehr. Löschen kannst du ihn mit <code>git branch -d login</code>.")}`,
      "Wechsle zurück in den Hauptzweig <code>main</code> und hole den Branch <code>login</code> hinein.",
      "# git switch ...\n# git merge ...\n",
      "git switch main\ngit merge login",
      "git switch main\ngit merge login",
      [[/^(git switch main|git checkout main)$/, "Wechsle zuerst in den Zielbranch: git switch main."], [/^git merge login$/, "Hole den Branch dann mit git merge login hinein."]]),
    git("Zusammenarbeit: clone, push, pull",
      `
        <p>Meist liegt ein Repository zusätzlich auf einem Server (zum Beispiel bei <b>GitHub</b>), damit mehrere Menschen daran arbeiten. Dieses Gegenstück heißt <b>Remote</b>, der Standardname ist ${c("origin")}.</p>
        ${ex("git clone https://github.com/beispiel/projekt.git   # Kopie des Repos holen\ngit pull                                                 # neue Commits vom Server holen\ngit push                                                 # eigene Commits hochladen")}
        <ul>
          <li>${c("git clone ADRESSE")}: lädt das komplette Repository samt Verlauf auf deinen Rechner (einmal am Anfang).</li>
          <li>${c("git pull")}: holt die Änderungen anderer vom Server und führt sie mit deinen zusammen.</li>
          <li>${c("git push")}: lädt deine neuen Commits auf den Server hoch.</li>
        </ul>
        ${warn("Hol dir vor dem Arbeiten mit <code>git pull</code> den neuesten Stand. Hat jemand anderes inzwischen etwas hochgeladen, wird dein <code>git push</code> sonst abgelehnt.")}`,
      "Hole das Repository <code>https://github.com/beispiel/projekt.git</code> mit <code>git clone</code>, wechsle in den Ordner <code>projekt</code>, hole mit <code>git pull</code> neue Änderungen und lade deine mit <code>git push</code> hoch.",
      "# git clone ...\n",
      "git clone https://github.com/beispiel/projekt.git\ncd projekt\ngit pull\ngit push",
      "git clone https://github.com/beispiel/projekt.git\ncd projekt\ngit pull\ngit push",
      [[/^git clone https:\/\/github\.com\/beispiel\/projekt\.git$/, "Hole das Repository mit git clone und der Adresse https://github.com/beispiel/projekt.git."], [/^cd projekt$/, "Wechsle mit cd projekt in den neuen Ordner."], [/^git pull$/, "Hole neue Änderungen mit git pull."], [/^git push$/, "Lade deine Commits mit git push hoch."]]),
    git("Fehler korrigieren: revert und amend",
      `
        <p>Fehler passieren. Git hat dafür zwei sichere Werkzeuge:</p>
        <ul>
          <li>${c("git commit --amend -m \"Neue Nachricht\"")}: ändert die Nachricht (und den Inhalt) des <b>letzten</b> Commits. Nur nutzen, solange du ihn noch nicht hochgeladen hast.</li>
          <li>${c("git revert HEAD")}: legt einen <b>neuen Commit</b> an, der den letzten Commit <b>rückgängig macht</b>. Der Verlauf bleibt vollständig erhalten, deshalb ist es auch für schon hochgeladene Commits richtig.</li>
        </ul>
        ${ex('git commit --amend -m "Tippfehler in der Nachricht behoben"\ngit revert HEAD       # HEAD = der aktuelle (letzte) Commit')}
        <p>Es gibt auch ${c("git reset")}, das Commits wirklich entfernt. Es ist mächtig, aber gefährlich, wenn andere die Commits schon haben. Als Anfänger bleibst du bei ${c("revert")}.</p>
        <p>Dateien, die gar nicht erst im Repository landen sollen (Passwörter, temporäre Dateien, ${c("node_modules")}), trägst du in eine Datei namens ${c(".gitignore")} ein, eine Zeile pro Muster.</p>`,
      "Mache den letzten Commit rückgängig, ohne den Verlauf zu verändern (<code>git revert HEAD</code>).",
      "# git revert ...\n",
      "git revert HEAD",
      "git revert HEAD",
      [[/^git revert HEAD$/, "Benutze git revert HEAD, das legt einen Commit an, der den letzten rückgängig macht."]]),
    git("Mini-Projekt: Der ganze Ablauf",
      `
        <p>Du spielst jetzt einen typischen Arbeitsablauf komplett durch. So arbeiten Entwickler jeden Tag:</p>
        <ol>
          <li>Neues Projekt anlegen: ${c("git init")}.</li>
          <li>Datei vormerken und speichern: ${c("git add")} und ${c("git commit")}.</li>
          <li>Für eine neue Funktion einen <b>Branch</b> anlegen und dort einen Commit machen.</li>
          <li>Zurück in den Hauptzweig wechseln (${c("git switch main")}) und die Funktion <b>mergen</b>.</li>
          <li>Zum Schluss den Verlauf kontrollieren (${c("git log --oneline")}).</li>
        </ol>
        <p>Die Reihenfolge der Befehle ist wichtig. Der Kurs prüft, dass sie in diesem Ablauf vorkommen.</p>
        ${tip("Schreibe dir die Schritte als Kommentare mit # auf, bevor du die Befehle tippst. So behältst du den Überblick.")}`,
      "Führe den ganzen Ablauf aus: <code>git init</code>, <code>git add .</code> und ein Commit, dann einen Branch <code>feature</code> anlegen (<code>git switch -c feature</code>) mit einem weiteren Commit, zurück zu <code>main</code>, <code>git merge feature</code> und am Ende <code>git log --oneline</code>.",
      "# 1. Repository anlegen\n# 2. add + commit\n# 3. Branch feature mit eigenem Commit\n# 4. zurück zu main und mergen\n# 5. Verlauf ansehen\n",
      'git init\ngit add .\ngit commit -m "Start"\ngit switch -c feature\ngit add .\ngit commit -m "Neue Funktion"\ngit switch main\ngit merge feature\ngit log --oneline',
      'git init\ngit add .\ngit commit -m "Start"\ngit switch -c feature\ngit add .\ngit commit -m "Neue Funktion"\ngit switch main\ngit merge feature\ngit log --oneline',
      [[/^git init$/, "Beginne mit git init."], [/^git add /, "Merke Dateien mit git add . vor."], [/^git commit -m ".+"$/, 'Speichere mit git commit -m "…".'], [/^(git switch -c feature|git checkout -b feature)$/, "Lege den Branch feature an (git switch -c feature)."], [/^git commit -m ".+"$/, "Mache im Branch feature einen weiteren Commit."], [/^(git switch main|git checkout main)$/, "Wechsle zurück zu main."], [/^git merge feature$/, "Hole feature mit git merge feature hinein."], [/^git log --oneline$/, "Sieh dir am Ende den Verlauf mit git log --oneline an."]]),
  ],
});
window.KURS_HINTS.git = [
  "Drei Befehle untereinander: Ordner anlegen, hineinwechseln, Repository anlegen.",
  "Zuerst die Datei vormerken (add), dann speichern (commit) mit der Nachricht nach -m in Anführungszeichen.",
  "Beide Befehle haben je ein Wort nach git: status und log. Bei log kommt noch eine Option für die Kurzform dazu.",
  "Erst ansehen (diff), dann zurücknehmen (restore). Beide brauchen den Dateinamen.",
  "Mit dem Zusatz -c legt switch den Branch an und wechselt in einem Schritt dorthin.",
  "Wechsle zuerst in den Branch, der die Änderungen bekommen soll (main), und sage dann merge mit dem Namen des Branches.",
  "Erst clone mit der Adresse, dann in den neuen Ordner wechseln, dann pull und push.",
  "revert legt einen neuen Commit an, der einen alten rückgängig macht. HEAD ist der letzte Commit.",
  "Gehe die fünf Schritte der Reihe nach durch. Im Branch und im Hauptzweig brauchst du jeweils einen eigenen Commit bzw. das Merge.",
];

/* ====================================================================== */
/*  Fehlersuche                                                             */
/* ====================================================================== */
const bug = (title, content, task, starter, hint, solution, expected, need) => ({
  title, content, task, starter, hint, solution,
  check: ({ output, code }) => {
    if (need && !need.re.test(code)) return need.msg;
    return expectOutput(output, expected);
  },
});
window.KURS_COURSES.push({
  id: "bugpy",
  lang: "python",
  langLabel: "Python",
  emoji: "🐛",
  title: "Fehlersuche in Python",
  desc: "Der Code ist kaputt, aber nur ein bisschen. Finde den Fehler, behebe ihn und lerne dabei, Fehlermeldungen zu lesen. Je weniger Tipps du brauchst, desto mehr Sterne bekommst du.",
  lessons: [
    bug("Bug 1: Der vergessene Doppelpunkt",
      `
        <p>Jeder Programmierer verbringt viel Zeit mit <b>Fehlersuche</b> („Debugging“). Das Wichtigste dabei: <b>Lies die Fehlermeldung</b>. Sie sagt dir die Zeile und meistens auch das Problem.</p>
        <p>Ein ${c("SyntaxError")} bedeutet: Python versteht den Aufbau des Codes nicht. Der häufigste Grund bei Anfängern ist ein vergessenes Zeichen, etwa der <b>Doppelpunkt</b> nach ${c("if")}, ${c("for")}, ${c("while")} oder ${c("def")}.</p>
        ${ex('SyntaxError: expected \':\'')}
        ${tip("Schau bei Syntaxfehlern in die <b>Zeile, die Python nennt, und in die Zeile davor</b>. Der Fehler steckt oft kurz vorher.")}`,
      "Das Programm soll <code>groß</code> ausgeben, bricht aber mit einem Fehler ab. Finde und behebe ihn.",
      'zahl = 5\nif zahl > 3\n    print("groß")\n',
      'Hinter der if-Bedingung fehlt ein Zeichen.',
      'zahl = 5\nif zahl > 3:\n    print("groß")\n',
      ["groß"]),
    bug("Bug 2: Der Tippfehler",
      `
        <p>Ein ${c("NameError")} heißt: Python kennt den Namen nicht, den du benutzt. Meistens steckt ein <b>Tippfehler</b> dahinter oder die Variable wurde noch nie angelegt. Python unterscheidet Groß- und Kleinschreibung: ${c("Name")} und ${c("name")} sind verschiedene Variablen.</p>
        ${ex("NameError: name 'nmae' is not defined")}
        <p>Vergleiche den Namen in der Fehlermeldung mit dem Namen, den du bei der Zuweisung geschrieben hast.</p>`,
      "Das Programm soll <code>Hallo Mia</code> ausgeben. Finde den Fehler.",
      'name = "Mia"\nprint("Hallo " + nmae)\n',
      "Vergleiche den Namen in print mit dem Namen der Variable.",
      'name = "Mia"\nprint("Hallo " + name)\n',
      ["Hallo Mia"]),
    bug("Bug 3: Die Einrückung",
      `
        <p>In Python gehört alles, was <b>eingerückt</b> ist, zum Block darüber. Ohne Einrückung fehlt der Block: Das gibt einen ${c("IndentationError")} („expected an indented block“).</p>
        ${ex("IndentationError: expected an indented block after 'for' statement on line 1")}
        <p>Nach einem Doppelpunkt <b>muss</b> eine eingerückte Zeile folgen. Üblich sind 4 Leerzeichen, wichtig ist, dass du im ganzen Block gleich einrückst.</p>`,
      "Gib die Zahlen <code>1</code>, <code>2</code>, <code>3</code> aus (jede in einer Zeile). Der Code gibt nur einen Fehler aus.",
      "for zahl in range(1, 4):\nprint(zahl)\n",
      "Die Zeile nach dem Doppelpunkt gehört in die Schleife und muss deshalb eingerückt sein.",
      "for zahl in range(1, 4):\n    print(zahl)\n",
      ["1", "2", "3"]),
    bug("Bug 4: Text plus Zahl",
      `
        <p>Ein ${c("TypeError")} heißt: Du benutzt einen Wert mit dem falschen <b>Typ</b>. Der Klassiker: Text und Zahl mit ${c("+")} verbinden.</p>
        ${ex('TypeError: can only concatenate str (not "int") to str')}
        <p>Es gibt zwei Lösungen: die Zahl mit ${c("str()")} in Text umwandeln oder gleich einen <b>f-String</b> benutzen: ${c('f"Alter: {alter}"')}.</p>`,
      "Das Programm soll <code>Alter: 12</code> ausgeben, bricht aber mit einem TypeError ab.",
      'alter = 12\nprint("Alter: " + alter)\n',
      "Text und Zahl lassen sich nicht einfach mit + verbinden. Wandle um oder nimm einen f-String.",
      'alter = 12\nprint(f"Alter: {alter}")\n',
      ["Alter: 12"]),
    bug("Bug 5: Eins daneben",
      `
        <p>Der berühmteste Fehler überhaupt heißt <b>Off-by-one</b> („um eins daneben“). Das Programm läuft ohne Fehlermeldung, tut aber das Falsche: Eine Schleife läuft einmal zu wenig oder zu viel.</p>
        <p>Der Grund liegt meist an ${c("range")}: Die <b>obere Grenze zählt nicht mit</b>. ${c("range(1, 5)")} liefert 1, 2, 3, 4, aber nicht die 5.</p>
        ${tip("Solche Fehler findest du nur, wenn du die <b>Ausgabe genau mit dem Soll vergleichst</b>. Zähle nach, ob Anfang und Ende stimmen.")}`,
      "Das Programm soll die Zahlen von <code>1</code> bis <code>5</code> ausgeben, hört aber zu früh auf.",
      "for zahl in range(1, 5):\n    print(zahl)\n",
      "Die obere Grenze von range zählt nicht mit.",
      "for zahl in range(1, 6):\n    print(zahl)\n",
      ["1", "2", "3", "4", "5"]),
    bug("Bug 6: Das falsche Teilen",
      `
        <p>Manche Fehler sind <b>logisch</b>: Der Code ist formal korrekt, rechnet aber anders, als du denkst. Python hat zwei Divisionen:</p>
        <ul>
          <li>${c("/")} liefert eine <b>Kommazahl</b>: ${c("5 / 2")} ist ${c("2.5")}.</li>
          <li>${c("//")} liefert nur den <b>ganzzahligen Teil</b>: ${c("5 // 2")} ist ${c("2")}.</li>
        </ul>
        <p>Beim Berechnen eines Durchschnitts willst du fast immer die normale Division.</p>`,
      "Der Durchschnitt von <code>[2, 3]</code> soll <code>2.5</code> sein. Das Programm gibt etwas anderes aus.",
      "zahlen = [2, 3]\nprint(sum(zahlen) // len(zahlen))\n",
      "Welches Divisionszeichen liefert eine Kommazahl?",
      "zahlen = [2, 3]\nprint(sum(zahlen) / len(zahlen))\n",
      ["2.5"]),
    bug("Bug 7: Die None-Falle",
      `
        <p>Manche Methoden verändern eine Liste <b>direkt</b> und geben dafür ${c("None")} („nichts“) zurück. Dazu gehören ${c("sort()")}, ${c("append()")} und ${c("reverse()")}. Wer ihr Ergebnis in einer Variable speichert, überschreibt seine Liste mit <b>None</b>.</p>
        ${ex("zahlen = [3, 1, 2]\nzahlen = zahlen.sort()\nprint(zahlen)   # None")}
        <p>Entweder rufst du ${c("zahlen.sort()")} einfach auf (ohne Zuweisung) oder du nimmst ${c("sorted(zahlen)")}, das eine neue Liste zurückgibt.</p>`,
      "Das Programm soll die sortierte Liste <code>[1, 2, 3]</code> ausgeben, zeigt aber <code>None</code>.",
      "zahlen = [3, 1, 2]\nzahlen = zahlen.sort()\nprint(zahlen)\n",
      "sort() verändert die Liste direkt und gibt selbst nichts Brauchbares zurück.",
      "zahlen = [3, 1, 2]\nzahlen.sort()\nprint(zahlen)\n",
      ["[1, 2, 3]"]),
    bug("Bug 8: FizzBuzz verhext",
      `
        <p>Ein letzter, kniffliger Fall: <b>die Reihenfolge der Bedingungen</b>. Bei ${c("if / elif / else")} gewinnt der <b>erste</b> passende Zweig, alle weiteren werden übersprungen.</p>
        <p>Wenn du bei FizzBuzz zuerst „durch 3“ prüfst, nimmt Python bei 15 schon diesen Zweig und kommt nie zum Fall „durch 3 und 5“. Prüfe immer den <b>speziellsten Fall zuerst</b>.</p>
        ${tip("Eine gute Debug-Technik: Gib mit <code>print()</code> Zwischenwerte aus, um zu sehen, welcher Zweig wirklich läuft.")}`,
      "FizzBuzz für 1 bis 15 gibt bei der 15 nicht <code>FizzBuzz</code> aus. Korrigiere die Reihenfolge.",
      'for i in range(1, 16):\n    if i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    elif i % 15 == 0:\n        print("FizzBuzz")\n    else:\n        print(i)\n',
      "Welcher Fall muss zuerst geprüft werden, damit er nicht von den anderen geschluckt wird?",
      'for i in range(1, 16):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)\n',
      ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]),
  ],
});
window.KURS_HINTS.bugpy = [
  "Lies die Fehlermeldung: Sie nennt die Zeile mit der if-Bedingung. Etwas am Zeilenende fehlt.",
  "Python sagt, welcher Name unbekannt ist. Schreibe ihn genau so, wie du die Variable oben angelegt hast.",
  "Die Meldung sagt „expected an indented block“. Rücke die print-Zeile unter der Schleife mit Leerzeichen ein.",
  "Zwei Wege führen zum Ziel: die Zahl mit str() umwandeln oder die Ausgabe als f-String schreiben.",
  "Die Ausgabe hört bei 4 auf. Überlege, welche Zahl du in range als obere Grenze schreiben musst.",
  "Das Zeichen // schneidet die Nachkommastelle ab. Du brauchst die normale Division.",
  "Entferne die Zuweisung vor zahlen.sort(): Die Methode ändert die Liste schon selbst.",
  "Der Fall „durch 15“ ist spezieller als „durch 3“ oder „durch 5“ und muss deshalb zuerst geprüft werden.",
];

window.KURS_COURSES.push({
  id: "bugjs",
  lang: "javascript",
  langLabel: "JavaScript",
  emoji: "🪲",
  title: "Fehlersuche in JavaScript",
  desc: "Kaputter JavaScript-Code zum Reparieren: Syntaxfehler, Tippfehler, const, ==, vergessenes return und die Falle mit var. Je weniger Tipps du brauchst, desto mehr Sterne.",
  lessons: [
    bug("Bug 1: Die offene Klammer",
      `
        <p>Ein ${c("SyntaxError")} heißt: JavaScript versteht den Aufbau nicht. Meist fehlt etwas, das <b>geschlossen</b> werden muss: eine Klammer ${c(")")}, eine geschweifte Klammer ${c("}")} oder ein Anführungszeichen.</p>
        ${ex("SyntaxError: missing ) after argument list")}
        <p>Der Editor hilft: Er ergänzt Klammern und Anführungszeichen von allein. Beim Kopieren oder Ändern von Code passiert es aber schnell, dass eines fehlt.</p>`,
      "Das Programm soll <code>Hallo</code> ausgeben, bricht aber mit einem SyntaxError ab.",
      'console.log("Hallo);\n',
      "Schau genau auf das Ende des Textes in der Klammer. Was fehlt dort?",
      'console.log("Hallo");\n',
      ["Hallo"]),
    bug("Bug 2: Der Tippfehler",
      `
        <p>Ein ${c("ReferenceError")} bedeutet: JavaScript kennt den Namen nicht. Das ist fast immer ein <b>Tippfehler</b> oder die Variable wurde nie angelegt. Auch hier zählt die Groß- und Kleinschreibung.</p>
        ${ex("ReferenceError: nme is not defined")}`,
      "Das Programm soll <code>Hallo Mia</code> ausgeben. Finde den Fehler.",
      'const name = "Mia";\nconsole.log("Hallo " + nme);\n',
      "Vergleiche den Namen in console.log mit dem Namen der Variable.",
      'const name = "Mia";\nconsole.log("Hallo " + name);\n',
      ["Hallo Mia"]),
    bug("Bug 3: Konstante ändern",
      `
        <p>Variablen, die du mit ${c("const")} anlegst, darfst du später <b>nicht neu zuweisen</b>. Versuchst du es doch, gibt es einen ${c("TypeError")}:</p>
        ${ex("TypeError: Assignment to constant variable.")}
        <p>Soll sich der Wert später ändern (wie ein Punktestand), nimmst du ${c("let")}.</p>`,
      "Der Punktestand soll um 5 steigen und <code>5</code> ausgeben, das Programm stürzt aber ab.",
      "const punkte = 0;\npunkte = punkte + 5;\nconsole.log(punkte);\n",
      "Mit const geht das nicht. Welches Schlüsselwort erlaubt Änderungen?",
      "let punkte = 0;\npunkte = punkte + 5;\nconsole.log(punkte);\n",
      ["5"]),
    bug("Bug 4: Zwei Gleichzeichen",
      `
        <p>JavaScript hat zwei Vergleiche: ${c("==")} (locker) und ${c("===")} (streng). Der lockere wandelt Typen <b>automatisch</b> um: ${c('"5" == 5')} ist ${c("true")}. Der strenge prüft auch den Typ: ${c('"5" === 5')} ist ${c("false")}.</p>
        <p>Der lockere Vergleich führt zu Überraschungen (zum Beispiel ${c('0 == ""')} ist ${c("true")}). Nimm deshalb immer ${c("===")}.</p>`,
      'Der Text <code>"5"</code> und die Zahl <code>5</code> sollen als <b>ungleich</b> gelten. Das Programm sagt <code>gleich</code>.',
      'const text = "5";\nconst zahl = 5;\nif (text == zahl) {\n  console.log("gleich");\n} else {\n  console.log("ungleich");\n}\n',
      "Nimm den strengen Vergleich mit drei Gleichzeichen.",
      'const text = "5";\nconst zahl = 5;\nif (text === zahl) {\n  console.log("gleich");\n} else {\n  console.log("ungleich");\n}\n',
      ["ungleich"]),
    bug("Bug 5: Ein Element zu viel",
      `
        <p>Wieder der Klassiker <b>Off-by-one</b>: Arrays beginnen bei 0, das letzte Element hat deshalb den Index ${c("length - 1")}. Läuft eine Schleife bis ${c("<= liste.length")}, greift sie einmal <b>zu weit</b> und liefert ${c("undefined")}.</p>
        ${ex("for (let i = 0; i <= liste.length; i++) { ... }   // falsch: ein Durchgang zu viel\nfor (let i = 0; i < liste.length; i++) { ... }    // richtig")}`,
      "Das Programm soll nur die drei Farben ausgeben, zeigt am Ende aber noch <code>undefined</code>.",
      'const farben = ["rot", "grün", "blau"];\nfor (let i = 0; i <= farben.length; i++) {\n  console.log(farben[i]);\n}\n',
      "Die Schleife darf nicht bis zur Länge laufen, sondern muss davor aufhören.",
      'const farben = ["rot", "grün", "blau"];\nfor (let i = 0; i < farben.length; i++) {\n  console.log(farben[i]);\n}\n',
      ["rot", "grün", "blau"]),
    bug("Bug 6: Das fehlende return",
      `
        <p>Eine Funktion ohne ${c("return")} gibt ${c("undefined")} zurück. Eine Rechnung wie ${c("a + b")} allein in einer Zeile tut nichts: Das Ergebnis wird berechnet und sofort weggeworfen.</p>
        ${ex("function addiere(a, b) {\n  a + b;        // Ergebnis geht verloren\n}\nconsole.log(addiere(2, 3));   // undefined")}`,
      "<code>addiere(2, 3)</code> soll <code>5</code> ausgeben, zeigt aber <code>undefined</code>.",
      "function addiere(a, b) {\n  a + b;\n}\nconsole.log(addiere(2, 3));\n",
      "Die Funktion muss das Ergebnis zurückgeben.",
      "function addiere(a, b) {\n  return a + b;\n}\nconsole.log(addiere(2, 3));\n",
      ["5"]),
    bug("Bug 7: Sortieren als Text",
      `
        <p>${c("sort()")} sortiert ohne Hilfe alles als <b>Text</b>, also nach dem ersten Zeichen: ${c("[10, 9, 100].sort()")} ergibt ${c("[10, 100, 9]")}. Für Zahlen brauchst du eine Vergleichsfunktion:</p>
        ${ex("zahlen.sort((a, b) => a - b);")}
        <p>Fehler wie dieser fallen bei kleinen Testwerten oft nicht auf. Teste deshalb mit Zahlen mit unterschiedlich vielen Stellen.</p>`,
      "Die Zahlen sollen aufsteigend als <code>9,10,100</code> erscheinen, nicht als Text sortiert.",
      "const zahlen = [10, 9, 100];\nzahlen.sort();\nconsole.log(zahlen.join(\",\"));\n",
      "sort() braucht für Zahlen eine Vergleichsfunktion mit zwei Parametern.",
      "const zahlen = [10, 9, 100];\nzahlen.sort((a, b) => a - b);\nconsole.log(zahlen.join(\",\"));\n",
      ["9,10,100"]),
    bug("Bug 8: var in der Schleife",
      `
        <p>Mit ${c("var")} angelegte Variablen gehören nicht zu einem Block, sondern zur ganzen Funktion. Das führt in Schleifen zu einem berühmten Fehler: Alle Funktionen, die du in der Schleife erzeugst, teilen sich <b>dieselbe</b> Variable ${c("i")} und sehen am Ende deren letzten Stand.</p>
        <p>Mit ${c("let")} bekommt <b>jeder Durchgang</b> seine eigene Kopie von ${c("i")}. Das ist der Grund, warum man heute fast nur noch ${c("let")} und ${c("const")} benutzt.</p>
        ${tip("Faustregel: <code>var</code> vermeiden. Nimm <code>const</code>, und <code>let</code>, wenn sich der Wert ändert.")}`,
      "Das Programm soll <code>0,1,2</code> ausgeben, zeigt aber dreimal dieselbe Zahl.",
      "const funktionen = [];\nfor (var i = 0; i < 3; i++) {\n  funktionen.push(() => i);\n}\nconsole.log(funktionen.map((f) => f()).join(\",\"));\n",
      "Ändere die Art, wie die Zählvariable i angelegt wird, damit jeder Durchgang seine eigene bekommt.",
      "const funktionen = [];\nfor (let i = 0; i < 3; i++) {\n  funktionen.push(() => i);\n}\nconsole.log(funktionen.map((f) => f()).join(\",\"));\n",
      ["0,1,2"]),
  ],
});
window.KURS_HINTS.bugjs = [
  "Die Meldung nennt die fehlende Klammer. Schau auf das Ende des Textes in console.log.",
  "JavaScript sagt, welcher Name unbekannt ist. Schreibe ihn genau wie bei der Variable oben.",
  "Mit const geht keine neue Zuweisung. Welches andere Schlüsselwort legt eine veränderbare Variable an?",
  "Drei Gleichzeichen vergleichen auch den Typ.",
  "Das letzte Element hat den Index length minus 1. Die Schleife darf nicht bis length laufen.",
  "Schreibe vor das Ergebnis das Wort return.",
  "Gib sort() eine Funktion mit a und b, die a minus b zurückgibt.",
  "Tausche var in der Schleife gegen let.",
];
})();
