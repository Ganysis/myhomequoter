import { useState, useEffect } from 'react';
import { niches } from '../../lib/niches';
import type { ProjectType, Timeline, PropertyType } from '../../lib/types';

interface FormData {
  // Step 1 - Service
  service: string;
  projectType: ProjectType | '';

  // Step 2 - Location
  zipCode: string;
  city: string;
  state: string;
  propertyType: PropertyType | '';

  // Step 3 - Timeline & Details
  timeline: Timeline | '';
  additionalInfo: string;

  // Step 4 - Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const initialFormData: FormData = {
  service: '',
  projectType: '',
  zipCode: '',
  city: '',
  state: '',
  propertyType: '',
  timeline: '',
  additionalInfo: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const projectTypes = [
  { value: 'installation', label: 'New Installation' },
  { value: 'repair', label: 'Repair / Fix' },
  { value: 'replacement', label: 'Replacement / Upgrade' },
  { value: 'consultation', label: 'Consultation / Quote Only' },
];

const timelines = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-3months', label: 'Within 1-3 months' },
  { value: '3-6months', label: 'Within 3-6 months' },
  { value: 'planning', label: 'Just planning / researching' },
];

const propertyTypes = [
  { value: 'residential', label: 'Residential (Home)' },
  { value: 'commercial', label: 'Commercial (Business)' },
];

interface Props {
  initialService?: string;
  initialZip?: string;
}

export default function MultiStepForm({ initialService = '', initialZip = '' }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    service: initialService,
    zipCode: initialZip,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;

  useEffect(() => {
    // Lookup city/state from ZIP code
    if (formData.zipCode.length === 5) {
      lookupZipCode(formData.zipCode);
    }
  }, [formData.zipCode]);

  const lookupZipCode = async (zip: string) => {
    try {
      // Using a free ZIP code API (in production, use your own endpoint)
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation'],
        }));
      }
    } catch {
      // Silently fail - user can enter manually
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!formData.service) {
          setError('Please select a service');
          return false;
        }
        if (!formData.projectType) {
          setError('Please select a project type');
          return false;
        }
        return true;

      case 2:
        if (formData.zipCode.length !== 5) {
          setError('Please enter a valid 5-digit ZIP code');
          return false;
        }
        if (!formData.propertyType) {
          setError('Please select a property type');
          return false;
        }
        return true;

      case 3:
        if (!formData.timeline) {
          setError('Please select a timeline');
          return false;
        }
        return true;

      case 4:
        if (!formData.firstName.trim()) {
          setError('Please enter your first name');
          return false;
        }
        if (!formData.lastName.trim()) {
          setError('Please enter your last name');
          return false;
        }
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.phone.match(/^\d{10}$/)) {
          setError('Please enter a valid 10-digit phone number');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sourceUrl: window.location.href,
          // UTM params would be extracted from URL in production
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600 mb-4">
          Your request has been submitted successfully. Local contractors will contact you shortly with free quotes.
        </p>
        <p className="text-sm text-gray-500">
          Check your email ({formData.email}) for confirmation.
        </p>
      </div>
    );
  }

  const selectedNiche = niches.find((n) => n.slug === formData.service);

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                s < step
                  ? 'bg-primary-600 text-white'
                  : s === step
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                s
              )}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">What service do you need?</h2>
              <p className="text-gray-500 mt-1">Select the type of project you're looking for</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={formData.service}
                onChange={(e) => updateField('service', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
              <div className="grid grid-cols-2 gap-3">
                {projectTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField('projectType', type.value)}
                    className={`px-4 py-3 rounded-lg border text-left transition-all ${
                      formData.projectType === type.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Where is your property?</h2>
              <p className="text-gray-500 mt-1">We'll match you with local contractors</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => updateField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="Enter your ZIP code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={5}
              />
              {formData.city && formData.state && (
                <p className="mt-2 text-sm text-green-600">
                  📍 {formData.city}, {formData.state}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <div className="grid grid-cols-2 gap-3">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField('propertyType', type.value)}
                    className={`px-4 py-3 rounded-lg border text-left transition-all ${
                      formData.propertyType === type.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">When do you need this done?</h2>
              <p className="text-gray-500 mt-1">This helps contractors prioritize your request</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
              <div className="space-y-3">
                {timelines.map((timeline) => (
                  <button
                    key={timeline.value}
                    type="button"
                    onClick={() => updateField('timeline', timeline.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-left transition-all ${
                      formData.timeline === timeline.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {timeline.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => updateField('additionalInfo', e.target.value)}
                placeholder="Describe your project, any specific requirements, or questions..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Contact Information</h2>
              <p className="text-gray-500 mt-1">Contractors will reach out with free quotes</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <p className="text-xs text-gray-500">
              By submitting, you agree to our{' '}
              <a href="/terms/" className="text-primary-600 hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy/" className="text-primary-600 hover:underline">Privacy Policy</a>.
              You consent to receive calls/texts from contractors.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Get Free Quotes</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Secure & Private</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>100% Free</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>No Obligation</span>
        </div>
      </div>
    </div>
  );
}
