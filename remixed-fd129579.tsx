import React, { useState, useEffect } from 'react';
import { Heart, Activity, Smartphone, TrendingUp, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const Equilibrium = () => {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [storageReady, setStorageReady] = useState(false);

  const [tensionScore, setTensionScore] = useState(42);
  const [vibeScore, setVibeScore] = useState(50);
  const [shape, setShape] = useState({ points: 8, smoothness: 0.7 });
  const [moodX, setMoodX] = useState(50);
  const [moodY, setMoodY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [intervention, setIntervention] = useState(null);
  const [screenTime, setScreenTime] = useState(3.2);
  const [steps, setSteps] = useState(1200);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (window.storage) {
        try {
          const session = await window.storage.get('equilibrium_session');
          if (session) {
            const userData = JSON.parse(session.value);
            setCurrentUser(userData);
            setAuthMode('app');
          }
        } catch (err) {
          console.log('No session found');
        }
      }
      setStorageReady(true);
    };
    checkSession();
  }, []);

  const handleSignup = async () => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setAuthError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError('Please enter a valid email');
      setIsLoading(false);
      return;
    }

    try {
      if (!window.storage) {
        setAuthError('Storage not available. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      const userKey = `eq_user_${email.toLowerCase()}`;
      
      let existing = null;
      try {
        existing = await window.storage.get(userKey);
      } catch (err) {
        // Key doesn't exist, which is what we want
      }
      
      if (existing) {
        setAuthError('Email already registered');
        setIsLoading(false);
        return;
      }

      const userData = { 
        name, 
        email: email.toLowerCase(), 
        password, 
        uid: `user_${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      try {
        await window.storage.set(userKey, JSON.stringify(userData));
      } catch (err) {
        console.error('Storage error:', err);
        setAuthError('Failed to save account. Please try again.');
        setIsLoading(false);
        return;
      }

      const sessionData = { name, email: email.toLowerCase(), uid: userData.uid };
      
      try {
        await window.storage.set('equilibrium_session', JSON.stringify(sessionData));
      } catch (err) {
        console.error('Session error:', err);
        setAuthError('Failed to create session. Please try again.');
        setIsLoading(false);
        return;
      }

      setCurrentUser(sessionData);
      setAuthSuccess('Account created successfully! 🎉');
      setTimeout(() => setAuthMode('app'), 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setAuthError('Something went wrong. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoading(true);

    if (!email || !password) {
      setAuthError('Email and password required');
      setIsLoading(false);
      return;
    }

    try {
      const userKey = `eq_user_${email.toLowerCase()}`;
      const result = await window.storage.get(userKey);
      
      if (!result) {
        setAuthError('Account not found');
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(result.value);
      if (userData.password !== password) {
        setAuthError('Incorrect password');
        setIsLoading(false);
        return;
      }

      await window.storage.set('equilibrium_session', JSON.stringify({ name: userData.name, email: userData.email, uid: userData.uid }));
      setCurrentUser({ name: userData.name, email: userData.email, uid: userData.uid });
      setAuthSuccess('Welcome back!');
      setTimeout(() => setAuthMode('app'), 1000);
    } catch (err) {
      setAuthError('Login failed');
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    try {
      await window.storage.delete('equilibrium_session');
    } catch (err) {
      console.log('Logout error:', err);
    }
    setCurrentUser(null);
    setAuthMode('login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  useEffect(() => {
    if (authMode !== 'app') return;

    // Calculate vibe score from orb position (0-100)
    const positivityScore = moodX; // 0 = negative, 100 = positive
    const energyScore = 100 - moodY; // 0 = low energy, 100 = high energy
    const newVibeScore = Math.round((positivityScore + energyScore) / 2);
    setVibeScore(newVibeScore);

    // Update shape smoothness based on vibe score (higher = smoother)
    setShape({ points: 8, smoothness: Math.max(0.3, newVibeScore / 100) });

    // Also keep tension calculation for interventions
    const screenFactor = Math.min(screenTime * 5, 60);
    const movementFactor = Math.max(0, 40 - (steps / 250));
    const tensionCalc = Math.round(screenFactor + movementFactor);
    setTensionScore(Math.min(100, Math.max(0, tensionCalc)));

    // Set interventions based on screen time and steps
    if (screenTime > 4 && steps < 500) {
      setIntervention({ type: 'Digital Paralysis', action: 'The Shake Out', message: 'Your body needs movement. A gentle stretch would help.', duration: '2 min' });
    } else if (tensionCalc > 60 && steps < 2000) {
      setIntervention({ type: 'Overstimulated', action: 'Visual Reset', message: 'Your eyes deserve a break.', duration: '3 min' });
    } else if (steps < 100) {
      setIntervention({ type: 'The Slump', action: 'Hydration & Oxygen', message: 'A sip of water would help.', duration: '1 min' });
    } else {
      setIntervention(null);
    }
  }, [screenTime, steps, moodX, moodY, authMode]);

  const generateShape = () => {
    const { points, smoothness } = shape;
    const cx = 150, cy = 150, br = 80;
    let path = 'M ';
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const noise = Math.sin(angle * 3 + tensionScore / 100 * 5) * (1 - smoothness) * 25;
      const r = br + noise;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      
      if (i === 0) {
        path += `${x},${y} `;
      } else {
        const pAngle = ((i - 1) / points) * Math.PI * 2;
        const pNoise = Math.sin(pAngle * 3 + tensionScore / 100 * 5) * (1 - smoothness) * 25;
        const pR = br + pNoise;
        path += `C ${cx + Math.cos(pAngle) * (pR + 20)},${cy + Math.sin(pAngle) * (pR + 20)} ${cx + Math.cos(angle) * (r - 20)},${cy + Math.sin(angle) * (r - 20)} ${x},${y} `;
      }
    }
    return path + 'Z';
  };

  const handleMoodDrag = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMoodX(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    setMoodY(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
  };

  const getColor = () => tensionScore < 30 ? 'from-emerald-400 to-teal-500' : tensionScore < 60 ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-red-500';
  const getText = () => tensionScore < 30 ? 'Equilibrium' : tensionScore < 60 ? 'Tension Rising' : 'High Tension';

  const getVibeColor = () => {
    if (vibeScore >= 75) return 'from-emerald-400 to-teal-500';
    if (vibeScore >= 50) return 'from-amber-400 to-orange-500';
    if (vibeScore >= 25) return 'from-orange-400 to-rose-500';
    return 'from-rose-400 to-red-500';
  };

  const getVibeText = () => {
    if (vibeScore >= 75) return 'Excellent Mood';
    if (vibeScore >= 50) return 'Good Mood';
    if (vibeScore >= 25) return 'Low Mood';
    return 'Need Support';
  };
  
  const getPositiveCaption = () => {
    // Based on Screen Time slider (0-12 hours)
    if (screenTime < 1) {
      return "🌟 Amazing screen discipline! You're protecting your mental wellness.";
    } else if (screenTime < 2) {
      return "✨ Excellent screen balance! Your mind has room to breathe.";
    } else if (screenTime < 3) {
      return "💚 Healthy screen habits! You're in control of your time.";
    } else if (screenTime < 4) {
      return "🌱 Good screen usage. Remember to take breaks and stretch.";
    } else if (screenTime < 5) {
      return "⏰ Moderate screen time. Consider stepping away soon.";
    } else if (screenTime < 6) {
      return "🌊 Screen time is adding up. Your eyes need a rest.";
    } else if (screenTime < 7) {
      return "💪 High screen exposure. Time to disconnect and recharge.";
    } else if (screenTime < 8) {
      return "🌸 Heavy screen use detected. Prioritize your wellbeing.";
    } else if (screenTime < 9) {
      return "🧘 Extended screen time. Your mind deserves a digital detox.";
    } else if (screenTime < 10) {
      return "💙 Screen overload. Please take a break - you matter more than the screen.";
    } else if (screenTime < 11) {
      return "🤗 Very high screen time. Step away and do something kind for yourself.";
    } else {
      return "❤️ Critical screen time! Your health comes first. Power down and rest.";
    }
  };
  
  const getStepsCaption = () => {
    if (steps >= 8000) {
      return "🏃 Amazing! You're crushing your movement goals today!";
    } else if (steps >= 5000) {
      return "👟 Great job staying active! Your body thanks you.";
    } else if (steps >= 2000) {
      return "🚶 Good progress! Every step counts toward wellness.";
    } else if (steps >= 500) {
      return "🌿 You're moving! Small steps lead to big changes.";
    } else {
      return "💫 Ready to move? Even a short walk can lift your mood.";
    }
  };
  
  const getScreenCaption = () => {
    if (screenTime < 2) {
      return "📱 Excellent screen balance! You're protecting your mental space.";
    } else if (screenTime < 4) {
      return "⏰ Healthy screen usage. You're in control of your time.";
    } else if (screenTime < 6) {
      return "👀 Consider a screen break soon. Your eyes will thank you.";
    } else if (screenTime < 8) {
      return "🌙 High screen time today. Maybe time to unplug?";
    } else {
      return "💙 Your mind needs rest from screens. Be kind to yourself.";
    }
  };
  
  const getMoodCaption = () => {
    const isPositive = moodX > 50;
    const isHighEnergy = moodY < 50;
    
    if (isPositive && isHighEnergy) {
      return "🎉 Positive and energized! Ride this wonderful wave!";
    } else if (isPositive && !isHighEnergy) {
      return "😌 Calm and content. This peaceful state is beautiful.";
    } else if (!isPositive && isHighEnergy) {
      return "⚡ Feeling intense? Channel that energy into something creative.";
    } else {
      return "🌙 Low energy is okay. Rest is productive. You're doing fine.";
    }
  };

  if (!storageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 animate-pulse mx-auto">
            <Heart className="w-10 h-10" />
          </div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (authMode !== 'app') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 mx-auto">
              <Heart className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-light mb-2">Equilibrium</h1>
            <p className="text-white/50 text-sm">The app that knows you need a break before you do</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            {authMode === 'login' ? (
              <div>
                <h2 className="text-2xl font-light mb-6">Welcome Back</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                {authError && <div className="flex items-center gap-2 text-rose-400 text-sm mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20"><AlertCircle className="w-4 h-4" /><span>{authError}</span></div>}
                {authSuccess && <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><CheckCircle className="w-4 h-4" /><span>{authSuccess}</span></div>}

                <button onClick={handleLogin} disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? 'Signing in...' : 'Sign In'} {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>

                <div className="mt-6 text-center text-sm text-white/40">
                  Don't have an account? <button type="button" onClick={() => setAuthMode('signup')} className="text-teal-400 hover:text-teal-300">Sign up</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-light mb-6">Create Account</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500" placeholder="Your name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500" placeholder="Min 6 characters" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSignup()} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-teal-500" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                {authError && <div className="flex items-center gap-2 text-rose-400 text-sm mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20"><AlertCircle className="w-4 h-4" /><span>{authError}</span></div>}
                {authSuccess && <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><CheckCircle className="w-4 h-4" /><span>{authSuccess}</span></div>}

                <button onClick={handleSignup} disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? 'Creating...' : 'Create Account'} {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>

                <div className="mt-6 text-center text-sm text-white/40">
                  Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-teal-400 hover:text-teal-300">Sign in</button>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-white/30 text-center">💾 Secure Local Storage • Privacy First</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="bg-white/5 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light">Equilibrium</h1>
            <p className="text-xs text-white/40">Welcome, {currentUser?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowStats(!showStats)} 
              className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-xl transition-all border border-teal-500/30"
              title="Toggle Activity Stats"
            >
              <Activity className="w-5 h-5" />
              <span className="text-sm font-medium">Activity</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-center mb-12">
          <div className="relative">
            <svg width="300" height="300">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={vibeScore >= 75 ? '#34d399' : vibeScore >= 50 ? '#fbbf24' : vibeScore >= 25 ? '#fb923c' : '#f87171'} />
                  <stop offset="100%" stopColor={vibeScore >= 75 ? '#14b8a6' : vibeScore >= 50 ? '#f97316' : vibeScore >= 25 ? '#f87171' : '#dc2626'} />
                </linearGradient>
              </defs>
              <path d={generateShape()} fill="url(#grad)" fillOpacity="0.3" stroke="url(#grad)" strokeWidth="2" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-5xl font-extralight bg-gradient-to-r ${getVibeColor()} bg-clip-text text-transparent`}>{vibeScore}</div>
                <div className="text-sm text-white/40 mt-2">{getVibeText()}</div>
              </div>
            </div>
          </div>
        </div>

        {intervention && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getColor()} flex items-center justify-center flex-shrink-0`}>
                <Heart className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white/50 mb-1">{intervention.type}</div>
                <h3 className="text-xl font-light mb-2">{intervention.action}</h3>
                <p className="text-white/70 mb-4">{intervention.message}</p>
                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-all">Start {intervention.duration} session</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl">
          <h3 className="text-xl font-light mb-6 text-center">Vibe Check - Drag to Set Your Mood</h3>
          <div 
            className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 cursor-crosshair" 
            className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 cursor-crosshair"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMoodDrag}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={e => {
              if (!isDragging) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const touch = e.touches[0];
              setMoodX(Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100)));
              setMoodY(Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100)));
            }}
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-white/40">High Energy</div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white/40">Low Energy</div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-white/40">Negative</div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white/40">Positive</div>
            <div className={`absolute w-16 h-16 rounded-full bg-gradient-to-br ${getVibeColor()} blur-sm transition-all duration-200`} style={{ left: `${moodX}%`, top: `${moodY}%`, transform: 'translate(-50%, -50%)' }} />
            <div className={`absolute w-12 h-12 rounded-full bg-gradient-to-br ${getVibeColor()} transition-all duration-200`} style={{ left: `${moodX}%`, top: `${moodY}%`, transform: 'translate(-50%, -50%)' }} />
          </div>
          <p className="text-center text-sm text-white/50 mt-4">Drag the orb to show how you feel</p>
          <p className="text-center text-sm text-teal-400/80 mt-2">{getMoodCaption()}</p>
        </div>

        {showStats && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-xl font-light mb-6">Today's Signals</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/50">Screen Time</span>
                </div>
                <div className="text-3xl font-light">{screenTime.toFixed(1)}<span className="text-lg text-white/40">h</span></div>
                <input type="range" min="0" max="12" step="0.1" value={screenTime} onChange={e => setScreenTime(parseFloat(e.target.value))} className="w-full mt-3 accent-teal-500" />
                <p className="text-xs text-emerald-400/80 mt-2">{getScreenCaption()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/50">Steps</span>
                </div>
                <div className="text-3xl font-light">{steps.toLocaleString()}</div>
                <input type="range" min="0" max="10000" step="100" value={steps} onChange={e => setSteps(parseInt(e.target.value))} className="w-full mt-3 accent-teal-500" />
                <p className="text-xs text-emerald-400/80 mt-2">{getStepsCaption()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-white/30 text-sm italic">The app that knows you need a break before you do.</p>
        </div>
      </div>
    </div>
  );
};

export default Equilibrium;