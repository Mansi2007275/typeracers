import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    env: {
      NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
        ? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.slice(0, 10) + "..."
        : "MISSING",
      NEXT_PUBLIC_SOMNIA_RPC_URL: process.env.NEXT_PUBLIC_SOMNIA_RPC_URL
        ? "SET"
        : "MISSING",
      NEXT_PUBLIC_SOMNIA_CHAIN_ID: process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || "MISSING",
    },
  });
}
