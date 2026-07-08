import re
with open('src/app/(app)/home/page.tsx', 'r') as f:
    content = f.read()

# revert weight trend chart strokes to color-breathe
content = content.replace('stroke="var(--color-seafoam-calm)"', 'stroke="var(--color-breathe)"')
content = content.replace('fill="var(--color-seafoam-calm)"', 'fill="var(--color-breathe)"')

# fix preset clicks
# first, add router to the component if not there
if 'const router =' not in content:
    content = content.replace('const s = useStore();', 'const s = useStore();\n  const router = useRouter();')

# change <Link href={`/routine...`} to <div onClick...
old_preset = """          <Link
            key={preset.id}
            href={`/routine?tab=presets&preset=${preset.id}`}
            className="card card-interactive"
            style={{
              padding: 0,
              position: "relative",
              overflow: "hidden"
            }}
          >"""
new_preset = """          <div
            key={preset.id}
            onClick={() => {
              if (window.confirm(`Add ${preset.name} to routine?`)) {
                router.push(`/routine?tab=presets&preset=${preset.id}`);
              }
            }}
            className="card card-interactive"
            style={{
              padding: 0,
              position: "relative",
              overflow: "hidden",
              cursor: "pointer"
            }}
          >"""
content = content.replace(old_preset, new_preset)

# remove description from preset
desc_line = r'<p className="text-caption" style={{ fontSize: 13, lineHeight: 1.45, WebkitLineClamp: 2, display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", margin: 0 }}>{preset.description}</p>'
content = re.sub(desc_line, '', content)

# replace </Link> for preset
content = re.sub(r'</Link>\n\s*\)\)}', '</div>\n        ))}', content)

with open('src/app/(app)/home/page.tsx', 'w') as f:
    f.write(content)
