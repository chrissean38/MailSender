async function getSuppressionList() {
  const response = await fetch('http://localhost:3000/api/suppression');
  if (!response.ok) throw new Error('Failed to fetch suppression list');
  return response.json();
}

async function addSuppression(email: string, reason: string, source?: string) {
  const response = await fetch('http://localhost:3000/api/suppression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, reason, source }),
  });

  if (!response.ok) throw new Error('Failed to add suppression');
  return response.json();
}

export { getSuppressionList, addSuppression };
