import re

with open(r'R:\Games\projects\trust\frontend\src\components\student\ApplicationForm.tsx', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

# Fix ReviewBlock title
content = content.replace(
    'text-navy-700">{title}</h3>',
    'text-navy-700 dark:text-slate-300">{title}</h3>'
)

with open(r'R:\Games\projects\trust\frontend\src\components\student\ApplicationForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed ReviewBlock title")