# BRANCH_TRUTH

| Branch | Role | Write Here? | Merge Target? |
|---|---|---:|---:|
| `integration/truth-pass-clean` | Stable fallback shell + proof/reference branch | Only fallback-shell changes | Not for new MetaMask rail work |
| `integration/metamask-delegation-poc` | Active MetaMask delegation pivot lane | Yes | Yes, for delegation work |
| `frontend/truth-pass` | Raw donor branch / Replit branch | No primary work | No |

## Rules
- No new MetaMask execution-rail work on `frontend/truth-pass`
- No new MetaMask execution-rail work on `integration/truth-pass-clean`
- All new delegation work belongs on `integration/metamask-delegation-poc`
- If work lands on `frontend/truth-pass`, port targeted files only
- Current active runtime truth on `integration/metamask-delegation-poc`: SDK upgraded to `@metamask/smart-accounts-kit@0.4.0-beta.1` in commit `7290292e9113d4b5f7c95258912ea55b4f34938b`
- Current live blocker on that branch is post-grant response parsing, not grant initiation or wallet compatibility
