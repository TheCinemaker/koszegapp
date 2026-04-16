# visitKőszeg App Szerkezeti Felület (URL Térkép)

Ez a dokumentum összefoglalja az alkalmazás összes elérhető felületét, csoportosítva a funkciók és a hozzáférési szintek szerint.

## 1. Turisztikai Portál (Publikus felületek)
A város látogatói számára készült információs és élménygazdagító oldalak.

*   `/` - **Kezdőlap**: Dinamikus spotlight, események és kiemelt ajánlatok.
*   `/attractions` - **Látnivalók**: Városi nevezetességek listája.
*   `/attractions/:id` - **Látnivaló részletei**.
*   `/events` - **Események**: Aktuális városi programok naptára.
*   `/events/:id` - **Esemény részletei**.
*   `/gastronomy` - **Gasztronómia**: Éttermek, kávézók, borászatok.
*   `/gastronomy/:id` - **Helyszín részletei**.
*   `/hotels` - **Szállások**: Hotelek, apartmanok listája.
*   `/hotels/:id` - **Szállás részletei**.
*   `/leisure` - **Szabadidő**: Túrák, múzeumok, aktív kikapcsolódás.
*   `/leisure/:id` - **Túra/Helyszín részletei**.
*   `/parking` - **Parkolás**: Parkolóövezetek és díjak.
*   `/parking-map` - **Élő Parkolási Térkép**: Szabad helyek valós idejű követése.
*   `/live-map` - **Városi Interaktív Térkép**: Minden látnivaló és esemény egyben.
*   `/weather` - **Időjárás**: Részletes előrejelzés Kőszegre.
*   `/info` - **Hasznos Infók**: Közérdekű adatok, menetrendek.

---

## 2. KőszegEats (Ételrendelés platform)
A helyi kiszállítási rendszer felületei.

*   `/eats` - **Vásárlói felület**: Éttermek listája és az étlapok.
*   `/eats-auth` - **Bejelentkezés/Regisztráció**: Kifejezetten az ételrendelőhöz.
*   `/eats-admin` - **Vállalkozói Admin**: Itt kezelik az éttermek az étlapjukat és a beérkező rendeléseket.
*   `/eats-landing` - **Promóciós oldal**: A koszegeats.hu főoldala.

---

## 3. Digitális Pincér (QR Menü platform)
A helyben fogyasztó vendégek mobil rendelési felülete.

*   `/menu/:restaurantId/:tableId` - **Digitális Étlap**: Itt rendelik ki a vendégek az asztaltól a söröket/ételeket.
*   `/menu-admin` - **Waiters Admin (Pincér felület)**: Itt látják a pincérek az asztaloktól érkező kéréseket, hívásokat és fizetési igényeket. Itt szerkeszthető a QR étlap (képekkel, árakkal).

---

## 4. Időpontfoglaló Rendszer (Booking)
Szolgáltatók (fodrász, masszőr, stb.) kezelése.

*   `/idopontfoglalas` - **Szolgáltatók listája**: A vendégek itt választhatnak szakembert.
*   `/booking` - **Foglalási folyamat**: Időpontválasztás és adatok megadása.
*   `/business` - **Szolgáltatói Dashboard (Admin)**: A fodrászok/szolgáltatók itt látják a naptárukat, itt állítják be a nyitvatartást és kezelik a foglalásokat.
*   `/provider-setup` - **Regisztráció/Beállítás**: Új szolgáltatók itt regisztrálhatnak a rendszerbe.

---

## 5. KőszegPass & Jegyrendszer
Helyi kedvezménykártya és belépőjegy kezelés.

*   `/pass` - **Saját KőszegPass**: A lakosok és vendégek itt érik el a virtuális kártyájukat.
*   `/pass/register` - **Pass Regisztráció**.
*   `/tickets` - **Jegyvásárlás**: Belépők vásárlása múzeumokba, koncertekre.
*   `/tickets/admin` - **Jegyadminisztráció**: Eladott jegyek követése és kezelése.
*   `/tickets/scanner` - **Jegyellenőrző felület**: Az őrök/jegyszedők itt szkennelik a QR kódokat (mobilra optimalizált).

---

## 6. Globális Adminisztráció & Fejlesztés

*   `/admin` - **Általános Tartalomkezelő**: A városi infók, látnivalók, események (CMS) kezelése.
*   `/superadmin` - **Rendszergazdai felület**: Minden adatbázis rekordhoz hozzáfér (csak fejlesztőknek/tulajdonosnak).
*   `/koszegieknek` - **Lakosági irányítópult**: Dedikált infók kőszegieknek.
*   `/auth` - **Globális Belépés**: A központi Identity rendszer.
*   `/showcase` - **Funkcióbemutató**: Az app technikai képességeinek demója.
