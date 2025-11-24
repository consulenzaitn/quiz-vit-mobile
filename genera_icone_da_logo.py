#!/usr/bin/env python3
"""
Script per creare icone PNG per la PWA dal logo.jpeg
"""
from PIL import Image
import os

def create_icon_from_logo(logo_path, size, output_filename):
    """Crea un'icona ridimensionando il logo"""
    # Apri il logo
    img = Image.open(logo_path)

    # Converti in RGBA se necessario
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Ridimensiona mantenendo l'aspect ratio e centrando
    img.thumbnail((size, size), Image.Resampling.LANCZOS)

    # Crea un'immagine quadrata con sfondo trasparente
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    # Centra l'immagine
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    output.paste(img, (x, y), img if img.mode == 'RGBA' else None)

    # Salva
    output.save(output_filename, 'PNG')
    print(f'✅ Icona creata: {output_filename} ({size}x{size})')

# Directory
mobile_dir = '/Users/josephborgese/Programmazione/Domande_VIT/quiz-app-mobile'
os.chdir(mobile_dir)

print('Creazione icone PWA dal logo...')
print()

try:
    logo_path = 'logo.jpeg'

    if not os.path.exists(logo_path):
        print(f'❌ Errore: {logo_path} non trovato!')
        exit(1)

    # Crea le icone necessarie
    create_icon_from_logo(logo_path, 192, 'icon-192.png')
    create_icon_from_logo(logo_path, 512, 'icon-512.png')
    create_icon_from_logo(logo_path, 180, 'apple-touch-icon.png')

    print()
    print('✅ Tutte le icone sono state create dal logo!')
except Exception as e:
    print(f'❌ Errore: {e}')
    import traceback
    traceback.print_exc()
    print()
    print('Installare Pillow con: pip install Pillow')
