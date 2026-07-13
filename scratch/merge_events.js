import fs from 'fs';
import path from 'path';

// --- DATA DEFINITIONS ---

const varszinhazEvents = [
  {
    name: "Kőszeg Város Fúvószenekarának térzenéje",
    date: "2026-07-09",
    time: "19:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "Kőszeg Város Fúvószenekarának ünnepi térzenéje a történelmi belvárosban.",
    tags: ["várszínház", "zene", "fúvószene", "program"]
  },
  {
    name: "Bernard Slade: Jutalomjáték",
    date: "2026-07-09",
    endDate: "2026-07-11",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Bernard Slade: Jutalomjáték – a Kőszegi Várszínház bemutató előadása. Esőnap: július 12.",
    tags: ["várszínház", "színház", "előadás", "bemutató"]
  },
  {
    name: "Madarász Éva: Csók Lilly",
    date: "2026-07-10",
    time: "19:00",
    location: "Portré Étterem",
    coords: { lat: 47.3884, lng: 16.5414 },
    description: "Madarász Éva: Csók Lilly című könyvének bemutatója a Portré Étteremben.",
    tags: ["várszínház", "könyvbemutató", "program"]
  },
  {
    name: "Fő téri zene – Duo Don Pedro'z",
    date: "2026-07-11",
    time: "19:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Hangulatos nyáresti koncert a kőszegi Fő téren.",
    tags: ["várszínház", "zene", "koncert", "program"]
  },
  {
    name: "Fő téri zene – Bujtás Ervin",
    date: "2026-07-12",
    time: "19:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Bujtás Ervin akusztikus koncertje a Fő téren.",
    tags: ["várszínház", "zene", "koncert", "program"]
  },
  {
    name: "A bőgős fia és az ördögök (meg a malac)",
    date: "2026-07-13",
    time: "18:00",
    location: "Jurisics Vár, Toronyudvar",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Gyerekudvar - Harlekin Bábszínház előadása.",
    tags: ["várszínház", "gyerekudvar", "bábszínház", "gyerek"]
  },
  {
    name: "Kiss Ágnes: A tenger szeme",
    date: "2026-07-14",
    time: "18:00",
    location: "Jurisics Vár, Toronyudvar",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Gyerekudvar - Barboncás Társulat előadása.",
    tags: ["várszínház", "gyerekudvar", "előadás", "gyerek"]
  },
  {
    name: "Szabadtéren szabadabban?",
    date: "2026-07-14",
    time: "19:00",
    location: "Kamaraudvar (Jurisich Gimnázium)",
    coords: { lat: 47.3912, lng: 16.5422 },
    description: "Szakmai beszélgetés a szabadtéri színházak jelenéről és jövőjéről.",
    tags: ["várszínház", "beszélgetés", "program"]
  },
  {
    name: "Tiszavirág",
    date: "2026-07-15",
    time: "18:00",
    location: "Jurisics Vár, Toronyudvar",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Gyerekudvar - Barboncás Társulat előadása.",
    tags: ["várszínház", "gyerekudvar", "előadás", "gyerek"]
  },
  {
    name: "Fő téri zene – Korponay Zsófia és Bánó Zoltán",
    date: "2026-07-15",
    time: "19:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Korponay Zsófia és Bánó Zoltán zenei estje a Fő téren.",
    tags: ["várszínház", "zene", "koncert", "program"]
  },
  {
    name: "Deres Péter: A bábjátékos – Kemény Henrik emlékére",
    date: "2026-07-15",
    time: "20:30",
    location: "Kamaraudvar (Jurisich Gimnázium)",
    coords: { lat: 47.3912, lng: 16.5422 },
    description: "Deres Péter: A bábjátékos – Kemény Henrik emlékére. Esőnap: július 17.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "Stefan Vögel: Egy apró kérés",
    date: "2026-07-16",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Stefan Vögel: Egy apró kérés – A Kőszegi Várszínház előadása. Esőnap: július 17.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "Az igazmondó juhász",
    date: "2026-07-17",
    time: "18:00",
    location: "Jurisics Vár, Toronyudvar",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Gyerekudvar - Ziránó Színház előadása.",
    tags: ["várszínház", "gyerekudvar", "előadás", "gyerek"]
  },
  {
    name: "Prof. Dr. Kovács Péter előadása",
    date: "2026-07-17",
    time: "19:00",
    location: "Jurisics Vár, Kősház",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Prof. Dr. Kovács Péter: A Garai család felemelkedése a 15. században című tudományos előadás.",
    tags: ["várszínház", "előadás", "történelem"]
  },
  {
    name: "Fő téri zene – Sons Left Behind",
    date: "2026-07-17",
    time: "19:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A Sons Left Behind zenekar élő koncertje a kőszegi Fő téren.",
    tags: ["várszínház", "zene", "koncert", "program"]
  },
  {
    name: "Operett-Musical Est",
    date: "2026-07-18",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Népszerű operett- és musicalslágerek csendülnek fel a csodás hangulatú nagyszínpadon. Esőnap: július 19.",
    tags: ["várszínház", "zene", "operett", "musical", "előadás"]
  },
  {
    name: "Jon Fosse: Reggel és este",
    date: "2026-07-18",
    time: "20:30",
    location: "Kamaraudvar (Jurisich Gimnázium)",
    coords: { lat: 47.3912, lng: 16.5422 },
    description: "Jon Fosse: Reggel és este – Ördöghatlan Produkció. Esőnap: július 19.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "A zöldszakállú király",
    date: "2026-07-19",
    time: "18:00",
    location: "Jurisics Vár, Toronyudvar",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Gyerekudvar - Ziránó Színház előadása.",
    tags: ["várszínház", "gyerekudvar", "előadás", "gyerek"]
  },
  {
    name: "Harmonikával a világ körül Peltzer Gézával",
    date: "2026-07-19",
    time: "19:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Peltzer Géza harmonikaestje a Fő téren.",
    tags: ["várszínház", "zene", "harmonika", "koncert"]
  },
  {
    name: "Robin Hood",
    date: "2026-07-20",
    time: "18:00",
    location: "Jurisics Vár, Toronyudvar",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Gyerekudvar - Robin Hood bábos vásári játék, Illaberek Bábszínház előadása.",
    tags: ["várszínház", "gyerekudvar", "bábszínház", "gyerek"]
  },
  {
    name: "Rényi Ádám: Kerülőút",
    date: "2026-07-20",
    time: "20:30",
    location: "Kamaraudvar (Jurisich Gimnázium)",
    coords: { lat: 47.3912, lng: 16.5422 },
    description: "Rényi Ádám: Kerülőút – A 6Szín előadása. Esőnap: július 21.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "Marius von Mayenburg: EX",
    date: "2026-07-23",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Marius von Mayenburg: EX – Orlai produkció. Esőnap: július 24.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "Házastársas",
    date: "2026-07-25",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Különleges és humoros színházi este a párkapcsolati játszmákról. Esőnap: július 26.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "Moravetz Levente: Jöhetsz drágám!",
    date: "2026-07-27",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Moravetz Levente: Jöhetsz drágám! – Hadart Színház. Esőnap: július 28.",
    tags: ["várszínház", "színház", "előadás"]
  },
  {
    name: "Dan Goggin: Apácák",
    date: "2026-07-30",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Dan Goggin: Apácák – Karinthy Színház musical-vígjátéka. Esőnap: július 31.",
    tags: ["várszínház", "színház", "előadás", "musical"]
  },
  {
    name: "Dés-Geszti-Békés: A dzsungel könyve",
    date: "2026-08-01",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Dés-Geszti-Békés: A dzsungel könyve – Roxinház előadása. Esőnap: augusztus 2.",
    tags: ["várszínház", "színház", "előadás", "musical"]
  },
  {
    name: "Fabrice Roger-Lacan: A szomszéd ajtó",
    date: "2026-08-03",
    time: "20:30",
    location: "Jurisics Vár, Nagyszínpad",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Fabrice Roger-Lacan: A szomszéd ajtó – A Kőszegi Várszínház és a Kultkikötő bemutatója. Esőnap: augusztus 4.",
    tags: ["várszínház", "színház", "előadás"]
  }
];

const ostromEvents = [
  // --- Felvezető programok ---
  {
    name: "18. Ostrom Kupa - Nemzetközi ökölvívó verseny",
    date: "2026-08-05",
    endDate: "2026-08-07",
    time: "Egész nap",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "XIX. Kőszegi Ostromnapok felvezető ökölvívó versenye. Kiemelt esemény: U15-ös magyar válogatott megmérkőzik a szerb válogatottal. A rendezvény ideje alatt gyűjtést szervezünk a Myrtill Alapítvány közreműködésével két rászoruló kisgyermek, Hanna és Julcsi javára. Rossz idő esetén: Balog Iskola tornacsarnok.",
    tags: ["ostrom", "ostromnapok", "sport", "ökölvívás", "program"],
    highlight: true,
    highlightLabel: "Ostrom Kupa"
  },
  {
    name: "Honvédelmi Sportnap - Önvédelmi bemutató & megemlékezés",
    date: "2026-08-07",
    time: "10:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Honvédelmi Sportnap ökölvívó önvédelmi bemutatóval a Főtéren, hagyományőrző bemutatókkal, majd koszorúzás és megemlékezés Jurisics Miklós szobránál.",
    tags: ["ostrom", "ostromnapok", "sport", "honvédelem", "program"]
  },
  {
    name: "Honvédelmi Sportnap - Íjászat és akadálypálya",
    date: "2026-08-07",
    time: "11:15",
    location: "Diáksétány",
    coords: { lat: 47.3898, lng: 16.5413 },
    description: "Íjászprogram, lézerlövészet, paintball lövészet, akadálypálya álcahálóval és bójákkal a Diáksétányon.",
    tags: ["ostrom", "ostromnapok", "sport", "honvédelem", "gyerek", "program"]
  },
  {
    name: "V. Ostrom Várvédő Jótékonysági Futóverseny",
    date: "2026-08-08",
    time: "09:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "V. Ostrom Várvédő Jótékonysági Futóverseny. Távok: 1.5 km (tömegfutás/gyerekfutam az Óvároson és török táboron át), 7 km, 14 km, 22 km. Rajt: Jurisics tér. A nevezések teljes bevételét a Myrtill Alapítványon keresztül Hanna és Julcsi támogatására ajánlják fel.",
    tags: ["ostrom", "ostromnapok", "sport", "futás", "jótékonyság", "program"],
    highlight: true,
    highlightLabel: "Jótékonysági Futás"
  },
  // --- Fő programok ---
  // PÉNTEK
  {
    name: "XIX. Kőszegi Ostromnapokat megnyitó puskalövések",
    date: "2026-08-07",
    time: "15:32",
    location: "Hősök tornya",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "XIX. Kőszegi Ostromnapok hivatalos megnyitása hagyományőrző puskalövésekkel a Hősök tornyánál.",
    tags: ["ostrom", "ostromnapok", "megnyitó", "program"]
  },
  {
    name: "Ostrom kupa „megtámadása”",
    date: "2026-08-07",
    time: "16:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Az Ostrom Kupa jelképes, játékos megtámadása a Főtéren.",
    tags: ["ostrom", "ostromnapok", "ökölvívás", "program"]
  },
  {
    name: "Kőszegi Vonósok Koncert",
    date: "2026-08-07",
    time: "16:30",
    location: "Tábornokház loggia",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "A Kőszegi Vonósok hangulatos szabadtéri hangversenye a Tábornokház loggiájáról.",
    tags: ["ostrom", "ostromnapok", "zene", "koncert"]
  },
  {
    name: "BE-JÓ Történelmi Táncegyüttes bemutatója",
    date: "2026-08-07",
    time: "17:20",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "Történelmi és reneszánsz táncok bemutatója a Jurisics téren.",
    tags: ["ostrom", "ostromnapok", "tánc", "program"]
  },
  {
    name: "Kőszegi Tornyosok zenéje",
    date: "2026-08-07",
    time: "17:50",
    location: "Hősök tornya",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "Toronyzene a Hősök tornyából a Kőszegi Tornyosok előadásában.",
    tags: ["ostrom", "ostromnapok", "zene"]
  },
  {
    name: "Ostromállapot kihirdetése",
    date: "2026-08-07",
    time: "18:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "A város ostromállapotának ünnepélyes kihirdetése és a török ultimátum felolvasása.",
    tags: ["ostrom", "ostromnapok", "történelem", "program"],
    highlight: true,
    highlightLabel: "Ostromállapot"
  },
  {
    name: "Német táncház – Pornóapáti Néptáncegyüttes",
    date: "2026-08-07",
    time: "19:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "Népzenei koncert és táncház a Pornóapáti Néptáncegyüttessel.",
    tags: ["ostrom", "ostromnapok", "tánc", "táncház", "zene"]
  },
  {
    name: "„Ég a város, ég a ház is” - tüzes török támadás",
    date: "2026-08-07",
    time: "20:00",
    location: "Lépcsős várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "Látványos tüzes show és csatajelenet a Lépcsős vároroknál a török csapatok ostromának emlékére.",
    tags: ["ostrom", "ostromnapok", "csata", "tűzshow", "program"],
    highlight: true,
    highlightLabel: "Tüzes Támadás"
  },
  {
    name: "Kutyán Budavásár Koncert",
    date: "2026-08-07",
    time: "20:30",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A Kutyán Budavásár zenekar nyáresti koncertje a Fő téren.",
    tags: ["ostrom", "ostromnapok", "zene", "koncert"]
  },
  {
    name: "Fáklyás felvonulás a Jurisics térre",
    date: "2026-08-07",
    time: "21:05",
    location: "Várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "Hangulatos fáklyás menet a vároroktól a Jurisics térre a hagyományőrző csapatok részvételével.",
    tags: ["ostrom", "ostromnapok", "felvonulás", "program"]
  },
  {
    name: "„Török lesen” jelmezes túra",
    date: "2026-08-07",
    time: "21:30",
    location: "Tourinform iroda",
    coords: { lat: 47.3882, lng: 16.5417 },
    description: "Jelmezes éjszakai túra és nyomozás a belvárosban. Találkozó a Fő téri Tourinform irodánál.",
    tags: ["ostrom", "ostromnapok", "túra", "program"]
  },
  // SZOMBAT
  {
    name: "Éjszakai patronok kilövése",
    date: "2026-08-08",
    time: "09:00",
    location: "Hősök tornya",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "Ébresztő lövések a Hősök tornyánál, indítva az ostromhétvége szombati napját.",
    tags: ["ostrom", "ostromnapok", "program"]
  },
  {
    name: "Kőszeg védművei – Történelmi séta",
    date: "2026-08-08",
    time: "09:15",
    location: "Hősök tornya",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "Tematikus vár- és várostörténeti séta az ostrom kulcsfontosságú pontjain. Vezeti: Révész József múzeumigazgató.",
    tags: ["ostrom", "ostromnapok", "túra", "történelem", "előadás"]
  },
  {
    name: "A török sereg sétája a belvárosban",
    date: "2026-08-08",
    time: "10:00",
    location: "Várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "A török katonák bevonulása és hangos portyája a kőszegi történelmi utcákon.",
    tags: ["ostrom", "ostromnapok", "hagyományőrzés", "program"]
  },
  {
    name: "Ifjú vitézek próba",
    date: "2026-08-08",
    time: "10:00",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Vitézi próbák, játékos kiképzés gyermekek részére a várudvarban (12-13 óra között szünetel).",
    tags: ["ostrom", "ostromnapok", "gyerek", "játék", "program"]
  },
  {
    name: "Gyermek ostrom",
    date: "2026-08-08",
    time: "10:30",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Várostrom-játék 5-14 év közötti gyermekeknek szivacsfegyverekkel.",
    tags: ["ostrom", "ostromnapok", "gyerek", "játék"]
  },
  {
    name: "Vadászkutyabemutató",
    date: "2026-08-08",
    time: "11:00",
    location: "Várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "Különleges vadászkutya engedelmességi és ügyességi bemutató a várárokban.",
    tags: ["ostrom", "ostromnapok", "kutyabemutató", "program"]
  },
  {
    name: "Várvédő mustra",
    date: "2026-08-08",
    time: "11:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "A várvédő katonai csapatok felsorakozása, fegyvermustrája a Jurisics téren.",
    tags: ["ostrom", "ostromnapok", "hagyományőrzés", "program"]
  },
  {
    name: "Szablyatánc – Czenki Hársfa Néptáncegyüttes",
    date: "2026-08-08",
    time: "11:30",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "Hagyományos szablyatánc-bemutató és néptánc előadás.",
    tags: ["ostrom", "ostromnapok", "tánc", "zene"]
  },
  {
    name: "Vásárütés",
    date: "2026-08-08",
    time: "13:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "A török portyázó csapatok rajtaütése a történelmi belváros kézműves vásárán.",
    tags: ["ostrom", "ostromnapok", "hagyományőrzés", "program"]
  },
  {
    name: "Tárlatvezetés a Jurisics vár kiállításában",
    date: "2026-08-08",
    time: "13:00",
    location: "Jurisics vár lovagterem",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Vezetett történelmi séta a Jurisics vár állandó kiállításában. Érvényes várbelépő vagy Múzeumostrom bérlet szükséges.",
    tags: ["ostrom", "ostromnapok", "kiállítás", "történelem", "túra"]
  },
  {
    name: "Berecz Mátyás: Fegyvert s vitézt éneklek",
    date: "2026-08-08",
    time: "14:00",
    location: "Jurisics vár lovagterem",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Berecz Mátyás előadása: Fegyvert s vitézt éneklek – A török elleni harcok és az európai hadügyi forradalom.",
    tags: ["ostrom", "ostromnapok", "történelem", "előadás"]
  },
  {
    name: "Batthyány Lovas Bandérium és a Vitézlő Rend lovasbemutatója",
    date: "2026-08-08",
    time: "14:30",
    location: "Lépcsős várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "Középkori fegyveres lovasbemutató a Batthyány Lovas Bandérium és a Nyugati Vármegye Vitézlő Rendje előadásában.",
    tags: ["ostrom", "ostromnapok", "lovasbemutató", "hagyományőrzés", "program"]
  },
  {
    name: "Gyermek ostrom",
    date: "2026-08-08",
    time: "15:30",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Várostrom-játék 5-14 év közötti gyermekeknek szivacsfegyverekkel (második menet).",
    tags: ["ostrom", "ostromnapok", "gyerek", "játék"]
  },
  {
    name: "SilverBirds Bellydance Egyesület hastánc",
    date: "2026-08-08",
    time: "15:30",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A SilverBirds Bellydance Egyesület látványos keleti táncbemutatója a Fő téren.",
    tags: ["ostrom", "ostromnapok", "tánc", "hastánc"]
  },
  {
    name: "Ostrom felvonulás",
    date: "2026-08-08",
    time: "16:30",
    location: "Jurisics vár - Diáksétány",
    coords: { lat: 47.3898, lng: 16.5413 },
    description: "A hagyományőrző gyalogos és lovas sereg díszes menete a Várparktól a Diáksétányig.",
    tags: ["ostrom", "ostromnapok", "felvonulás", "program"],
    highlight: true,
    highlightLabel: "Ostrom Felvonulás"
  },
  {
    name: "Kőszegi Tornyosok zenéje",
    date: "2026-08-08",
    time: "18:00",
    location: "Hősök tornya",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "Toronyzene a Hősök tornyából az ostrom szombati zárásaként.",
    tags: ["ostrom", "ostromnapok", "zene"]
  },
  {
    name: "VÁROSTROM",
    date: "2026-08-08",
    time: "18:30",
    location: "Várfal, Diáksétány",
    coords: { lat: 47.3898, lng: 16.5413 },
    description: "A Kőszegi Ostromnapok fő attrakciója: a kőszegi vár ostromának látványos élő csatarekonstrukciója puskaporral, ágyúkkal és vitézi küzdelmekkel a Diáksétánynál. Belépés támogatói jeggyel.",
    tags: ["ostrom", "ostromnapok", "csata", "várostrom", "program"],
    highlight: true,
    highlightLabel: "Várostrom"
  },
  {
    name: "SOMNIUM Koncert",
    date: "2026-08-08",
    time: "19:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A SOMNIUM zenekar pop-rock koncertje a Fő téren.",
    tags: ["ostrom", "ostromnapok", "zene", "koncert"]
  },
  {
    name: "Kőszeg Város Koncert Fúvószenekara",
    date: "2026-08-08",
    time: "20:00",
    location: "Jurisics tér",
    coords: { lat: 47.3888, lng: 16.5411 },
    description: "Fúvószenei koncert a Jurisics téren Kőszeg Város Koncert Fúvószenekara előadásában.",
    tags: ["ostrom", "ostromnapok", "zene", "fúvószene"]
  },
  {
    name: "Szelindek - Régi Világzenék koncert",
    date: "2026-08-08",
    time: "21:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Középkori ihletésű energikus világzene a Szelindek együttes tolmácsolásában.",
    tags: ["ostrom", "ostromnapok", "zene", "koncert"]
  },
  {
    name: "Ostrom Retro disco",
    date: "2026-08-08",
    time: "22:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Nyáresti szabadtéri retro buli és tánc a Fő téren késő éjszakáig.",
    tags: ["ostrom", "ostromnapok", "disco", "zene", "program"]
  },
  // VASÁRNAP
  {
    name: "Ostromtúra a Szulejmán-kilátóhoz",
    date: "2026-08-09",
    time: "09:00",
    location: "Tourinform iroda",
    coords: { lat: 47.3882, lng: 16.5417 },
    description: "Gyalogos emléktúra a Szulejmán-kilátóhoz a Tourinform irodától indulva. Táv: 8 km.",
    tags: ["ostrom", "ostromnapok", "túra", "program"]
  },
  {
    name: "Kézműves foglalkozások a Csók István Művészkörrel",
    date: "2026-08-09",
    time: "10:00",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Családi kézműves foglalkozás, agyagozás és rajzolás a vár udvarán.",
    tags: ["ostrom", "ostromnapok", "gyerek", "kézműves", "program"]
  },
  {
    name: "„Harangszóig” csatazajos megemlékezés",
    date: "2026-08-09",
    time: "10:30",
    location: "Diáksétány",
    coords: { lat: 47.3898, lng: 16.5413 },
    description: "Megemlékezés az ostrom sikeres befejezéséről a történelmi 11 órás harangszó kíséretében, puskalövésekkel a Diáksétánynál.",
    tags: ["ostrom", "ostromnapok", "megemlékezés", "történelem", "program"],
    highlight: true,
    highlightLabel: "Harangszó csata"
  },
  {
    name: "ESŐNAP - Szombati rossz idő esetén Várostrom",
    date: "2026-08-09",
    time: "11:00",
    location: "Várfal, Diáksétány",
    coords: { lat: 47.3898, lng: 16.5413 },
    description: "Esőnap a szombati Várostrom esetleges pótlására a Diáksétánynál.",
    tags: ["ostrom", "ostromnapok", "esőnap", "várostrom"]
  },
  {
    name: "Gyermek ostrom",
    date: "2026-08-09",
    time: "11:30",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Várostrom-játék 5-14 év közötti gyermekeknek szivacsfegyverekkel a vasárnapi napon.",
    tags: ["ostrom", "ostromnapok", "gyerek", "játék"]
  },
  {
    name: "Tárlatvezetés a Tábornokházban és a Hősök tornyában",
    date: "2026-08-09",
    time: "11:30",
    location: "Hősök tornya",
    coords: { lat: 47.3887, lng: 16.5416 },
    description: "Vezetett történelmi séta a múzeum állandó kiállításaiban. Érvényes belépő vagy Múzeumostrom bérlet szükséges.",
    tags: ["ostrom", "ostromnapok", "túra", "történelem", "kiállítás"]
  },
  {
    name: "Kőszegi Borkereskedelem - Jurisics Bandérium",
    date: "2026-08-09",
    time: "13:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "Kőszegi borászati hagyományok bemutatása a Jurisics Bandérium katonai kíséretében a Fő téren.",
    tags: ["ostrom", "ostromnapok", "bor", "program"]
  },
  {
    name: "Gyulaffy Bandérium viselet- és fegyverbemutató",
    date: "2026-08-09",
    time: "14:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A Gyulaffy Bandérium végvári vitézi viselet- és fegyverzeti bemutatója a Fő téren.",
    tags: ["ostrom", "ostromnapok", "fegyverbemutató", "hagyományőrzés"]
  },
  {
    name: "Gyermek ostrom",
    date: "2026-08-09",
    time: "14:30",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Várostrom-játék 5-14 év közötti gyermekeknek szivacsfegyverekkel (délutáni menet).",
    tags: ["ostrom", "ostromnapok", "gyerek", "játék"]
  },
  {
    name: "SilverBirds Bellydance hastáncbemutató",
    date: "2026-08-09",
    time: "15:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A SilverBirds Bellydance Egyesület keleti hastánc előadása a Fő téren.",
    tags: ["ostrom", "ostromnapok", "tánc", "hastánc"]
  },
  {
    name: "Barátkozás Marton-Szállás lovaival",
    date: "2026-08-09",
    time: "15:00",
    location: "Várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "Családi és gyerekprogram: simogatás és barátkozás a hagyományőrző lovakkal a várárokban.",
    tags: ["ostrom", "ostromnapok", "lovaglás", "gyerek", "program"]
  },
  {
    name: "Hagyományőrző csapatok koszorúzása",
    date: "2026-08-09",
    time: "15:32",
    location: "Lépcsős várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "A XIX. Kőszegi Ostromnapok végvári katonai egységeinek ünnepélyes koszorúzási szertartása a vároroknál.",
    tags: ["ostrom", "ostromnapok", "koszorúzás", "történelem", "program"]
  },
  {
    name: "Gyermek-felnőtt közös ostrom",
    date: "2026-08-09",
    time: "16:00",
    location: "Lépcsős várorok",
    coords: { lat: 47.3892, lng: 16.5401 },
    description: "Közös, játékos záróostrom ifjú vitézek és felnőtt hagyományőrzők részvételével a Lépcsős vároroknál.",
    tags: ["ostrom", "ostromnapok", "játék", "program"]
  },
  {
    name: "Boglya Népzenei Együttes koncert és táncház",
    date: "2026-08-09",
    time: "16:00",
    location: "Fő tér",
    coords: { lat: 47.3881, lng: 16.5415 },
    description: "A Boglya Népzenei Együttes népzenei koncertje és vidám táncháza a Fő téren.",
    tags: ["ostrom", "ostromnapok", "zene", "népzene", "táncház"]
  },
  {
    name: "Marton-Szállás lovas íjász bemutató",
    date: "2026-08-09",
    time: "17:30",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "Marton-Szállás lovas íjászainak látványos, ügyességi bemutatója a Jurisics vár udvarán.",
    tags: ["ostrom", "ostromnapok", "lovasíjászat", "hagyományőrzés", "program"],
    highlight: true,
    highlightLabel: "Lovas íjászat"
  },
  {
    name: "Ataru Taiko Ütőegyüttes koncert",
    date: "2026-08-09",
    time: "19:00",
    location: "Jurisics vár",
    coords: { lat: 47.3896, lng: 16.5404 },
    description: "A monumentális japán dobfesztivál hangulatát idéző Ataru Taiko Ütőegyüttes nagyszabású zárókoncertje a Várudvarban.",
    tags: ["ostrom", "ostromnapok", "zene", "dob", "koncert"],
    highlight: true,
    highlightLabel: "Ataru Taiko"
  }
];

// --- MERGING PROCESS ---

console.log('Loading events.json...');
const eventsFile = './public/data/events.json';
let eventsData = [];
if (fs.existsSync(eventsFile)) {
  eventsData = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
}

// Map existing events by ID to avoid duplicates
const eventsMap = new Map();
eventsData.forEach(e => eventsMap.set(e.id, e));

// 1. Merge Várszínház events into events.json
varszinhazEvents.forEach((ve, idx) => {
  const id = `varszinhaz_2026_${idx + 1}`;
  const mergedEvent = {
    id,
    name: ve.name,
    date: ve.date,
    endDate: ve.endDate || ve.date,
    time: ve.time,
    location: ve.location,
    coords: ve.coords,
    description: ve.description,
    tags: ve.tags,
    image: "event_default.jpg",
    createdBy: "admin",
    highlight: false,
    highlightLabel: "",
    isVarszinhaz: true
  };
  eventsMap.set(id, mergedEvent);
});

// 2. Merge Ostromnapok events into events.json
ostromEvents.forEach((oe, idx) => {
  const id = `ostrom_2026_${idx + 1}`;
  const mergedEvent = {
    id,
    name: oe.name,
    date: oe.date,
    endDate: oe.endDate || oe.date,
    time: oe.time,
    location: oe.location,
    coords: oe.coords,
    description: oe.description,
    tags: oe.tags,
    image: "ostromhero.png", // Using the request: "az ostrom_hero képet használd az events-ekhez ami ostrommal kapcsolatos!"
    createdBy: "admin",
    highlight: oe.highlight || false,
    highlightLabel: oe.highlightLabel || "",
    isOstrom: true
  };
  eventsMap.set(id, mergedEvent);
});

// Write events.json back
const updatedEventsList = Array.from(eventsMap.values());
fs.writeFileSync(eventsFile, JSON.stringify(updatedEventsList, null, 2), 'utf8');
console.log(`Saved ${updatedEventsList.length} total events in events.json`);

// 3. Write ostrom_programok.json
// Group ostromEvents by date
const groupedByDate = {};
ostromEvents.forEach((oe, idx) => {
  const dateKey = oe.date;
  if (!groupedByDate[dateKey]) {
    groupedByDate[dateKey] = [];
  }
  
  // Format dates as ISO string for live countdown parsing in OstromPage.jsx
  // Assuming a default start time if time is 'Egész nap'
  let startHour = 10;
  let startMin = 0;
  if (oe.time && oe.time.includes(':')) {
    const parts = oe.time.split(':');
    startHour = parseInt(parts[0], 10);
    startMin = parseInt(parts[1], 10);
  }
  
  const startISO = `${oe.date}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
  const endISO = `${oe.date}T${String(startHour + 1).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;

  groupedByDate[dateKey].push({
    id: `ostrom_2026_${idx + 1}`,
    idopont: startISO,
    veg_idopont: endISO,
    nev: oe.name,
    kiemelt: oe.highlight || false,
    helyszin: {
      nev: oe.location,
      lat: oe.coords.lat,
      lng: oe.coords.lng
    },
    leiras: oe.description
  });
});

// Convert grouped object to array
const ostromProgramokList = Object.keys(groupedByDate).sort().map(dateStr => {
  return {
    datum: dateStr,
    esemenyek: groupedByDate[dateStr].sort((a, b) => a.idopont.localeCompare(b.idopont))
  };
});

const ostromProgramokFile = './public/data/ostrom_programok.json';
fs.writeFileSync(ostromProgramokFile, JSON.stringify(ostromProgramokList, null, 2), 'utf8');
console.log(`Saved program schedule in ${ostromProgramokFile}`);

console.log('Successfully completed data merging script!');
