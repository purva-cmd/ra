import { NextRequest, NextResponse } from "next/server";
import { getBuyingGroup, getAccountSignals } from "@/lib/smarte-client";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-smarte-api-key") ?? process.env.SMARTE_API_KEY ?? "";

  if (!apiKey) {
    return NextResponse.json(
      { error: true, code: "AUTH_ERROR", message: "No SMARTe API key provided" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: true, code: "INVALID_REQUEST", message: "Invalid JSON" }, { status: 400 });
  }

  const { type, params } = body as { type: string; params: Record<string, unknown> };

  if (!type || !params) {
    return NextResponse.json(
      { error: true, code: "INVALID_REQUEST", message: "Missing 'type' or 'params'" },
      { status: 400 }
    );
  }

  let result;
  switch (type) {
    case "buying-group":
      result = await getBuyingGroup(apiKey, params as Parameters<typeof getBuyingGroup>[1]);
      break;
    case "account-signals":
      result = await getAccountSignals(apiKey, params as Parameters<typeof getAccountSignals>[1]);
      break;
    default:
      return NextResponse.json(
        { error: true, code: "UNKNOWN_TYPE", message: `Unknown agent type: ${type}` },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}
