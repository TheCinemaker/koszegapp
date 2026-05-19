/**
 * KőszegAPP - Magyar tiltott szavak és obszcén kifejezések gyűjteménye
 * Ez a lista a látogatói üzenőfal automatikus szűréséhez készült (1. opció).
 * Tartalmazza az obszcén kifejezéseket, vulgáris igéket, testrészeket, sértő szlengeket
 * és a leggyakoribb megkerülési (leetspeak / írásjeles) próbálkozásokat.
 */

export const badWordsHU = [
  // === OBSZCÉN FŐNEVEK ÉS TESTRÉSZEK ===
  "fasz",
  "faszom",
  "faszfej",
  "faszkalap",
  "faszfejű",
  "faszkalapú",
  "faszfejü",
  "geci",
  "gecim",
  "gecinyelő",
  "geciláda",
  "geco",
  "geciy",
  "pina",
  "pinám",
  "punci",
  "puncim",
  "picsa",
  "picsám",
  "segg",
  "seggfej",
  "seggfejű",
  "seggnyaló",
  "kurva",
  "kurvaanyád",
  "kurvák",
  "kurafi",
  "köcsög",
  "kocsog",
  "köcsögök",
  "pöcs",
  "pocs",
  "pöcsfej",
  "pöcsöm",
  "csöcs",
  "csöcsök",
  "csecse",
  "kuki",
  "szarházi",
  "szardarab",
  "buzi",
  "buzis",
  "buzik",
  "homokos",
  "leszbikus", // olykor provokatív környezetben használt
  "csicska",
  "csicskás",
  "nyomorék",
  "retardált",
  "cigány" , // etnikai jellegű sértésként használva szűrendő
  "zsidó", // kontextustól függően provokatív/sértő kontextusban

  // === VULGÁRIS IGÉK ÉS CSELEKVÉSEK ===
  "baszik",
  "baszni",
  "basz",
  "baszat",
  "baszódj",
  "baszodj",
  "kibaszott",
  "lebasz",
  "elbasz",
  "szopik",
  "szopni",
  "szopás",
  "szopat",
  "leszop",
  "szopd le",
  "szopd",
  "szopkod",
  "szopkodás",
  "recska",
  "recskázik",
  "recskázni",
  "verni a",
  "kiveri a",
  "maszturb",
  "hugyozik",
  "hugyozni",
  "hugy",
  "hugyos",
  "szarik",
  "szarni",
  "szar",
  "szarok",
  "beszar",
  "lefos",
  "fosik",
  "fosni",
  "fos",
  "fosol",
  "fingik",
  "fingani",
  "fing",

  // === DURVA SÉRTÉSEK ÉS ÖSSZETÉTELEK ===
  "kurvaanyad",
  "kurvaanyád",
  "kurva_anyád",
  "kurvaanyadat",
  "kurvaanyádat",
  "anyád",
  "anyad",
  "anyadat",
  "anyádat",
  "apádat",
  "büdös",
  "budos",
  "gecifej",
  "geciség",
  "pinafej",
  "picsafej",
  "seggarc",
  "kurvanő",
  "kurvano",
  "szargombóc",
  "szarkupac",
  "gané",
  "ganej",
  "szarháziak",
  "görény",
  "patkány",
  "tetű",
  "tetves",

  // === LEETSPEAK / SPECIÁLIS KARAKTERES KERÜLŐUTAK ===
  "f@sz",
  "f@szom",
  "f@szfej",
  "fa$z",
  "fa$zom",
  "f4sz",
  "f.a.s.z",
  "fas z",
  "fa-sz",
  "fa_sz",
  "g@ci",
  "g@cim",
  "g.e.c.i",
  "gec i",
  "ge-ci",
  "ge_ci",
  "k.u.r.v.a",
  "k_u_r_v_a",
  "kurv@",
  "kvr@",
  "ku.rva",
  "k.urva",
  "p1na",
  "p1nám",
  "p.i.n.a",
  "p_i_n_a",
  "p.i.c.s.a",
  "p_i_c_s_a",
  "s.e.g.g",
  "s_e_g_g",
  "s3gg",
  "sz@r",
  "sz.ar",
  "b.u.z.i",
  "b_u_z_i",
  "bu2i",
  "k0cs0g",
  "k.ö.c.s.ö.g",
  "k_ö_c_s_ö_g",
  "p0cs",
  "p.ö.c.s"
];

/**
 * Egyszerű segédfüggvény a szöveg ellenőrzésére.
 * Claude közvetlenül használhatja a komponensben.
 * @param {string} text Az ellenőrizni kívánt üzenet
 * @returns {boolean} true, ha a szöveg tartalmaz tiltott szót, egyébként false
 */
export const containsProfanity = (text) => {
  if (!text) return false;
  
  // Kisbetűssé alakítjuk és megtisztítjuk az alapvető írásjelektől a jobb egyezésért
  const normalizedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eltávolítja az ékezeteket az ellenőrzés idejére
    .replace(/[^a-z0-9@$\s._-]/g, ""); // Csak betűk, számok és engedélyezett spec karakterek
    
  return badWordsHU.some(word => {
    // Ékezetmentesített tiltott szó
    const normalizedWord = word
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
      
    // Ellenőrizzük, hogy a szöveg tartalmazza-e a tiltott szót különálló szóként vagy szórészként
    const regex = new RegExp(`\\b${normalizedWord}\\b|${normalizedWord}`, "i");
    return regex.test(normalizedText) || normalizedText.includes(normalizedWord);
  });
};
