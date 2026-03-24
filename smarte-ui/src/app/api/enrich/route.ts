import { NextRequest, NextResponse } from "next/server";
import {
  enrichContact,
  enrichCompany,
  enrichEmail,
  enrichMobile,
  enrichTechnographics,
} from "@/lib/smarte-client";

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
    case "contact":
      result = await enrichContact(apiKey, params as Parameters<typeof enrichContact>[1]);
      break;
    case "company":
      result = await enrichCompany(apiKey, params as Parameters<typeof enrichCompany>[1]);
      break;
    case "email":
      result = await enrichEmail(apiKey, params as Parameters<typeof enrichEmail>[1]);
      break;
    case "mobile":
      result = await enrichMobile(apiKey, params as Parameters<typeof enrichMobile>[1]);
      break;
    case "technographics":
      result = await enrichTechnographics(apiKey, params as Parameters<typeof enrichTechnographics>[1]);
      break;
    default:
      return NextResponse.json(
        { error: true, code: "UNKNOWN_TYPE", message: `Unknown enrich type: ${type}` },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}
