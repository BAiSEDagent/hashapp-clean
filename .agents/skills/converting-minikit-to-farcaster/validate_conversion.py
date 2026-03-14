#!/usr/bin/env python3
"""
Validate a converted project to ensure MiniKit has been fully removed
and Farcaster SDK is properly set up.

Usage:
 python scripts/validate\_conversion.py

Checks:
 1\. No remaining MiniKit imports
 2\. No remaining MiniKit hooks
 3\. No MiniKitProvider in code
 4\. Farcaster SDK is imported where needed
 5\. sdk.actions.ready() is called somewhere
 6\. package.json has correct dependencies
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import List, Tuple

class ValidationResult:
 def \_\_init\_\_(self):
 self.errors: List\[str\] = \[\]
 self.warnings: List\[str\] = \[\]
 self.passed: List\[str\] = \[\]

 def add\_error(self, msg: str):
 self.errors.append(msg)

 def add\_warning(self, msg: str):
 self.warnings.append(msg)

 def add\_pass(self, msg: str):
 self.passed.append(msg)

 @property
 def is\_valid(self) -> bool:
 return len(self.errors) == 0

\# Patterns to check
MINIKIT\_IMPORT = re.compile(r"from\\s+\['\\"\]@coinbase/onchainkit/minikit\['\\"\]")
ONCHAINKIT\_IMPORT = re.compile(r"from\\s+\['\\"\]@coinbase/onchainkit\['\\"\]")
MINIKIT\_HOOKS = re.compile(r'\\b(useMiniKit\|useClose\|useOpenUrl\|useViewProfile\|useViewCast\|useComposeCast\|useAddFrame\|useAuthenticate\|useNotification\|usePrimaryButton)\\s\*\\(')
MINIKIT\_PROVIDER = re.compile(r' List\[Path\]:
 """Find all source files."""
 files = \[\]
 for root, \_, filenames in os.walk(directory):
 if 'node\_modules' in root or '.next' in root:
 continue
 for filename in filenames:
 if filename.endswith(('.tsx', '.ts', '.jsx', '.js')):
 files.append(Path(root) / filename)
 return files

def check\_no\_minikit\_imports(files: List\[Path\], project\_path: Path, result: ValidationResult):
 """Check that no MiniKit imports remain."""
 minikit\_found = \[\]
 onchainkit\_found = \[\]

 for filepath in files:
 try:
 content = filepath.read\_text(encoding='utf-8')
 rel\_path = str(filepath.relative\_to(project\_path))

 if MINIKIT\_IMPORT.search(content):
 minikit\_found.append(rel\_path)
 if ONCHAINKIT\_IMPORT.search(content):
 onchainkit\_found.append(rel\_path)
 except Exception:
 pass

 if minikit\_found:
 result.add\_error(f"MiniKit imports still present in: {', '.join(minikit\_found)}")

 if onchainkit\_found:
 result.add\_error(f"OnchainKit imports still present in: {', '.join(onchainkit\_found)} - replace with @farcaster/miniapp-sdk")

 if not minikit\_found and not onchainkit\_found:
 result.add\_pass("No MiniKit/OnchainKit imports found")

def check\_no\_minikit\_hooks(files: List\[Path\], project\_path: Path, result: ValidationResult):
 """Check that no MiniKit hooks are being used."""
 found = \[\]
 for filepath in files:
 try:
 content = filepath.read\_text(encoding='utf-8')
 matches = MINIKIT\_HOOKS.findall(content)
 if matches:
 rel\_path = filepath.relative\_to(project\_path)
 found.append(f"{rel\_path}: {', '.join(set(matches))}")
 except Exception:
 pass

 if found:
 result.add\_error(f"MiniKit hooks still in use:\\n " + "\\n ".join(found))
 else:
 result.add\_pass("No MiniKit hooks found")

def check\_no\_provider(files: List\[Path\], project\_path: Path, result: ValidationResult):
 """Check that MiniKitProvider and OnchainKitProvider with miniKit are removed."""
 minikit\_provider\_found = \[\]
 onchainkit\_with\_minikit\_found = \[\]

 for filepath in files:
 try:
 content = filepath.read\_text(encoding='utf-8')
 rel\_path = str(filepath.relative\_to(project\_path))

 if MINIKIT\_PROVIDER.search(content):
 minikit\_provider\_found.append(rel\_path)

 # Check for OnchainKitProvider with miniKit prop
 if ONCHAINKIT\_PROVIDER.search(content) and MINIKIT\_PROP.search(content):
 onchainkit\_with\_minikit\_found.append(rel\_path)
 except Exception:
 pass

 if minikit\_provider\_found:
 result.add\_error(f"MiniKitProvider still present in: {', '.join(minikit\_provider\_found)}")

 if onchainkit\_with\_minikit\_found:
 result.add\_error(f"OnchainKitProvider with miniKit prop found in: {', '.join(onchainkit\_with\_minikit\_found)} - replace with WagmiProvider + farcasterMiniApp connector")

 if not minikit\_provider\_found and not onchainkit\_with\_minikit\_found:
 result.add\_pass("MiniKit providers removed")

def check\_farcaster\_sdk\_usage(files: List\[Path\], project\_path: Path, result: ValidationResult):
 """Check that Farcaster SDK is imported and ready() is called."""
 has\_sdk\_import = False
 has\_wagmi\_connector = False
 has\_ready = False
 sdk\_import\_files = \[\]
 wagmi\_connector\_files = \[\]
 ready\_files = \[\]

 for filepath in files:
 try:
 content = filepath.read\_text(encoding='utf-8')
 rel\_path = str(filepath.relative\_to(project\_path))

 if FARCASTER\_IMPORT.search(content):
 has\_sdk\_import = True
 sdk\_import\_files.append(rel\_path)
 if FARCASTER\_WAGMI\_IMPORT.search(content):
 has\_wagmi\_connector = True
 wagmi\_connector\_files.append(rel\_path)
 if SDK\_READY.search(content):
 has\_ready = True
 ready\_files.append(rel\_path)
 except Exception:
 pass

 if has\_sdk\_import:
 result.add\_pass(f"Farcaster SDK imported in: {', '.join(sdk\_import\_files)}")
 else:
 result.add\_error("Farcaster SDK not imported - add: import { sdk } from '@farcaster/miniapp-sdk'")

 if has\_wagmi\_connector:
 result.add\_pass(f"Farcaster wagmi connector imported in: {', '.join(wagmi\_connector\_files)}")
 else:
 result.add\_error("Farcaster wagmi connector not imported - add: import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'")

 if has\_ready:
 result.add\_pass(f"sdk.actions.ready() called in: {', '.join(ready\_files)}")
 else:
 result.add\_error("sdk.actions.ready() not found - add to your main page useEffect: await sdk.actions.ready()")

def check\_package\_json(project\_path: Path, result: ValidationResult):
 """Check package.json for correct dependencies."""
 package\_json\_path = project\_path / 'package.json'

 if not package\_json\_path.exists():
 result.add\_warning("package.json not found")
 return

 try:
 with open(package\_json\_path) as f:
 pkg = json.load(f)
 except Exception as e:
 result.add\_error(f"Could not parse package.json: {e}")
 return

 deps = {\*\*pkg.get('dependencies', {}), \*\*pkg.get('devDependencies', {})}

 # Check for old OnchainKit - this should be removed
 if '@coinbase/onchainkit' in deps:
 result.add\_error("@coinbase/onchainkit still installed - run: npm uninstall @coinbase/onchainkit")
 else:
 result.add\_pass("@coinbase/onchainkit removed")

 # Check for required Farcaster packages
 required\_packages = \[\
 ('@farcaster/miniapp-sdk', 'npm install @farcaster/miniapp-sdk'),\
 ('@farcaster/miniapp-wagmi-connector', 'npm install @farcaster/miniapp-wagmi-connector'),\
 ('wagmi', 'npm install wagmi'),\
 ('@tanstack/react-query', 'npm install @tanstack/react-query'),\
 \]

 for package, install\_cmd in required\_packages:
 if package in deps:
 result.add\_pass(f"{package} installed (version: {deps\[package\]})")
 else:
 result.add\_error(f"{package} not installed - run: {install\_cmd}")

def check\_env\_variables(project\_path: Path, result: ValidationResult):
 """Check for old environment variables that should be removed."""
 env\_files = \['.env', '.env.local', '.env.example'\]
 old\_vars = \['NEXT\_PUBLIC\_ONCHAINKIT\_API\_KEY', 'NEXT\_PUBLIC\_ONCHAINKIT\_PROJECT\_NAME'\]

 for env\_file in env\_files:
 env\_path = project\_path / env\_file
 if env\_path.exists():
 try:
 content = env\_path.read\_text()
 found = \[var for var in old\_vars if var in content\]
 if found:
 result.add\_warning(f"{env\_file} contains old MiniKit vars: {', '.join(found)}")
 except Exception:
 pass

def check\_manifest(project\_path: Path, result: ValidationResult):
 """Check farcaster.json manifest uses 'miniapp' instead of 'frame'."""
 # Check for manifest route
 manifest\_paths = \[\
 project\_path / 'app' / '.well-known' / 'farcaster.json' / 'route.ts',\
 project\_path / 'app' / '.well-known' / 'farcaster.json' / 'route.js',\
 project\_path / 'pages' / 'api' / '.well-known' / 'farcaster.json.ts',\
 project\_path / 'pages' / 'api' / '.well-known' / 'farcaster.json.js',\
 project\_path / 'public' / '.well-known' / 'farcaster.json',\
 \]

 manifest\_found = False
 for manifest\_path in manifest\_paths:
 if manifest\_path.exists():
 manifest\_found = True
 try:
 content = manifest\_path.read\_text()

 # Check for old 'frame' key
 if MANIFEST\_FRAME\_KEY.search(content):
 result.add\_error(f"Manifest uses 'frame' key - change to 'miniapp': {manifest\_path.relative\_to(project\_path)}")

 # Check for new 'miniapp' key
 if MANIFEST\_MINIAPP\_KEY.search(content):
 result.add\_pass(f"Manifest correctly uses 'miniapp' key: {manifest\_path.relative\_to(project\_path)}")
 elif not MANIFEST\_FRAME\_KEY.search(content):
 result.add\_warning(f"Manifest found but no 'miniapp' or 'frame' key detected: {manifest\_path.relative\_to(project\_path)}")

 except Exception as e:
 result.add\_warning(f"Could not read manifest: {e}")
 break

 if not manifest\_found:
 result.add\_warning("No farcaster.json manifest found - create app/.well-known/farcaster.json/route.ts")

def validate\_project(project\_dir: str) -> ValidationResult:
 """Run all validation checks."""
 project\_path = Path(project\_dir).resolve()
 result = ValidationResult()

 if not project\_path.exists():
 result.add\_error(f"Directory does not exist: {project\_dir}")
 return result

 files = find\_source\_files(str(project\_path))

 if not files:
 result.add\_warning("No source files found")
 return result

 # Run checks
 check\_no\_minikit\_imports(files, project\_path, result)
 check\_no\_minikit\_hooks(files, project\_path, result)
 check\_no\_provider(files, project\_path, result)
 check\_farcaster\_sdk\_usage(files, project\_path, result)
 check\_package\_json(project\_path, result)
 check\_env\_variables(project\_path, result)
 check\_manifest(project\_path, result)

 return result

def print\_result(result: ValidationResult):
 """Print validation results."""
 print("\\n" + "=" \* 60)
 print("CONVERSION VALIDATION REPORT")
 print("=" \* 60)

 if result.passed:
 print("\\n✅ PASSED:")
 for msg in result.passed:
 print(f" {msg}")

 if result.warnings:
 print("\\n⚠️ WARNINGS:")
 for msg in result.warnings:
 print(f" {msg}")

 if result.errors:
 print("\\n❌ ERRORS:")
 for msg in result.errors:
 print(f" {msg}")

 print("\\n" + "-" \* 60)
 if result.is\_valid:
 print("✅ VALIDATION PASSED - Conversion looks complete!")
 else:
 print("❌ VALIDATION FAILED - Please fix the errors above")
 print("=" \* 60 + "\\n")

def main():
 if len(sys.argv) < 2:
 print("Usage: python validate\_conversion.py ")
 print("Example: python validate\_conversion.py ./my-converted-app")
 sys.exit(1)

 project\_dir = sys.argv\[1\]
 result = validate\_project(project\_dir)
 print\_result(result)

 sys.exit(0 if result.is\_valid else 1)

if \_\_name\_\_ == '\_\_main\_\_':
 main()