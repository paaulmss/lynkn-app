export function getAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS ||
    'https://lynkn-app.vercel.app,http://localhost:5173,capacitor://localhost,https://localhost,http://localhost')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
}
