import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import useMockupStore from '../stores/useMockupStore';
import { mockups, auth as authApi } from '../services/api';
import MockupGallery from '../components/MockupGallery';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { googleConnected, etsyConnected } = useAuthStore();
  const { selectedMockups, clearSelection } = useMockupStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['mockups'],
    queryFn: async () => {
      const response = await mockups.list();
      return response.data;
    },
    enabled: googleConnected
  });

  const handleCreateListing = () => {
    if (selectedMockups.length === 0) {
      alert('Please select at least one mockup');
      return;
    }
    navigate('/create-listing');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Mockups</h1>
          <p className="text-gray-600 mt-1">
            Select mockups to create Etsy listings
          </p>
        </div>
        {selectedMockups.length > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedMockups.length} selected
            </span>
            <button
              onClick={() => clearSelection()}
              className="btn btn-secondary"
            >
              Clear Selection
            </button>
            <button
              onClick={handleCreateListing}
              className="btn btn-primary flex items-center space-x-2"
            >
              <ShoppingBag size={18} />
              <span>Create Listing</span>
            </button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`card ${googleConnected ? 'border-2 border-green-500' : 'border-2 border-yellow-500'}`}>
          <div className="flex items-center space-x-3">
            {googleConnected ? (
              <CheckCircle2 className="text-green-500" size={24} />
            ) : (
              <AlertCircle className="text-yellow-500" size={24} />
            )}
            <div>
              <h3 className="font-semibold">Google Drive</h3>
              <p className="text-sm text-gray-600">
                {googleConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {!googleConnected && (
            <button
              onClick={() => authApi.googleAuth()}
              className="btn btn-primary mt-4 w-full"
            >
              Connect Google Drive
            </button>
          )}
        </div>

        <div className={`card ${etsyConnected ? 'border-2 border-green-500' : 'border-2 border-yellow-500'}`}>
          <div className="flex items-center space-x-3">
            {etsyConnected ? (
              <CheckCircle2 className="text-green-500" size={24} />
            ) : (
              <AlertCircle className="text-yellow-500" size={24} />
            )}
            <div>
              <h3 className="font-semibold">Etsy</h3>
              <p className="text-sm text-gray-600">
                {etsyConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {!etsyConnected && googleConnected && (
            <button
              onClick={() => authApi.etsyAuth()}
              className="btn btn-primary mt-4 w-full"
            >
              Connect Etsy
            </button>
          )}
        </div>
      </div>

      {/* Mockup Gallery */}
      {googleConnected ? (
        <div className="card">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading mockups...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Error loading mockups: {error.message}
              </p>
            </div>
          )}

          {data && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {data.count} {data.count === 1 ? 'Mockup' : 'Mockups'} Found
                </h2>
              </div>
              <MockupGallery mockups={data.mockups} />
            </>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Connect Google Drive
          </h3>
          <p className="mt-2 text-gray-600">
            Connect your Google Drive account to view your mockup images
          </p>
        </div>
      )}
    </div>
  );
}
