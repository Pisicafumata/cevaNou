# Terraquarium · Garden Club

Un mic ecosistem pe care îl construiești în ritmul tău: **plantezi → îngrijești → colectezi frunze → descoperi ceva nou**.

Repository: [Pisicafumata/cevaNou](https://github.com/Pisicafumata/cevaNou). Versiunea actuală: **0.2.0**.

## Ce poți face acum

- Construiește pe o insulă izometrică cu **52 de locuri**, inclusiv 7 locuri de apă.
- Alege din **20 de elemente**: ferigi, flori, stejar, stuf, nuferi, pietre, ciuperci, bambus, lotus, felinare, salcie, koi, fluturi, podeț, pin, bancă, licurici, bonsai, cristal și fântână.
- Așază elementele direct în scenă, cu previzualizare și grilă, sau prin **Așază automat**. Folosește săgeți + Enter dacă preferi tastatura.
- Mută elementele gratuit sau reciclează-le pentru jumătate din preț. Elementele inițiale nu oferă frunze la reciclare.
- Primește experiență, avansează prin **6 niveluri** și încheie **9 misiuni** cu recompense unice.
- Colectează frunzele produse în timp de plante și viețuitoare, apoi investește-le în insulă.
- Alege zi/noapte după ora locală sau manual, ploaie/ceață/cer senin, pauză animație și mod ambiental.
- Redenumește insula, urmărește colecția descoperită, exportă și importă salvări JSON.
- Revino după o pauză: ecosistemul simulează până la 8 ore, fără să omoare plantele.

**Rulează momentan în browser.** Modul ambiental ascunde comenzile; integrarea reală în fundalul desktopului Windows este încă în plan. Nu schimbă wallpaperul sau pornirea automată a calculatorului.

## Pornește jocul

Ai nevoie de Node.js 22 sau mai nou. Jocul nu are dependențe de instalat.

```sh
npm run dev
```

Deschide **http://127.0.0.1:4173**. Pe Windows poți folosi și `Deschide-Terraquarium.cmd`.

Fișierul HTML trebuie servit prin HTTP pentru modulele JavaScript. GitHub păstrează sursa; pagina nu este publicată automat ca site.

## Primii pași

1. Alege **Ferigă** din colecție și apasă un loc liber pe insulă, sau **Așază automat**. Prețul se plătește numai după amplasarea reușită.
2. Primește recompensa misiunii **Pune-ți amprenta**: deblochezi rapid nivelul 2.
3. Udă insula, adaugă bambus sau lotus și continuă misiunile.
4. Colectează frunzele din coș; poți continua să construiești în timp ce plantele cresc.
5. Selectează **Mută** sau **Reciclează** pentru a reorganiza. `Esc` anulează selecția sau iese din ambient.

Preferințele conțin atmosfera, pauza animației și copiile de siguranță. Importul cere confirmare înainte să înlocuiască insula curentă. Salvarea veche v0.1 este migrată automat; cheia originală rămâne în browser.

## Verificare

```sh
npm test
npm run check
```

Cele 22 de teste pentru mecanici nu au dependențe. Verificarea în browser este păstrată în `tests/browser-smoke.cjs` și folosește opțional Playwright:

```sh
npm run test:browser
```

Pentru aceasta ai nevoie de Playwright și de un browser instalat, iar serverul trebuie să ruleze. Implicit se folosește Edge pe Windows, respectiv Chromium pe alte sisteme. `TERRA_PLAYWRIGHT_MODULE` poate indica modulul Playwright deja disponibil, `TERRA_BROWSER_PATH` un executabil, iar `TERRA_TEST_URL` adresa serverului. Capturile și fișierele descărcate sunt ignorate în `artifacts/`.

## Structură

```text
src/catalog.js       Elemente, niveluri, categorii și teren
src/simulation.js    Economie, creștere, amplasare, misiuni și salvări
src/sprites.js       20 de desene pixel art, comune scenei și colecției
src/scene.js         Scenă, animații, previzualizare și interacțiune
src/app.js           Interfață, salvare, import/export și ciclul de viață
src/styles.css       Interfață adaptabilă și ambient
tests/               Teste pentru mecanici și verificare în browser
docs/PLAN.md         Arhitectură, reguli și ce urmează
docs/VERIFICARE.md   Rezultate și limitele verificării
```

Tot artworkul este desenat local în Canvas. Fără conturi, servicii externe, chei API, resurse descărcate sau tranzacții reale. Frunzele sunt exclusiv resurse din joc. Păstrează periodic o copie exportată dacă vrei să îți muți progresul între browsere sau calculatoare.
