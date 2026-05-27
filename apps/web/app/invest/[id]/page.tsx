'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS, PROPERTY_ESCROW_ABI, ERC20_ABI } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';
import { recordInvestment } from '@/lib/api';

export default function InvestPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'invest' | 'success'>('input');

  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: invest, data: investHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isInvesting, isSuccess: investSuccess, data: investReceipt } = useWaitForTransactionReceipt({ hash: investHash });

  useEffect(() => {
    if (approveSuccess && step === 'approve') {
      setStep('invest');
    }
  }, [approveSuccess, step]);

  useEffect(() => {
    if (investSuccess && investReceipt && address) {
      recordInvestment({
        propertyId: '1',
        investorId: address,
        walletAddress: address.toLowerCase(),
        usdcAmount: amount,
        sharesAllocated: parseUnits(amount, 6).toString(),
        sharePctBps: '0',
        txHash: investReceipt.transactionHash,
        blockNumber: investReceipt.blockNumber.toString(),
      }).catch(console.error);
      setStep('success');
    }
  }, [investSuccess, investReceipt, address, amount]);

  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const handleApprove = async () => {
    if (!amount) return;
    setStep('approve');
    try {
      await approve({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PROPERTY_ESCROW, parseUnits(amount, 6)],
      });
    } catch (error) {
      console.error(error);
      setStep('input');
    }
  };

  const handleInvest = async () => {
    if (!amount) return;
    try {
      await invest({
        address: CONTRACTS.PROPERTY_ESCROW,
        abi: PROPERTY_ESCROW_ABI,
        functionName: 'invest',
        args: [parseUnits(amount, 6)],
      });
    } catch (error) {
      console.error(error);
      setStep('invest');
    }
  };

  const cbldReward = amount ? (parseFloat(amount) * 0.09).toFixed(2) : '0';
  const balance = usdcBalance ? formatUnits(usdcBalance, 6) : '0';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent">
              Concrete Build
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/marketplace/1" className="inline-flex items-center text-gray-400 hover:text-indigo-400 transition mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Property
        </Link>

        {step === 'success' ? (
          /* Success Screen */
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Investment Successful!</h1>
            <p className="text-gray-400 mb-6">Your investment has been recorded on-chain</p>

            <div className="bg-indigo-950/30 border border-indigo-800 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-400 mb-2">You Invested</div>
              <div className="text-3xl font-bold mb-4">${amount} USDC</div>
              
              <div className="text-sm text-gray-400 mb-2">CBLD Reward Earned</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {cbldReward} CBLD
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard" className="block">
                <button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3 rounded-lg transition">
                  View Dashboard
                </button>
              </Link>
              <Link href="/marketplace" className="block">
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition">
                  Browse More Properties
                </button>
              </Link>
            </div>
          </div>
        ) : (
          /* Investment Form */
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Invest in Property</h1>
            <p className="text-gray-400 mb-8">Enter the amount you want to invest in USDC</p>

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Connect your wallet to continue</p>
                <ConnectButton />
              </div>
            ) : (
              <>
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Investment Amount (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1000"
                      disabled={step !== 'input'}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">USDC</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Balance: {balance} USDC
                  </div>
                </div>

                {/* Reward Preview */}
                {amount && (
                  <div className="bg-indigo-950/30 border border-indigo-800 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">You'll receive</span>
                      <span className="text-xl font-bold text-indigo-400">{cbldReward} CBLD</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">9% instant reward on your investment</div>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-3 mb-6">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${step === 'approve' || step === 'invest' || step === 'success' ? 'bg-green-950/30 border border-green-800' : 'bg-gray-800 border border-gray-700'}`}>
                    {step === 'approve' || step === 'invest' || step === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                    )}
                    <span>Step 1: Approve USDC</span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${step === 'success' ? 'bg-green-950/30 border border-green-800' : 'bg-gray-800 border border-gray-700'}`}>
                    {step === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                    )}
                    <span>Step 2: Confirm Investment</span>
                  </div>
                </div>

                {/* Action Button */}
                {step === 'input' && (
                  <button
                    onClick={handleApprove}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 rounded-lg transition disabled:cursor-not-allowed"
                  >
                    Approve USDC
                  </button>
                )}

                {step === 'approve' && (
                  <button disabled className="w-full bg-gray-700 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Approving...
                  </button>
                )}

                {step === 'invest' && !isInvesting && (
                  <button
                    onClick={handleInvest}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-4 rounded-lg transition"
                  >
                    Confirm Investment
                  </button>
                )}

                {step === 'invest' && isInvesting && (
                  <button disabled className="w-full bg-gray-700 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Investing...
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
