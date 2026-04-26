#!/bin/bash

# Fincz-Track: Java License Header Application Script
# This script applies the template from java.header to all .java files.

PROJECT_ROOT="/home/ahmad/JIDE/fincz-track"
HEADER_FILE="$PROJECT_ROOT/services/user-service/java.header"

if [ ! -f "$HEADER_FILE" ]; then
    echo "Error: Header template not found at $HEADER_FILE"
    exit 1
fi

echo "Applying standard headers to all Java files..."

find "$PROJECT_ROOT/services" -name "*.java" | while read -r file; do
    # Temporary file for processing
    temp_file=$(mktemp)
    
    # Check if the file starts with an existing comment block
    if head -n 1 "$file" | grep -q "^/\*"; then
        # Remove the old header (deletes from line 1 to the first occurrence of */)
        sed '1,/\*\//d' "$file" > "$temp_file"
    else
        cat "$file" > "$temp_file"
    fi
    
    # Prepend the new header content
    cat "$HEADER_FILE" "$temp_file" > "$file"
    rm "$temp_file"
done

echo "Done! All Java files have been updated."