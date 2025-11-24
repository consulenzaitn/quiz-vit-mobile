#!/usr/bin/env python3
"""
Script per sostituire tutte le occorrenze di localStorage con SafeStorage
"""
import re

file_path = '/Users/josephborgese/Programmazione/Domande_VIT/quiz-app-mobile/js/app.js'

# Leggi il file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.content()

# Pattern di sostituzione
replacements = [
    # JSON.parse(localStorage.getItem('key') || 'default') -> SafeStorage.getItem('key', parsed_default)
    (r"JSON\.parse\(localStorage\.getItem\('([^']+)'\)\s*\|\|\s*'(\[.*?\])'\)", r"SafeStorage.getItem('\1', \2)"),
    (r"JSON\.parse\(localStorage\.getItem\('([^']+)'\)\s*\|\|\s*'(\{.*?\})'\)", r"SafeStorage.getItem('\1', \2)"),

    # localStorage.setItem('key', JSON.stringify(value)) -> SafeStorage.setItem('key', value)
    (r"localStorage\.setItem\('([^']+)',\s*JSON\.stringify\(([^\)]+)\)\)", r"SafeStorage.setItem('\1', \2)"),

    # localStorage.removeItem('key') -> SafeStorage.removeItem('key')
    (r"localStorage\.removeItem\('([^']+)'\)", r"SafeStorage.removeItem('\1')"),

    # localStorage.getItem('key') -> SafeStorage.getItem('key')
    (r"localStorage\.getItem\('([^']+)'\)", r"SafeStorage.getItem('\1')"),
]

# Applica le sostituzioni
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Scrivi il file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Sostituzioni completate!')
