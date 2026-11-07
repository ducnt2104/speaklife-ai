import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";
import { getUserSettings } from "@/lib/db/settings";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const settings = getUserSettings(session.userId);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
    settings,
  });
}
