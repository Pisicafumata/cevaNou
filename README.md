# Terraquarium

Un joc ambiental cu ecosisteme mici, care cresc încet în timp ce îți vezi de zi. Începem cu **plante și apă**; alte ecosisteme vor folosi aceeași structură.

Repository: [Pisicafumata/cevaNou](https://github.com/Pisicafumata/cevaNou).

## Prima etapă — v0.1

- Insulă pixel art desenată în Canvas 2D, cu iaz, stuf, ferigi și un copac.
- Udare, umiditate și creștere lentă; stadiul plantei se schimbă odată cu progresul.
- Variante de zi/noapte, pauză pentru animație și mod ambiental cu interfața ascunsă.
- Salvare locală versionată, progres la revenire limitat la opt ore. Planta nu moare dacă lipsești.
- Desenare la maximum 30 FPS; oprire la ascunderea paginii; mișcare redusă după preferința sistemului.
- Fără biblioteci, conturi, servicii externe, fonturi descărcate sau chei API.

**Această versiune rulează în browser. Modul ambiental nu setează fundalul Windows.** Integrarea reală în spatele iconițelor este etapa următoare și are o schemă în [docs/PLAN.md](docs/PLAN.md). Iazul este decorativ în v0.1; nu simulăm încă nivelul apei, calitatea apei sau viețuitoare.

## Pornire

Ai nevoie de Node.js 22 sau mai nou.

```sh
npm run dev
```

Deschide **http://127.0.0.1:4173**. Alternativ, pe Windows, dublu clic pe `Deschide-Terraquarium.cmd`. Launcherul folosește Node din PATH sau runtime-ul local Codex, dacă există. Nu schimbă politica PowerShell a sistemului.

Nu este necesar `npm install`: nu avem dependențe. Fișierul HTML trebuie servit prin HTTP, deoarece folosește module JavaScript.

## Cum îl încerci

1. Apasă **Udă planta**: umiditatea urcă, apare o ploaie scurtă.
2. Comută **Noapte** pentru varianta nocturnă; **Zi** revine la lumină. Deocamdată alegerea este manuală.
3. Deschide **Mod ambiental**; revino cu butonul din colț sau `Esc`.
4. Reîncarcă pagina: progresul și preferințele se păstrează pe acest browser/origin.
5. Deschide **Planul proiectului** pentru etapele pe scurt.

Creșterea este intenționat lentă: +12 puncte procentuale/oră cât umiditatea depășește 20%. Solul pierde 6 puncte/oră. Udarea adaugă 18 puncte, până la 100%. Apăsările repetate nu oferă creștere instantanee. Pauza animației oprește mișcarea, nu timpul ecosistemului.

## Verificare

```sh
npm test
npm run check
```

Testele verifică regulile de timp, udarea, salvările invalide și revenirea offline. Pentru verificarea vizuală: testează zi/noapte, udare, reîncărcare, ambient și un ecran îngust. Nu este încă măsurat consumul real ca wallpaper Windows.

## Structură

```text
index.html                Interfață și planul pe scurt
src/app.js                Comenzi, salvare, ciclu de viață și limita cu hostul
src/simulation.js         Stare, reguli și validarea salvării
src/scene.js              Desen și animație, independente de hostul Windows
src/styles.css            Aspect și afișare adaptabilă
assets/sprout.svg         Identitatea vizuală locală
scripts/dev-server.mjs    Server local fără dependențe
tests/simulation.test.js  Teste pentru mecanica de bază
docs/PLAN.md              Schema și criteriile etapelor următoare
```

Stocarea browserului poate fi indisponibilă sau curățată; interfața arată dacă salvarea eșuează. Exportul/importul și salvarea desktop pe disc sunt prevăzute în etapa 02.
