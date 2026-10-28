# Verificare v0.2 — 28 octombrie 2026

Flux: comandă din interfață → validare și simulare locală → salvare → scenă și progres actualizate → reîncărcare. Jocul nu are API sau bază de date externă.

## Mecanicile jocului

22/22 teste Node trecute: teren și catalog; cumpărare fără modificarea stării originale; respingerea achizițiilor fără nivel/resurse; coliziuni și teren incompatibil; descoperiri; mutare; reciclare; pauza udării; colectare și fracții; producție, umiditate și XP; oprire pe sol uscat; efectele vremii; insulă goală; limita offline; ceas dat înapoi; recompense unice; pragurile nivelurilor; migrare v1; persistare v2; salvări invalide și ID-uri restaurate.

Sintaxa modulelor aplicației, catalogului, scenei, sprite-urilor, simulării și serverului a fost verificată cu Node.

## Browser

Microsoft Edge, verificare automată păstrată în `tests/browser-smoke.cjs`. 19 scenarii trecute:

1. Amplasare manuală în Canvas și retragerea exactă a prețului.
2. Primirea unei recompense, creșterea în nivel și deblocarea unui element.
3. Amplasare automată.
4. Mutare fără cost.
5. Reciclare cu restituirea a jumătate din preț.
6. Construcție cu săgeți și Enter.
7. Udare și pauză între udări.
8. Filtrarea colecției și explicația deblocărilor.
9. Nume de insulă afișat ca text, inclusiv caractere HTML.
10. Lumina, vremea, pauza animației și descărcarea efectivă a salvării.
11. Import invalid care păstrează lumea curentă.
12. Import confirmat și păstrarea lui după reîncărcare.
13. Colecție și ieșire din ambient cu Escape.
14. Oprirea efectivă a desenării Canvas la callbackul de pauză, apoi reluarea.
15. Grădină matură cu toate cele 20 de tipuri de sprite.
16. Ecrane de 390 și 320px fără derulare orizontală; preferință de mișcare redusă.
17. Producție offline și colectarea resurselor.
18. Migrarea efectivă din cheia localStorage v1 în v2.
19. Joc utilizabil chiar dacă localStorage este blocat, cu mesaj despre lipsa salvării.

Capturile cu grădina de zi, de noapte și pe ecran îngust au fost inspectate. Nu au apărut erori JavaScript, erori de consolă sau cereri eșuate în sesiunea principală verificată. Fișierele de test, capturile și copia de siguranță descărcată sunt în directorul ignorat `artifacts/`.

## Încă neverificat

Rularea efectivă ca wallpaper Windows, inputul printr-un host desktop, salvarea după restartul hostului, autostart, două monitoare și consumul măsurat CPU/GPU/RAM. Callbackul de pauză pregătit și testat în browser nu echivalează cu integrarea desktop completă.
