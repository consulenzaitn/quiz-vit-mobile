#!/usr/bin/env python3
"""
Script per esportare TUTTE le domande in UN UNICO file Markdown
Organizzato per materia con indice navigabile
"""
import re
import json
from datetime import datetime
from pathlib import Path
from collections import defaultdict

INPUT_FILE = 'js/data-embedded.js'
OUTPUT_FILE = 'MATERIALE_STUDIO_COMPLETO.md'

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

def sanitize_anchor(text):
    """Crea un anchor link valido per Markdown"""
    # Rimuovi caratteri speciali e converti in lowercase
    anchor = text.lower()
    anchor = anchor.replace(':', '')
    anchor = anchor.replace('.', '')
    anchor = anchor.replace(',', '')
    anchor = anchor.replace('/', '-')
    anchor = anchor.replace(' ', '-')
    anchor = anchor.replace('(', '')
    anchor = anchor.replace(')', '')
    return anchor

def create_single_file(questions_by_materia, output_file):
    """Crea un unico file Markdown con tutte le materie"""

    total_questions = sum(len(qs) for qs in questions_by_materia.values())
    sorted_materie = sorted(questions_by_materia.items(), key=lambda x: x[0])

    with open(output_file, 'w', encoding='utf-8') as f:
        # ========== HEADER ==========
        f.write("# 📚 VIT CYBER - Materiale di Studio Completo\n\n")
        f.write(f"**Generato il:** {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        f.write(f"**Totale materie:** {len(questions_by_materia)}\n")
        f.write(f"**Totale domande:** {total_questions}\n\n")
        f.write("---\n\n")

        # ========== ISTRUZIONI PER L'AI ==========
        f.write("## 🤖 Istruzioni per l'AI\n\n")
        f.write("Sei un **esperto formatore** in materia di **Cybersecurity e Diritto della Polizia di Stato Italiana**. ")
        f.write(f"Il tuo compito è analizzare le **{total_questions} domande d'esame** organizzate per materia e creare un **documento di studio completo e professionale**.\n\n")

        f.write("### 🎯 Obiettivi del documento:\n\n")
        f.write("1. **Teoria Completa**: Spiega tutti i concetti chiave per ogni materia\n")
        f.write("2. **Organizzazione Logica**: Mantieni la struttura per materia, ma crea collegamenti tra argomenti correlati\n")
        f.write("3. **Esempi Pratici**: Fornisci esempi concreti, casi d'uso e scenari operativi\n")
        f.write("4. **Schemi e Tabelle**: Crea tabelle comparative, schemi riassuntivi e mappe concettuali\n")
        f.write("5. **Approfondimenti Normativi**: Contestualizza ogni argomento nel quadro legislativo italiano\n")
        f.write("6. **Linguaggio Professionale**: Usa terminologia tecnica ma accessibile, adatta a operatori di polizia\n\n")

        f.write("### 📋 Struttura raccomandata:\n\n")
        f.write("Per ogni materia, crea una sezione strutturata così:\n\n")
        f.write("```markdown\n")
        f.write("# [NOME MATERIA]\n\n")
        f.write("## 1. Introduzione e Quadro Normativo\n")
        f.write("- Riferimenti legislativi principali\n")
        f.write("- Contesto operativo\n\n")
        f.write("## 2. Concetti Fondamentali\n")
        f.write("- Definizioni chiave\n")
        f.write("- Principi generali\n\n")
        f.write("## 3. Approfondimenti Tematici\n")
        f.write("- [Sottotemi specifici identificati dalle domande]\n\n")
        f.write("## 4. Casistica e Procedure\n")
        f.write("- Esempi pratici\n")
        f.write("- Workflow operativi\n\n")
        f.write("## 5. Tabelle Riassuntive\n")
        f.write("- Comparazioni\n")
        f.write("- Checklist operative\n\n")
        f.write("## 6. FAQ d'Esame\n")
        f.write("- Risposte alle domande più frequenti\n")
        f.write("```\n\n")

        f.write("### 💡 Suggerimenti operativi:\n\n")
        f.write("- **Analizza i pattern**: Identifica temi ricorrenti tra le domande\n")
        f.write("- **Crea collegamenti**: Mostra come le diverse materie si integrano (es. diritto penale + procedure)\n")
        f.write("- **Evidenzia i tranelli**: Segnala le risposte errate comuni per aiutare a evitare errori\n")
        f.write("- **Usa formattazione**: Grassetto per concetti chiave, liste puntate, tabelle, quote per citazioni normative\n")
        f.write("- **Aggiungi esempi**: Scenari operativi realistici che un agente potrebbe affrontare\n\n")

        f.write("---\n\n")

        # ========== INDICE DELLE MATERIE ==========
        f.write("## 📑 Indice delle Materie\n\n")
        f.write(f"*{len(questions_by_materia)} materie - {total_questions} domande totali*\n\n")

        for i, (materia, questions) in enumerate(sorted_materie, 1):
            anchor = sanitize_anchor(materia)
            f.write(f"{i}. [{materia}](#{anchor}) ({len(questions)} domande)\n")

        f.write("\n---\n\n")

        # ========== SEZIONI PER MATERIA ==========
        for i, (materia, questions) in enumerate(sorted_materie, 1):
            anchor = sanitize_anchor(materia)

            # Header materia
            f.write(f"## {i}. {materia}\n\n")
            f.write(f"**Numero domande:** {len(questions)}\n\n")
            f.write("---\n\n")

            # Istruzioni specifiche per la materia
            f.write("### 🎯 Obiettivi di questa sezione\n\n")
            f.write(f"Analizza attentamente le **{len(questions)} domande** di questa materia per:\n\n")
            f.write("1. Identificare i **concetti chiave** e le **definizioni** necessarie\n")
            f.write("2. Estrarre i **riferimenti normativi** (leggi, decreti, articoli)\n")
            f.write("3. Creare una **teoria completa** che copra tutti gli argomenti testati\n")
            f.write("4. Fornire **esempi pratici** e **casi operativi** per ogni concetto\n")
            f.write("5. Preparare **tabelle riassuntive** dove appropriato\n\n")

            f.write("---\n\n")

            # Domande della materia
            f.write("### 📋 Domande d'Esame\n\n")

            for j, q in enumerate(questions, 1):
                f.write(f"#### Domanda {j}/{len(questions)}\n\n")
                f.write(f"**Q:** {q['Domanda']}\n\n")
                f.write(f"**✅ Risposta Corretta:** {q['RispostaCorretta']}\n\n")

                # Risposte errate per contesto
                risposte_errate = []
                for key in ['RispostaErrata1', 'RispostaErrata2', 'RispostaErrata3']:
                    if q.get(key) and q[key].strip():
                        risposte_errate.append(q[key])

                if risposte_errate:
                    f.write("<details>\n")
                    f.write("<summary>Risposte Errate (clicca per vedere)</summary>\n\n")
                    for err in risposte_errate:
                        f.write(f"- ❌ {err}\n")
                    f.write("\n</details>\n\n")

                f.write("---\n\n")

            # Separatore tra materie
            if i < len(sorted_materie):
                f.write("\n\n")
                f.write("=" * 80 + "\n\n")

        # ========== FOOTER ==========
        f.write("\n\n---\n\n")
        f.write("## 📝 Note Finali per l'AI\n\n")
        f.write("### Come procedere:\n\n")
        f.write("1. **Prima Lettura**: Leggi tutte le domande di una materia per identificare i temi\n")
        f.write("2. **Analisi**: Raggruppa mentalmente le domande per sottotemi\n")
        f.write("3. **Teoria**: Crea contenuto teorico che risponda a TUTTE le domande\n")
        f.write("4. **Esempi**: Aggiungi casi pratici e scenari operativi\n")
        f.write("5. **Verifica**: Assicurati che ogni domanda trovi risposta nella teoria\n\n")

        f.write("### Output finale atteso:\n\n")
        f.write("Un documento Markdown ben strutturato con:\n")
        f.write("- **Titoli e sottotitoli** chiari e gerarchici\n")
        f.write("- **Paragrafi** ben formattati e leggibili\n")
        f.write("- **Liste puntate** per enumerazioni\n")
        f.write("- **Tabelle** per comparazioni e riepiloghi\n")
        f.write("- **Grassetto** per concetti chiave\n")
        f.write("- **Codice/Quote** per citazioni normative\n")
        f.write("- **Collegamenti logici** tra sezioni correlate\n\n")

        f.write("### Esempio di formattazione:\n\n")
        f.write("```markdown\n")
        f.write("## Concetto Fondamentale\n\n")
        f.write("**Definizione**: Testo definizione...\n\n")
        f.write("**Riferimento Normativo**:\n")
        f.write("> Art. 123 del D.Lgs. n. 51/2018: \"testo citazione\"\n\n")
        f.write("**Esempio Operativo**:\n")
        f.write("Un agente si trova nella seguente situazione...\n\n")
        f.write("| Scenario | Azione Corretta | Riferimento |\n")
        f.write("|----------|-----------------|-------------|\n")
        f.write("| A        | Fare X          | Art. 123    |\n")
        f.write("| B        | Fare Y          | Art. 124    |\n")
        f.write("```\n\n")

        f.write("---\n\n")
        f.write(f"*🤖 Documento generato automaticamente il {datetime.now().strftime('%d/%m/%Y %H:%M')}*\n")
        f.write("*📚 VIT Cyber Quiz - Export Tool v1.0*\n")

    return output_file

def main():
    print("=" * 80)
    print("📚 VIT CYBER - EXPORT MATERIALE COMPLETO (FILE UNICO)")
    print("=" * 80)
    print()

    # Carica domande
    questions = load_questions(INPUT_FILE)

    # Raggruppa per materia
    by_materia = group_by_materia(questions)

    print(f"\n📊 Statistiche:")
    print(f"  - Materie trovate: {len(by_materia)}")
    print(f"  - Domande totali: {len(questions)}")
    print()

    # Crea file unico
    print("📝 Creazione file unico...")
    output_file = create_single_file(by_materia, OUTPUT_FILE)

    print()
    print("=" * 80)
    print("✅ EXPORT COMPLETATO!")
    print("=" * 80)
    print()
    print(f"📁 File creato: {output_file}")
    print(f"📊 Materie: {len(by_materia)}")
    print(f"📋 Domande: {len(questions)}")
    print()
    print("=" * 80)
    print("🎯 COME USARE IL FILE:")
    print("=" * 80)
    print()
    print("1. Apri il file Markdown generato")
    print("2. Copia TUTTO il contenuto (Cmd+A / Ctrl+A)")
    print("3. Incolla in ChatGPT o Claude")
    print("4. Usa questo prompt:")
    print()
    print("-" * 80)
    print("PROMPT CONSIGLIATO:")
    print("-" * 80)
    print()
    print("\"Crea un documento di studio completo seguendo le istruzioni")
    print("nel file. Per ogni materia:")
    print("- Analizza tutte le domande")
    print("- Crea teoria approfondita con esempi pratici")
    print("- Aggiungi tabelle riassuntive")
    print("- Collega concetti tra materie correlate")
    print("- Usa formattazione Markdown professionale\"")
    print()
    print("-" * 80)
    print()
    print("💡 SUGGERIMENTO:")
    print("Se il file è troppo grande, puoi chiedere all'AI di processare")
    print("una materia alla volta copiando solo la sezione specifica.")
    print()

if __name__ == '__main__':
    main()
