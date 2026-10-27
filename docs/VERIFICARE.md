# Verificare v0.1 — 28 octombrie 2026

Flux verificat: interfață → simulare locală → salvare în browser → reîncărcare → scenă și statistici actualizate. Nu există API sau bază de date externă în prima versiune.

## Rezultate

- 8/8 teste automate pentru simulare: trecute.
- Verificarea sintaxei pentru controler, scenă, simulare și server: trecută.
- Server local: răspuns HTTP 200 pentru pagină și încărcarea resurselor fără cereri eșuate.
- Browser: Microsoft Edge, verificat automat fără erori JavaScript sau erori în consolă.
- Udare: umiditatea inițială 62% devine 80%; valoarea se păstrează după reîncărcare.
- Revenire după două ore simulate: umiditate 50%, creștere 42%, pornind de la 62% și 18%.
- Zi/noapte, pauză animație, ambient și revenire cu Esc: funcționale.
- Intrarea directă prin `?ambient=1` și ieșirea din mod: funcționale.
- Planul din dialog: se deschide și se închide cu Esc.
- Salvare coruptă: recuperare cu o lume inițială validă.
- Stocare blocată: jocul continuă și afișează lipsa salvării.
- Preferința de mișcare redusă: pagina și comenzile rămân funcționale.
- Capturi desktop și mobile inspectate; la 390px și 320px nu există derulare orizontală.
- Callbackul pregătit pentru pauza hostului a fost apelat din test; integrarea efectivă Lively nu a fost executată.

## Limite

Nu sunt verificate încă rularea ca wallpaper Windows, inputul prin host, persistența după restartul hostului, pornirea cu Windows, două monitoare sau consumul CPU/GPU/RAM. Acestea au criterii explicite în [PLAN.md](PLAN.md).

Capturile și scriptul local de verificare a browserului sunt în directorul ignorat `artifacts/`; sursa nu depinde de ele sau de instalarea Playwright. Testele simulării se rulează din repository cu `npm test`.
