with open(r'R:\Games\projects\trust\frontend\src\components\student\ApplicationForm.tsx', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

with open(r'R:\Games\projects\trust\new_payment_section.txt', 'r', encoding='utf-8') as f:
    new_section = f.read()

# Find the old payment section
start = content.find('{currentStep === 6 && (')
if start == -1:
    print('OLD SECTION NOT FOUND')
else:
    # Find the matching closing
    brace_count = 0
    i = start
    while i < len(content):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end = i + 1
                break
        i += 1
    
    old_section = content[start:end]
    print(f"Old section length: {len(old_section)}")
    print(f"New section length: {len(new_section)}")
    
    # Replace
    new_content = content[:start] + new_section + content[end:]
    
    with open(r'R:\Games\projects\trust\frontend\src\components\student\ApplicationForm.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("REPLACEMENT COMPLETE")