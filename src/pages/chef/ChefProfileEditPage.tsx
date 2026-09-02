import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Camera, Save, Eye } from 'lucide-react';

export const ChefProfileEditPage: React.FC = () => {
  const { chefs, addToast } = useApp();
  const navigate = useNavigate();
  const currentChef = chefs[0];

  const [name, setName] = useState(currentChef.name);
  const [specialty, setSpecialty] = useState(currentChef.specialty);
  const [location, setLocation] = useState(currentChef.location);
  const [experienceYears, setExperienceYears] = useState(currentChef.experienceYears);
  const [bio, setBio] = useState(currentChef.bio);
  const [about, setAbout] = useState(currentChef.about || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Kitchen Profile Saved', 'Your chef profile details have been updated.');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Profile Management</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Edit Chef Profile</h1>
        </div>

        <button
          onClick={() => navigate(`/chef/${currentChef.id}`)}
          className="px-4 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-2xl flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>Preview Public Profile</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Chef Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Operating Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Cuisine Specialty</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Cooking Experience (Years)</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Short Tagline Bio</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Detailed Kitchen Heritage Story</label>
          <textarea
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Profile Modifications</span>
        </button>
      </form>

    </div>
  );
};
