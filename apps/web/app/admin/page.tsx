'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Shield, Building2, DollarSign, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS, PROPERTY_ESCROW_ABI } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';
import { getPendingProperties, approveProperty, deployProperty } from '@/lib/api';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [profitAmount, setProfitAmount] = useState('');
  const [pendingProperties, setPendingProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadPendingProperties();
    }
  }, [isConnected]);

  const loadPendingProperties = async () => {
    try {
      const data = await getPendingProperties();
      setPendingProperties(data.properties || []);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const handleApprove = async (propertyId: string) => {
    setLoading(true);
    try {
      await approveProperty(propertyId);
      alert('Property approved! 9% CBLD tokens recorded. Deploy contract next.');
      loadPendingProperties();
    } catch (error) {
      console.error(error);
      alert('Failed to approve property');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (propertyId: string, contractAddress: string) => {
    if (!contractAddress) {
      alert('Please enter contract address');
      return;
    }
    setLoading(true);
    try {
      await deployProperty(propertyId, contractAddress);
      alert('Property deployed and activated!');
      loadPendingProperties();
    } catch (error) {
      console.error(error);
      alert('Failed to deploy property');
    } finally {
      setLoading(false);
    }
  };

  const { writeContract: distributeProfit, data: distributeHash } = useWriteContract();
  const { isLoading: isDistributing } = useWaitForTransactionReceipt({ hash: distributeHash });

  const { data: totalRaised } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'totalRaised',
  });

  const { data: investorCount } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'getInvestorCount',
  });

  const { data: totalProfitDeposited } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'totalProfitDeposited',
  });

  const handleDistribute = async () => {
    if (!profitAmount) return;
    try {
      await distributeProfit({
        address: CONTRACTS.PROPERTY_ESCROW,
        abi: PROPERTY_ESCROW_ABI,
        functionName: 'distributeProfit',
        args: [parseUnits(profitAmount, 6)],
      });
      setProfitAmount('');
    } catch (error) {
      console.error(error);
    }
  };

  const raised = totalRaised ? formatUnits(totalRaised, 6) : '0';
  const deposited = totalProfitDeposited ? formatUnits(totalProfitDeposited, 6) : '0';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent">
              Concrete Build
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/marketplace" className="hover:text-indigo-400 transition">Marketplace</Link>
              <Link href="/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link>
              <Link href="/admin" className="text-indigo-400 font-medium">Admin</Link>
              <ConnectButton />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isConnected ? (
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-gray-400 mb-6">Connect your admin wallet to access the panel</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-indigo-400" />
              <h1 className="text-4xl font-bold">Admin Panel</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <Building2 className="w-8 h-8 text-indigo-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">Active Properties</div>
                <div className="text-2xl font-bold">1</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <DollarSign className="w-8 h-8 text-indigo-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">Total Raised</div>
                <div className="text-2xl font-bold">${raised}</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <Users className="w-8 h-8 text-indigo-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">Total Investors</div>
                <div className="text-2xl font-bold">{investorCount?.toString() || '0'}</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">Profit Deposited</div>
                <div className="text-2xl font-bold text-green-400">${deposited}</div>
              </div>
            </div>

            {/* Pending Properties */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Pending Properties</h2>
              <p className="text-gray-400 mb-6">
                Review and approve property listings. Approved properties will receive 9% CBLD tokens.
              </p>
              
              {pendingProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending properties
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProperties.map((property) => (
                    <div key={property.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{property.title}</h3>
                          <p className="text-gray-400 text-sm mb-2">{property.locationCity}, {property.locationCountry}</p>
                          <p className="text-gray-500 text-sm">{property.description?.substring(0, 150)}...</p>
                        </div>
                        <span className="bg-yellow-950/50 border border-yellow-800 text-yellow-400 px-3 py-1 rounded-full text-sm">
                          {property.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Valuation</div>
                          <div className="font-semibold">${property.totalValuationUsdc} USDC</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">CBLD Reward (9%)</div>
                          <div className="font-semibold text-indigo-400">
                            {(parseFloat(property.totalValuationUsdc) * 0.09).toFixed(2)} CBLD
                          </div>
                        </div>
                      </div>

                      {property.status === 'pending_review' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(property.id)}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve & Mint CBLD
                          </button>
                          <button
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {property.status === 'approved' && (
                        <div>
                          <p className="text-green-400 text-sm mb-3">✓ Approved - Deploy contract to activate</p>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              placeholder="Contract address (0x...)"
                              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm"
                              id={`contract-${property.id}`}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`contract-${property.id}`) as HTMLInputElement;
                                handleDeploy(property.id, input.value);
                              }}
                              disabled={loading}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                            >
                              Deploy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profit Distribution */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Distribute Profit</h2>
              <p className="text-gray-400 mb-6">
                Allocate profit to investors proportionally based on their ownership shares
              </p>

              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Profit Amount (USDC)
                </label>
                <input
                  type="number"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={handleDistribute}
                  disabled={!profitAmount || isDistributing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
                >
                  {isDistributing ? 'Distributing...' : 'Distribute Profit'}
                </button>
              </div>
            </div>

            {/* Properties Management */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Property Management</h2>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Example Property #1</h3>
                    <p className="text-gray-400 text-sm">Contract: {CONTRACTS.PROPERTY_ESCROW.slice(0, 10)}...</p>
                  </div>
                  <span className="bg-green-950/50 border border-green-800 text-green-400 px-3 py-1 rounded-full text-sm">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total Raised</div>
                    <div className="font-semibold">${raised} USDC</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Investors</div>
                    <div className="font-semibold">{investorCount?.toString() || '0'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Profit Deposited</div>
                    <div className="font-semibold text-green-400">${deposited} USDC</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <Link href={`https://sepolia.etherscan.io/address/${CONTRACTS.PROPERTY_ESCROW}`} target="_blank" className="text-indigo-400 hover:text-indigo-300 text-sm">
                    View on Etherscan →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
