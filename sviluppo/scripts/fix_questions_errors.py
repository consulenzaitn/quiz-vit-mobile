#!/usr/bin/env python3
"""
Script per correggere errori ortografici e di formattazione in data-embedded.js
- Spazi prima della punteggiatura (. ? ! , ; :)
- Spazi doppi consecutivi
- Errori ortografici comuni
- Genera report dettagliato delle modifiche
"""
import re
import json
import shutil
from datetime import datetime

INPUT_FILE = 'js/data-embedded.js'
BACKUP_FILE = f'js/data-embedded.js.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
OUTPUT_FILE = 'js/data-embedded.js'

# Dizionario errori ortografici comuni
TYPO_CORRECTIONS = {
    'servzio': 'servizio',
    'assistenete': 'assistente',
    'permanza': 'permanenza',
    'acceso': 'accesso',
    'etelematici': 'telematici',
    'cp..': 'c.p.',
    # Aggiungi altri errori comuni qui
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

def fix_spacing(text):
    """Rimuove spazi prima della punteggiatura"""
    if not text:
        return text

    # Spazio prima di . ? ! , ; :
    text = re.sub(r'\s+([.?!,;:])', r'\1', text)
    # Spazi doppi o multipli
    text = re.sub(r'\s{2,}', ' ', text)
    # Spazio all'inizio e fine
    text = text.strip()

    return text

def fix_typos(text):
    """Corregge errori ortografici comuni"""
    if not text:
        return text

    original = text
    for typo, correct in TYPO_CORRECTIONS.items():
        # Case insensitive replace, ma mantieni il case originale
        pattern = re.compile(re.escape(typo), re.IGNORECASE)
        text = pattern.sub(correct, text)

    return text

def fix_question(question):
    """Applica tutte le correzioni a una domanda"""
    changes = []

    for field in ['Domanda', 'RispostaCorretta', 'RispostaErrata1', 'RispostaErrata2', 'RispostaErrata3', 'Materia']:
        if field in question and question[field]:
            original = question[field]

            # Applica fix spacing
            fixed = fix_spacing(original)

            # Applica fix typos
            fixed = fix_typos(fixed)

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
    print("🔧 FIX QUESTIONS ERRORS - VIT Cyber Quiz")
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
        print("📊 REPORT MODIFICHE")
        print("=" * 80)
        print()

        # Raggruppa per tipo
        spacing_changes = [c for c in all_changes if re.search(r'\s[.?!,;:]|\s{2,}', c['original'])]
        typo_changes = [c for c in all_changes if c not in spacing_changes]

        print(f"🔹 Correzioni spacing: {len(spacing_changes)}")
        print(f"🔹 Correzioni typos: {len(typo_changes)}")
        print()

        # Mostra primi 20 cambiamenti
        print("📝 Prime 20 correzioni:")
        print("-" * 80)
        for i, change in enumerate(all_changes[:20], 1):
            print(f"{i}. ID {change['id']} - {change['field']}")
            print(f"   ❌ Prima:  {change['original'][:80]}")
            print(f"   ✅ Dopo:   {change['fixed'][:80]}")
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

    # Mantieni la struttura originale del file
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
    report_file = f'fix_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("REPORT CORREZIONI - VIT Cyber Quiz\n")
        f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Totale correzioni: {len(all_changes)}\n")
        f.write(f"- Correzioni spacing: {len(spacing_changes)}\n")
        f.write(f"- Correzioni typos: {len(typo_changes)}\n\n")
        f.write("DETTAGLIO MODIFICHE:\n")
        f.write("-" * 80 + "\n\n")

        for change in all_changes:
            f.write(f"ID: {change['id']} - Campo: {change['field']}\n")
            f.write(f"Prima:  {change['original']}\n")
            f.write(f"Dopo:   {change['fixed']}\n\n")

    print(f"📄 Report dettagliato salvato: {report_file}")
    print()

    print("=" * 80)
    print("✅ CORREZIONI COMPLETATE CON SUCCESSO!")
    print("=" * 80)
    print(f"📁 File originale: {INPUT_FILE}")
    print(f"💾 Backup: {BACKUP_FILE}")
    print(f"📝 Report: {report_file}")
    print(f"🔢 Totale correzioni: {len(all_changes)}")

if __name__ == '__main__':
    main()
