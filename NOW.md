# NOW

## Current task
Finish the live MetaMask delegated spend loop in Hashapp.

## Owners
- Adam: real-browser MetaMask Flask grant + retry loop
- Replit: patch response parsing for SDK `0.4.0-beta.1`, redeploy, capture exact response shape
- BAiSED: repo truth, branch hygiene, targeted fixes, and context compression

## Done means
All are true:
1. MetaMask Flask grants ERC-7715 permission ✅
2. app stores `permissionsContext` + `delegationManager`
3. Scout session account redeems one spend
4. Activity shows the real delegated spend
5. Receipt shows tx hash, BaseScan link, block/timestamp

## Blocked by
The grant now succeeds onchain, but frontend response parsing still throws `No signer metadata in granted permission`.

## Do not do
- no new redesign work
- no new branch sprawl
- no re-litigation of the old Coinbase EOA rail
- no broadening scope before the delegated loop is proven

## Parallel research lane
A separate agent may scope Uniswap Trading API integration, but shipping priority remains:
1. finish post-grant response parsing
2. prove one delegated spend end-to-end
3. then merge the shortest real Uniswap slice
