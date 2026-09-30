/* ══════════════════════════════════
   TAFELWERK – Ergänzung: Biologie und Geschichte, dazu welche Tabellen als Karteikarten gelernt werden können (TAFEL_LEARN).
   Wird nach tafelwerk-daten.js geladen und hängt sich an TAFEL und TAFEL_SUBJ an.
══════════════════════════════════ */
TAFEL_SUBJ.bio={name:'Biologie',icon:'🧬'};
TAFEL_SUBJ.gesch={name:'Geschichte',icon:'🏛️'};
TAFEL.push(
/* ───────── BIOLOGIE ───────── */
{id:'b-zelle',subj:'bio',title:'Zelle: Bestandteile und Aufgaben',icon:'🔬',cols:['Bestandteil','Aufgabe','Vorkommen'],rows:[
 ['Zellkern','enthält die Erbinformation (DNA) und steuert die Zelle','Tier- und Pflanzenzelle'],['Zellmembran','begrenzt die Zelle und regelt den Stoffaustausch','Tier- und Pflanzenzelle'],['Zytoplasma','Grundsubstanz der Zelle, Ort vieler Stoffwechselvorgänge','Tier- und Pflanzenzelle'],
 ['Mitochondrien','Zellatmung: gewinnen Energie (ATP)','Tier- und Pflanzenzelle'],['Ribosomen','bauen Proteine zusammen (Proteinbiosynthese)','Tier- und Pflanzenzelle'],['Endoplasmatisches Retikulum','Transport- und Membransystem, Proteinsynthese','Tier- und Pflanzenzelle'],
 ['Golgi-Apparat','verpackt und versendet Stoffe in Bläschen (Vesikeln)','Tier- und Pflanzenzelle'],['Lysosomen','Verdauung: bauen Stoffe ab','vor allem Tierzelle'],['Zentriolen','bilden den Spindelapparat bei der Zellteilung','Tierzelle'],
 ['Zellwand','gibt Stabilität und Form (aus Cellulose)','Pflanzenzelle'],['Chloroplasten','Fotosynthese: bilden mit Licht Traubenzucker','Pflanzenzelle'],['Vakuole','Speicher, hält den Zellinnendruck (Turgor)','vor allem Pflanzenzelle']]},
{id:'b-dna',subj:'bio',title:'DNA, RNA und genetischer Code',icon:'🧬',cols:['Begriff','Erklärung'],rows:[
 ['Basen der DNA','Adenin (A), Thymin (T), Guanin (G), Cytosin (C)'],['Basenpaarung','A–T (2 Wasserstoffbrücken) und G–C (3 Wasserstoffbrücken)'],['Basen der RNA','Adenin, Uracil (U statt Thymin), Guanin, Cytosin'],
 ['Aufbau der DNA','Doppelhelix aus zwei Strängen; Zucker Desoxyribose, Phosphat und Base'],['Nukleotid','Zucker + Phosphat + Base'],['Codon','drei Basen der mRNA, die für eine Aminosäure stehen'],['Startcodon','AUG (steht für Methionin)'],['Stoppcodons','UAA, UAG und UGA'],
 ['Chromosomen des Menschen','46 (23 Paare); Körperzellen sind diploid, Keimzellen haploid (23)'],['Geschlechtschromosomen','XX = weiblich, XY = männlich'],['Genom des Menschen','etwa 3 Milliarden Basenpaare und rund 20 000 Gene'],
 ['Replikation, Transkription, Translation','DNA verdoppeln, DNA → mRNA abschreiben, mRNA → Protein übersetzen']]},
{id:'b-vitamine',subj:'bio',title:'Vitamine',icon:'🍊',cols:['Vitamin','Name','Aufgabe','Mangel','Vorkommen'],rows:[
 ['A','Retinol','Sehen, Haut und Schleimhäute','Nachtblindheit, trockene Haut','Leber, Fisch, Möhren (als Carotin)'],['B1','Thiamin','Nerven, Energiestoffwechsel','Beriberi','Fleisch, Erbsen, Haferflocken'],['B2','Riboflavin','Energiestoffwechsel','Hautprobleme','Fleisch, Milch, Vollkorn'],
 ['B3','Niacin','Energiestoffwechsel','Pellagra','Fleisch, Fisch, Hefe'],['B6','Pyridoxin','Eiweißstoffwechsel, Nerven','Nervenschäden','Leber, Kartoffeln, Kiwi'],['B7','Biotin','Haut und Haare','Hautentzündungen','Leber, Blumenkohl'],
 ['B9','Folsäure','Zellteilung, Blutbildung','Blutarmut, Fehlbildungen beim Kind','Blattgemüse, Weizenkeime'],['B12','Cobalamin','Blutbildung, Nerven','Blutarmut (perniziöse Anämie)','Leber, Fisch, Milch (nur tierisch)'],['C','Ascorbinsäure','Abwehr, Bindegewebe','Skorbut','Zitrusfrüchte, Paprika, Kiwi'],
 ['D','Calciferol (D₃: Cholecalciferol)','Knochen, Aufnahme von Calcium','Rachitis (Kinder)','Sonnenlicht (in der Haut), Fisch'],['E','Tocopherol','Schutz der Zellen (Antioxidans)','selten','Pflanzenöle, Nüsse'],['K','Phyllochinon','Blutgerinnung','Blutungen','Grünkohl, Blattgemüse, Leber']],
 note:'Fettlöslich sind die Vitamine A, D, E und K, wasserlöslich die B-Vitamine und Vitamin C.'},
{id:'b-blut',subj:'bio',title:'Blutgruppen (AB0-System)',icon:'🩸',cols:['Gruppe','Antigene auf den roten Blutkörperchen','Antikörper im Plasma','darf spenden an','darf empfangen von','Anteil in Deutschland'],rows:[
 ['A','A','Anti-B','A und AB','A und 0','43 %'],['B','B','Anti-A','B und AB','B und 0','11 %'],['AB','A und B','keine','nur AB','alle Gruppen (Universalempfänger)','5 %'],['0','keine','Anti-A und Anti-B','alle Gruppen (Universalspender)','nur 0','41 %']],
 note:'Etwa 85 % der Deutschen sind Rhesus-positiv (Rh+), 15 % Rhesus-negativ. Bei Transfusionen zählt zusätzlich der Rhesusfaktor. Häufigkeiten nach dem DRK-Blutspendedienst.'},
{id:'b-energie',subj:'bio',title:'Nährstoffe und Energiegehalt',icon:'🍞',cols:['Nährstoff','Energie in kJ/g','Energie in kcal/g','Aufgabe'],rows:[
 ['Kohlenhydrate','17','4','schnelle Energie'],['Eiweiß (Protein)','17','4','Aufbau von Zellen, Muskeln und Enzymen'],['Fett','37','9','Energiespeicher, Zellbausteine, fettlösliche Vitamine'],['Alkohol (Ethanol)','29','7','kein Nährstoff']],
 note:'Nach EU-Verordnung 1169/2011 (Nährwertkennzeichnung). 1 kcal = 4,184 kJ.'},
{id:'b-stoffwechsel',subj:'bio',title:'Fotosynthese, Zellatmung und Gärung',icon:'🌿',cols:['Vorgang','Reaktionsgleichung','Ort'],rows:[
 ['Fotosynthese','6 CO₂ + 6 H₂O + Lichtenergie → C₆H₁₂O₆ + 6 O₂','Chloroplasten'],['Zellatmung','C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + Energie (ATP)','Mitochondrien'],['alkoholische Gärung','C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂','Hefe'],['Milchsäuregärung','C₆H₁₂O₆ → 2 C₃H₆O₃','Milchsäurebakterien, Muskel bei Sauerstoffmangel']]},
{id:'b-mendel',subj:'bio',title:'Mendelsche Regeln',icon:'🌱',cols:['Regel','Aussage'],rows:[
 ['1. Uniformitätsregel','Kreuzt man zwei reinerbige Formen, die sich in einem Merkmal unterscheiden, sind alle Nachkommen der ersten Generation (F₁) gleich.'],
 ['2. Spaltungsregel','In der zweiten Generation (F₂) spalten die Merkmale wieder auf: Genotyp 1 : 2 : 1, Phänotyp 3 : 1 (bei dominant-rezessivem Erbgang).'],
 ['3. Unabhängigkeitsregel','Verschiedene Merkmale werden unabhängig voneinander vererbt und neu kombiniert; bei zwei Merkmalen ergibt sich in F₂ das Verhältnis 9 : 3 : 3 : 1.']]},
{id:'b-system',subj:'bio',title:'Systematik der Lebewesen',icon:'🐈',cols:['Rang','Mensch','Hauskatze'],rows:[
 ['Domäne','Eukaryoten','Eukaryoten'],['Reich','Tiere','Tiere'],['Stamm','Chordatiere','Chordatiere'],['Klasse','Säugetiere','Säugetiere'],['Ordnung','Primaten','Raubtiere'],['Familie','Menschenaffen (Hominidae)','Katzen (Felidae)'],['Gattung','Homo','Felis'],['Art','Homo sapiens','Felis catus']]},
{id:'b-mensch',subj:'bio',title:'Der menschliche Körper in Zahlen',icon:'🫀',cols:['Größe','Wert'],rows:[
 ['Knochen (Erwachsene)','206'],['Zähne','20 Milchzähne, 32 bleibende Zähne (mit Weisheitszähnen)'],['Körpertemperatur','36,5–37,5 °C'],['Ruhepuls (Erwachsene)','60–80 Schläge pro Minute'],['Atemzüge in Ruhe','12–16 pro Minute'],['Blutmenge (Erwachsene)','5–6 Liter'],
 ['Blutdruck (normal)','unter 120/80 mmHg'],['Chromosomen','46'],['Hautfläche','etwa 1,8 m²'],['Skelettmuskeln','über 600'],['Nervenzellen im Gehirn','rund 86 Milliarden']]},

/* ───────── GESCHICHTE ───────── */
{id:'g-zeit',subj:'gesch',title:'Zeittafel: wichtige Jahreszahlen',icon:'📜',cols:['Jahr','Ereignis'],rows:[
 ['um 3300 v. Chr.','Erste Schrift (Keilschrift) in Mesopotamien'],['776 v. Chr.','Erste Olympische Spiele (überliefert)'],['44 v. Chr.','Ermordung Gaius Julius Caesars'],['27 v. Chr.','Augustus wird erster römischer Kaiser'],['9 n. Chr.','Schlacht im Teutoburger Wald (Varusschlacht)'],
 ['476','Ende des Weströmischen Reichs'],['622','Hidschra: Beginn der islamischen Zeitrechnung'],['800','Karl der Große wird zum Kaiser gekrönt'],['962','Otto I. wird Kaiser (Heiliges Römisches Reich)'],['1066','Schlacht bei Hastings: Normannen erobern England'],
 ['1096','Beginn des 1. Kreuzzugs'],['1215','Magna Carta in England'],['1347–1351','Pest („Schwarzer Tod“) in Europa'],['1453','Eroberung Konstantinopels durch die Osmanen'],['um 1450','Gutenberg erfindet den Buchdruck mit beweglichen Lettern'],
 ['1492','Kolumbus erreicht Amerika'],['1517','Luthers Thesen: Beginn der Reformation'],['1555','Augsburger Religionsfrieden'],['1618–1648','Dreißigjähriger Krieg'],['1648','Westfälischer Friede'],
 ['1776','Unabhängigkeitserklärung der USA'],['1789','Beginn der Französischen Revolution (Sturm auf die Bastille, 14. Juli)'],['1806','Ende des Heiligen Römischen Reichs'],['1815','Wiener Kongress, Schlacht bei Waterloo'],['1848','Revolution in Deutschland (Paulskirche)'],
 ['1871','Gründung des Deutschen Kaiserreichs (18. Januar)'],['1914','Beginn des Ersten Weltkriegs'],['1917','Oktoberrevolution in Russland'],['1918','Ende des Ersten Weltkriegs (Waffenstillstand am 11. November)'],['1919','Versailler Vertrag, Weimarer Verfassung'],
 ['1929','Weltwirtschaftskrise (Börsencrash im Oktober)'],['1933','Machtübernahme der Nationalsozialisten (30. Januar)'],['1938','Novemberpogrome (9. November)'],['1939','Beginn des Zweiten Weltkriegs (1. September)'],['1945','Ende des Zweiten Weltkriegs in Europa (8. Mai)'],
 ['1949','Gründung der Bundesrepublik (Grundgesetz, 23. Mai) und der DDR (7. Oktober)'],['1957','Römische Verträge (Gründung der EWG)'],['1961','Bau der Berliner Mauer (13. August)'],['1969','Erste Mondlandung (Apollo 11, 20. Juli)'],['1989','Fall der Berliner Mauer (9. November)'],
 ['1990','Deutsche Wiedervereinigung (3. Oktober)'],['1991','Auflösung der Sowjetunion'],['1992','Vertrag von Maastricht (Europäische Union)'],['2002','Euro-Bargeld wird eingeführt (1. Januar)']]},
{id:'g-epochen',subj:'gesch',title:'Epochen der Geschichte',icon:'⏳',cols:['Epoche','Zeitraum'],rows:[
 ['Urgeschichte','von den ersten Menschen bis zur Erfindung der Schrift (um 3300 v. Chr.)'],['Antike','etwa 800 v. Chr. bis 476 n. Chr. (Griechen und Römer)'],['Mittelalter','476 bis 1492 (Kaiser, Kirche, Ritter, Städte)'],['Frühe Neuzeit','1492 bis 1789 (Entdeckungen, Reformation, Absolutismus)'],
 ['Neuzeit','ab 1789 (Revolutionen, Industrialisierung, Nationalstaaten, Weltkriege)'],['Zeitgeschichte','ab 1945 (Kalter Krieg, geteiltes Deutschland, Europäische Einigung)']],
 note:'Die Grenzen zwischen den Epochen werden je nach Lehrbuch etwas unterschiedlich gezogen.'}
);

/* Welche Tabellen als Karteikarten gelernt werden können: pairs = [Spalte der Vorderseite, [Spalten der Rückseite]]; short = Kurzname auf der Karte */
const TAFEL_LEARN={
  'm-mengen':{short:'Zeichen',pairs:[[0,[1]]]},'m-roemisch':{short:'Römische Zahlen',pairs:[[0,[1]]]},'m-griechisch':{short:'Griechisches Alphabet',pairs:[[0,[2]],[1,[2]]]},
  'p-si':{short:'SI-Einheiten',pairs:[[0,[1,2]]]},'p-vorsaetze':{short:'Vorsätze',pairs:[[0,[1,2]]]},'p-einheiten':{short:'Einheiten',pairs:[[0,[1,2]]]},
  'c-en':{short:'Elektronegativität',pairs:[[0,[1]],[2,[3]]]},'c-ionen':{short:'Ionen',pairs:[[0,[1]],[2,[3]]]},'c-saeuren':{short:'Säuren und Basen',pairs:[[0,[1,2]]]},'c-nachweis':{short:'Nachweise',pairs:[[0,[1,2]]]},'c-gruppen':{short:'Funktionelle Gruppen',pairs:[[0,[1,2]]]},
  'b-zelle':{short:'Zelle',pairs:[[0,[1,2]]]},'b-dna':{short:'Genetik',pairs:[[0,[1]]]},'b-vitamine':{short:'Vitamine',pairs:[[0,[1,3,4]]]},'b-blut':{short:'Blutgruppen',pairs:[[0,[1,2,3,4]]]},'b-mendel':{short:'Mendelsche Regeln',pairs:[[0,[1]]]},'b-system':{short:'Systematik (Mensch)',pairs:[[0,[1]]]},
  'g-zeit':{short:'Geschichte',pairs:[[0,[1]],[1,[0]]]},'g-epochen':{short:'Epochen',pairs:[[0,[1]]]},
  'u-nato':{short:'Buchstabieralphabet',pairs:[[0,[1,2]]]},'u-morse':{short:'Morsecode',pairs:[[0,[1]],[2,[3]],[4,[5]]]}
};
