export const RIDDLES = [
    {
        id: "riddle_1",
        text: {
            adult: "Irány a tér közepe, ahol a legtöbb ember fordul meg.",
            child: "Menjünk a tér közepére!"
        }
    },
    {
        id: "riddle_2",
        text: {
            adult: "Keressük meg a város határait. Hol vannak a régi falak?",
            child: "Keressünk egy régi, leomlott falat!"
        }
    },
    {
        id: "riddle_3",
        text: {
            adult: "Menjünk a Várkörre, ahol az élet keringett.",
            child: "Sétáljunk ki a körútra!"
        }
    },
    {
        id: "riddle_4",
        text: {
            adult: "Keress egy házat, ahol a parancsnokok laktak.",
            child: "Keressünk egy katonás házat!"
        }
    },
    {
        id: "riddle_5",
        text: {
            adult: "Vissza a Lábasházhoz! De most más szemmel nézz rá.",
            child: "Menjünk a lábas házikóhoz!"
        }
    },
    {
        id: "riddle_6",
        text: {
            adult: "Keress egy házat, ami egy családról (Chernel) kapta a nevét.",
            child: "Keressünk egy házat, aminek madaras neve van!"
        }
    },
    {
        id: "riddle_7",
        text: {
            adult: "Irány a Szent Jakab templom. A hit ereje vár.",
            child: "Menjünk a templomhoz!"
        }
    },
    {
        id: "riddle_8",
        text: {
            adult: "Nézzük meg a Sgraffitós házat!",
            child: "Nézzük meg a karcolt házat!"
        }
    },
    {
        id: "riddle_9",
        text: {
            adult: "A Jézus Szíve templom felé vesszük az irányt.",
            child: "Menjünk a nagy templomhoz!"
        }
    },
    {
        id: "riddle_10",
        text: {
            adult: "Keressük meg, hol volt régen a Városkapu!",
            child: "Hol mentek be régen a várba?"
        }
    },
    {
        id: "riddle_11",
        text: {
            adult: "Vissza a VÁRHOZ! (Jurisics Vár)",
            child: "Fussunk a várhoz!"
        }
    }
];

export const getRandomRiddle = (excludeIds = []) => {
    const available = RIDDLES.filter(r => !excludeIds.includes(r.id));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
};
