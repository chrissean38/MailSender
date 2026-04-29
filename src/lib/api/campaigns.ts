import type { Campaign } from '@/types';

async function getCampaigns() {
  const response = await fetch('http://localhost:3000/api/campaigns');
  if (!response.ok) throw new Error('Failed to fetch campaigns');
  return response.json();
}

async function createCampaign(data: Partial<Campaign>) {
  const response = await fetch('http://localhost:3000/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create campaign');
  return response.json();
}

export { getCampaigns, createCampaign };
