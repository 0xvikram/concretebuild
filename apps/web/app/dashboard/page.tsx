'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Building2, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, PROPERTY_ESCROW_ABI, ERC20_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const { writeContract: claimProfit, data: claimHash } = useWriteContract();
  const { isLoading: isClaiming } = useWaitForTransactionReceipt({ hash: claimHash });

  const { data: myShares } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'investorShares',
    args: address ? [address] : undefined,
  });

  const { data: claimableProfit } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'claimableProfit',
    args: address ? [address] : undefined,
  });

  const { data: sharePercentage } = useReadContract({
    address: CONTRACTS.PROPERTY_ESCROW,
    abi: PROPERTY_ESCROW_ABI,
    functionName: 'getSharePercentageBps',
    args: address ? [address] : undefined,
  });

  const { data: cbldBalance } = useReadContract({
    address: CONTRACTS.CBLD,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const handleClaim = async () => {
    try {
      await claimProfit({
        address: CONTRACTS.PROPERTY_ESCROW,
        abi: PROPERTY_ESCROW_ABI,
        functionName: 'claimProfit',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const claimable = claimableProfit ? formatUnits(claimableProfit, 6) : '0';
  const cbld = cbldBalance ? formatUnits(cbldBalance, 18) : '0';
  const usdc = usdcBalance ? formatUnits(usdcBalance, 6) : '0';
  const ownership = sharePercentage ? (Number(sharePercentage) / 100).toFixed(2) : '0';

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
              <Link href="/dashboard" className="text-indigo-400 font-medium">Dashboard</Link>
              <ConnectButton />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isConnected ? (
          <div className="text-center py-20">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to view your portfolio</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-8">My Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <Wallet className="w-8 h-8 text-indigo-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">USDC Balance</div>
                <div className="text-2xl font-bold">${usdc}</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <TrendingUp className="w-8 h-8 text-indigo-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">CBLD Rewards</div>
                <div className="text-2xl font-bold">{parseFloat(cbld).toFixed(2)}</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <Building2 className="w-8 h-8 text-indigo-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">My Shares</div>
                <div className="text-2xl font-bold">{myShares?.toString() || '0'}</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                <div className="text-sm text-gray-400 mb-1">Claimable Profit</div>
                <div className="text-2xl font-bold text-green-400">${claimable}</div>
              </div>
            </div>

            {/* Claimable Profit Card */}
            {claimableProfit && Number(claimableProfit) > 0 && (
              <div className="bg-gradient-to-r from-green-950/50 to-emerald-950/50 border border-green-800 rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Profit Available to Claim</h3>
                    <p className="text-gray-400">Withdraw your earnings to your wallet</p>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition disabled:cursor-not-allowed"
                  >
                    {isClaiming ? 'Claiming...' : `Claim $${claimable}`}
                  </button>
                </div>
              </div>
            )}

            {/* Portfolio */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">My Investments</h2>

              {myShares && Number(myShares) > 0 ? (
                <div className="space-y-4">
                  <Link href="/marketplace/1" className="block">
                    <div className="bg-gray-800/50 border border-gray-700 hover:border-indigo-500 rounded-lg p-6 transition">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">Example Property #1</h3>
                          <p className="text-gray-400 text-sm">Premium Location, City Center</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Ownership</div>
                          <div className="text-xl font-bold text-indigo-400">{ownership}%</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">My Shares</div>
                          <div className="font-semibold">{myShares.toString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Claimable</div>
                          <div className="font-semibold text-green-400">${claimable}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Expected ROI</div>
                          <div className="font-semibold">8.5% APY</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Investments Yet</h3>
                  <p className="text-gray-400 mb-6">Start investing in tokenized real estate</p>
                  <Link href="/marketplace">
                    <button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold px-6 py-3 rounded-lg transition">
                      Browse Properties
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
