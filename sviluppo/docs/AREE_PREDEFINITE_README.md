# 📚 Aree Tematiche Predefinite - VIT Cyber

## 🎯 Descrizione

Al primo avvio dell'app VIT Cyber, vengono caricate automaticamente **16 aree tematiche predefinite** che organizzano tutte le 76 materie del quiz in gruppi logici.

L'utente può:
- ✅ Modificare le aree esistenti
- ✅ Aggiungere o rimuovere materie dalle aree
- ✅ Eliminare aree
- ✅ Creare nuove aree personalizzate

Le aree sono completamente modificabili come se fossero state create dall'utente stesso.

---

## 📊 Aree Generate

### 1. ⚖️ Diritto Penale (18 materie)
**Descrizione**: Reati, concussione, corruzione, delitti contro patrimonio e P.A.

Include materie su:
- Delitti contro il patrimonio (furto, rapina, usura, estorsione)
- Reati della Pubblica Amministrazione (peculato, corruzione, concussione)
- Omicidio e reati contro la persona
- Falsità, stalking, maltrattamenti

### 2. 👮 Ordinamento Polizia (10 materie)
**Descrizione**: Accesso, avanzamento, nuovo ordinamento e carriera

Include materie su:
- Accesso e avanzamento
- Nuovo ordinamento personale
- Responsabilità disciplinare
- Relazioni sindacali
- Gestione servizi

### 3. 🛡️ Pubblica Sicurezza (10 materie)
**Descrizione**: Sistema P.S., controllo territorio, ordine pubblico, DASPO

Include materie su:
- Controllo del territorio
- DASPO e DACUR
- Ordine pubblico
- Amministrazione della P.S.
- Manifestazioni sportive
- Uso legittimo delle armi

### 4. ⚡ Procedura Penale (5 materie)
**Descrizione**: Attività di P.G., acquisizione notizie reato, atti e procedure

Include materie su:
- Acquisizione notizia di reato
- Attività d'iniziativa e delegata
- Polizia Giudiziaria
- Documentazione atti
- Rapporti informativi

### 5. 💻 Cybercrime e Reati Informatici (5 materie)
**Descrizione**: Crimini informatici, tecniche investigative, hate speech, web

Include materie su:
- Reati informatici
- Polizia Postale
- Hate speech ed estremismo online
- Social network

### 6. 🌍 Immigrazione e Stranieri (5 materie)
**Descrizione**: Ingresso, soggiorno stranieri, permessi, protezione internazionale

Include materie su:
- Ingresso e soggiorno straniero
- Permessi di soggiorno
- Espulsione e respingimento
- Protezione internazionale
- Contrasto immigrazione illegale

### 7. 🏛️ Diritto Amministrativo (4 materie)
**Descrizione**: Principi, provvedimenti, trasparenza e pubblica amministrazione

Include materie su:
- Provvedimento amministrativo
- Principi di legalità
- Discrezionalità amministrativa
- Responsabilità patrimoniale

### 8. 🛡️ Violenza di Genere e Tutela Vittime (4 materie)
**Descrizione**: Violenza di genere, OSCAD, Progetto Scudo, persone scomparse

Include materie su:
- Violenza di genere
- OSCAD
- Progetto Scudo
- Commissario persone scomparse

### 9. 🔒 Privacy e Dati Personali (3 materie)
**Descrizione**: Riservatezza, banche dati, CED, accesso e protezione dati

Include materie su:
- Banche dati CED
- Diritto alla riservatezza
- Protezione dati per finalità di polizia

### 10. 📜 Diritto Costituzionale (2 materie)
**Descrizione**: Costituzione, principi costituzionali e libertà civili

Include materie su:
- Principi costituzionali rilevanti
- Diritti di libertà civile

### 11. 💊 Stupefacenti e Sostanze (2 materie)
**Descrizione**: Legislazione stupefacenti e normativa correlata

### 12. 👶 Minori e Tutela (2 materie)
**Descrizione**: Pornografia minorile, offese ai minori e protezione

Include materie su:
- Contrasto pornografia minorile
- Identificazione minori stranieri

### 13. ⭐ Etica e Deontologia (2 materie)
**Descrizione**: Etica professionale, stress, coping e resilienza

Include materie su:
- Stress e coping
- Vittimologia

### 14. 🚨 Misure di Prevenzione (2 materie)
**Descrizione**: Misure di prevenzione personali e patrimoniali

### 15. 🔫 Sicurezza e Armi (1 materia)
**Descrizione**: Norme sicurezza armi e regolamentazione

### 16. 🏗️ Salute e Sicurezza Lavoro (1 materia)
**Descrizione**: D.Lgs 81, sicurezza luoghi di lavoro e normativa

---

## 🔧 Implementazione Tecnica

### File Coinvolti

1. **js/default-areas.js**
   - Contiene `window.DEFAULT_AREAS` con tutte le aree predefinite
   - Formato: `{ "Nome Area": ["Materia1", "Materia2", ...] }`
   - Caricato prima di app.js nell'HTML

2. **generate_default_areas.py**
   - Script Python per generare automaticamente le aree
   - Usa pattern regex per classificare le 76 materie
   - Output: default_areas.json e areas_import_simple.json

3. **default_areas.json**
   - Formato completo con metadati (colori, icone, descrizioni)
   - Utile per documentazione e riferimento

### Logica di Caricamento

```javascript
// In js/app.js - loadData()
const savedConfig = SafeStorage.getItem('quizConfig');
if (savedConfig) {
    // Utente ha già configurato le sue aree
    config = savedConfig;
} else {
    // Primo avvio: carica aree predefinite
    if (window.DEFAULT_AREAS) {
        config = {
            areas: window.DEFAULT_AREAS,
            version: '1.0',
            defaultAreasLoaded: true
        };
        // Salva in localStorage per permettere modifiche
        SafeStorage.setItem('quizConfig', config);
    }
}
```

### Caratteristiche Chiave

- **Primo Avvio**: Le aree vengono caricate automaticamente
- **Persistenza**: Salvate subito in localStorage
- **Modificabilità**: L'utente può modificarle liberamente
- **No Reset**: Una volta salvate, le modifiche dell'utente sono preservate
- **Completezza**: Tutte le 76 materie sono classificate

---

## 🔄 Regenerare le Aree

Per rigenerare le aree (dopo modifiche alle materie):

```bash
# 1. Esegui lo script di generazione
python3 generate_default_areas.py

# 2. Converti in formato JS
python3 -c "
import json
with open('areas_import_simple.json', 'r', encoding='utf-8') as f:
    areas = json.load(f)
output = 'window.DEFAULT_AREAS = ' + json.dumps(areas, ensure_ascii=False, indent=2) + ';'
with open('js/default-areas.js', 'w', encoding='utf-8') as f:
    f.write('// Aree tematiche predefinite - VIT Cyber\n')
    f.write('// Generate automaticamente da generate_default_areas.py\n\n')
    f.write(output)
"

# 3. Incrementa versione cache in sw.js e index.html
```

---

## 📝 Note per gli Sviluppatori

- Le aree predefinite NON sovrascrivono le personalizzazioni utente
- Il caricamento avviene solo se `localStorage` è vuoto
- I pattern regex in `generate_default_areas.py` gestiscono encoding Unicode
- L'ordine delle aree è preservato dal file JSON

---

**Versione**: 1.0  
**Generato**: 24 Novembre 2025  
**Script**: generate_default_areas.py
