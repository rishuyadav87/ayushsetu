import os
import re

src_dir = r"C:\Users\RISHU RAJ\.gemini\antigravity\scratch\ayush-setu\client\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it's not a jsx file or doesn't have <button, skip
    if not filepath.endswith('.jsx') or '<button' not in content:
        return

    # Check if we need to modify
    # Regex to find <button ...> where it does not contain onClick or type="submit"
    # We will use a function to replace
    changed = False

    def repl(match):
        nonlocal changed
        button_tag = match.group(0)
        if 'onClick=' in button_tag or 'type="submit"' in button_tag:
            return button_tag
        changed = True
        return button_tag.replace('<button', '<button onClick={() => toast(\'Feature coming soon!\', { icon: \'🚧\' })}')

    new_content = re.sub(r'<button\b[^>]*>', repl, content)

    if changed:
        # ensure import toast from 'react-hot-toast';
        if 'react-hot-toast' not in new_content:
            # find last import
            imports = list(re.finditer(r'^import .*?;?\n', new_content, re.MULTILINE))
            if imports:
                last_import = imports[-1]
                idx = last_import.end()
                new_content = new_content[:idx] + "import toast from 'react-hot-toast';\n" + new_content[idx:]
            else:
                new_content = "import toast from 'react-hot-toast';\n" + new_content

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(src_dir):
    for f in files:
        process_file(os.path.join(root, f))
