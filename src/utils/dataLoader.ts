export async function loadJSON<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Erreur chargement ${path}: HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}
