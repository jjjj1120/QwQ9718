import os

# Paths
desktop_style_path = 'style.css'
temp_style_path = '../AppData/Local/Temp/ebfe1a64-970d-4648-8747-442726134a2d_QwQ9718-main.zip.QwQ9718-main.zip/QwQ9718-main/style.css'

def merge_css():
    try:
        # Read the memory system CSS (current desktop file)
        if os.path.exists(desktop_style_path):
            with open(desktop_style_path, 'r', encoding='utf-8') as f:
                memory_css = f.read()
            print(f"Read memory CSS: {len(memory_css)} bytes")
        else:
            print("Desktop style.css not found!")
            memory_css = ""

        # Read the full base CSS (temp file)
        if os.path.exists(temp_style_path):
            with open(temp_style_path, 'r', encoding='utf-8') as f:
                base_css = f.read()
            print(f"Read base CSS: {len(base_css)} bytes")
        else:
            print(f"Temp style.css not found at: {temp_style_path}")
            # Try absolute path if relative fails? 
            # But the tool used relative so it should work.
            return

        # Merge
        merged_css = base_css + "\n\n" + memory_css
        
        # Write back to desktop style.css
        with open(desktop_style_path, 'w', encoding='utf-8') as f:
            f.write(merged_css)
            
        print(f"Successfully merged CSS. New size: {len(merged_css)} bytes")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    merge_css()
