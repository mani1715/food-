import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Calendar, ShieldCheck, Power } from 'lucide-react';

export const ChefSchedulePage: React.FC = () => {
  const { chefs, addToast } = useApp();
  const currentChef = chefs[0];

  const [isOpen, setIsOpen] = useState(currentChef.schedule?.openStatus !== false);
  const [holidayMode, setHolidayMode] = useState(currentChef.schedule?.holidayMode || false);
  const [pauseOrders, setPauseOrders] = useState(currentChef.schedule?.pauseOrders || false);
  const [dailyHours, setDailyHours] = useState(currentChef.schedule?.dailyHours || '10:00 AM - 09:30 PM');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Schedule Updated', 'Kitchen operating schedule has been saved successfully.');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Kitchen Controls</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Kitchen Schedule & Availability</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Live Kitchen Status Toggle */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-black">Live Kitchen Status</h3>
            <p className="text-xs text-neutral-500">Toggle whether your kitchen is actively taking orders right now.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              addToast('Kitchen Status', isOpen ? 'Kitchen set to CLOSED.' : 'Kitchen set to OPEN!');
            }}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              isOpen ? 'bg-emerald-900 text-white shadow-subtle' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOpen ? 'KITCHEN OPEN' : 'KITCHEN CLOSED'}</span>
          </button>
        </div>

        {/* Holiday & Temporary Pause Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-black">Holiday Mode</h4>
              <button
                type="button"
                onClick={() => setHolidayMode(!holidayMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${holidayMode ? 'bg-black' : 'bg-neutral-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${holidayMode ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-xs text-neutral-500">Temporarily pause all incoming pre-orders for vacation.</p>
          </div>

          <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-black">Rush Hour Pause</h4>
              <button
                type="button"
                onClick={() => setPauseOrders(!pauseOrders)}
                className={`w-12 h-6 rounded-full transition-colors relative ${pauseOrders ? 'bg-black' : 'bg-neutral-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${pauseOrders ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-xs text-neutral-500">Pause new orders for 30 mins to catch up on stove prep.</p>
          </div>
        </div>

        {/* Weekly Hours Schedule */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-subtle space-y-4">
          <h3 className="text-base font-extrabold text-black border-b pb-3">Weekly Operating Hours</h3>
          <div className="space-y-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center justify-between text-xs font-semibold py-1.5 border-b border-neutral-100">
                <span className="text-black font-bold">{day}</span>
                <input
                  type="text"
                  defaultValue={dailyHours}
                  className="p-2 border border-neutral-300 rounded-xl text-xs font-bold text-right bg-neutral-50 w-52"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle"
        >
          Save Operating Schedule
        </button>

      </form>

    </div>
  );
};
