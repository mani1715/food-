import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ChefHat, Check, ArrowRight, ArrowLeft, Upload, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChefOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [step, setStep] = useState(1);

  // Form State
  const [personalName, setPersonalName] = useState('Chef Rajeshwari Devi');
  const [phone, setPhone] = useState('+91 98123 45678');
  const [kitchenName, setKitchenName] = useState('Rajeshwari Marwari Home Kitchen');
  const [area, setArea] = useState('Kondapur, Hyderabad');
  const [specialty, setSpecialty] = useState('Rajasthani Dal Baati Churma & Gatte Ki Sabzi');
  const [selectedCats, setSelectedCats] = useState<string[]>(['Lunch', 'Dinner', 'North Indian']);
  const [fileName, setFileName] = useState('FSSAI_Certificate_Draft.pdf');

  const stepsList = [
    '1. Personal Info',
    '2. Kitchen Info',
    '3. Categories',
    '4. Operating Area',
    '5. Menu Setup',
    '6. Verification Docs',
    '7. Review & Submit',
  ];

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    } else {
      addToast('Application Submitted!', 'Your home kitchen registration has been received. Audit team will contact you in 24 hours.');
      navigate('/chef/dashboard');
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-50 text-xs font-semibold text-neutral-800">
          <ChefHat className="w-4 h-4 text-black" />
          <span>Home Chef Partner Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Register Your Home Kitchen
        </h1>
        <p className="text-xs text-neutral-500">
          Complete the 7 step application to start selling your home cooked meals on Aura.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-4 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-2">
          <span>Step {step} of 7</span>
          <span className="font-mono text-black font-extrabold">{Math.round((step / 7) * 100)}% Completed</span>
        </div>
        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-black h-full transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold text-black mt-3 overflow-x-auto no-scrollbar">
          {stepsList.map((sLabel, idx) => (
            <span
              key={sLabel}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap ${
                idx + 1 === step ? 'bg-black text-white' : idx + 1 < step ? 'text-black' : 'text-neutral-400'
              }`}
            >
              {sLabel}
            </span>
          ))}
        </div>
      </div>

      {/* Step Form Body */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-modal space-y-6">
        
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Personal Information</h3>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-neutral-300 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Primary Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-neutral-300 text-xs font-bold"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Kitchen Information</h3>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Kitchen Brand Name</label>
              <input
                type="text"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-neutral-300 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Cuisine Specialty</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-neutral-300 text-xs font-bold"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Select Food Categories</h3>
            <p className="text-xs text-neutral-500">Select categories your kitchen will cook:</p>
            <div className="flex flex-wrap gap-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Sweets', 'Bakery', 'Pickles', 'Healthy Meals', 'North Indian', 'Andhra Specials'].map((cat) => {
                const isSel = selectedCats.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (isSel) setSelectedCats(selectedCats.filter((c) => c !== cat));
                      else setSelectedCats([...selectedCats, cat]);
                    }}
                    className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
                      isSel ? 'bg-black text-white border-black' : 'bg-neutral-50 text-black border-neutral-200'
                    }`}
                  >
                    {isSel ? '✓ ' : ''}{cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Operating Area & Delivery Radius</h3>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Home Kitchen Address / Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-neutral-300 text-xs font-bold"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Initial Menu Setup</h3>
            <p className="text-xs text-neutral-600">Your default initial menu item will be pre-filled based on your specialty.</p>
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-1">
              <p className="text-sm font-bold text-black">{specialty}</p>
              <p className="text-xs text-neutral-500">Price: $14.99 • Prep Time: 30 Mins</p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Verification Documents Upload (Mock UI)</h3>
            <div className="border-2 border-dashed border-neutral-300 rounded-3xl p-6 text-center space-y-3 bg-neutral-50">
              <Upload className="w-8 h-8 text-black mx-auto" />
              <div>
                <p className="text-xs font-bold text-black">Upload FSSAI License or Kitchen Photo</p>
                <p className="text-[11px] text-neutral-400">PDF, JPG, PNG up to 10MB</p>
              </div>
              <div className="inline-block px-3 py-1 bg-white border border-neutral-300 rounded-xl text-xs font-mono">
                {fileName}
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-black border-b pb-2">Review & Submit Registration</h3>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2 font-semibold">
              <p><strong className="text-black">Chef Name:</strong> {personalName}</p>
              <p><strong className="text-black">Kitchen Brand:</strong> {kitchenName}</p>
              <p><strong className="text-black">Location:</strong> {area}</p>
              <p><strong className="text-black">Specialty:</strong> {specialty}</p>
              <p><strong className="text-black">Document:</strong> {fileName} (Attached)</p>
            </div>
          </div>
        )}

        {/* Stepper Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-5 py-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
              step === 1 ? 'opacity-40 cursor-not-allowed border-neutral-200' : 'border-black text-black hover:bg-neutral-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-7 py-3 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle"
          >
            <span>{step === 7 ? 'Submit Kitchen Application' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
