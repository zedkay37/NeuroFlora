/* ============================================================
   NEUROFLORA — Import Lichess
   Récupère les dernières parties publiques d'un pseudo, en PGN.
   ============================================================ */
export async function fetchLichessPgn(user: string, max = 20): Promise<string> {
  const u = encodeURIComponent(user.trim());
  const url = `https://lichess.org/api/games/user/${u}?max=${max}&clocks=false&evals=false&opening=false`;
  const res = await fetch(url, { headers: { Accept: 'application/x-chess-pgn' } });
  if (!res.ok) throw new Error(`Lichess a répondu ${res.status}`);
  const pgn = await res.text();
  if (!pgn.trim()) throw new Error('Aucune partie trouvée pour ce pseudo');
  return pgn;
}
