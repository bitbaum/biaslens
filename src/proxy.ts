import { NextResponse, type NextRequest } from 'next/server';

/**
 * Put the BiasLens address in front of any article link:
 *   biaslens.orangecat.ch/https://www.example.ch/article
 * opens /analyze with that link. Reads the raw request URL because a path that
 * contains "https://" has its double slash collapsed by the time it reaches a
 * page's params.
 */
export function proxy(request: NextRequest) {
  const raw = request.nextUrl.href.slice(request.nextUrl.origin.length);
  const match = raw.match(/^\/(https?):\/+(.+)$/i);
  if (!match) return NextResponse.next();
  let target: URL;
  try {
    target = new URL(`${match[1]!.toLowerCase()}://${match[2]}`);
  } catch {
    return NextResponse.next();
  }
  const destination = new URL('/analyze', request.url);
  destination.searchParams.set('u', target.toString());
  return NextResponse.redirect(destination, 307);
}

// A matcher cannot contain "https:" (the colon starts a parameter), so match
// every page path and decide in the function, which costs one regex test.
export const config = {
  matcher: ['/((?!_next/|api/|favicon|icon|manifest).*)'],
};
