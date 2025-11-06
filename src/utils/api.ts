const API_URL = 'https://api.poehali.dev/v0/sql-query';

export const executeSQLQuery = async (query: string) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
};

export const escapeSQL = (str: string): string => {
  return str.replace(/'/g, "''");
};
