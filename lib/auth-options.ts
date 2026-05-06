export const authOptions = { providers: [], session: { strategy: 'jwt' as const } };

export async function getServerAuthSession() {
  return { user: { id: 'anon', email: 'dje.reis.17@gmail.com', name: 'Jefferson' } };
}
