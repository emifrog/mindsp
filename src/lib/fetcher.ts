/**
 * Fetcher SWR réutilisable
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Erreur lors du chargement des données");
    throw error;
  }
  return res.json();
};
