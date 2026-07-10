'use client';

import React, { useEffect, useState } from 'react';


export default function AgentCopilot() {
  const [agent, setAgent] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initialize PageAgent
    import('page-agent').then(({ PageAgent }) => {
      const pageAgent = new PageAgent({
        model: 'gemini-2.5-flash',
        baseURL: '/api/ai-proxy',
        apiKey: 'handled-by-server', // Ignored, handled securely by server
      });
      setAgent(pageAgent);
    }).catch((err) => console.error('Failed to load page-agent:', err));
  }, []);

  const handleExecute = async () => {
    if (!agent || !prompt.trim()) return;
    setIsExecuting(true);
    try {
      await agent.execute(prompt);
    } catch (error) {
      console.error("Agent execution failed:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="w-80 p-4 bg-background border border-border rounded-xl shadow-lg flex flex-col gap-3">
          <div className="font-semibold text-sm">Page Agent Copilot</div>
          <textarea
            className="w-full p-2 text-sm bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={3}
            placeholder="What should I do on this page?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isExecuting}
          />
          <button
            onClick={handleExecute}
            disabled={isExecuting || !prompt.trim()}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Toggle Copilot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
