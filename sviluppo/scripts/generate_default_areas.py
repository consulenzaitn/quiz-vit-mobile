#!/usr/bin/env python3
"""
Script per generare aree tematiche predefinite con materie associate
Analizza le 76 materie e le raggruppa logicamente in aree
"""
import re
import json
from datetime import datetime
from collections import defaultdict

INPUT_FILE = 'js/data-embedded.js'
OUTPUT_FILE = 'default_areas.json'

def load_questions(file_path):
    """Carica le domande dal file JS"""
    print(f"📖 Caricamento file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'window\.QUIZ_DATA = (\[.*\]);', content, re.DOTALL)
    if not match:
        raise ValueError("Impossibile trovare QUIZ_DATA nel file")

    questions = json.loads(match.group(1))
    print(f"✅ Caricate {len(questions)} domande")
    return questions

def get_all_materie(questions):
    """Estrae tutte le materie uniche"""
    materie = set()
    for q in questions:
        materia = q.get('Materia', '')
        if materia:
            materie.add(materia)
    return sorted(materie)

def create_default_areas(materie):
    """Crea una struttura di aree predefinite con materie associate"""

    # Definizione delle aree con pattern di matching
    areas = [
        {
            "name": "Diritto Penale",
            "color": "#dc3545",  # Rosso
            "icon": "⚖️",
            "description": "Reati, concussione, corruzione, delitti contro patrimonio e P.A.",
            "subjects": []
        },
        {
            "name": "Diritto Amministrativo",
            "color": "#0dcaf0",  # Cyan
            "icon": "🏛️",
            "description": "Principi, provvedimenti, trasparenza e pubblica amministrazione",
            "subjects": []
        },
        {
            "name": "Diritto Costituzionale",
            "color": "#6610f2",  # Viola
            "icon": "📜",
            "description": "Costituzione, principi costituzionali e libertà civili",
            "subjects": []
        },
        {
            "name": "Procedura Penale",
            "color": "#fd7e14",  # Arancione
            "icon": "⚡",
            "description": "Attività di P.G., acquisizione notizie reato, atti e procedure",
            "subjects": []
        },
        {
            "name": "Ordinamento Polizia",
            "color": "#0d6efd",  # Blu
            "icon": "👮",
            "description": "Accesso, avanzamento, nuovo ordinamento e carriera",
            "subjects": []
        },
        {
            "name": "Pubblica Sicurezza",
            "color": "#198754",  # Verde
            "icon": "🛡️",
            "description": "Sistema P.S., controllo territorio, ordine pubblico, DASPO",
            "subjects": []
        },
        {
            "name": "Cybercrime e Reati Informatici",
            "color": "#6f42c1",  # Indaco
            "icon": "💻",
            "description": "Crimini informatici, tecniche investigative, hate speech, web",
            "subjects": []
        },
        {
            "name": "Privacy e Dati Personali",
            "color": "#20c997",  # Teal
            "icon": "🔒",
            "description": "Riservatezza, banche dati, CED, accesso e protezione dati",
            "subjects": []
        },
        {
            "name": "Stupefacenti e Sostanze",
            "color": "#d63384",  # Rosa
            "icon": "💊",
            "description": "Legislazione stupefacenti e normativa correlata",
            "subjects": []
        },
        {
            "name": "Minori e Tutela",
            "color": "#ffc107",  # Giallo
            "icon": "👶",
            "description": "Pornografia minorile, offese ai minori e protezione",
            "subjects": []
        },
        {
            "name": "Anticorruzione e Trasparenza",
            "color": "#795548",  # Marrone
            "icon": "🔍",
            "description": "Contrasto corruzione, prevenzione e disciplina",
            "subjects": []
        },
        {
            "name": "Sicurezza e Armi",
            "color": "#607d8b",  # Grigio blu
            "icon": "🔫",
            "description": "Norme sicurezza armi e regolamentazione",
            "subjects": []
        },
        {
            "name": "Salute e Sicurezza Lavoro",
            "color": "#ff9800",  # Arancione scuro
            "icon": "🏗️",
            "description": "D.Lgs 81, sicurezza luoghi di lavoro e normativa",
            "subjects": []
        },
        {
            "name": "Etica e Deontologia",
            "color": "#9c27b0",  # Viola scuro
            "icon": "⭐",
            "description": "Etica professionale, stress, coping e resilienza",
            "subjects": []
        },
        {
            "name": "Immigrazione e Stranieri",
            "color": "#00bcd4",  # Ciano chiaro
            "icon": "🌍",
            "description": "Ingresso, soggiorno stranieri, permessi, protezione internazionale",
            "subjects": []
        },
        {
            "name": "Violenza di Genere e Tutela Vittime",
            "color": "#e91e63",  # Rosa intenso
            "icon": "🛡️",
            "description": "Violenza di genere, OSCAD, Progetto Scudo, persone scomparse",
            "subjects": []
        },
        {
            "name": "Misure di Prevenzione",
            "color": "#ff5722",  # Rosso arancione
            "icon": "🚨",
            "description": "Misure di prevenzione personali e patrimoniali",
            "subjects": []
        },
        {
            "name": "Altre Materie",
            "color": "#6c757d",  # Grigio
            "icon": "📚",
            "description": "Materie non classificate in altre aree",
            "subjects": []
        }
    ]

    # Pattern di matching per assegnare materie alle aree
    patterns = {
        "Diritto Penale": [
            r"DIRITTO PENALE",
            r"DELITTI CONTRO",
            r"REATI PROPRI",
            r"PUBBLICO UFFICIALE",
            r"PECULATO",
            r"CONCUSSIONE",
            r"CORRUZIONE",
            r"ESTORSIONE",
            r"TRUFFA",
            r"FURTO",
            r"RAPINA",
            r"USURA",
            r"APPROPRIAZIONE INDEBITA",
            r"ILLECITO PENALE",
            r"OMICIDIO",
            r"^LE CAUSE DI ESCLUSIONE DEL REATO",
            r"^LE FORME DI MANIFESTAZIONE DEL REATO",
            r"FALSITA.*ATTI.*P\.U",
            r"STALKING",
            r"ATTI PERSECUTORI",
            r"MALTRATTAMENTI.*FAMILIARI"
        ],
        "Diritto Amministrativo": [
            r"DIRITTO AMMINISTRATIVO",
            r"PROVVEDIMENTO AMMINISTRATIVO",
            r"RIMEDI AMMINISTRATIVI",
            r"LEGALITÀ E TRASPARENZA",
            r"PUBBLICA AMMINISTRAZIONE",
            r"RESPONSABILITÀ PATRIMONIALE"
        ],
        "Diritto Costituzionale": [
            r"PRINCIPI COSTITUZIONALI",
            r"LIBERT.*CIVILE",
            r"COSTITUZIONE"
        ],
        "Procedura Penale": [
            r"ACQUISIZIONE.*NOTIZIA.*REATO",
            r"ATTIVIT.*INIZIATIVA.*DELEGATA",
            r"DOCUMENTAZIONE.*ATTI.*PG",
            r"RELAZIONE SERVIZIO",
            r"ANNOTAZIONE",
            r"VERBALE",
            r"AMMINISTRAZIONE DELLA GIUSTIZIA",
            r"OMESSA DENUNCIA",
            r"POLIZIA GIUDIZIARIA.*ORGANIZZAZIONE",
            r"RAPPORTI INFORMATIVI"
        ],
        "Ordinamento Polizia": [
            r"ACCESSO E AVANZAMENTO",
            r"ORDINAMENTO.*PERSONALE.*POLIZIA",
            r"CENNI SUL NUOVO ORDINAMENTO",
            r"RUOLI E QUALIFICHE.*PERSONALE",
            r"RIORDINO DELLE CARRIERE",
            r"RESPONSABILITÀ DISCIPLINARE",
            r"SANZIONI DISCIPLINARI",
            r"RELAZIONI SINDACALI",
            r"ACCORDO NAZIONALE QUADRO",
            r"DOVERI.*GENERALI.*PARTICOLARI",
            r"PS PERSONALE GESTIONE SERVIZI",
            r"REGISTRO DIPENDENTI",
            r"SCHEDA PERSONALE",
            r"SERVIZIO SETTIMANALE"
        ],
        "Pubblica Sicurezza": [
            r"DIRITTO.*PUBBLICA SICUREZZA",
            r"CONTROLLO DEL TERRITORIO",
            r"ORDINE PUBBLICO",
            r"DASPO",
            r"DACUR",
            r"ATTIVITÀ DI CONTROLLO",
            r"AMMINISTRAZIONE DELLA PS",
            r"MANIFESTAZIONI SPORTIVE",
            r"PREVENZIONE GENERALE E SOCCORSO",
            r"UFFICIO PREVENZIONE GENERALE",
            r"USO LEGITTIMO DELLE ARMI"
        ],
        "Cybercrime e Reati Informatici": [
            r"CRIMINI INFORMATICI",
            r"REATI INFORMATICI",
            r"CYBERCRIME",
            r"POLIZIA POSTALE",
            r"HATE SPEECH",
            r"ESTREMISMO IN RETE",
            r"WEB",
            r"SOCIAL NETWORK"
        ],
        "Privacy e Dati Personali": [
            r"RISERVATEZZA.*DATI",
            r"BANCA DATI.*CED",
            r"PRIVACY",
            r"PROTEZIONE.*DATI"
        ],
        "Stupefacenti e Sostanze": [
            r"STUPEFACENTI",
            r"LEGISLAZIONE SUGLI STUPEFACENTI"
        ],
        "Minori e Tutela": [
            r"PORNOGRAFIA MINORILE",
            r"MINORI",
            r"OFFENDONO I MINORI"
        ],
        "Anticorruzione e Trasparenza": [
            r"CONTRASTO.*PREVENZIONE.*CORRUZIONE",
            r"DISCIPLINA.*CORRUZIONE",
            r"ANTICORRUZIONE"
        ],
        "Sicurezza e Armi": [
            r"ARMI.*NORME.*SICUREZZA",
            r"USO LEGITTIMO DELLE ARMI"
        ],
        "Salute e Sicurezza Lavoro": [
            r"SALUTE E SICUREZZA.*LAVORO",
            r"DECRETO LEGISLATIVO.*81",
            r"LUOGHI DI LAVORO"
        ],
        "Etica e Deontologia": [
            r"ETICA.*DEONTOLOGIA",
            r"STRESS",
            r"COPING",
            r"RESILIENZA",
            r"VITTIMOLOGIA",
            r"VITTIMA DEL REATO"
        ],
        "Immigrazione e Stranieri": [
            r"INGRESSO.*SOGGIORNO.*STRANIERO",
            r"IMMIGRAZIONE",
            r"PERMESSI DI SOGGIORNO",
            r"INESPELLIBILITÀ",
            r"ESPULSIONE.*RESPINGIMENTO",
            r"PROTEZIONE INTERNAZIONALE",
            r"APOLIDE"
        ],
        "Violenza di Genere e Tutela Vittime": [
            r"VIOLENZA DI GENERE",
            r"OSCAD",
            r"PROGETTO SCUDO",
            r"COMMISSARIO.*PERSONE SCOMPARSE"
        ],
        "Misure di Prevenzione": [
            r"MISURE DI PREVENZIONE PERSONALI",
            r"MISURE DI PREVENZIONE PATRIMONIALI",
            r"AMMONIMENTO DEL QUESTORE"
        ]
    }

    # Assegna materie alle aree
    assigned = set()

    for area in areas:
        area_name = area["name"]
        if area_name == "Altre Materie":
            continue  # Saltiamo "Altre Materie" per ora

        if area_name in patterns:
            for materia in materie:
                if materia in assigned:
                    continue

                # Controlla se la materia matcha uno dei pattern dell'area
                for pattern in patterns[area_name]:
                    if re.search(pattern, materia, re.IGNORECASE):
                        area["subjects"].append(materia)
                        assigned.add(materia)
                        break

    # Assegna le materie non classificate a "Altre Materie"
    altre_materie_area = next(a for a in areas if a["name"] == "Altre Materie")
    for materia in materie:
        if materia not in assigned:
            altre_materie_area["subjects"].append(materia)

    # Rimuovi aree vuote
    areas = [a for a in areas if len(a["subjects"]) > 0]

    return areas

def generate_import_format(areas):
    """Genera il formato per l'import nell'app"""
    # Formato: nome area => lista di materie
    import_format = {}

    for area in areas:
        import_format[area["name"]] = area["subjects"]

    return import_format

def main():
    print("=" * 80)
    print("📚 VIT CYBER - GENERAZIONE AREE PREDEFINITE")
    print("=" * 80)
    print()

    # Carica domande
    questions = load_questions(INPUT_FILE)

    # Estrai materie
    materie = get_all_materie(questions)
    print(f"📊 Materie trovate: {len(materie)}")
    print()

    # Crea aree
    print("🎯 Creazione aree tematiche...")
    areas = create_default_areas(materie)

    print()
    print("=" * 80)
    print("✅ AREE GENERATE")
    print("=" * 80)
    print()

    total_subjects = 0
    for i, area in enumerate(areas, 1):
        print(f"{i}. {area['icon']} {area['name']}")
        print(f"   📊 Materie: {len(area['subjects'])}")
        print(f"   📝 {area['description']}")
        total_subjects += len(area['subjects'])

        # Mostra prime 3 materie come esempio
        if area['subjects']:
            print(f"   📚 Esempi:")
            for subj in area['subjects'][:3]:
                print(f"      • {subj}")
            if len(area['subjects']) > 3:
                print(f"      ... e altre {len(area['subjects']) - 3} materie")
        print()

    print("=" * 80)
    print(f"📊 STATISTICHE FINALI")
    print("=" * 80)
    print(f"  • Aree create: {len(areas)}")
    print(f"  • Materie totali: {total_subjects}")
    print(f"  • Domande totali: {len(questions)}")
    print()

    # Salva file JSON completo
    output_data = {
        "version": "1.0",
        "generated": datetime.now().isoformat(),
        "total_areas": len(areas),
        "total_subjects": total_subjects,
        "areas": areas
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✅ File salvato: {OUTPUT_FILE}")
    print()

    # Genera anche formato import semplificato
    import_format = generate_import_format(areas)
    import_file = 'areas_import_simple.json'

    with open(import_file, 'w', encoding='utf-8') as f:
        json.dump(import_format, f, ensure_ascii=False, indent=2)

    print(f"✅ File import semplificato: {import_file}")
    print()

    print("=" * 80)
    print("🎯 COME IMPORTARE NELL'APP")
    print("=" * 80)
    print()
    print("Opzione 1 - Import Automatico:")
    print("  1. Apri l'app VIT Cyber")
    print("  2. Vai in 'Gestione Aree'")
    print("  3. Usa il pulsante 'Importa Aree Predefinite'")
    print("  4. L'app caricherà automaticamente default_areas.json")
    print()
    print("Opzione 2 - Import Manuale JSON:")
    print("  1. Apri areas_import_simple.json")
    print("  2. Copia il contenuto")
    print("  3. Nell'app, usa 'Importa da JSON'")
    print()
    print("💡 Le aree sono completamente modificabili dall'utente!")
    print()

if __name__ == '__main__':
    main()
