# 📁 Struttura Progetto - VIT Cyber Quiz

Questa guida documenta l'organizzazione del progetto dopo la riorganizzazione del 24/11/2025.

---

## 🎯 Principio di Organizzazione

Il progetto è diviso in due aree principali:

1. **ROOT** - File necessari per il funzionamento dell'app
2. **sviluppo/** - File di sviluppo, utility e materiali

---

## 📦 File nella ROOT (Essenziali per l'App)

### Core App
| File | Descrizione | Necessario |
|------|-------------|------------|
| `index.html` | Pagina principale dell'app | ⭐ Sì |
| `manifest.json` | Configurazione PWA | ⭐ Sì |
| `sw.js` | Service Worker per offline | ⭐ Sì |
| `default_areas.json` | Aree tematiche predefinite | ⭐ Sì |

### CSS
| File | Descrizione | Necessario |
|------|-------------|------------|
| `css/style.css` | Stili dell'applicazione | ⭐ Sì |

### JavaScript
| File | Descrizione | Necessario |
|------|-------------|------------|
| `js/app.js` | Logica principale (58KB) | ⭐ Sì |
| `js/data-embedded.js` | Database 760 domande (378KB) | ⭐ Sì |
| `js/default-areas.js` | Aree tematiche (6KB) | ⭐ Sì |

### Assets
| File | Descrizione | Necessario |
|------|-------------|------------|
| `icon-192.png` | Icona PWA piccola | ⭐ Sì |
| `icon-512.png` | Icona PWA grande | ⭐ Sì |
| `apple-touch-icon.png` | Icona iOS | ⭐ Sì |
| `logo.jpeg` | Logo originale | No (riferimento) |
| `icon.svg` | Logo vettoriale | No (riferimento) |

### Documentazione
| File | Descrizione | Necessario |
|------|-------------|------------|
| `README.md` | Guida utente | Consigliato |
| `CHANGELOG.md` | Storico versioni | Consigliato |
| `ROADMAP.md` | Piano sviluppo futuro | Consigliato |

---

## 🛠️ Cartella `sviluppo/`

Contiene tutti i file di sviluppo, utility e materiali generati. **Non necessari** per il funzionamento dell'app.

### Struttura
```
sviluppo/
├── README.md                    Guida sviluppo
├── scripts/                     9 script Python
├── backup/                      8 file backup
├── reports/                     5 report correzioni
├── test/                        2 file HTML test
├── materiali_studio/            Export Markdown
└── docs/                        Documentazione dev
```

### Script Principali (`scripts/`)

#### Correzione Errori
- `fix_questions_errors_v4.py` - **Versione corrente** ⭐
- `fix_questions_errors_v3.py`
- `fix_questions_errors_v2.py`
- `fix_questions_errors.py`

#### Generazione Contenuti
- `generate_default_areas.py` - Genera le 16 aree tematiche ⭐
- `export_study_materials.py` - Export Markdown per studio
- `export_all_subjects_single_file.py` - Export unico file
- `genera_icone_da_logo.py` - Genera icone PWA
- `replace_localstorage.py` - Utility localStorage

### Backup (`backup/`)
- `app.js.backup` - Backup app.js
- `data-embedded.js.backup.*` - 7 backup timestampati

### Report (`reports/`)
- `fix_report_*.txt` - 5 report correzioni con log dettagliati

### Test (`test/`)
- `test-areas.html` - Test caricamento aree
- `generate-icons.html` - Generatore icone

### Materiali Studio (`materiali_studio/`)
- `MATERIALE_STUDIO_COMPLETO.md` - Tutte le domande (14K righe)
- `areas_import_simple.json` - Aree in formato semplice
- `[Materia].md` - File per singola materia

### Docs (`docs/`)
- `AREE_PREDEFINITE_README.md` - Documentazione aree complete

---

## 🚀 Deployment

Per il deploy dell'app, serve solo il contenuto della **ROOT**:

```bash
# File necessari (442KB totali)
index.html           (31KB)
manifest.json        (0.5KB)
sw.js                (2KB)
default_areas.json   (6KB)
css/style.css        (8KB)
js/app.js            (58KB)
js/data-embedded.js  (378KB)
js/default-areas.js  (6KB)
icon-*.png           (vari KB)
```

La cartella `sviluppo/` **non è necessaria** per il funzionamento.

---

## 📝 Manutenzione

### Correggere Errori nelle Domande
```bash
cd sviluppo/scripts
python3 fix_questions_errors_v4.py
```

### Rigenerare Aree Tematiche
```bash
cd sviluppo/scripts
python3 generate_default_areas.py
```

### Esportare Materiali Studio
```bash
cd sviluppo/scripts
python3 export_all_subjects_single_file.py
```

---

## 📊 Statistiche Progetto

- **Versione App**: v1.7.4
- **Domande Totali**: 760
- **Materie**: 76
- **Aree Tematiche**: 16
- **File Root**: 17 file essenziali
- **File Sviluppo**: 32 file utility

---

## 🔄 Storia Riorganizzazione

**24 Novembre 2025 - Commit 3e5176b**
- Creata cartella `sviluppo/` con 6 sottocartelle
- Spostati 32 file dalla root
- Root rimasta con solo 17 file essenziali
- Aggiunta documentazione completa

---

**Ultima aggiornamento**: 24 Novembre 2025  
**Autore**: Joseph Borgese + Claude Code
