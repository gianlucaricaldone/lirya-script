#!/bin/bash

# Script per unire file JSON e copiare file SVG

# Directory corrente dove si trova lo script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Nome del file di output JSON
OUTPUT_FILE="$SCRIPT_DIR/cards.json"

# Cartelle per i file SVG
SVG_SOURCE_DIR="$SCRIPT_DIR/../../card_generator/svg_carte/"  # Modifica questo percorso con la cartella di origine dei file SVG
SVG_DEST_DIR="$SCRIPT_DIR/../svg-templates/"  # Modifica questo percorso con la cartella di destinazione

# Lista dei file JSON da combinare
JSON_FILES=(
    "/Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/card_generator/json/lirya-common-cards.json"
    "/Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/card_generator/json/lirya-uncommon-cards.json"
    "/Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/card_generator/json/lirya-rare-cards.json"
    "/Users/gianlucaricaldone/Progetti/Drive/LIRYA/script/card_generator/json/lirya-legendary-ultra-rare-cards.json"
)

# PARTE 1: UNIONE DEI FILE JSON
echo "Inizio unione dei file JSON..."

# Controlla se jq è installato
if command -v jq &> /dev/null; then
    # Usa jq per unire i file JSON
    echo "[]" > "$OUTPUT_FILE"

    for FILE in "${JSON_FILES[@]}"; do
        if [ -f "$FILE" ]; then
            jq -s '.[0] + .[1]' "$OUTPUT_FILE" "$FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
            echo "File JSON $FILE aggiunto con successo."
        else
            echo "Errore: File JSON $FILE non trovato."
        fi
    done
else
    # Metodo alternativo senza jq
    echo "[" > "$OUTPUT_FILE"

    COUNT=0
    TOTAL=${#JSON_FILES[@]}

    for FILE in "${JSON_FILES[@]}"; do
        if [ -f "$FILE" ]; then
            CONTENT=$(cat "$FILE" | sed -e 's/^\[//' -e 's/\]$//')
            echo "$CONTENT" >> "$OUTPUT_FILE"

            COUNT=$((COUNT+1))
            if [ $COUNT -lt $TOTAL ]; then
                echo "," >> "$OUTPUT_FILE"
            fi

            echo "File JSON $FILE aggiunto con successo."
        else
            echo "Errore: File JSON $FILE non trovato."
        fi
    done

    echo "]" >> "$OUTPUT_FILE"
fi

echo "Completata l'unione dei file JSON in $OUTPUT_FILE"

# PARTE 2: COPIA DEI FILE SVG
echo "Inizio copia dei file SVG..."

# Verifica se la cartella di origine esiste
if [ ! -d "$SVG_SOURCE_DIR" ]; then
    echo "Errore: La cartella di origine dei file SVG ($SVG_SOURCE_DIR) non esiste."
    exit 1
fi

# Crea la cartella di destinazione se non esiste
if [ ! -d "$SVG_DEST_DIR" ]; then
    mkdir -p "$SVG_DEST_DIR"
    echo "Creata cartella di destinazione: $SVG_DEST_DIR"
fi

# Copia tutti i file SVG
SVG_COUNT=0
for SVG_FILE in "$SVG_SOURCE_DIR"/*.svg; do
    if [ -f "$SVG_FILE" ]; then
        # Estrai il nome del file senza il percorso
        FILENAME=$(basename "$SVG_FILE")

        # Copia il file
        cp "$SVG_FILE" "$SVG_DEST_DIR/$FILENAME"

        SVG_COUNT=$((SVG_COUNT+1))
        echo "Copiato: $FILENAME"
    fi
done

echo "Completata la copia di $SVG_COUNT file SVG da $SVG_SOURCE_DIR a $SVG_DEST_DIR"

echo "Tutte le operazioni sono state completate con successo!"