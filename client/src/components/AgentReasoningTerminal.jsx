import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Terminal, Play, RotateCcw, CheckCircle2, AlertTriangle, 
  Sparkles, Zap, ShieldCheck, ArrowRight, ExternalLink, Cpu
} from "lucide-react";
import { toast } from "sonner";

const INITIAL_LOGS = [
  {
    id: 1,
    timestamp: "19:42:01",
    stage: "SYSTEM_INIT",
    message: "🤖 MedFlow Autonomous Orchestrator active. Listening for clinic queue triggers...",
    type: "info"
  },
  {
    id: 2,
    timestamp: "19:42:05",
    stage: "PERCEPTION",
    message: "📥 Inbound Trigger: New walk-in registered for Dr. Rajesh Kumar (Cardiology).",
    type: "event"
  },
  {
    id: 3,
    timestamp: "19:42:06",
    stage: "REASONING",
    message: "🧠 Analyzing Patient History + Local Commute Traffic (Rain + 1.8km delay)...",
    type: "reasoning"
  },
  {
    id: 4,
    timestamp: "19:42:07",
    stage: "EVALUATION",
    message: "📊 Predicted No-Show Risk: 84% (HIGH RISK). Triggering mitigation workflow.",
    type: "warning"
  },
  {
    id: 5,
    timestamp: "19:42:08",
    stage: "TOOL_CALL",
    message: "⚡ Executing n8n Webhook -> Dispatched WhatsApp reschedule prompt to +91-9876543210.",
    type: "action"
  },
  {
    id: 6,
    timestamp: "19:42:09",
    stage: "PERSISTENCE",
    message: "💾 Saved audit log token #TK-8492 to MongoDB Atlas database.",
    type: "success"
  }
];

export default function AgentReasoningTerminal({ className = "" }) {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState("IDLE");
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const runSampleAgentExecution = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    toast.info("🤖 Triggering Autonomous Agentic Reasoning Cycle...");

    const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

    // Step 1: Perception
    setActiveStep("PERCEPTION");
    setLogs(prev => [...prev, {
      id: Date.now() + 1,
      timestamp: now(),
      stage: "PERCEPTION",
      message: "🔍 [Agent Perception] Inbound Diagnostic Request: Prescription OCR & Triage check.",
      type: "event"
    }]);

    await new Promise(r => setTimeout(r, 1200));

    // Step 2: Reasoning
    setActiveStep("REASONING");
    setLogs(prev => [...prev, {
      id: Date.now() + 2,
      timestamp: now(),
      stage: "REASONING",
      message: "🧠 [Agent Reasoning] Invoking Gemini 1.5 Flash Vision API... Analyzing drug-interaction matrix (Amlodipine + Atorvastatin).",
      type: "reasoning"
    }]);

    await new Promise(r => setTimeout(r, 1400));

    // Step 3: Tool Call / Action
    setActiveStep("TOOL_CALL");
    setLogs(prev => [...prev, {
      id: Date.now() + 3,
      timestamp: now(),
      stage: "TOOL_CALL",
      message: "⚡ [Tool Action] Dispatched payload to n8n Automation Webhook -> /api/webhooks/n8n-alert.",
      type: "action"
    }]);

    await new Promise(r => setTimeout(r, 1200));

    // Step 4: Success / Persistence
    setActiveStep("SUCCESS");
    setLogs(prev => [...prev, {
      id: Date.now() + 4,
      timestamp: now(),
      stage: "PERSISTENCE",
      message: "✅ [Agent Execution Complete] Patient record & automated audit trail persisted to DB.",
      type: "success"
    }]);

    setIsExecuting(false);
    setActiveStep("IDLE");
    toast.success("✅ Agent execution finished successfully!");
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info("Terminal logs cleared.");
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl font-mono text-xs text-slate-100 overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-slate-200 tracking-wide text-xs">
            MedFlow Autonomous Agentic Hub
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
            isExecuting 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}>
            {isExecuting ? `ACTIVE: ${activeStep}` : "READY • STANDBY"}
          </span>
        </div>

        {/* Terminal Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={runSampleAgentExecution}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-sans font-medium text-xs transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isExecuting ? "Executing..." : "Trigger Agent Run"}</span>
          </button>
          <button
            onClick={clearLogs}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Clear Terminal Logs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Window */}
      <div className="h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/50 p-1 rounded transition"
            >
              <span className="text-slate-500 select-none text-[11px] min-w-[55px]">
                {log.timestamp}
              </span>

              {log.type === "info" && <Terminal className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />}
              {log.type === "event" && <Bot className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />}
              {log.type === "reasoning" && <Sparkles className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />}
              {log.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />}
              {log.type === "action" && <Zap className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />}
              {log.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />}

              <span className={`font-mono text-xs ${
                log.type === "warning" ? "text-amber-300 font-medium" :
                log.type === "action" ? "text-blue-300" :
                log.type === "success" ? "text-emerald-300" :
                log.type === "reasoning" ? "text-purple-300" :
                "text-slate-300"
              }`}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Info */}
      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>Engine: <strong className="text-slate-400">Gemini 1.5 Pro Agentic Loop</strong></span>
          <span>Protocol: <strong className="text-slate-400">n8n Webhook Orchestrator</strong></span>
        </div>
        <span className="text-emerald-400 flex items-center gap-1 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Live Stream Connected
        </span>
      </div>
    </div>
  );
}
