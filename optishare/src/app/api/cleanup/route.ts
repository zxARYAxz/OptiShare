import { NextResponse } from "next/server";
import { cleanupExpiredFiles } from "@/lib/cleanup";

export const runtime = "nodejs";

export async function POST() {
  const result = await cleanupExpiredFiles();
  return NextResponse.json(result);
}
