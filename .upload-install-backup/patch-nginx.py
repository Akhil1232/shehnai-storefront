"""Inserts the /uploads/ location block above the catch-all location."""
import sys
p = sys.argv[1]
s = open(p).read()
block = (
'    # Uploaded images, served straight from disk. Filenames are random and\n'
'    # immutable, so they can be cached indefinitely.\n'
'    location /uploads/ {\n'
'        alias /var/www/shehnai/uploads/;\n'
'        expires 365d;\n'
'        add_header Cache-Control "public, immutable";\n'
'        access_log off;\n'
'        try_files $uri =404;\n'
'    }\n'
'\n')
i = s.index("    location / {")   # must come BEFORE the catch-all to win
open(p, "w").write(s[:i] + block + s[i:])
