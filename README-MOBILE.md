# Quiz VIT - Versione Mobile PWA

Versione Progressive Web App dell'applicazione Quiz VIT ottimizzata per dispositivi mobili, in particolare iPhone.

## ✨ Caratteristiche

- ✅ **760 domande** già incluse nell'app
- ✅ **PWA (Progressive Web App)** - installabile come app nativa
- ✅ **Funziona offline** - nessun server necessario dopo la prima apertura
- ✅ **Configurazione persistente** - le aree e associazioni sono salvate nel browser
- ✅ **Responsive** - ottimizzata per schermi piccoli
- ✅ **Dark Mode** - modalità scura disponibile
- ✅ **Statistiche complete** - tracciamento progressi e domande sbagliate
- ✅ **Service Worker** - caching automatico per prestazioni ottimali

## 📱 Installazione su iPhone (Consigliato)

### Passo 1: Trasferimento file
1. **Trasferisci** lo ZIP sul tuo iPhone (via AirDrop, email, iCloud Drive, etc.)
2. **Estrai** il file ZIP usando l'app File di iOS

### Passo 2: Generare le icone (IMPORTANTE!)
Prima di installare l'app, devi generare le icone:

1. **Apri** il file `generate-icons.html` con Safari
2. **Clicca** sul pulsante "Scarica Icone"
3. Le icone verranno scaricate automaticamente (3 file PNG)
4. **Sposta** i file `icon-192.png`, `icon-512.png` e `apple-touch-icon.png` nella stessa cartella di `index.html`

### Passo 3: Installazione come PWA
1. **Apri** il file `index.html` con **Safari** (importante: usa Safari!)
2. **Tocca** il pulsante "Condividi" (icona con freccia verso l'alto) in basso
3. **Scorri** e seleziona **"Aggiungi a Home"**
4. **Conferma** il nome "Quiz VIT" e tocca "Aggiungi"
5. L'icona apparirà sulla tua Home Screen! 🎉

### Passo 4: Usa l'app
- **Tocca** l'icona sulla Home Screen
- L'app si aprirà **a schermo intero** senza le barre del browser
- Funziona completamente **offline** dopo il primo caricamento!

## 🤖 Installazione su Android

1. **Apri** `index.html` con Chrome
2. Chrome mostrerà automaticamente un banner "Aggiungi a schermata Home"
3. Oppure: Menu (⋮) → "Installa app" o "Aggiungi a schermata Home"

## 🌐 Uso tramite browser (alternativa)

Se non vuoi installare l'app:
1. **Apri** semplicemente `index.html` con qualsiasi browser
2. Funziona normalmente come sito web
3. Aggiungi un segnalibro per accesso rapido

---

## 🎯 Primo utilizzo

### Configurare le aree

1. Apri l'app e clicca su **"Gestisci Aree e Materie"**
2. Inserisci il nome dell'area (es: "Area Giuridica", "Area Tecnica") e clicca **"Aggiungi Area"**
3. Seleziona l'area dal menu a tendina
4. Seleziona le materie da associare all'area (tieni premuto per selezione multipla)
5. Clicca **"Salva Associazione"**

**💡 Novità:**

- Puoi **rimuovere materie** dalle aree cliccando sulla **X** accanto al nome
- **Ogni materia** può essere associata a una sola area alla volta

### Avviare un quiz

1. Clicca su **"Inizia Quiz"**
2. Scegli la modalità:
   - **Per Area**: tutte le domande di un'area specifica
   - **Per Materia**: domande di una singola materia
   - **Tutte le domande**: tutte le 760 domande disponibili
   - **Domande sbagliate (Tutte)**: ripeti tutte le domande sbagliate
   - **🆕 Domande sbagliate per Area**: solo le domande sbagliate di un'area specifica
   - **🆕 Domande sbagliate per Materia**: solo le domande sbagliate di una materia
3. **🆕 Opzioni avanzate:**
   - ✅ **Escludi domande già viste**: filtra le domande che hai già completato
4. Imposta il numero di domande e opzionalmente un timer
5. Inizia il quiz!

### Visualizzare il progresso

**🆕 Dashboard - Progresso per Area:**

- Visualizza il progresso per ogni area con barre colorate
- Badge **"✓ Completata"** quando finisci tutte le domande di un'area
- Contatore domande sbagliate per area

**Statistiche dettagliate:**

- Clicca su **"Statistiche"** per vedere:
  - Quiz completati totali
  - Performance per area con pulsanti:
    - **Riprova sbagliate**: rifai solo le domande sbagliate dell'area
    - **Reset**: cancella tutto il progresso dell'area
  - Performance per materia con pulsanti:
    - **Riprova sbagliate**: rifai solo le domande sbagliate della materia
    - **Reset**: cancella tutto il progresso della materia

**🆕 Cronologia Quiz:**

- Clicca su **"Cronologia"** per vedere:
  - Data e ora di ogni quiz completato
  - Modalità usata (Area, Materia, Casuale, ecc.)
  - Numero domande e punteggio
  - Ultime 50 sessioni salvate

### Cancellare i dati

- **Reset selettivo**: Usa i pulsanti "Reset" nelle statistiche per cancellare il progresso di singole aree o materie
- **Statistiche globali**: Clicca su "Cancella tutte le statistiche" nella sezione Statistiche
- **Configurazione aree**: Usa il pulsante **X** per rimuovere materie dalle aree

---

## 💡 Differenze con la versione desktop

### ❌ Funzionalità rimosse:
- Import domande da Excel (le domande sono già incluse)
- Download/Upload configurazione JSON
- Ricarica dati da file

### ✅ Funzionalità mantenute:
- Tutti i tipi di quiz
- Gestione aree e materie
- Statistiche complete
- Dark mode
- Timer per quiz

---

## 🔧 Note tecniche

- **PWA**: L'app utilizza Service Worker per il caching e funzionamento offline
- **Storage**: Configurazione e statistiche salvate in localStorage del browser
- **Domande**: 760 domande embedded nel file `js/data-embedded.js`
- **Compatibilità**: Funziona su tutti i browser moderni (Chrome, Safari, Firefox, Edge)
- **Offline**: Dopo il primo caricamento, funziona completamente offline
- **Dimensione**: ~90 KB (compressa in ZIP)

---

## ❓ Risoluzione problemi

### Le icone non appaiono nell'app installata
1. Assicurati di aver generato le icone con `generate-icons.html`
2. Verifica che i 3 file PNG siano nella cartella principale
3. Disinstalla e reinstalla l'app

### Le configurazioni scompaiono
Se cancelli i dati del browser o la cache, le configurazioni delle aree andranno perse. Le domande rimarranno sempre disponibili perché sono embedded nel codice.

### L'app non funziona offline
1. Apri l'app almeno una volta con connessione internet
2. Il Service Worker si registrerà automaticamente
3. Controlla nella console del browser se ci sono errori

### Posso usare l'app senza installarla?
Sì! Puoi semplicemente aprire `index.html` con qualsiasi browser e funzionerà ugualmente.

---

## 🔄 Aggiornamenti

Per aggiornare le domande:
1. Rigenera l'app mobile dal computer usando `genera_app_mobile.py`
2. Sostituisci i file sul dispositivo mobile
3. Le tue configurazioni aree rimarranno salvate nel browser

---

## 📋 Distribuzione

### Per distribuire l'app a qualcun altro:

**Opzione 1: ZIP (più semplice)**
- Invia il file `quiz-app-mobile.zip`
- L'utente lo estrae e segue le istruzioni sopra

**Opzione 2: Hosting web**
- Carica i file su un server web (es: GitHub Pages, Netlify, Vercel)
- Condividi il link
- L'app sarà installabile direttamente dal browser

**Opzione 3: TestFlight (professionale, richiede account Apple Developer)**
- Converti l'app in un'app nativa iOS
- Distribuisci fino a 10.000 beta tester
- Costo: 99€/anno

---

**Versione**: 1.0 PWA
**Domande incluse**: 760
**Ultimo aggiornamento**: 2025-11-20
**Tipo**: Progressive Web App (PWA)
