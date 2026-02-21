export function getEntryPointCode(main_page_relative_path: string = './App') {
  return `
import { createRoot } from 'react-dom/client';
import React from 'react';
import App from '${main_page_relative_path}';

const doc = document.getElementById('root');
if (doc) {
  const root = createRoot(doc);
  root.render(<App />);
}
`
}

export function getLoadingPage(page_name: string): string {
  return `
import React, { useState, useEffect, useRef } from 'react';

export function useLoginPageAutoReload() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    const url = "/__page_status__?name=${page_name}";

    const checkPageStatus = async () => {
      if (reloadingRef.current) return;

      try {
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 200) {
          reloadingRef.current = true;
          window.location.reload();
        }
      } catch (err) {
        console.error("Login status check failed:", err);
      }
    };

    // run immediately
    checkPageStatus();

    const intervalId = setInterval(checkPageStatus, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
}

const LoadingPage = () => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  useLoginPageAutoReload();

  const messages = [
    "Initializing project structure...",
    "Optimizing asset delivery...",
    "Configuring secure protocols...",
    "Applying final design touches...",
    "Almost there, hang tight!"
  ];

  // Simulate progress loading
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 99 ? prev + 1 : 99));
    }, 200);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => prev < (messages.length - 1) ? (prev + 1) : (messages.length - 1));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8 text-center">
        
        {/* Animated Icon / Logo */}
        <div className="relative flex justify-center">
          <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.6)]"></div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Building Page ${page_name}
          </h1>
          <p className="text-slate-400 text-lg h-6 transition-all duration-500 ease-in-out">
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 ease-out"
              style={{ width: \`\${progress}%\` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-500 uppercase tracking-widest">
            <span>Status: Processing</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="pt-8 grid grid-cols-3 gap-4 opacity-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={\`h-full bg-slate-600 animate-[shimmer_2s_infinite]\`}
                style={{ animationDelay: \`\${i * 0.2}s\` }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full md:w-[500px] md:h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -z-10"></div>
    </div>
  );
};

export default LoadingPage;
`;
}
