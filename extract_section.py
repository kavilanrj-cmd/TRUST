with open(r'R:\Games\projects\trust\frontend\src\components\student\ApplicationForm.tsx', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

# Find the payment step section
start = content.find('{currentStep === 6 && (')
if start == -1:
    print('NOT FOUND')
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
                section = content[start:i+1]
                with open('payment_section.txt', 'w', encoding='utf-8') as out:
                    out.write(section)
                print("FOUND - saved to payment_section.txt")
                print(f"Length: {len(section)}")
                break
        i += 1