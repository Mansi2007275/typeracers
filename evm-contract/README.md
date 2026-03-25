# EVM Contract (Somnia)

This folder contains a beginner-friendly Hardhat setup for deploying the typing score contract to Somnia.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Copy `.env.example` to `.env` and fill values:

- `SOMNIA_RPC_URL`: Somnia RPC endpoint
- `SOMNIA_CHAIN_ID`: Somnia chain id
- `DEPLOYER_PRIVATE_KEY`: private key for deployment wallet

## 3) Compile

```bash
npm run build
```

## 4) Deploy to Somnia

```bash
npm run deploy:somnia
```

After deploy, copy the printed contract address into frontend `.env.local` as:

`NEXT_PUBLIC_CONTRACT_ADDRESS=0x...`
