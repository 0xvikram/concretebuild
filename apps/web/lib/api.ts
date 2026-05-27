const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function recordInvestment(data: {
  propertyId: string;
  investorId: string;
  walletAddress: string;
  usdcAmount: string;
  sharesAllocated: string;
  sharePctBps: string;
  txHash: string;
  blockNumber: string;
}) {
  const res = await fetch(`${API_URL}/api/investments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createProperty(data: {
  ownerId: string;
  ownerWallet: string;
  title: string;
  description: string;
  location: string;
  totalValuation: string;
  images: string[];
}) {
  const res = await fetch(`${API_URL}/api/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPendingProperties() {
  const res = await fetch(`${API_URL}/api/properties?status=pending_review`);
  return res.json();
}

export async function approveProperty(propertyId: string) {
  const res = await fetch(`${API_URL}/api/properties/${propertyId}/approve`, {
    method: 'POST',
  });
  return res.json();
}

export async function deployProperty(propertyId: string, contractAddress: string) {
  const res = await fetch(`${API_URL}/api/properties/${propertyId}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractAddress }),
  });
  return res.json();
}
