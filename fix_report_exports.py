import re
with open('src/app/(app)/report/page.tsx', 'r') as f:
    content = f.read()

# remove export from function components except default
content = re.sub(r'^export function (MetricCard|ReportSection|DailyActivityChart|Legend|LegendItem|BreakdownBars|WeightTrendChart|EmptyChart|buildMonthReports)', r'function \1', content, flags=re.MULTILINE)

with open('src/app/(app)/report/page.tsx', 'w') as f:
    f.write(content)
