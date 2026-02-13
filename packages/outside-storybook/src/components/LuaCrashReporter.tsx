import React, { useState, useEffect } from 'react';

interface CrashReport {
  system: string;
  phase: string;
  tic: number;
  timestamp: number;
  luaError: string;
  luaTraceback: string;
  ecsState: Record<string, unknown>;
  hostCallHistory: Array<{ name: string; args: unknown[]; timestamp: number }>;
}

export function LuaCrashReporter() {
  const [crashReport, setCrashReport] = useState<CrashReport | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkError = () => {
      const error = (window as any).__luaError;
      if (error) {
        setCrashReport(error);
      }
    };

    // Check on mount
    checkError();

    // Also set up interval to check for new errors
    const interval = setInterval(checkError, 500);
    return () => clearInterval(interval);
  }, []);

  if (!crashReport) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          padding: '8px 16px',
          borderRadius: 4,
          backgroundColor: '#22c55e',
          color: 'white',
          fontSize: 12,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 9999,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'white',
          }}
        />
        Lua Status: OK
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(crashReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 4,
          backgroundColor: '#ef4444',
          color: 'white',
          fontSize: 12,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 300,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'white',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            Lua Error: {crashReport.phase}
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            Tic {crashReport.tic} · {crashReport.system}
          </div>
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px 8px',
            backgroundColor: 'white',
            color: '#ef4444',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 'bold',
            flexShrink: 0,
            transition: 'all 200ms',
            opacity: copied ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as any).style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as any).style.backgroundColor = 'white';
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
    </div>
  );
}
