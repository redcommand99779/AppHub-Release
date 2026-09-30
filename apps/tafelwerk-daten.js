/* ══════════════════════════════════
   TAFELWERK – die Nachschlage-Tabellen (Daten). Angezeigt von formeln.js, dort kommen die Formel-Übersichten
   aus den Karteikarten dazu. Ein Abschnitt: {id, subj, title, icon, cols:[Spaltenköpfe], rows:[[Zellen]], note?, link?}
══════════════════════════════════ */
const TAFEL_SUBJ={
  mathe:{name:'Mathe',icon:'📐'},physik:{name:'Physik',icon:'⚛️'},chemie:{name:'Chemie',icon:'🧪'},
  astro:{name:'Astronomie & Erde',icon:'🔭'},info:{name:'Informatik',icon:'💻'},alltag:{name:'Umrechnen & Alltag',icon:'🧮'}
};
const TAFEL_DE=(n,d)=>n.toFixed(d).replace('.',',');
const TAFEL_PRIMES=(()=>{const p=[];for(let n=2;n<=200;n++){let ok=true;for(let d=2;d*d<=n;d++)if(n%d===0){ok=false;break;}if(ok)p.push(n);}return p;})();
const TAFEL=[
/* ───────── MATHE ───────── */
{id:'m-mengen',subj:'mathe',title:'Zahlenmengen und Zeichen',icon:'🔢',cols:['Zeichen','Bedeutung'],rows:[
 ['ℕ','natürliche Zahlen: 0, 1, 2, 3, …'],['ℤ','ganze Zahlen: …, −2, −1, 0, 1, 2, …'],['ℚ','rationale Zahlen (Brüche)'],['ℝ','reelle Zahlen'],['ℂ','komplexe Zahlen'],
 ['∈  ∉','ist Element von / ist kein Element von'],['⊂  ⊆','ist Teilmenge von'],['∪  ∩','Vereinigung / Schnittmenge'],['∅','leere Menge'],['∀  ∃','für alle / es existiert'],
 ['≈  ≠','ungefähr gleich / ungleich'],['≤  ≥','kleiner oder gleich / größer oder gleich'],['∞','unendlich'],['⇒  ⇔','daraus folgt / genau dann, wenn'],['|a|','Betrag von a'],['√','Quadratwurzel'],['Σ','Summe'],['π','Kreiszahl ≈ 3,14159265']]},
{id:'m-potenz',subj:'mathe',title:'Potenz- und Wurzelgesetze',icon:'⬆️',cols:['Gesetz','Formel'],rows:[
 ['gleiche Basis, Multiplikation','aᵐ · aⁿ = aᵐ⁺ⁿ'],['gleiche Basis, Division','aᵐ / aⁿ = aᵐ⁻ⁿ'],['Potenz einer Potenz','(aᵐ)ⁿ = aᵐ·ⁿ'],['gleicher Exponent, Multiplikation','aⁿ · bⁿ = (a · b)ⁿ'],
 ['gleicher Exponent, Division','aⁿ / bⁿ = (a / b)ⁿ'],['negativer Exponent','a⁻ⁿ = 1 / aⁿ'],['Exponent null','a⁰ = 1   (a ≠ 0)'],['Wurzel als Potenz','ⁿ√a = a^(1/n)'],['gebrochener Exponent','a^(m/n) = ⁿ√(aᵐ)'],
 ['Wurzel eines Produkts','√(a · b) = √a · √b'],['Wurzel eines Bruchs','√(a / b) = √a / √b']]},
{id:'m-log',subj:'mathe',title:'Logarithmengesetze',icon:'📉',cols:['Gesetz','Formel'],rows:[
 ['Definition','log_a(x) = y  ⇔  aʸ = x'],['Produkt','log(x · y) = log x + log y'],['Quotient','log(x / y) = log x − log y'],['Potenz','log(xʸ) = y · log x'],
 ['Basiswechsel','log_a(b) = ln b / ln a'],['Sonderfälle','log_a(1) = 0,   log_a(a) = 1'],['Zehner- und natürlicher Logarithmus','lg = log₁₀,   ln = log_e   (e ≈ 2,71828)']]},
{id:'m-geo-flaechen',subj:'mathe',title:'Geometrie: Flächen',icon:'⬛',cols:['Figur','Fläche A','Umfang U'],rows:[
 ['Quadrat (Seite a)','a²','4 · a'],['Rechteck','a · b','2 · (a + b)'],['Parallelogramm','a · h','2 · (a + b)'],['Dreieck','½ · g · h','a + b + c'],['Trapez','½ · (a + c) · h','a + b + c + d'],
 ['Raute','e · f / 2','4 · a'],['Kreis','π · r²','2 · π · r'],['Kreisring','π · (R² − r²)','2π · (R + r)'],['Kreissektor (Winkel α)','α/360° · π · r²','Bogen b = α/360° · 2πr'],['gleichseitiges Dreieck','a² · √3 / 4','3 · a']]},
{id:'m-geo-koerper',subj:'mathe',title:'Geometrie: Körper',icon:'🧊',cols:['Körper','Volumen V','Oberfläche O'],rows:[
 ['Würfel','a³','6 · a²'],['Quader','a · b · c','2 · (ab + ac + bc)'],['Prisma','G · h','2 · G + M'],['Zylinder','π · r² · h','2πr² + 2πrh = 2πr · (r + h)'],
 ['Pyramide','⅓ · G · h','G + M'],['Kegel','⅓ · π · r² · h','π · r · (r + s)   (s = Mantellinie)'],['Kugel','4/3 · π · r³','4 · π · r²']]},
{id:'m-dreieck',subj:'mathe',title:'Dreieck und Satzgruppe des Pythagoras',icon:'📐',cols:['Satz','Formel'],rows:[
 ['Winkelsumme im Dreieck','α + β + γ = 180°'],['Satz des Pythagoras','a² + b² = c²'],['Höhensatz','h² = p · q'],['Kathetensatz','a² = c · p     b² = c · q'],['Sinussatz','a / sin α = b / sin β = c / sin γ'],
 ['Kosinussatz','c² = a² + b² − 2ab · cos γ'],['Flächeninhalt nach Heron','A = √( s · (s−a) · (s−b) · (s−c) ),   s = (a + b + c)/2'],['Strahlensatz','a / b = c / d   (Abschnitte auf den Strahlen)'],['Innenwinkel im n-Eck','(n − 2) · 180°']]},
{id:'m-trig',subj:'mathe',title:'Trigonometrie: Werte und Regeln',icon:'📈',cols:['Winkel','Bogenmaß','sin','cos','tan'],rows:[
 ['0°','0','0','1','0'],['30°','π/6','½','√3/2 ≈ 0,866','√3/3 ≈ 0,577'],['45°','π/4','√2/2 ≈ 0,707','√2/2 ≈ 0,707','1'],['60°','π/3','√3/2 ≈ 0,866','½','√3 ≈ 1,732'],['90°','π/2','1','0','nicht definiert'],
 ['120°','2π/3','√3/2','−½','−√3'],['135°','3π/4','√2/2','−√2/2','−1'],['150°','5π/6','½','−√3/2','−√3/3'],['180°','π','0','−1','0'],['270°','3π/2','−1','0','nicht definiert'],['360°','2π','0','1','0']],
 note:'Bogenmaß = Grad · π / 180°.  Grad = Bogenmaß · 180° / π.  sin² α + cos² α = 1,  tan α = sin α / cos α.'},
{id:'m-trig-regeln',subj:'mathe',title:'Trigonometrie: Additionstheoreme',icon:'🔁',cols:['Regel','Formel'],rows:[
 ['Summe (Sinus)','sin(α ± β) = sin α · cos β ± cos α · sin β'],['Summe (Kosinus)','cos(α ± β) = cos α · cos β ∓ sin α · sin β'],['Doppelter Winkel (Sinus)','sin 2α = 2 · sin α · cos α'],
 ['Doppelter Winkel (Kosinus)','cos 2α = cos² α − sin² α'],['Symmetrie','sin(−α) = −sin α,   cos(−α) = cos α'],['Komplementärwinkel','sin(90° − α) = cos α']]},
{id:'m-ableitung',subj:'mathe',title:'Ableitungen',icon:'🧮',cols:['f(x)','f′(x)'],rows:[
 ['c  (Konstante)','0'],['xⁿ','n · xⁿ⁻¹'],['√x','1 / (2 · √x)'],['1 / x','−1 / x²'],['eˣ','eˣ'],['aˣ','aˣ · ln a'],['ln x','1 / x'],['sin x','cos x'],['cos x','−sin x'],['tan x','1 / cos² x'],
 ['Summenregel','(u + v)′ = u′ + v′'],['Faktorregel','(c · u)′ = c · u′'],['Produktregel','(u · v)′ = u′ · v + u · v′'],['Quotientenregel','(u / v)′ = (u′ · v − u · v′) / v²'],['Kettenregel','(f(g(x)))′ = f′(g(x)) · g′(x)']]},
{id:'m-integral',subj:'mathe',title:'Integrale und Stammfunktionen',icon:'∫',cols:['f(x)','Stammfunktion F(x)'],rows:[
 ['xⁿ   (n ≠ −1)','xⁿ⁺¹ / (n + 1) + C'],['1 / x','ln |x| + C'],['eˣ','eˣ + C'],['aˣ','aˣ / ln a + C'],['sin x','−cos x + C'],['cos x','sin x + C'],['Hauptsatz','∫ₐᵇ f(x) dx = F(b) − F(a)'],['Partielle Integration','∫ u · v′ dx = u · v − ∫ u′ · v dx'],['Substitution','∫ f(g(x)) · g′(x) dx = ∫ f(t) dt   mit t = g(x)']]},
{id:'m-folgen',subj:'mathe',title:'Folgen, Reihen und Zinsen',icon:'🔗',cols:['Name','Formel'],rows:[
 ['arithmetische Folge','aₙ = a₁ + (n − 1) · d'],['arithmetische Reihe (Summe)','sₙ = n/2 · (a₁ + aₙ)'],['geometrische Folge','aₙ = a₁ · qⁿ⁻¹'],['geometrische Reihe (Summe)','sₙ = a₁ · (1 − qⁿ) / (1 − q)'],
 ['unendliche geometrische Reihe','s = a₁ / (1 − q)   für |q| < 1'],['Zinseszins','Kₙ = K₀ · (1 + p/100)ⁿ'],['einfache Zinsen','Z = K · p/100 · t/360']]},
{id:'m-stochastik',subj:'mathe',title:'Stochastik',icon:'🎲',cols:['Begriff','Formel'],rows:[
 ['Laplace-Wahrscheinlichkeit','P(E) = günstige Fälle / mögliche Fälle'],['Gegenereignis','P(Ē) = 1 − P(E)'],['Fakultät','n! = 1 · 2 · … · n'],['Anordnungen (Permutationen)','n!'],
 ['Binomialkoeffizient','(n über k) = n! / (k! · (n − k)!)'],['Binomialverteilung','P(X = k) = (n über k) · pᵏ · (1 − p)ⁿ⁻ᵏ'],['Erwartungswert','E(X) = Σ xᵢ · P(xᵢ),   bei Binomial: n · p'],['Standardabweichung (Binomial)','σ = √( n · p · (1 − p) )'],
 ['Additionssatz','P(A ∪ B) = P(A) + P(B) − P(A ∩ B)'],['bedingte Wahrscheinlichkeit','P(A | B) = P(A ∩ B) / P(B)'],['Mittelwert','x̄ = (x₁ + … + xₙ) / n']]},
{id:'m-vektor',subj:'mathe',title:'Vektoren und analytische Geometrie',icon:'➡️',cols:['Name','Formel'],rows:[
 ['Betrag (Länge)','|a| = √(a₁² + a₂² + a₃²)'],['Skalarprodukt','a · b = a₁b₁ + a₂b₂ + a₃b₃'],['Winkel zwischen Vektoren','cos φ = (a · b) / (|a| · |b|)'],['Orthogonal','a · b = 0'],['Kreuzprodukt','a × b = (a₂b₃ − a₃b₂ | a₃b₁ − a₁b₃ | a₁b₂ − a₂b₁)'],
 ['Abstand zweier Punkte','d = √((x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²)'],['Mittelpunkt einer Strecke','M = ((x₁ + x₂)/2 | (y₁ + y₂)/2)'],['Geradengleichung','x = p + t · v'],['Kreisgleichung','(x − m)² + (y − n)² = r²'],['Kugelgleichung','(x − a)² + (y − b)² + (z − c)² = r²']]},
{id:'m-quadrate',subj:'mathe',title:'Quadrat-, Kubikzahlen und Wurzeln (1–25)',icon:'🔲',cols:['n','n²','n³','√n'],
 rows:Array.from({length:25},(_,i)=>{const n=i+1;return [String(n),String(n*n),String(n*n*n),TAFEL_DE(Math.sqrt(n),3)];})},
{id:'m-primzahlen',subj:'mathe',title:'Primzahlen bis 200',icon:'🔐',cols:['Primzahlen'],rows:[[TAFEL_PRIMES.join(', ')],['Es gibt '+TAFEL_PRIMES.length+' Primzahlen bis 200. Teilbarkeit: durch 3, wenn die Quersumme durch 3 teilbar ist; durch 9 bei Quersumme durch 9; durch 4, wenn die letzten zwei Ziffern durch 4 teilbar sind.']]},
{id:'m-konstanten',subj:'mathe',title:'Wichtige Zahlen mit vielen Nachkommastellen',icon:'🅿️',cols:['Name','Wert (50 Nachkommastellen, in Fünfergruppen)'],rows:[
 ['Kreiszahl π','3,14159 26535 89793 23846 26433 83279 50288 41971 69399 37510 …'],
 ['Eulersche Zahl e','2,71828 18284 59045 23536 02874 71352 66249 77572 47093 69995 …'],
 ['√2 (Diagonale im Einheitsquadrat)','1,41421 35623 73095 04880 16887 24209 69807 85696 71875 37694 …'],
 ['√3','1,73205 08075 68877 29352 74463 41505 87236 69428 05253 81038 …'],
 ['√5','2,23606 79774 99789 69640 91736 68731 27623 54406 18359 61152 …'],
 ['Goldener Schnitt φ = (1 + √5) / 2','1,61803 39887 49894 84820 45868 34365 63811 77203 09179 80576 …'],
 ['ln 2','0,69314 71805 59945 30941 72321 21458 17656 80755 00134 36025 …'],
 ['ln 10','2,30258 50929 94045 68401 79914 54684 36420 76011 01488 62877 …'],
 ['Euler-Mascheroni-Konstante γ','0,57721 56649 01532 86060 65120 90082 …'],
 ['Catalansche Konstante G','0,91596 55941 77219 01505 46035 14932 …']],
 note:'π ist die Zahl, die man erhält, wenn man den Umfang eines Kreises durch seinen Durchmesser teilt. Sie ist irrational (unendlich viele Stellen ohne Wiederholung), e und φ ebenso. Für den Alltag reichen π ≈ 3,14159 und e ≈ 2,71828.'},
{id:'m-naeherung',subj:'mathe',title:'Näherungen für π und Wurzeln',icon:'🎯',cols:['Näherung','Dezimalwert','Fehler'],rows:[
 ['π ≈ 3','3,000 000','−0,142 (4,5 %)'],['π ≈ 3,14','3,140 000','−0,0016'],['π ≈ 22/7 (Archimedes)','3,142 857','+0,0013'],['π ≈ 355/113 (Zu Chongzhi)','3,141 592 92','+0,000 000 27'],['π ≈ √10','3,162 278','+0,0207'],
 ['√2 ≈ 99/70','1,414 285 7','+0,000 072'],['√2 ≈ 1,4142','1,414 200','−0,000 014'],['e ≈ 19/7','2,714 286','−0,0040'],['e ≈ 2,718','2,718 000','−0,000 282']],
 note:'Fehler = Näherung minus genauer Wert (Vorzeichen: + heißt zu groß).'},
{id:'m-fibonacci',subj:'mathe',title:'Fibonacci-Zahlen, Fakultäten und Dreieckszahlen',icon:'🐚',cols:['n','Fibonacci Fₙ','Fakultät n!','Dreieckszahl n(n+1)/2'],rows:[
['0','0','1','0'],
['1','1','1','1'],
['2','1','2','3'],
['3','2','6','6'],
['4','3','24','10'],
['5','5','120','15'],
['6','8','720','21'],
['7','13','5 040','28'],
['8','21','40 320','36'],
['9','34','362 880','45'],
['10','55','3 628 800','55'],
['11','89','39 916 800','66'],
['12','144','479 001 600','78'],
['13','233','6 227 020 800','91'],
['14','377','87 178 291 200','105'],
['15','610','1 307 674 368 000','120'],
['16','987','20 922 789 888 000','136'],
['17','1 597','355 687 428 096 000','153'],
['18','2 584','6 402 373 705 728 000','171'],
['19','4 181','121 645 100 408 832 000','190'],
['20','6 765','2 432 902 008 176 640 000','210']],
 note:'Fibonacci: F₀ = 0, F₁ = 1, Fₙ = Fₙ₋₁ + Fₙ₋₂. Das Verhältnis Fₙ₊₁ / Fₙ nähert sich dem Goldenen Schnitt φ ≈ 1,618.'},
{id:'m-bruch',subj:'mathe',title:'Brüche, Dezimalzahlen und Prozent',icon:'🍰',cols:['Bruch','Dezimalzahl','Prozent'],rows:[
 ['1/2','0,5','50 %'],['1/3','0,333… (Periode 3)','33,3 %'],['2/3','0,666… (Periode 6)','66,7 %'],['1/4','0,25','25 %'],['3/4','0,75','75 %'],['1/5','0,2','20 %'],['2/5','0,4','40 %'],['3/5','0,6','60 %'],['4/5','0,8','80 %'],
 ['1/6','0,1666…','16,7 %'],['1/7','0,142857142857… (Periode 142857)','14,3 %'],['1/8','0,125','12,5 %'],['3/8','0,375','37,5 %'],['5/8','0,625','62,5 %'],['7/8','0,875','87,5 %'],['1/9','0,111… (Periode 1)','11,1 %'],['1/10','0,1','10 %'],['1/12','0,08333…','8,3 %'],['1/16','0,0625','6,25 %'],['1/20','0,05','5 %'],['1/25','0,04','4 %'],['1/50','0,02','2 %'],['1/100','0,01','1 %']]},
{id:'m-zehner',subj:'mathe',title:'Große und kleine Zahlen (Zehnerpotenzen)',icon:'🔭',cols:['Zehnerpotenz','Zahl','Name (deutsch)'],rows:[
 ['10³','1 000','Tausend'],['10⁶','1 000 000','Million'],['10⁹','1 000 000 000','Milliarde'],['10¹²','1 000 000 000 000','Billion'],['10¹⁵','1 000 000 000 000 000','Billiarde'],['10¹⁸','1 000 000 000 000 000 000','Trillion'],['10²¹','1 000 000 000 000 000 000 000','Trilliarde'],['10²⁴','1 mit 24 Nullen','Quadrillion'],['10¹⁰⁰','1 mit 100 Nullen','Googol'],
 ['10⁻³','0,001','Tausendstel'],['10⁻⁶','0,000 001','Millionstel'],['10⁻⁹','0,000 000 001','Milliardstel'],['10⁻¹²','0,000 000 000 001','Billionstel']],
 note:'Vorsicht bei Übersetzungen: Die englische „billion“ ist unsere Milliarde (10⁹), die englische „trillion“ ist unsere Billion (10¹²).'},
{id:'m-roemisch',subj:'mathe',title:'Römische Zahlen',icon:'🏛️',cols:['Zeichen','Wert','Beispiele'],rows:[
 ['I','1','III = 3,  IV = 4'],['V','5','VI = 6,  IX = 9'],['X','10','XIV = 14,  XL = 40'],['L','50','XC = 90'],['C','100','CD = 400'],['D','500','CM = 900'],['M','1000','MMXXVI = 2026']],note:'Kleinere Zeichen vor einem größeren werden abgezogen (IV = 5 − 1).'},
{id:'m-griechisch',subj:'mathe',title:'Griechisches Alphabet',icon:'Ω',cols:['Klein','Groß','Name'],rows:[
 ['α','Α','Alpha'],['β','Β','Beta'],['γ','Γ','Gamma'],['δ','Δ','Delta'],['ε','Ε','Epsilon'],['ζ','Ζ','Zeta'],['η','Η','Eta'],['θ','Θ','Theta'],['ι','Ι','Iota'],['κ','Κ','Kappa'],['λ','Λ','Lambda'],['μ','Μ','My'],
 ['ν','Ν','Ny'],['ξ','Ξ','Xi'],['ο','Ο','Omikron'],['π','Π','Pi'],['ρ','Ρ','Rho'],['σ','Σ','Sigma'],['τ','Τ','Tau'],['υ','Υ','Ypsilon'],['φ','Φ','Phi'],['χ','Χ','Chi'],['ψ','Ψ','Psi'],['ω','Ω','Omega']]},

/* ───────── PHYSIK ───────── */
{id:'p-si',subj:'physik',title:'SI-Basiseinheiten',icon:'📏',cols:['Größe','Einheit','Zeichen'],rows:[
 ['Länge','Meter','m'],['Masse','Kilogramm','kg'],['Zeit','Sekunde','s'],['elektrische Stromstärke','Ampere','A'],['Temperatur','Kelvin','K'],['Stoffmenge','Mol','mol'],['Lichtstärke','Candela','cd']]},
{id:'p-vorsaetze',subj:'physik',title:'Vorsätze für Einheiten',icon:'🔟',cols:['Vorsatz','Zeichen','Faktor'],rows:[
 ['Exa','E','10¹⁸'],['Peta','P','10¹⁵'],['Tera','T','10¹²'],['Giga','G','10⁹'],['Mega','M','10⁶'],['Kilo','k','10³'],['Hekto','h','10²'],['Deka','da','10¹'],['Dezi','d','10⁻¹'],['Zenti','c','10⁻²'],
 ['Milli','m','10⁻³'],['Mikro','µ','10⁻⁶'],['Nano','n','10⁻⁹'],['Piko','p','10⁻¹²'],['Femto','f','10⁻¹⁵']]},
{id:'p-einheiten',subj:'physik',title:'Abgeleitete Einheiten',icon:'🧱',cols:['Größe','Einheit','Zusammensetzung'],rows:[
 ['Kraft','Newton (N)','kg · m / s²'],['Druck','Pascal (Pa)','N / m²'],['Energie, Arbeit, Wärme','Joule (J)','N · m = W · s'],['Leistung','Watt (W)','J / s'],['Frequenz','Hertz (Hz)','1 / s'],['Ladung','Coulomb (C)','A · s'],
 ['Spannung','Volt (V)','W / A'],['Widerstand','Ohm (Ω)','V / A'],['Kapazität','Farad (F)','C / V'],['Induktivität','Henry (H)','V · s / A'],['magnetische Flussdichte','Tesla (T)','V · s / m²'],['Radioaktivität','Becquerel (Bq)','1 / s']]},
{id:'p-konstanten',subj:'physik',title:'Naturkonstanten',icon:'🔬',cols:['Größe','Zeichen','Wert'],rows:[
 ['Lichtgeschwindigkeit im Vakuum','c','299 792 458 m/s  (exakt; ≈ 3 · 10⁸ m/s)'],['Gravitationskonstante','G','6,674 30 · 10⁻¹¹ m³ / (kg · s²)'],['Normfallbeschleunigung','g','9,806 65 m/s²  (meist 9,81 m/s²)'],
 ['Plancksches Wirkungsquantum','h','6,626 070 15 · 10⁻³⁴ J · s  (exakt)'],['Elementarladung','e','1,602 176 634 · 10⁻¹⁹ C  (exakt)'],['Elektronenmasse','mₑ','9,109 383 71 · 10⁻³¹ kg'],['Protonenmasse','mₚ','1,672 621 926 · 10⁻²⁷ kg'],['Neutronenmasse','mₙ','1,674 927 501 · 10⁻²⁷ kg'],
 ['atomare Masseneinheit','u','1,660 539 069 · 10⁻²⁷ kg'],['Avogadro-Konstante','N_A','6,022 140 76 · 10²³ 1/mol  (exakt)'],['Boltzmann-Konstante','k_B','1,380 649 · 10⁻²³ J/K  (exakt)'],['universelle Gaskonstante','R','8,314 462 618 J / (mol · K)'],
 ['Faraday-Konstante','F','96 485,332 12 C/mol'],['elektrische Feldkonstante','ε₀','8,854 187 819 · 10⁻¹² F/m'],['magnetische Feldkonstante','μ₀','1,256 637 061 · 10⁻⁶ N/A²'],['Stefan-Boltzmann-Konstante','σ','5,670 374 419 · 10⁻⁸ W / (m² · K⁴)']],
 note:'Werte nach CODATA 2022 (NIST). Seit 2019 sind c, h, e, k_B und N_A per Definition exakt.'},
{id:'p-widerstand',subj:'physik',title:'Farbcode für Widerstände',icon:'🌈',cols:['Farbe','Ziffer','Multiplikator','Toleranz'],rows:[
 ['schwarz','0','× 1','–'],['braun','1','× 10','± 1 %'],['rot','2','× 100','± 2 %'],['orange','3','× 1 kΩ','–'],['gelb','4','× 10 kΩ','–'],['grün','5','× 100 kΩ','± 0,5 %'],['blau','6','× 1 MΩ','± 0,25 %'],
 ['violett','7','× 10 MΩ','± 0,1 %'],['grau','8','–','–'],['weiß','9','–','–'],['gold','–','× 0,1','± 5 %'],['silber','–','× 0,01','± 10 %']],note:'Die ersten beiden (oder drei) Ringe sind Ziffern, danach kommt der Multiplikator, zuletzt die Toleranz. Weitere, engere Toleranzen (z. B. grau ± 0,01 %) kommen nur bei Präzisionswiderständen vor.'},
{id:'p-dichte',subj:'physik',title:'Stoffwerte: Dichte, Schmelz- und Siedepunkt',icon:'🧲',cols:['Stoff','Dichte in g/cm³','Schmelzpunkt in °C','Siedepunkt in °C'],rows:[
 ['Wasser','1,00 (bei 4 °C)','0','100'],['Eis','0,92','0','–'],['Ethanol','0,79','−114','78'],['Quecksilber','13,53','−38,8','356,7'],['Aluminium','2,70','660,3','2519'],['Eisen','7,86','1538','2861'],['Kupfer','8,96','1084,6','2562'],
 ['Silber','10,49','961,8','2162'],['Gold','19,3','1064,2','2856'],['Blei','11,34','327,5','1749'],['Zink','7,14','419,5','907'],['Zinn (weiß)','7,27','231,9','2602'],['Stahl','ca. 7,85','ca. 1400–1500','–'],['Glas','ca. 2,5','–','–'],['Luft (20 °C)','0,0012','–','–']],
 note:'Dichten bei Raumtemperatur; Werte der Elemente nach dem CRC Handbook of Chemistry and Physics.'},
{id:'p-waerme',subj:'physik',title:'Spezifische Wärmekapazität',icon:'🔥',cols:['Stoff','c in J / (kg · K)'],rows:[
 ['Wasser (25 °C)','4181'],['Eis (−10 °C)','2050'],['Ethanol','2440'],['Luft (0 °C, trocken)','1003,5'],['Aluminium','897'],['Eisen','449'],['Kupfer','385'],['Quecksilber','139,5'],['Blei','129'],['Gold','129']],note:'Wärmemenge Q = c · m · ΔT. Werte bei 25 °C, wenn nichts anderes dabeisteht.'},
{id:'p-schall',subj:'physik',title:'Schallgeschwindigkeit',icon:'🔊',cols:['Stoff','Geschwindigkeit in m/s'],rows:[
 ['Luft (20 °C)','343'],['Luft (0 °C)','331'],['Wasser (20 °C)','1481'],['Meerwasser','ca. 1500'],['Stahl','ca. 5930']],note:'Licht im Vakuum: 299 792 458 m/s. Schall braucht einen Stoff und breitet sich im Vakuum nicht aus.'},
{id:'p-temp',subj:'physik',title:'Temperatur und Zustände',icon:'🌡️',cols:['Umrechnung','Formel'],rows:[
 ['Celsius → Kelvin','T = ϑ + 273,15'],['Kelvin → Celsius','ϑ = T − 273,15'],['Celsius → Fahrenheit','°F = °C · 9/5 + 32'],['Fahrenheit → Celsius','°C = (°F − 32) · 5/9'],['absoluter Nullpunkt','0 K = −273,15 °C'],['Wassers Gefrierpunkt / Siedepunkt','273,15 K / 373,15 K']]},

/* ───────── CHEMIE ───────── */
{id:'c-pse',subj:'chemie',title:'Periodensystem der Elemente',icon:'🗂️',cols:['Hinweis'],rows:[['Alle 118 Elemente mit Symbol, Masse, Gruppe und Zustand findest du im eigenen Periodensystem – dort gibt es auch ein Quiz.']],link:{label:'🧪 Zum Periodensystem',app:'periodensystem'}},
{id:'c-en',subj:'chemie',title:'Elektronegativität (nach Pauling)',icon:'⚡',cols:['Element','EN','Element','EN'],rows:[
 ['H','2,20','Na','0,93'],['Li','0,98','Mg','1,31'],['Be','1,57','Al','1,61'],['B','2,04','Si','1,90'],['C','2,55','P','2,19'],['N','3,04','S','2,58'],['O','3,44','Cl','3,16'],['F','3,98','Br','2,96'],
 ['K','0,82','I','2,66'],['Ca','1,00','Fe','1,83'],['Cu','1,90','Zn','1,65'],['Ag','1,93','Au','2,54']],
 note:'Differenz bis 0,4: unpolare Bindung; 0,4–1,7: polare Atombindung; über 1,7: Ionenbindung (Faustregel).'},
{id:'c-ionen',subj:'chemie',title:'Wichtige Ionen',icon:'➕',cols:['Formel','Name','Formel','Name'],rows:[
 ['Na⁺','Natrium','Cl⁻','Chlorid'],['K⁺','Kalium','Br⁻','Bromid'],['Ag⁺','Silber','I⁻','Iodid'],['NH₄⁺','Ammonium','F⁻','Fluorid'],['H₃O⁺','Oxonium','O²⁻','Oxid'],['Mg²⁺','Magnesium','S²⁻','Sulfid'],['Ca²⁺','Calcium','OH⁻','Hydroxid'],
 ['Cu²⁺','Kupfer(II)','NO₃⁻','Nitrat'],['Zn²⁺','Zink','SO₄²⁻','Sulfat'],['Fe²⁺','Eisen(II)','SO₃²⁻','Sulfit'],['Fe³⁺','Eisen(III)','CO₃²⁻','Carbonat'],['Al³⁺','Aluminium','PO₄³⁻','Phosphat'],['Pb²⁺','Blei(II)','HCO₃⁻','Hydrogencarbonat'],['Ba²⁺','Barium','MnO₄⁻','Permanganat']]},
{id:'c-saeuren',subj:'chemie',title:'Säuren und Basen',icon:'🧴',cols:['Formel','Name','Art'],rows:[
 ['HCl','Salzsäure','Säure'],['H₂SO₄','Schwefelsäure','Säure'],['HNO₃','Salpetersäure','Säure'],['H₃PO₄','Phosphorsäure','Säure'],['H₂CO₃','Kohlensäure','Säure'],['CH₃COOH','Essigsäure','Säure'],['HF','Flusssäure','Säure'],
 ['NaOH','Natronlauge','Base'],['KOH','Kalilauge','Base'],['Ca(OH)₂','Kalkwasser','Base'],['NH₃','Ammoniak (Lösung: Salmiakgeist)','Base']]},
{id:'c-ph',subj:'chemie',title:'pH-Werte im Alltag',icon:'🧪',cols:['Stoff','pH-Wert'],rows:[
 ['Batteriesäure','0'],['Magensäure','1–2'],['Zitronensaft','2'],['Cola','ca. 3'],['Essig','ca. 2,5'],['Kaffee','5'],['Regen (sauber)','ca. 5,6'],['Milch','6,5'],['reines Wasser','7'],['Blut','7,4'],['Meerwasser','ca. 8'],['Seife','9–10'],['Ammoniaklösung','11'],['Bleiche','12–13'],['Natronlauge','14']],
 note:'pH < 7 sauer, pH = 7 neutral, pH > 7 basisch (alkalisch).'},
{id:'c-alkane',subj:'chemie',title:'Alkane',icon:'⛓️',cols:['Name','Formel','Siedepunkt in °C'],rows:[
 ['Methan','CH₄','−162'],['Ethan','C₂H₆','−89'],['Propan','C₃H₈','−42'],['Butan','C₄H₁₀','−0,5'],['Pentan','C₅H₁₂','36'],['Hexan','C₆H₁₄','69'],['Heptan','C₇H₁₆','98'],['Octan','C₈H₁₈','126'],['Nonan','C₉H₂₀','151'],['Decan','C₁₀H₂₂','174']],note:'Allgemeine Formel der Alkane: CₙH₂ₙ₊₂.'},
{id:'c-gruppen',subj:'chemie',title:'Funktionelle Gruppen (Organik)',icon:'🧬',cols:['Stoffklasse','Gruppe','Beispiel'],rows:[
 ['Alkohol','–OH  (Hydroxy)','Ethanol C₂H₅OH'],['Aldehyd','–CHO','Ethanal CH₃CHO'],['Keton','C=O in der Kette','Propanon (Aceton)'],['Carbonsäure','–COOH','Essigsäure CH₃COOH'],['Ester','–COO–','Essigsäureethylester'],['Ether','–O–','Diethylether'],['Amin','–NH₂','Methylamin CH₃NH₂']]},
{id:'c-molmasse',subj:'chemie',title:'Molare Massen häufiger Stoffe',icon:'⚖️',cols:['Stoff','Formel','M in g/mol'],rows:[
 ['Wasserstoff','H₂','2,02'],['Sauerstoff','O₂','32,00'],['Stickstoff','N₂','28,01'],['Wasser','H₂O','18,02'],['Kohlenstoffdioxid','CO₂','44,01'],['Methan','CH₄','16,04'],['Ammoniak','NH₃','17,03'],['Chlorwasserstoff','HCl','36,46'],
 ['Natriumhydroxid','NaOH','40,00'],['Schwefelsäure','H₂SO₄','98,07'],['Kochsalz','NaCl','58,44'],['Kalk (Calciumcarbonat)','CaCO₃','100,09'],['Traubenzucker (Glucose)','C₆H₁₂O₆','180,16']],note:'Berechnet aus den Atommassen des Periodensystems.'},
{id:'c-loeslich',subj:'chemie',title:'Löslichkeit von Salzen (Faustregeln)',icon:'💧',cols:['Regel'],rows:[
 ['Alle Nitrate (NO₃⁻) sind gut löslich.'],['Alle Salze der Alkalimetalle (Na⁺, K⁺, Li⁺) und Ammoniumsalze sind gut löslich.'],['Chloride sind gut löslich – außer AgCl und PbCl₂.'],
 ['Sulfate sind gut löslich – außer BaSO₄ und PbSO₄; CaSO₄ ist nur schwer löslich.'],['Carbonate, Phosphate und Sulfide sind meist schwer löslich (außer mit Alkalimetallen).'],['Hydroxide sind meist schwer löslich (außer NaOH, KOH; Ca(OH)₂ mäßig).']]},
{id:'c-nachweis',subj:'chemie',title:'Nachweisreaktionen',icon:'🔎',cols:['Stoff','Nachweis','Beobachtung'],rows:[
 ['Kohlenstoffdioxid','Kalkwasser','wird trüb (weißer Niederschlag CaCO₃)'],['Sauerstoff','Glimmspanprobe','Glimmspan leuchtet hell auf'],['Wasserstoff','Knallgasprobe','Es knallt / pfeift'],['Wasser','wasserfreies Kupfersulfat','wird von weiß zu blau'],
 ['Chlorid-Ionen','Silbernitratlösung','weißer Niederschlag (AgCl)'],['Sulfat-Ionen','Bariumchloridlösung','weißer Niederschlag (BaSO₄)'],['Stärke','Iod-Kaliumiodid-Lösung','blauviolette Färbung'],['Traubenzucker','Fehling-Probe','ziegelroter Niederschlag'],
 ['Säure / Base','Universalindikator','rot–gelb (sauer), grün (neutral), blau–violett (basisch)'],['Base','Phenolphthalein','farblos → pink (ab pH 8,2)']]},
{id:'c-reihe',subj:'chemie',title:'Spannungsreihe der Metalle',icon:'🔋',cols:['unedel → edel'],rows:[['Li, K, Ca, Na, Mg, Al, Zn, Fe, Ni, Sn, Pb, H, Cu, Ag, Hg, Pt, Au'],['Je weiter links, desto unedler: Das Metall gibt leichter Elektronen ab und reagiert stärker mit Säuren.']]},

/* ───────── ASTRONOMIE & ERDE ───────── */
{id:'a-planeten',subj:'astro',title:'Planeten des Sonnensystems',icon:'🪐',cols:['Planet','Abstand zur Sonne (Bahnhalbachse) in Mio. km','Durchmesser am Äquator in km','Umlaufzeit','Fallbeschleunigung in m/s²'],rows:[
 ['Merkur','57,9','4879','88,0 Tage','3,7'],['Venus','108,2','12 104','224,7 Tage','8,9'],['Erde','149,6','12 756','365,26 Tage','9,8'],['Mars','227,9','6792','687,0 Tage','3,7'],['Jupiter','778,4','142 984','4333 Tage (11,86 Jahre)','23,1'],
 ['Saturn','1427','120 536','10 759 Tage (29,45 Jahre)','9,0'],['Uranus','2871','51 118','30 688 Tage (84,02 Jahre)','8,7'],['Neptun','4498','49 528','60 182 Tage (164,8 Jahre)','11,0']],note:'Bahnhalbachse und Umlaufzeit nach JPL (mittlere Bahnelemente), Durchmesser und Fallbeschleunigung nach dem NASA Planetary Fact Sheet. Bei den Gasplaneten gilt die Fallbeschleunigung in Höhe der Wolkenobergrenze. Die Bahnhalbachsen der großen Planeten schwanken je nach Quelle um etwa 0,5 %, weil sie sich gegenseitig anziehen.'},
{id:'a-daten',subj:'astro',title:'Sonne, Erde, Mond und Entfernungen',icon:'☀️',cols:['Größe','Wert'],rows:[
 ['Sonne: Radius','ca. 695 700 km'],['Sonne: Masse','1,989 · 10³⁰ kg'],['Erde: mittlerer Radius','6371 km'],['Erde: Masse','5,972 · 10²⁴ kg'],['Erde: Umfang am Äquator','40 075 km'],['Mond: mittlerer Radius','1737,4 km'],['Mond: Masse','7,346 · 10²² kg'],
 ['Mond: mittlere Entfernung zur Erde','384 400 km'],['Astronomische Einheit (AE)','149 597 870,7 km  (≈ 149,6 Mio. km)'],['Lichtjahr','9,461 · 10¹² km'],['Parsec','3,26 Lichtjahre'],['Licht von der Sonne zur Erde','ca. 8 min 19 s'],['Umlauf der Erde um die Sonne','ca. 365,25 Tage'],['Umlauf des Mondes um die Erde','27,32 Tage (Mondphasen: 29,53 Tage)']]},
{id:'a-erde',subj:'astro',title:'Erde: Zahlen und Rekorde',icon:'🌍',cols:['Größe','Wert'],rows:[
 ['Erdoberfläche','510,1 Mio. km²  (davon ca. 71 % Wasser)'],['höchster Berg über dem Meeresspiegel','Mount Everest, 8848,86 m'],['tiefste bekannte Stelle im Meer','Challenger Deep im Marianengraben, ca. 10 935 m (± 6 m)'],['Erdalter','ca. 4,54 Milliarden Jahre'],['Kontinente','Europa, Asien, Afrika, Nordamerika, Südamerika, Australien/Ozeanien, Antarktis'],
 ['Weltmeere','Pazifischer, Atlantischer, Indischer, Südlicher und Arktischer Ozean'],['Tageslänge','24 h (Sonnentag); eine Drehung der Erde dauert 23 h 56 min 4 s'],['Neigung der Erdachse','ca. 23,44°']]},

/* ───────── INFORMATIK ───────── */
{id:'i-zahlen',subj:'info',title:'Zahlensysteme: Dezimal, Binär, Hexadezimal',icon:'0️⃣',cols:['Dezimal','Binär','Hexadezimal'],
 rows:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,32,64,100,128,255,256].map(n=>[String(n),n.toString(2),n.toString(16).toUpperCase()])},
{id:'i-zweier',subj:'info',title:'Zweierpotenzen',icon:'2️⃣',cols:['Potenz','Wert'],rows:Array.from({length:17},(_,i)=>['2^'+i,String(Math.pow(2,i)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')]),note:'Bits: 8 Bit = 1 Byte.  1 KiB = 1024 Byte,  1 MiB = 1024 KiB,  1 GiB = 1024 MiB.  (1 kB = 1000 Byte,  1 MB = 1000 kB.)'},
{id:'i-logik',subj:'info',title:'Logik-Gatter (Wahrheitstabellen)',icon:'🔀',cols:['A','B','UND','ODER','XOR','NAND','NOR'],rows:[['0','0','0','0','0','1','1'],['0','1','0','1','1','1','0'],['1','0','0','1','1','1','0'],['1','1','1','1','0','0','0']],note:'NICHT (NOT): aus 0 wird 1 und aus 1 wird 0.'},
{id:'i-einheiten',subj:'info',title:'Datengrößen',icon:'💾',cols:['Einheit','Bedeutung'],rows:[['1 Bit','kleinste Einheit: 0 oder 1'],['1 Byte','8 Bit'],['1 KiB','1024 Byte'],['1 MiB','1024 KiB = 1 048 576 Byte'],['1 GiB','1024 MiB'],['1 TiB','1024 GiB'],['ASCII','7 Bit pro Zeichen, 128 Zeichen (A = 65, a = 97, 0 = 48)'],['Farbe (RGB)','3 Byte: je 0–255 für Rot, Grün, Blau']]},

/* ───────── UMRECHNEN & ALLTAG ───────── */
{id:'u-laenge',subj:'alltag',title:'Längen, Flächen, Volumen',icon:'📐',cols:['Einheit','Umrechnung'],rows:[
 ['1 km','1000 m'],['1 m','100 cm = 1000 mm'],['1 Zoll (inch)','2,54 cm'],['1 Fuß (foot)','30,48 cm'],['1 Meile (mile)','1,609 km'],['1 Seemeile','1,852 km'],['1 ha (Hektar)','10 000 m²'],['1 a (Ar)','100 m²'],['1 km²','100 ha = 1 000 000 m²'],
 ['1 m³','1000 L'],['1 L','1000 mL = 1 dm³'],['1 mL','1 cm³'],['1 Gallone (US)','3,785 L']]},
{id:'u-masse',subj:'alltag',title:'Masse, Zeit, Geschwindigkeit, Energie',icon:'⏱️',cols:['Einheit','Umrechnung'],rows:[
 ['1 t','1000 kg'],['1 kg','1000 g'],['1 Pfund (lb)','453,6 g'],['1 Unze (oz)','28,35 g'],['1 h','60 min = 3600 s'],['1 Tag','24 h = 86 400 s'],['1 Jahr','365 Tage (Schaltjahr 366)'],
 ['km/h → m/s','durch 3,6 teilen'],['m/s → km/h','mal 3,6'],['1 Knoten','1,852 km/h'],['1 kWh','3,6 MJ = 3 600 000 J'],['1 PS','ca. 735,5 W'],['1 bar','100 000 Pa = 1000 hPa'],['1 atm','1013,25 hPa']]},
{id:'u-nato',subj:'alltag',title:'Buchstabieralphabet (DIN 5009)',icon:'🔤',cols:['Buchstabe','seit 2022 (Städte)','bis 2022 (Namen)'],rows:[
 ['A','Aachen','Anton'],['B','Berlin','Berta'],['C','Chemnitz','Cäsar'],['D','Düsseldorf','Dora'],['E','Essen','Emil'],['F','Frankfurt','Friedrich'],['G','Goslar','Gustav'],['H','Hamburg','Heinrich'],['I','Ingelheim','Ida'],
 ['J','Jena','Julius'],['K','Köln','Kaufmann'],['L','Leipzig','Ludwig'],['M','München','Martha'],['N','Nürnberg','Nordpol'],['O','Offenbach','Otto'],['P','Potsdam','Paula'],['Q','Quickborn','Quelle'],['R','Rostock','Richard'],
 ['S','Salzwedel','Samuel'],['T','Tübingen','Theodor'],['U','Unna','Ulrich'],['V','Völklingen','Viktor'],['W','Wuppertal','Wilhelm'],['X','Xanten','Xanthippe'],['Y','Ypsilon','Ypsilon'],['Z','Zwickau','Zacharias']],
 note:'Die Norm DIN 5009 wurde 2022 überarbeitet: Städtenamen ersetzen die Vornamen. Umlaute werden mit „Umlaut“ davor gebuchstabiert (z. B. „Umlaut Aachen“).'},
{id:'u-morse',subj:'alltag',title:'Morsealphabet',icon:'📡',cols:['Zeichen','Morse','Zeichen','Morse','Zeichen','Morse'],rows:[
 ['A','·−','J','·−−−','S','···'],['B','−···','K','−·−','T','−'],['C','−·−·','L','·−··','U','··−'],['D','−··','M','−−','V','···−'],['E','·','N','−·','W','·−−'],['F','··−·','O','−−−','X','−··−'],
 ['G','−−·','P','·−−·','Y','−·−−'],['H','····','Q','−−·−','Z','−−··'],['I','··','R','·−·','SOS','··· −−− ···']]},
{id:'u-noten',subj:'alltag',title:'Notenschlüssel (IHK, Richtwert)',icon:'📝',cols:['Note','Bezeichnung','Prozent'],rows:[
 ['1','sehr gut','92–100 %'],['2','gut','81–91 %'],['3','befriedigend','67–80 %'],['4','ausreichend','50–66 %'],['5','mangelhaft','30–49 %'],['6','ungenügend','0–29 %']],note:'Der IHK-Schlüssel ist ein verbreiteter Richtwert. Schulen und Lehrkräfte legen die Grenzen teils anders fest.'}
];
