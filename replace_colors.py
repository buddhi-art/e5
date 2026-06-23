import os
import re

directory = 'src'

replacements = {
    # Light mode readability for sky text
    r'\btext-sky-400\b': 'text-sky-600 dark:text-sky-400',
    # Convert sky button gradients to orange for clickable elements
    r'\bfrom-sky-500 to-sky-400\b': 'from-orange-500 to-orange-400',
    r'\bhover:from-sky-400 hover:to-sky-300\b': 'hover:from-orange-400 hover:to-orange-300',
    r'rgba\(14,165,233,0\.15\)': 'rgba(249,115,22,0.15)', # Shadow color for buttons (orange instead of sky)
    r'rgba\(14,165,233,0\.3\)': 'rgba(14,165,233,0.3)', # Keep logo shadow sky
}

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            for pattern, rep in replacements.items():
                new_content = re.sub(r'(?<!dark:)' + pattern, rep, new_content)

            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
