export function selfieUrl(sessionId: string, token: string): string {
  const base = import.meta.env.VITE_PUBLIC_WEB_URL || 'https://lynkn-app.vercel.app';
  const url = new URL('/verify/' + encodeURIComponent(sessionId), base);
  // Keep the capability out of HTTP requests and Referer headers.
  url.hash = token;
  return url.toString();
}
