# TypeRacer Refactor Notes (Somnia + MetaMask)

This project was refactored from Starknet/Cairo to an EVM-compatible setup on Somnia.

## What Changed

- Starknet, StarkZap, Cairo contracts, and Privy server-signing flow were removed.
- Frontend wallet flow now uses MetaMask (`window.ethereum`) with network switching.
- Contract interactions now use `ethers.js` and a Solidity contract.
- A new Hardhat workspace was added in `evm-contract/` for compile/deploy.

## Frontend Flow

1. User clicks **Connect Wallet**.
2. App requests accounts from MetaMask.
3. App switches to Somnia chain if needed.
4. On race finish, app submits score on-chain via Solidity contract.
5. Leaderboard reads top scores directly from contract via Somnia RPC.

## Env Vars (Frontend)

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_deployed_contract
NEXT_PUBLIC_SOMNIA_RPC_URL=https://rpc.testnet.somnia.network
NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312
NEXT_PUBLIC_SOMNIA_CHAIN_NAME=Somnia Testnet
NEXT_PUBLIC_SOMNIA_EXPLORER_URL=https://shannon-explorer.somnia.network
NEXT_PUBLIC_SOMNIA_TOKEN_NAME=Somnia
NEXT_PUBLIC_SOMNIA_TOKEN_SYMBOL=SOM
```

## Deploy Contract

See `evm-contract/README.md` for full deployment steps.
