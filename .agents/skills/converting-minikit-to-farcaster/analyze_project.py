#!/usr/bin/env python3
"""
Analyze a project directory for MiniKit usage.
Finds all imports and hook usages that need conversion.

Usage:
 python scripts/analyze\_project.py
 python scripts/analyze\_project.py ./my-minikit-app

Output:
 JSON report of all MiniKit usage found
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import TypedDict, List

class HookUsage(TypedDict):
 hook: str
 file: str
 line: int
 code: str

class ImportInfo(TypedDict):
 file: str
 line: int
 imports: List\[str\]

class AnalysisReport(TypedDict):
 project\_dir: str
 files\_scanned: int
 files\_with\_minikit: int
 imports: List\[ImportInfo\]
 hook\_usages: List\[HookUsage\]
 provider\_locations: List\[dict\]
 summary: dict

\# MiniKit hooks to search for
MINIKIT\_HOOKS = \[\
 'useMiniKit',\
 'useClose',\
 'useOpenUrl',\
 'useViewProfile',\
 'useViewCast',\
 'useComposeCast',\
 'useAddFrame',\
 'useAuthenticate',\
 'useNotification',\
 'usePrimaryButton',\
\]

\# Import patterns - both @coinbase/onchainkit/minikit AND @coinbase/onchainkit
MINIKIT\_IMPORT\_PATTERN = re.compile(
 r"from\\s+\['\\"\]@coinbase/onchainkit(?:/minikit)?\['\\"\]"
)

\# OnchainKitProvider with miniKit prop
ONCHAINKIT\_PROVIDER\_PATTERN = re.compile(
 r" List\[Path\]:
 """Find all relevant source files in directory."""
 files = \[\]
 for root, \_, filenames in os.walk(directory):
 # Skip node\_modules and .next
 if 'node\_modules' in root or '.next' in root:
 continue
 for filename in filenames:
 if filename.endswith(extensions):
 files.append(Path(root) / filename)
 return files

def analyze\_file(filepath: Path) -> dict:
 """Analyze a single file for MiniKit usage."""
 result = {
 'imports': \[\],
 'hooks': \[\],
 'provider': False,
 'provider\_lines': \[\],
 'provider\_type': None
 }

 try:
 content = filepath.read\_text(encoding='utf-8')
 except Exception as e:
 print(f"Warning: Could not read {filepath}: {e}", file=sys.stderr)
 return result

 lines = content.split('\\n')

 for i, line in enumerate(lines, 1):
 # Check for imports from @coinbase/onchainkit or @coinbase/onchainkit/minikit
 if MINIKIT\_IMPORT\_PATTERN.search(line):
 # Extract what's being imported
 import\_match = re.search(r"import\\s+\\{(\[^}\]+)\\}", line)
 if import\_match:
 imports = \[s.strip() for s in import\_match.group(1).split(',')\]
 result\['imports'\].append({
 'line': i,
 'imports': imports
 })

 # Check for hook usages
 for hook in MINIKIT\_HOOKS:
 hook\_pattern = re.compile(rf'\\b{hook}\\s\*\\(')
 if hook\_pattern.search(line):
 result\['hooks'\].append({
 'hook': hook,
 'line': i,
 'code': line.strip()
 })

 # Check for OnchainKitProvider (may have miniKit prop)
 if ONCHAINKIT\_PROVIDER\_PATTERN.search(line):
 result\['provider'\] = True
 result\['provider\_type'\] = 'OnchainKitProvider'
 result\['provider\_lines'\].append({
 'line': i,
 'code': line.strip()
 })

 # Check for MiniKitProvider
 if MINIKIT\_PROVIDER\_PATTERN.search(line):
 result\['provider'\] = True
 result\['provider\_type'\] = 'MiniKitProvider'
 result\['provider\_lines'\].append({
 'line': i,
 'code': line.strip()
 })

 # Check for miniKit prop
 if MINIKIT\_PROP\_PATTERN.search(line):
 result\['provider\_lines'\].append({
 'line': i,
 'code': line.strip(),
 'is\_minikit\_prop': True
 })

 return result

def analyze\_project(project\_dir: str) -> AnalysisReport:
 """Analyze entire project for MiniKit usage."""
 project\_path = Path(project\_dir).resolve()

 if not project\_path.exists():
 print(f"Error: Directory {project\_dir} does not exist", file=sys.stderr)
 sys.exit(1)

 files = find\_files(str(project\_path))

 report: AnalysisReport = {
 'project\_dir': str(project\_path),
 'files\_scanned': len(files),
 'files\_with\_minikit': 0,
 'imports': \[\],
 'hook\_usages': \[\],
 'provider\_locations': \[\],
 'summary': {}
 }

 hook\_counts = {hook: 0 for hook in MINIKIT\_HOOKS}

 for filepath in files:
 result = analyze\_file(filepath)
 rel\_path = str(filepath.relative\_to(project\_path))

 has\_minikit = bool(result\['imports'\] or result\['hooks'\] or result\['provider'\])

 if has\_minikit:
 report\['files\_with\_minikit'\] += 1

 # Collect imports
 for imp in result\['imports'\]:
 report\['imports'\].append({
 'file': rel\_path,
 'line': imp\['line'\],
 'imports': imp\['imports'\]
 })

 # Collect hook usages
 for hook\_usage in result\['hooks'\]:
 report\['hook\_usages'\].append({
 'hook': hook\_usage\['hook'\],
 'file': rel\_path,
 'line': hook\_usage\['line'\],
 'code': hook\_usage\['code'\]
 })
 hook\_counts\[hook\_usage\['hook'\]\] += 1

 # Collect provider locations
 if result\['provider'\]:
 for provider\_info in result\['provider\_lines'\]:
 report\['provider\_locations'\].append({
 'file': rel\_path,
 'line': provider\_info\['line'\],
 'code': provider\_info\['code'\]
 })

 # Build summary
 report\['summary'\] = {
 'total\_hook\_usages': sum(hook\_counts.values()),
 'hooks\_by\_type': {k: v for k, v in hook\_counts.items() if v > 0},
 'has\_provider': len(report\['provider\_locations'\]) > 0,
 'unique\_hooks\_used': \[k for k, v in hook\_counts.items() if v > 0\]
 }

 return report

def print\_report(report: AnalysisReport):
 """Print human-readable report."""
 print("\\n" + "=" \* 60)
 print("MINIKIT ANALYSIS REPORT")
 print("=" \* 60)
 print(f"\\nProject: {report\['project\_dir'\]}")
 print(f"Files scanned: {report\['files\_scanned'\]}")
 print(f"Files with MiniKit: {report\['files\_with\_minikit'\]}")

 print("\\n--- IMPORTS ---")
 if report\['imports'\]:
 for imp in report\['imports'\]:
 print(f" {imp\['file'\]}:{imp\['line'\]}")
 print(f" Imports: {', '.join(imp\['imports'\])}")
 else:
 print(" No MiniKit imports found")

 print("\\n--- HOOK USAGES ---")
 if report\['hook\_usages'\]:
 for usage in report\['hook\_usages'\]:
 print(f" {usage\['file'\]}:{usage\['line'\]}")
 print(f" Hook: {usage\['hook'\]}")
 print(f" Code: {usage\['code'\]\[:80\]}...")
 else:
 print(" No hook usages found")

 print("\\n--- PROVIDER LOCATIONS ---")
 if report\['provider\_locations'\]:
 for loc in report\['provider\_locations'\]:
 print(f" {loc\['file'\]}:{loc\['line'\]}")
 print(f" {loc\['code'\]\[:80\]}")
 else:
 print(" No MiniKitProvider found")

 print("\\n--- SUMMARY ---")
 summary = report\['summary'\]
 print(f" Total hook usages: {summary\['total\_hook\_usages'\]}")
 print(f" Unique hooks: {', '.join(summary\['unique\_hooks\_used'\]) or 'None'}")
 print(f" Has provider: {'Yes' if summary\['has\_provider'\] else 'No'}")

 if summary\['hooks\_by\_type'\]:
 print("\\n Hooks by frequency:")
 for hook, count in sorted(summary\['hooks\_by\_type'\].items(), key=lambda x: -x\[1\]):
 print(f" {hook}: {count}")

 print("\\n" + "=" \* 60)

def main():
 if len(sys.argv) < 2:
 print("Usage: python analyze\_project.py  \[--json\]")
 print("Example: python analyze\_project.py ./my-minikit-app")
 sys.exit(1)

 project\_dir = sys.argv\[1\]
 output\_json = '--json' in sys.argv

 report = analyze\_project(project\_dir)

 if output\_json:
 print(json.dumps(report, indent=2))
 else:
 print\_report(report)
 # Also save JSON report
 report\_path = Path(project\_dir) / 'minikit-analysis.json'
 with open(report\_path, 'w') as f:
 json.dump(report, f, indent=2)
 print(f"\\nJSON report saved to: {report\_path}")

if \_\_name\_\_ == '\_\_main\_\_':
 main()