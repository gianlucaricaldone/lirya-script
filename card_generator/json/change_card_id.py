import json
import os
import re

def update_card_ids(files_list):
    current_id = 5  # ID iniziale come richiesto
    
    # Dizionario per tenere traccia dei vecchi ID mappati ai nuovi
    id_mapping = {}
    
    for file_path in files_list:
        print(f"Elaborazione del file: {file_path}")
        
        # Leggi il file JSON
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Determina la struttura del file e ottieni la lista di carte
        if 'common_cards' in data:
            cards_list = data['common_cards']
            root_key = 'common_cards'
        else:
            cards_list = data
            root_key = None
            
        # Aggiorna gli ID delle carte e i riferimenti nelle immagini
        for card in cards_list:
            old_id = card['id']
            id_mapping[old_id] = current_id
            
            # Aggiorna l'ID della carta
            card['id'] = current_id
            
            # Aggiorna il riferimento dell'immagine
            if 'img' in card:
                # Estrai il vecchio ID dall'URL dell'immagine
                img_path = card['img']
                # Sostituisci il vecchio ID con il nuovo nell'URL dell'immagine
                new_img_path = re.sub(r'(\d+)_', f"{current_id}_", img_path)
                card['img'] = new_img_path
            
            current_id += 1
        
        # Salva il file aggiornato
        output_path = f"updated_{os.path.basename(file_path)}"
        with open(output_path, 'w', encoding='utf-8') as file:
            if root_key:
                json.dump({root_key: cards_list}, file, ensure_ascii=False, indent=2)
            else:
                json.dump(cards_list, file, ensure_ascii=False, indent=2)
        
        print(f"File aggiornato salvato come: {output_path}")
        
    # Stampa un riassunto delle modifiche
    print(f"\nTotale carte elaborate: {current_id - 5}")
    print(f"Range di ID: da 5 a {current_id - 1}")
    
    return id_mapping

# Lista dei file da elaborare nell'ordine specificato
files_to_process = [
    "lirya-common-cards.json",
    "lirya-uncommon-cards.json", 
    "lirya-rare-cards.json", 
    "lirya-legendary-ultra-rare-cards.json"
]

# Esegui l'aggiornamento degli ID
id_map = update_card_ids(files_to_process)

# Mostra alcuni esempi di mapping degli ID (facoltativo)
print("\nEsempi di mapping degli ID (vecchio → nuovo):")
count = 0
for old_id, new_id in id_map.items():
    print(f"ID {old_id} → ID {new_id}")
    count += 1
    if count >= 10:  # Mostra solo i primi 10 esempi
        print("...")
        break