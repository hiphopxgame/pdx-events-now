
import React from 'react';
import { Header } from '@/components/Header';
import { SubmitEventForm } from '@/components/SubmitEventForm';
import ProtectedRoute from '@/components/ProtectedRoute';

const SubmitEvent = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Submit Your Event</h1>
            <p className="text-lg text-gray-600">
              Share your event with the Portland community. All submissions are reviewed before publication.
            </p>
          </div>
          <SubmitEventForm />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SubmitEvent;
