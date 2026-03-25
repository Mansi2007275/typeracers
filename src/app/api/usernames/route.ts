import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { addresses } = await req.json();
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return NextResponse.json({ error: "addresses array required" }, { status: 400 });
  }

  // Optional endpoint retained for backwards compatibility.
  // For the MetaMask + Somnia flow, usernames are not resolved server-side.
  return NextResponse.json({ usernames: {} });
}
