'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Building2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { CONTRACTS, PROPERTY_ESCROW_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export default function MarketplacePage() {
  const { data: totalRaised } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'totalRaised',
  });

  const { data: totalValuation } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'totalValuation',
  });

  const { data: investorCount } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'getInvestorCount',
  });

  const { data: fundingProgress } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'getFundingProgressBps',
  });

  const raised = totalRaised ? formatUnits(totalRaised, 6) : '0';
  const valuation = totalValuation ? formatUnits(totalValuation, 6) : '0';
  const progress = fundingProgress ? Number(fundingProgress) / 100 : 0;

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
              <Link href="/marketplace" className="text-indigo-400 font-medium">Marketplace</Link>
              <Link href="/dashboard" className="hover:text-indigo-400 transition">Dashboard</Link>
              <ConnectButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-gray-800 bg-gradient-to-b from-indigo-950/20 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-5xl font-bold mb-4">Property Marketplace</h1>
          <p className="text-xl text-gray-400 mb-8">Invest in tokenized real estate with USDC</p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <Building2 className="w-8 h-8 text-indigo-400 mb-2" />
              <div className="text-2xl font-bold">1</div>
              <div className="text-sm text-gray-400">Active Properties</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <DollarSign className="w-8 h-8 text-indigo-400 mb-2" />
              <div className="text-2xl font-bold">${raised}</div>
              <div className="text-sm text-gray-400">Total Raised</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <Users className="w-8 h-8 text-indigo-400 mb-2" />
              <div className="text-2xl font-bold">{investorCount?.toString() || '0'}</div>
              <div className="text-sm text-gray-400">Investors</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <TrendingUp className="w-8 h-8 text-indigo-400 mb-2" />
              <div className="text-2xl font-bold">9%</div>
              <div className="text-sm text-gray-400">CBLD Rewards</div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Property Card */}
          <Link href="/marketplace/1" className="group">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-indigo-500 transition">
              <div className="aspect-video bg-gradient-to-br from-indigo-900/50 to-gray-900 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-indigo-400/50" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition">Example Property #1</h3>
                <p className="text-gray-400 text-sm mb-4">Premium real estate investment opportunity</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Valuation</span>
                    <span className="font-semibold">${valuation} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Raised</span>
                    <span className="font-semibold">${raised} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expected ROI</span>
                    <span className="font-semibold text-green-400">8.5% APY</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Funding Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3 rounded-lg transition">
                  View Details
                </button>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
