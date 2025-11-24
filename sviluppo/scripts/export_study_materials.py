#!/usr/bin/env python3
"""
Script per esportare domande e risposte in formato Markdown per materia
Crea materiale di studio da dare in pasto a un AI (ChatGPT/Claude)
"""
import re
import json
from datetime import datetime
from pathlib import Path
from collections import defaultdict

INPUT_FILE = 'js/data-embedded.js'
OUTPUT_DIR = 'materiali_studio'

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
    return questions

def group_by_materia(questions):
    """Raggruppa le domande per materia"""
    by_materia = defaultdict(list)

    for q in questions:
        materia = q.get('Materia', 'SENZA MATERIA')
        by_materia[materia].append(q)

    return by_materia

def create_markdown_for_materia(materia, questions, output_path):
    """Crea un file Markdown per una materia specifica"""

    # Sanitize nome file
    safe_filename = materia.replace('/', '-').replace(':', '-').replace('.', '')
    filepath = output_path / f"{safe_filename}.md"

    with open(filepath, 'w', encoding='utf-8') as f:
        # Header con istruzioni per l'AI
        f.write(f"# 📚 Materiale di Studio: {materia}\n\n")
        f.write(f"**Generato il:** {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        f.write(f"**Numero domande:** {len(questions)}\n\n")

        f.write("---\n\n")

        # Istruzioni per l'AI
        f.write("## 🤖 Istruzioni per l'AI\n\n")
        f.write("Sei un esperto formatore in materia di **{}**. ".format(materia))
        f.write("Il tuo compito è creare un **documento di studio completo e approfondito** basato sulle domande d'esame sottostanti.\n\n")

        f.write("### Obiettivi del documento:\n\n")
        f.write("1. **Teoria Completa**: Spiega tutti i concetti chiave richiesti dalle domande\n")
        f.write("2. **Organizzazione Logica**: Raggruppa gli argomenti in sezioni tematiche\n")
        f.write("3. **Esempi Pratici**: Fornisci esempi concreti e casi d'uso\n")
        f.write("4. **Schemi e Tabelle**: Crea tabelle comparative quando utile\n")
        f.write("5. **Approfondimenti**: Aggiungi contesto normativo e collegamenti tra concetti\n")
        f.write("6. **Linguaggio Chiaro**: Usa un linguaggio professionale ma accessibile\n\n")

        f.write("### Struttura raccomandata:\n\n")
        f.write("```\n")
        f.write("# [MATERIA]\n\n")
        f.write("## 1. Introduzione e Quadro Normativo\n")
        f.write("## 2. Concetti Fondamentali\n")
        f.write("## 3. [Argomento Specifico 1]\n")
        f.write("## 4. [Argomento Specifico 2]\n")
        f.write("## 5. Tabelle Riassuntive\n")
        f.write("## 6. FAQ - Domande Frequenti d'Esame\n")
        f.write("## 7. Riferimenti Normativi\n")
        f.write("```\n\n")

        f.write("---\n\n")

        # Domande e risposte
        f.write("## 📋 Domande d'Esame con Risposte Corrette\n\n")
        f.write(f"*Analizza attentamente queste {len(questions)} domande per identificare tutti gli argomenti da trattare nel documento di studio.*\n\n")
        f.write("---\n\n")

        for i, q in enumerate(questions, 1):
            f.write(f"### Domanda {i}\n\n")
            f.write(f"**Q:** {q['Domanda']}\n\n")
            f.write(f"**✅ Risposta Corretta:** {q['RispostaCorretta']}\n\n")

            # Opzionale: mostra anche le risposte errate per contesto
            risposte_errate = []
            for key in ['RispostaErrata1', 'RispostaErrata2', 'RispostaErrata3']:
                if q.get(key) and q[key].strip():
                    risposte_errate.append(q[key])

            if risposte_errate:
                f.write("**Risposte Errate (per contesto):**\n")
                for err in risposte_errate:
                    f.write(f"- ❌ {err}\n")
                f.write("\n")

            f.write("---\n\n")

        # Footer
        f.write("\n## 📝 Note per la Generazione del Documento\n\n")
        f.write("- Identifica i **temi ricorrenti** nelle domande\n")
        f.write("- Crea **collegamenti logici** tra gli argomenti\n")
        f.write("- Espandi ogni concetto con **teoria approfondita**\n")
        f.write("- Usa **formattazione Markdown** per massima leggibilità\n")
        f.write("- Includi **esempi pratici** per ogni concetto importante\n")
        f.write("- Crea **tabelle comparative** dove appropriato\n\n")
        f.write("---\n\n")
        f.write("*🤖 Documento generato automaticamente da VIT Cyber Quiz - Export Tool*\n")

    return filepath

def export_single_materia(materia_name=None):
    """Esporta una singola materia per test"""

    # Carica domande
    questions = load_questions(INPUT_FILE)

    # Raggruppa per materia
    by_materia = group_by_materia(questions)

    # Se non specificata, prendi la prima materia con più domande
    if materia_name is None:
        # Ordina per numero domande
        sorted_materie = sorted(by_materia.items(), key=lambda x: len(x[1]), reverse=True)
        materia_name = sorted_materie[0][0]
        print(f"\n📊 Materie disponibili (top 5):")
        for i, (mat, qs) in enumerate(sorted_materie[:5], 1):
            print(f"{i}. {mat}: {len(qs)} domande")
        print()

    if materia_name not in by_materia:
        print(f"❌ Materia '{materia_name}' non trovata!")
        print("\nMaterie disponibili:")
        for mat in sorted(by_materia.keys()):
            print(f"  - {mat}")
        return None

    # Crea directory output
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)

    # Esporta la materia
    questions_materia = by_materia[materia_name]
    filepath = create_markdown_for_materia(materia_name, questions_materia, output_path)

    print(f"✅ Creato file: {filepath}")
    print(f"📊 Domande esportate: {len(questions_materia)}")
    print()
    print("=" * 80)
    print("🎯 PROSSIMO PASSO:")
    print("=" * 80)
    print()
    print("1. Apri il file Markdown generato")
    print("2. Copia TUTTO il contenuto")
    print("3. Incollalo in ChatGPT o Claude")
    print("4. L'AI creerà automaticamente un documento di studio completo!")
    print()
    print("💡 Prompt suggerito per l'AI:")
    print("-" * 80)
    print("Crea un documento di studio completo seguendo le istruzioni nel file.")
    print("Analizza tutte le domande e crea teoria approfondita con esempi pratici.")
    print("-" * 80)
    print()

    return filepath

def export_all_materie():
    """Esporta tutte le materie"""

    # Carica domande
    questions = load_questions(INPUT_FILE)

    # Raggruppa per materia
    by_materia = group_by_materia(questions)

    # Crea directory output
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)

    print()
    print("=" * 80)
    print("📚 ESPORTAZIONE TUTTE LE MATERIE")
    print("=" * 80)
    print()

    files_created = []

    for materia, questions_materia in sorted(by_materia.items()):
        filepath = create_markdown_for_materia(materia, questions_materia, output_path)
        files_created.append((materia, len(questions_materia), filepath))
        print(f"✅ {materia}: {len(questions_materia)} domande → {filepath.name}")

    print()
    print("=" * 80)
    print(f"✅ ESPORTAZIONE COMPLETATA!")
    print("=" * 80)
    print()
    print(f"📁 Directory: {output_path.absolute()}")
    print(f"📄 Files creati: {len(files_created)}")
    print(f"📊 Totale domande: {sum(count for _, count, _ in files_created)}")
    print()
    print("🎯 Puoi ora dare ogni file a ChatGPT/Claude per creare materiali di studio!")
    print()

    return files_created

if __name__ == '__main__':
    print("=" * 80)
    print("📚 VIT CYBER - EXPORT MATERIALI DI STUDIO")
    print("=" * 80)
    print()
    print("Cosa vuoi fare?")
    print()
    print("1. Esporta UNA materia (per test)")
    print("2. Esporta TUTTE le materie")
    print()

    choice = input("Scelta [1/2]: ").strip()

    if choice == '1':
        # Test con una materia
        export_single_materia()
    elif choice == '2':
        # Esporta tutto
        export_all_materie()
    else:
        print("❌ Scelta non valida!")
