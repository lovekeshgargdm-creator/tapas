import re
with open('src/components/Icons.tsx', 'r') as f:
    content = f.read()

# add imports
if 'lucide-react' in content:
    content = re.sub(r'import \{.*?\} from "lucide-react";\n?', '', content)
content = 'import { Dna, Wind, History, Ruler } from "lucide-react";\n' + content

# replace IconYoga
content = re.sub(r'export const IconYoga = .*?;\n', 'export const IconYoga = (p: P) => <Dna {...p} />;\n', content, flags=re.DOTALL)

# replace IconBreathe
content = re.sub(r'export const IconBreathe = .*?;\n', 'export const IconBreathe = (p: P) => <Wind {...p} />;\n', content, flags=re.DOTALL)

with open('src/components/Icons.tsx', 'w') as f:
    f.write(content)
