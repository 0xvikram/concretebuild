'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Building2, Upload, CheckCircle2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { createProperty } from '@/lib/api';

export default function OnboardingPage() {
  const { address, isConnected } = useAccount();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    totalValuation: '',
  });
  
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setLoading(true);
    try {
      await createProperty({
        ownerId: address,
        ownerWallet: address.toLowerCase(),
        title: formData.title,
        description: formData.description,
        location: formData.location,
        totalValuation: formData.totalValuation,
        images,
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

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
              <ConnectButton />
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submitted ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Property Submitted!</h2>
            <p className="text-gray-400 mb-8">
              Your property is now pending admin approval. You'll receive 9% CBLD tokens once approved.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
                Back to Home
              </Link>
              <button onClick={() => { setSubmitted(false); setFormData({ title: '', description: '', location: '', totalValuation: '' }); setImages([]); }} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
                List Another Property
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-8 h-8 text-indigo-400" />
              <h1 className="text-4xl font-bold">List Your Property</h1>
            </div>

            {!isConnected ? (
              <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-lg">
                <p className="text-gray-400 mb-6">Connect your wallet to list a property</p>
                <ConnectButton />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Property Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Modern Downtown Apartment"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property..."
                    rows={4}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="New York, NY"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Total Valuation (USDC)</label>
                  <input
                    type="number"
                    required
                    value={formData.totalValuation}
                    onChange={(e) => setFormData({ ...formData, totalValuation: e.target.value })}
                    placeholder="100000"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You'll receive {formData.totalValuation ? (parseFloat(formData.totalValuation) * 0.09).toFixed(2) : '0'} CBLD tokens upon approval
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Property Images</label>
                  <div className="border-2 border-dashed border-gray-800 rounded-lg p-8 text-center hover:border-indigo-500 transition">
                    <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-indigo-400 hover:text-indigo-300">Upload images</span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </label>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {images.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-800">
                          <img src={img} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 rounded-lg transition disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Property for Approval'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
