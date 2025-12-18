# VIT Cyber - Quiz Cybersecurity

App quiz per la preparazione in cybersecurity con **1060 domande**.

## Caratteristiche

- **1060 domande** di cybersecurity organizzate per area e materia
- **Funziona offline** - PWA installabile su smartphone
- **Dark/Light mode** - Tema chiaro e scuro
- **Statistiche avanzate** - Grafici a ciambella, barre di progresso, analisi per area
- **Minimap domande** - Naviga velocemente tra le domande durante il quiz
- **Riprendi Quiz** - I quiz abbandonati vengono salvati e puoi riprenderli
- **Modalita multiple**:
  - Quiz per Area
  - Quiz per Materia
  - Quiz Casuale
  - Ripasso Domande Sbagliate
  - Practice Mode (allenamento)
  - Exam Mode (simulazione)

## Installazione come App

### Android (Chrome)
1. Apri l'app nel browser Chrome
2. Tocca il menu (3 puntini)
3. Seleziona "Aggiungi a schermata Home"

### iPhone/iPad (Safari)
1. Apri l'app in Safari
2. Tocca il pulsante Condividi
3. Seleziona "Aggiungi a Home"

### Desktop (Chrome/Edge)
1. Apri l'app nel browser
2. Clicca sull'icona di installazione nella barra degli indirizzi

## Shortcuts Tastiera

| Tasto | Azione |
|-------|--------|
| `1-4` | Seleziona risposta |
| `Enter` | Conferma / Prossima domanda |
| `Space` | Pausa quiz |
| `Escape` | Esci dal quiz |

## Minimap Domande

Durante il quiz, clicca sull'icona griglia nell'header per aprire la mappa delle domande:
- **Verde**: Risposta corretta
- **Rosso**: Risposta errata
- **Giallo**: Domanda segnata
- **Arancione**: Domanda saltata
- **Grigio**: Non ancora risposta

Clicca su qualsiasi numero per navigare direttamente a quella domanda.

## Statistiche

La pagina statistiche offre una visione completa delle tue performance.

**Nota**: Tutte le statistiche sono basate su **domande uniche**. Se rispondi alla stessa domanda più volte, conta come una sola. Se correggi una risposta sbagliata, la domanda passa da "sbagliata" a "corretta".

- **Grafico a ciambella**: Percentuale domande corrette vs sbagliate
- **Metriche chiave**: Quiz completati, domande viste, corrette, sbagliate
- **Performance per Area**: Barre di progresso colorate per ogni area
- **Aree da Migliorare**: Materie dove hai meno del 60% di domande corrette
- **Suggerimenti**: Consigli personalizzati basati sui tuoi punti deboli

## Studia

Consulta e ripassa tutte le 1060 domande:
- **Ricerca**: Cerca per testo domanda, risposta o materia
- **Filtri**: Per area, materia e stato (viste/sbagliate/non viste)
- **Paginazione**: Naviga facilmente tra centinaia di domande
- **Card espandibili**: Tocca per vedere tutte le risposte
- **Indicatori colore**: Verde (vista), Rosso (sbagliata), Grigio (non vista)

## Cronologia

La cronologia mostra gli ultimi 100 quiz completati con dettagli su percentuale, tempo e risposte.

**Eliminare quiz dalla cronologia:**
1. Tocca il pulsante "Elimina" nell'header
2. Seleziona i quiz da eliminare (singoli o tutti)
3. Conferma l'eliminazione

Le statistiche vengono automaticamente ricalcolate dopo l'eliminazione.

## Riprendi Quiz

Se abbandoni un quiz prima di completarlo (premendo X o Escape), il tuo progresso viene salvato automaticamente.

Al prossimo accesso alla dashboard vedrai un banner che ti permette di:
- **Riprendi**: Continua il quiz da dove l'avevi lasciato
- **Elimina**: Scarta il quiz salvato e pulisce le statistiche

Il quiz salvato mostra l'area/materia e il numero di domande già risposte.

**Nota**: Quando elimini un quiz in sospeso, le domande viste e sbagliate durante quel quiz vengono rimosse dalle statistiche (solo se non sono presenti in altri quiz completati).

## Supporto Offline

L'app funziona completamente offline dopo il primo caricamento. Tutte le domande e i tuoi progressi sono salvati localmente sul dispositivo.

## Privacy

Tutti i dati (statistiche, cronologia, progressi) sono salvati **localmente** sul tuo dispositivo tramite localStorage. Nessun dato viene inviato a server esterni.

## Tecnologie

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Service Worker (PWA)

---

**Versione**: 2.6.0
