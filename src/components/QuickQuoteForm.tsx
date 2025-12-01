import { useState } from 'react';
import { niches } from '../lib/niches';

export default function QuickQuoteForm() {
  const [selectedNiche, setSelectedNiche] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNiche || !zipCode) return;

    setIsLoading(true);
    // Redirect to full form with pre-filled values
    window.location.href = `/get-quotes/?service=${selectedNiche}&zip=${zipCode}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Get Free Quotes</h2>
        <p className="mt-1 text-gray-600">Compare prices from local contractors</p>
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
          What service do you need?
        </label>
        <select
          id="service"
          value={selectedNiche}
          onChange={(e) => setSelectedNiche(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
          required
        >
          <option value="">Select a service...</option>
          {niches.map((niche) => (
            <option key={niche.id} value={niche.slug}>
              {niche.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-2">
          Your ZIP Code
        </label>
        <input
          type="text"
          id="zipcode"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="Enter your ZIP code"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          pattern="[0-9]{5}"
          maxLength={5}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !selectedNiche || zipCode.length !== 5}
        className="w-full px-6 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Finding contractors...</span>
          </>
        ) : (
          <>
            <span>Get Free Quotes</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Free service. No obligations. Your information is secure.
      </p>
    </form>
  );
}
