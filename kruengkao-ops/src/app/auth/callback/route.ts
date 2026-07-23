import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google) redirects back here with either `?code=…` on success or
// `?error=…` on failure (e.g. the signup gate rejected a non-team account).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const providerError = searchParams.get("error");

  // Rejected by the allow-domain/allow-email gate, or the user declined.
  if (providerError) {
    return NextResponse.redirect(`${origin}/login?error=not_authorized`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Honour x-forwarded-host when behind a load balancer (prod), else origin.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const safeNext = next.startsWith("/") ? next : "/";
      if (isLocalEnv || !forwardedHost) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
