import requests
import re

r = requests.get('https://my-trust-nine.vercel.app/student/application')
html = r.text

# Find all JS chunk URLs
chunks = re.findall(r'/static/chunks/[^"\']+\.js', html)
print('JS chunks found:', len(chunks))
for c in chunks[:10]:
    print('  ', c)

# Check for upi-qr-code in the HTML
if 'upi-qr-code' in html:
    print('FOUND upi-qr-code in HTML')
else:
    print('NOT FOUND upi-qr-code in HTML')