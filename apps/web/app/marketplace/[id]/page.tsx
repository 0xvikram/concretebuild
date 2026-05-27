'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useReadContract, useAccount } from 'wagmi';
import { CONTRACTS, PROPERTY_ESCROW_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export default function PropertyDetailPage() {
  const { address, isConnected } = useAccount();

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

  const { data: remaining } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'getRemainingInvestment',
  });

  const { data: myShares } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'investorShares',
    args: address ? [address] : undefined,
  });

  const raised = totalRaised ? formatUnits(totalRaised, 6) : '0';
  const valuation = totalValuation ? formatUnits(totalValuation, 6) : '0';
  const progress = fundingProgress ? Number(fundingProgress) / 100 : 0;
  const remainingAmount = remaining ? formatUnits(remaining, 6) : '0';

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/marketplace" className="inline-flex items-center text-gray-400 hover:text-indigo-400 transition mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="aspect-video bg-gradient-to-br from-indigo-900/50 to-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
              <Building2 className="w-24 h-24 text-indigo-400/50" />
            </div>

            {/* Details */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h1 className="text-3xl font-bold mb-2">Example Property #1</h1>
              <div className="flex items-center text-gray-400 mb-6">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Premium Location, City Center</span>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6">
                This is a premium real estate investment opportunity on the blockchain. 
                Invest with USDC and earn proportional profits from rental income. 
                Get 9% CBLD rewards instantly on your investment.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Property Type</div>
                  <div className="font-semibold">Residential</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Expected ROI</div>
                  <div className="font-semibold text-green-400">8.5% APY</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Min Investment</div>
                  <div className="font-semibold">$100 USDC</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Investment Term</div>
                  <div className="font-semibold">12 months</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Card */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4">Investment Details</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Valuation</span>
                  <span className="font-semibold">${valuation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Raised</span>
                  <span className="font-semibold text-indigo-400">${raised}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining</span>
                  <span className="font-semibold">${remainingAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Investors</span>
                  <span className="font-semibold">{investorCount?.toString() || '0'}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Funding Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* My Investment */}
              {isConnected && myShares && Number(myShares) > 0 && (
                <div className="bg-indigo-950/30 border border-indigo-800 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-400 mb-1">Your Shares</div>
                  <div className="text-2xl font-bold text-indigo-400">{myShares.toString()}</div>
                </div>
              )}

              {/* CTA */}
              {isConnected ? (
                <Link href="/invest/1" className="block">
                  <button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-4 rounded-lg transition">
                    Invest Now
                  </button>
                </Link>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-3">Connect wallet to invest</p>
                  <ConnectButton />
                </div>
              )}

              {/* Reward Badge */}
              <div className="mt-4 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-800/50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-400 mb-1">Instant Reward</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  9% CBLD
                </div>
                <div className="text-xs text-gray-500 mt-1">on your investment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
