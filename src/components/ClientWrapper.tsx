"use client";

import Providers from './Providers';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useEffect, useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

export default function ClientWrapper({ children }: { children: React.ReactNode; }) {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [userGender, setUserGender] = useState("Male");

  const CORRECT_PIN = process.env.NEXT_PUBLIC_FAMILY_PIN || "2468";

  useEffect(() => {
    const savedPin = localStorage.getItem("family_pin");
    setIsUnlocked(savedPin === CORRECT_PIN);
    setIsSetupComplete(localStorage.getItem("my_setup_complete") === "true");

    const attempts = parseInt(localStorage.getItem("pin_failed_attempts") || "0");
    const lockout = parseInt(localStorage.getItem("pin_lockout_time") || "0");
    setFailedAttempts(attempts);

    if (lockout > Date.now()) {
      setLockoutTime(lockout);
    } else if (lockout !== 0) {
      localStorage.removeItem("pin_failed_attempts");
      localStorage.removeItem("pin_lockout_time");
      setFailedAttempts(0);
      setLockoutTime(null);
    }
  }, [CORRECT_PIN]);

  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = lockoutTime - now;
      if (diff <= 0) {
        setLockoutTime(null);
        localStorage.removeItem("pin_failed_attempts");
        localStorage.removeItem("pin_lockout_time");
        setFailedAttempts(0);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleUnlock = () => {
    if (lockoutTime) return;
    if (pinInput === CORRECT_PIN) {
      localStorage.setItem("family_pin", pinInput);
      localStorage.removeItem("pin_failed_attempts");
      setIsUnlocked(true);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem("pin_failed_attempts", newAttempts.toString());
      if (newAttempts >= 3) {
        const unlockTime = Date.now() + 24 * 60 * 60 * 1000;
        setLockoutTime(unlockTime);
        localStorage.setItem("pin_lockout_time", unlockTime.toString());
        alert("Too many failed attempts. App is locked for 24 hours.");
      } else {
        alert(`Incorrect PIN! You have ${3 - newAttempts} attempts left.`);
      }
      setPinInput("");
    }
  };

  const handleSetupComplete = () => {
    if (!userName.trim()) return alert("Please enter your exact name.");
    localStorage.setItem("my_name", userName.trim());
    localStorage.setItem("my_gender", userGender);
    localStorage.setItem("my_setup_complete", "true");
    setIsSetupComplete(true);
  };

  if (isUnlocked === null || isSetupComplete === null) return null;

  if (!isUnlocked) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          {lockoutTime ? (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-500">App Locked</h1>
              <p className="text-gray-400 text-center text-sm mb-6">Too many incorrect attempts.</p>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl w-full text-center">
                <p className="text-xs text-red-400 font-bold uppercase mb-1">Try again in</p>
                <p className="text-2xl font-mono font-bold text-red-500">{timeLeft}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                <Lock size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2">App Locked</h1>
              <p className="text-gray-400 text-center text-sm mb-8">Enter passcode to access your data.</p>
              <input
                type="password"
                maxLength={6}
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="w-full text-center text-2xl tracking-[0.5em] mb-4 p-4 rounded-xl border-none bg-gray-900 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {failedAttempts > 0 && (
                <p className="text-rose-500 text-xs mb-6 font-medium">{3 - failedAttempts} attempts remaining</p>
              )}
              <button onClick={handleUnlock} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors">
                Unlock
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <div className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold mb-2 text-center text-indigo-600">Welcome</h1>
          <p className="text-gray-500 text-center text-sm mb-8">
            Important: If you are using a new device, type your name <b>EXACTLY</b> as you did on your previous device to sync your data.
          </p>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h3 className="font-bold mb-3 text-sm text-gray-700">Your Identity</h3>
              <input type="text" placeholder="Your Name (e.g. Aung)" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full mb-3 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={userGender} onChange={(e) => setUserGender(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 outline-none">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <button onClick={handleSetupComplete} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors">
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Providers>
      <div className="flex min-h-screen w-full">
        <BottomNav />
        <div className="flex-1 flex flex-col md:ml-24 min-w-0 min-h-screen bg-white dark:bg-gray-950">
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}