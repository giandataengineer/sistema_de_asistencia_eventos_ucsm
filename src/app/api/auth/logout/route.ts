import { NextResponse } from "next/server";
import { getTokenCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ message: "Sesion cerrada" });
  const cookieOpts = getTokenCookieOptions();

  response.cookies.set(cookieOpts.name, "", {
    httpOnly: true,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: "/",
    maxAge: 0,
  });

  return response;
}
