import requests
import re

r = requests.get('https://my-trust-nine.vercel.app/student/application')
html = r.text

# Look for script src
scripts = re.findall(r'src="(/static/chunks/[^"]+\.js)"', html)
print('Script chunks:', len(scripts))
for s in scripts[:10]:
    print('  ', s)

# Also check pageProps
if 'pageProps' in html:
    print('pageProps found')