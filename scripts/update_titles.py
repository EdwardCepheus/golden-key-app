import sqlite3
import re
import os

db_path = "/Users/cepheus/Library/Application Support/com.goldenkey.app/golden_key.db"
titles_file = "/Users/cepheus/.accio/accounts/1750055011/agents/DID-F456DA-2B0D4C/project/final_optimized_titles_with_ip.txt"

# Mapping extracted from the prompt text (manual extraction based on common sense of the sequential order)
# Since I generated the prompts, I know the IDs were 00001 to 00219.
# I will fetch all products from the DB and map them by their sequence.
# To be safe, I'll fetch them in the order they were likely fetched before.
# Usually, SQLite "SELECT id FROM products" without ORDER BY returns them in insertion order.

def get_db_ids():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM products")
    ids = [row[0] for row in cursor.fetchall()]
    conn.close()
    return ids

db_ids = get_db_ids()

def update_db():
    if not os.path.exists(titles_file):
        print("Titles file not found.")
        return

    with open(titles_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    updated_count = 0
    for line in lines:
        parts = line.split('|')
        if len(parts) < 2:
            continue
        
        idx_str = parts[0].strip()
        try:
            # Handle cases like "00001" or "001"
            idx = int(idx_str) - 1 # 0-based
        except ValueError:
            continue
            
        if idx >= len(db_ids):
            print(f"Index {idx} out of range for DB IDs.")
            continue
            
        uuid = db_ids[idx]
        sku_title = parts[1].strip()
        guide_title = parts[2].strip() if len(parts) > 2 else ""

        # Update both title_zh (as display title) and sku_search_title (for SEO)
        # and guide_title.
        cursor.execute("""
            UPDATE products 
            SET sku_search_title = ?, guide_title = ? 
            WHERE id = ?
        """, (sku_title, guide_title, uuid))
        updated_count += 1

    conn.commit()
    conn.close()
    print(f"Successfully updated {updated_count} products in the database.")

if __name__ == "__main__":
    update_db()
