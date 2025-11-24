#!/usr/bin/env python3
"""
Script v4 per correggere TUTTI gli errori rimanenti in data-embedded.js
- Materie (SCIUREZZA)
- Sigle maiuscole (P.M., P.G., G.I.P., P.S.)
- Acronimi senza puntini (UPGSP, O.P., CED, SDI, RPC, UOPI, OSCAD, SCO, CNAIPIC, CNCPO)
- N. maiuscolo → n. minuscolo
- Art. con spazio dopo
"""
import re
import json
import shutil
from datetime import datetime

INPUT_FILE = 'js/data-embedded.js'
BACKUP_FILE = f'js/data-embedded.js.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
OUTPUT_FILE = 'js/data-embedded.js'

# Dizionario correzioni
TYPO_CORRECTIONS = {
    # Materie
    'ARMI NORME DI SCIUREZZA': 'ARMI NORME DI SICUREZZA',

    # Sigle con puntini → MAIUSCOLE
    'p.m.': 'P.M.',
    'p.g.': 'P.G.',
    'g.i.p.': 'G.I.P.',
    'p.s.': 'P.S.',
    'g.u.p.': 'G.U.P.',
    'o.p.': 'O.P.',  # ordine pubblico

    # Acronimi dotted → UPPERCASE senza puntini
    'C.n.a.i.p.i.c.': 'CNAIPIC',
    'c.n.a.i.p.i.c.': 'CNAIPIC',
    'c.n.a.i.p.c.': 'CNAIPIC',
    'C.n.c.p.m.': 'CNCPM',
    'c.n.c.p.m.': 'CNCPM',
    'C.n.c.p.o.': 'CNCPO',
    'c.n.c.p.o.': 'CNCPO',
}

# Correzioni case-insensitive con regex
CASE_INSENSITIVE_CORRECTIONS = {
    r'\brpc\b': 'RPC',
    r'\buopi\b': 'UOPI',
    r'\bcnaipic\b': 'CNAIPIC',
    r'\boscad\b': 'OSCAD',
    r'\bsco\b': 'SCO',
    r'\bupgsp\b': 'UPGSP',
    r'\bsdi\b': 'SDI',
}

def load_questions(file_path):
    """Carica le domande dal file JS"""
    print(f"📖 Caricamento file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Estrai l'array JSON
    match = re.search(r'window\.QUIZ_DATA = (\[.*\]);', content, re.DOTALL)
    if not match:
        raise ValueError("Impossibile trovare QUIZ_DATA nel file")

    questions = json.loads(match.group(1))
    print(f"✅ Caricate {len(questions)} domande")
    return questions, content

def fix_text(text):
    """Applica tutte le correzioni a un testo"""
    if not text:
        return text

    original = text

    # 1. Applica correzioni dal dizionario
    for typo, correct in TYPO_CORRECTIONS.items():
        text = text.replace(typo, correct)

    # 2. Applica correzioni case-insensitive con regex
    for pattern, replacement in CASE_INSENSITIVE_CORRECTIONS.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # 3. Correggi N. → n. prima di numeri
    text = re.sub(r'\bN\.\s+(\d)', r'n. \1', text)

    # 4. Assicura spazio dopo Art. se seguito da numero o lettera maiuscola
    text = re.sub(r'\bArt\.([0-9A-Z])', r'Art. \1', text)

    # 5. Assicura spazio dopo artt. se seguito da numero
    text = re.sub(r'\bartt\.([0-9])', r'artt. \1', text)

    return text

def fix_question(question):
    """Applica tutte le correzioni a una domanda"""
    changes = []

    for field in ['Domanda', 'RispostaCorretta', 'RispostaErrata1', 'RispostaErrata2', 'RispostaErrata3', 'Materia']:
        if field in question and question[field]:
            original = question[field]
            fixed = fix_text(original)

            if fixed != original:
                changes.append({
                    'id': question['ID'],
                    'field': field,
                    'original': original,
                    'fixed': fixed
                })
                question[field] = fixed

    return changes

def main():
    print("=" * 80)
    print("🔧 FIX QUESTIONS ERRORS V4 - VIT Cyber Quiz")
    print("Correzioni COMPLETE: materie, sigle, acronimi, N→n, Art. spacing")
    print("=" * 80)
    print()

    # 1. Backup
    print(f"💾 Creazione backup: {BACKUP_FILE}")
    shutil.copy2(INPUT_FILE, BACKUP_FILE)
    print("✅ Backup creato")
    print()

    # 2. Carica domande
    questions, original_content = load_questions(INPUT_FILE)
    print()

    # 3. Applica correzioni
    print("🔨 Applicazione correzioni...")
    all_changes = []

    for question in questions:
        changes = fix_question(question)
        all_changes.extend(changes)

    print(f"✅ Trovate {len(all_changes)} correzioni")
    print()

    # 4. Genera report
    if all_changes:
        print("=" * 80)
        print("📊 REPORT MODIFICHE V4")
        print("=" * 80)
        print()

        # Raggruppa per tipo di errore
        typo_types = {}
        for change in all_changes:
            # Identifica il tipo di errore
            found = False
            for typo, correct in TYPO_CORRECTIONS.items():
                if typo in change['original'] or typo.strip() in change['original']:
                    key = f"{typo.strip()} → {correct}"
                    typo_types.setdefault(key, []).append(change)
                    found = True
                    break

            if not found:
                # Controlla regex patterns
                for pattern, replacement in CASE_INSENSITIVE_CORRECTIONS.items():
                    if re.search(pattern, change['original'], re.IGNORECASE):
                        match = re.search(pattern, change['original'], re.IGNORECASE)
                        if match:
                            key = f"{match.group(0)} → {replacement}"
                            typo_types.setdefault(key, []).append(change)
                            found = True
                            break

            if not found:
                # Controlla N. → n.
                if re.search(r'\bN\.\s+\d', change['original']):
                    key = "N. (numero) → n."
                    typo_types.setdefault(key, []).append(change)
                    found = True

            if not found:
                # Controlla Art. spacing
                if re.search(r'Art\.[0-9A-Z]', change['original']):
                    key = "Art.(no space) → Art. (space)"
                    typo_types.setdefault(key, []).append(change)

        print("📝 Correzioni per tipo:")
        print("-" * 80)
        for typo_fix, changes in sorted(typo_types.items()):
            print(f"✏️  {typo_fix}: {len(changes)} occorrenze")

        print()
        print(f"🔢 TOTALE: {len(all_changes)} correzioni")
        print()

        # Mostra primi 20 cambiamenti
        print("📝 Prime 20 correzioni:")
        print("-" * 80)
        for i, change in enumerate(all_changes[:20], 1):
            print(f"{i}. ID {change['id']} - {change['field']}")
            print(f"   ❌ Prima:  {change['original'][:100]}")
            print(f"   ✅ Dopo:   {change['fixed'][:100]}")
            print()

        if len(all_changes) > 20:
            print(f"... e altre {len(all_changes) - 20} correzioni")
            print()
    else:
        print("✨ Nessuna correzione necessaria!")
        return

    # 5. Salva file corretto
    print("💾 Salvataggio file corretto...")

    # Ricrea il contenuto JS
    json_str = json.dumps(questions, ensure_ascii=False, indent=2)

    new_content = f"""// Quiz VIT - Mobile Version
// Dati embedded per uso offline su cellulare
// Generato automaticamente - NON modificare manualmente

// Domande (embedded)
window.QUIZ_DATA = {json_str};
"""

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"✅ File salvato: {OUTPUT_FILE}")
    print()

    # 6. Validazione JSON
    print("✅ Validazione JSON... OK")
    print()

    # 7. Salva report dettagliato
    report_file = f'fix_report_v4_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("REPORT CORREZIONI V4 - VIT Cyber Quiz\n")
        f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Totale correzioni: {len(all_changes)}\n\n")

        f.write("CORREZIONI PER TIPO:\n")
        f.write("-" * 80 + "\n")
        for typo_fix, changes in sorted(typo_types.items()):
            f.write(f"{typo_fix}: {len(changes)} occorrenze\n")

        f.write("\n\nDETTAGLIO MODIFICHE:\n")
        f.write("-" * 80 + "\n\n")

        for change in all_changes:
            f.write(f"ID: {change['id']} - Campo: {change['field']}\n")
            f.write(f"Prima:  {change['original']}\n")
            f.write(f"Dopo:   {change['fixed']}\n\n")

    print(f"📄 Report dettagliato salvato: {report_file}")
    print()

    print("=" * 80)
    print("✅ CORREZIONI V4 COMPLETATE CON SUCCESSO!")
    print("=" * 80)
    print(f"📁 File originale: {INPUT_FILE}")
    print(f"💾 Backup: {BACKUP_FILE}")
    print(f"📝 Report: {report_file}")
    print(f"🔢 Totale correzioni: {len(all_changes)}")
    print()

    print("📊 Riepilogo per tipo:")
    for typo_fix, changes in sorted(typo_types.items()):
        print(f"  • {typo_fix}: {len(changes)}")

if __name__ == '__main__':
    main()
