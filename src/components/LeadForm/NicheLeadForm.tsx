import { useState, useEffect } from 'react';
import { getNicheForm, hasCustomForm, type NicheFormConfig, type FormQuestion } from '../../lib/niche-forms';

interface Props {
  nicheSlug: string;
  initialZip?: string;
}

interface FormData {
  [key: string]: string | string[];
}

export default function NicheLeadForm({ nicheSlug, initialZip = '' }: Props) {
  // Form component for niche-specific lead capture
  const [formConfig, setFormConfig] = useState<NicheFormConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [contactData, setContactData] = useState({
    zipCode: initialZip,
    city: '',
    state: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const config = getNicheForm(nicheSlug);
    if (config) {
      setFormConfig(config);
    }
  }, [nicheSlug]);

  useEffect(() => {
    if (contactData.zipCode.length === 5) {
      lookupZipCode(contactData.zipCode);
    }
  }, [contactData.zipCode]);

  const lookupZipCode = async (zip: string) => {
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (response.ok) {
        const data = await response.json();
        setContactData((prev) => ({
          ...prev,
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation'],
        }));
      }
    } catch {
      // Silent fail
    }
  };

  if (!formConfig) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading form...</p>
      </div>
    );
  }

  const totalSteps = formConfig.steps.length + 1; // +1 for contact step
  const isContactStep = currentStep === formConfig.steps.length;

  const updateFormField = (questionId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  };

  const updateContactField = (field: string, value: string) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const toggleCheckboxValue = (questionId: string, value: string) => {
    const current = (formData[questionId] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFormField(questionId, newValue);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isContactStep) {
      if (contactData.zipCode.length !== 5) {
        newErrors.zipCode = 'Enter a valid 5-digit ZIP code';
      }
      if (!contactData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!contactData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!contactData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        newErrors.email = 'Enter a valid email address';
      }
      if (!contactData.phone.replace(/\D/g, '').match(/^\d{10}$/)) {
        newErrors.phone = 'Enter a valid 10-digit phone number';
      }
    } else {
      const step = formConfig.steps[currentStep];
      for (const question of step.questions) {
        if (question.required) {
          const value = formData[question.id];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            newErrors[question.id] = `${question.label} is required`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: nicheSlug,
          ...formData,
          ...contactData,
          phone: contactData.phone.replace(/\D/g, ''),
          sourceUrl: window.location.href,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Something went wrong' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
        <p className="text-gray-600 mb-2">Your request has been submitted successfully.</p>
        <p className="text-gray-600">
          Local {formConfig.title.replace('Get ', '').replace(' Quotes', '')} contractors will contact you shortly.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Confirmation sent to: {contactData.email}
        </p>
      </div>
    );
  }

  const renderQuestion = (question: FormQuestion) => {
    const value = formData[question.id];
    const error = errors[question.id];

    switch (question.type) {
      case 'radio':
        return (
          <div key={question.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 list-none m-0 p-0">
              {question.options?.map((option) => (
                <div
                  key={option.value}
                  onClick={() => updateFormField(question.id, option.value)}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all list-none ${
                    value === option.value
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                    value === option.value ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {value === option.value && (
                      <span className="w-2.5 h-2.5 bg-primary-500 rounded-full" />
                    )}
                  </span>
                  <span className="text-gray-900">{option.label}</span>
                </div>
              ))}
            </div>
            {question.helperText && (
              <p className="mt-2 text-sm text-gray-500">{question.helperText}</p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={question.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 list-none m-0 p-0">
              {question.options?.map((option) => {
                const isChecked = (value as string[] || []).includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleCheckboxValue(question.id, option.value)}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all list-none ${
                      isChecked
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 flex-shrink-0 ${
                      isChecked ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="text-gray-900">{option.label}</span>
                  </div>
                );
              })}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={question.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={(value as string) || ''}
              onChange={(e) => updateFormField(question.id, e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select...</option>
              {question.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {question.helperText && (
              <p className="mt-2 text-sm text-gray-500">{question.helperText}</p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'text':
        return (
          <div key={question.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => updateFormField(question.id, e.target.value)}
              placeholder={question.placeholder}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {question.helperText && (
              <p className="mt-2 text-sm text-gray-500">{question.helperText}</p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const renderContactStep = () => (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          ZIP Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={contactData.zipCode}
          onChange={(e) => updateContactField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="Enter your ZIP code"
          maxLength={5}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.zipCode ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {contactData.city && contactData.state && (
          <p className="mt-2 text-sm text-green-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {contactData.city}, {contactData.state}
          </p>
        )}
        {errors.zipCode && <p className="mt-2 text-sm text-red-600">{errors.zipCode}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contactData.firstName}
            onChange={(e) => updateContactField('firstName', e.target.value)}
            placeholder="John"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contactData.lastName}
            onChange={(e) => updateContactField('lastName', e.target.value)}
            placeholder="Smith"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={contactData.email}
          onChange={(e) => updateContactField('email', e.target.value)}
          placeholder="john@example.com"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={contactData.phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
            // Format as (XXX) XXX-XXXX
            let formatted = digits;
            if (digits.length > 6) {
              formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            } else if (digits.length > 3) {
              formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            } else if (digits.length > 0) {
              formatted = `(${digits}`;
            }
            updateContactField('phone', formatted);
          }}
          placeholder="(555) 123-4567"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
            errors.phone ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <p className="text-xs text-gray-500">
        By submitting, you agree to our{' '}
        <a href="/terms/" className="text-primary-600 hover:underline">Terms</a> and{' '}
        <a href="/privacy/" className="text-primary-600 hover:underline">Privacy Policy</a>.
        You consent to receive calls/texts from contractors regarding your project.
      </p>
    </div>
  );

  const currentStepData = isContactStep ? null : formConfig.steps[currentStep];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {isContactStep ? 'Contact Info' : currentStepData?.title}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isContactStep ? 'Your Contact Information' : currentStepData?.title}
          </h2>
          <p className="text-gray-600 mt-1">
            {isContactStep ? 'Almost done! How should contractors reach you?' : currentStepData?.description}
          </p>
        </div>

        {/* Questions */}
        {isContactStep ? renderContactStep() : currentStepData?.questions.map(renderQuestion)}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errors.submit}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {currentStep > 0 ? (
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

          {isContactStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Get My Free Quotes'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Your info is secure
        </div>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          100% Free
        </div>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          No obligation
        </div>
      </div>
    </div>
  );
}
