"use client";

import { useEffect } from "react";

export default function StandalonePage() {
  useEffect(() => {
    window.location.replace("/standalone.html");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-semibold text-lg">Loading Daily Stock CPU Web App...</p>
        <p className="text-sm text-slate-400">
          If you are not redirected automatically,{" "}
          <a href="/standalone.html" className="text-amber-400 underline">
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
