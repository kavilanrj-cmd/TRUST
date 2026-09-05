import requests

r = requests.get('https://my-trust-nine.vercel.app/student/application')
html = r.text

# Save full HTML for analysis
with open('page_source.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('HTML length:', len(html))
# Search for key strings
searches = ['upi-qr-code', 'kavilan.rj@oksbi', 'Scan the QR', 'Application Fee', 'Total Payable']
for s in searches:
    if s in html:
        print(f'FOUND: {s}')
    else:
        print(f'NOT FOUND: {s}')