# 🛠️ Sviluppo - VIT Cyber Quiz

Questa cartella contiene tutti i file utilizzati durante lo sviluppo dell'app ma **non necessari per il suo funzionamento**.

---

## 📁 Struttura

### `scripts/`
Script Python per utility e manutenzione:
- **fix_questions_errors_v*.py** - Correzione errori nelle domande (versioni 1-4)
- **generate_default_areas.py** - Generazione aree tematiche predefinite
- **export_study_materials.py** - Export domande in Markdown per studio
- **export_all_subjects_single_file.py** - Export tutte le materie in un unico file
- **genera_icone_da_logo.py** - Generazione icone PWA dal logo
- **replace_localstorage.py** - Utility per gestione localStorage

### `reports/`
Report di correzione errori:
- `fix_report_*.txt` - Log delle correzioni effettuate alle domande

### `backup/`
File di backup creati durante le modifiche:
- `js/app.js.backup` - Backup di app.js
- `js/data-embedded.js.backup.*` - Backup timestampati del database domande

### `test/`
File HTML per testing:
- **test-areas.html** - Test caricamento aree tematiche
- **generate-icons.html** - Generatore icone PWA

### `materiali_studio/`
Materiali di studio generati:
- **MATERIALE_STUDIO_COMPLETO.md** - Tutte le domande in formato Markdown
- **areas_import_simple.json** - Formato semplificato aree per import
- **[Materia].md** - File per singola materia

### `docs/`
Documentazione sviluppo:
- **AREE_PREDEFINITE_README.md** - Guida completa alle aree tematiche

---

## 🚀 Utilizzo Script Principali

### Correzione Errori nelle Domande
```bash
python3 scripts/fix_questions_errors_v4.py
```
Ultima versione dello script di correzione. Corregge:
- Errori ortografici
- Concordanze
- Apostrofi errati
- Uniformità risposte

### Generazione Aree Tematiche
```bash
python3 scripts/generate_default_areas.py
```
Genera le 16 aree predefinite classificando automaticamente le 76 materie.

Output:
- `../default_areas.json` (formato completo)
- `materiali_studio/areas_import_simple.json` (formato semplificato)

### Export Materiali di Studio
```bash
# Export singola materia
python3 scripts/export_study_materials.py

# Export tutte le materie in un file
python3 scripts/export_all_subjects_single_file.py
```

Genera file Markdown con istruzioni per AI (ChatGPT/Claude) per creare materiali di studio approfonditi.

---

## ⚠️ Note Importanti

1. **Non eliminare questa cartella** - Gli script potrebbero essere utili per manutenzioni future
2. **Backup automatici** - Gli script v4 creano backup automatici prima delle modifiche
3. **Report** - Conserva i report per tracciare tutte le correzioni effettuate
4. **Versioning** - Gli script sono versionati (v1, v2, v3, v4) per tracciare l'evoluzione

---

## 📊 File dell'App (root)

I file necessari per il funzionamento dell'app sono nella root:
- `index.html` - Pagina principale
- `manifest.json` - Configurazione PWA
- `sw.js` - Service Worker per offline
- `default_areas.json` - Aree predefinite (caricato da app.js)
- `css/` - Stili
- `js/` - JavaScript dell'app
  - `app.js` - Logica principale
  - `data-embedded.js` - Database 760 domande
  - `default-areas.js` - Aree tematiche predefinite

---

**Ultima aggiornamento**: 24 Novembre 2025
**Versione App**: v1.7.4
