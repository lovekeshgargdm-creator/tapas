import re
with open('src/components/Icons.tsx', 'r') as f:
    content = f.read()

# add IconHistory
content += '\nexport const IconHistory = (p: P) => <History {...p} />;\n'

with open('src/components/Icons.tsx', 'w') as f:
    f.write(content)
