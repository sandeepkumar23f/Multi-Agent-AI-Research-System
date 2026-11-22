import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Check, Copy, FileText, ShieldCheck, Globe, BookOpen } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STEPS = [
  { id: 1, title: "Web Search", icon: Globe },
  { id: 2, title: "Deep Reader", icon: BookOpen },
  { id: 3, title: "Report Draft", icon: FileText },
  { id: 4, title: "Critic Audit", icon: ShieldCheck },
];

const PRESETS = [
  "Impact of AI agents on junior software engineering hiring in 2026",
  "Groq LPU inference architecture vs traditional GPU serving",
  "Retrieval-Augmented Generation vs Long-Context LLMs in production",
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const runResearch = (selectedTopic) => {
    const query = (selectedTopic || topic).trim();
    if (!query || loading) return;

    setTopic(query);
    setLoading(true);
    setError("");
    setResult(null);
    setActiveStep(1);
    setStatusText("Starting multi-agent pipeline...");

    const es = new EventSource(`${API_BASE}/api/research?topic=${encodeURIComponent(query)}`);

    es.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "step") {
        setActiveStep(msg.step);
        setStatusText(msg.label);
      } else if (msg.type === "done") {
        setResult(msg.data);
        setActiveStep(5);
        setLoading(false);
        es.close();
      } else if (msg.type === "error") {
        setError(msg.message);
        setLoading(false);
        es.close();
      }
    };

    es.onerror = () => {
      setError("Stream interrupted. Ensure the Express server is running.");
      setLoading(false);
      es.close();
    };
  };

  const handleCopy = () => {
    if (!result?.report) return;
    navigator.clipboard.writeText(result.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B] font-sans antialiased">
      {/* Top Minimal Masthead */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-900" />
            <span className="font-semibold text-sm tracking-tight">ResearchDesk</span>
            <span className="text-xs text-stone-400 hidden sm:inline">
              / Multi-Agent Synthesis & Critic Pipeline
            </span>
          </div>
          <span className="text-xs font-mono text-stone-500">Groq · Tavily · LangGraph</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Query Bar */}
        <section className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Automated Research Briefs
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Dispatches four specialized agents to search, scrape primary sources, draft a report, and audit quality.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runResearch();
            }}
            className="mt-5 flex gap-2"
          >
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a technical or market research topic..."
              className="flex-1 bg-white border border-stone-300 rounded-md px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? "Running" : "Run Pipeline"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Suggested Topics */}
          {!result && !loading && (
            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => runResearch(p)}
                  className="text-xs text-stone-600 bg-white border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-md text-left cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 4-Stage Pipeline Progress Bar */}
        {(loading || result) && (
          <section className="mt-8 bg-white border border-stone-200 rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isDone = activeStep > s.id;
                const isCurrent = activeStep === s.id && loading;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md border text-xs font-medium ${
                      isDone
                        ? "bg-stone-50 border-stone-300 text-stone-900"
                        : isCurrent
                        ? "bg-amber-50/70 border-amber-300 text-amber-900"
                        : "bg-white border-stone-100 text-stone-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{s.title}</span>
                    {isDone && <Check className="w-3.5 h-3.5 ml-auto text-emerald-700" />}
                  </div>
                );
              })}
            </div>
            {loading && (
              <p className="text-xs font-mono text-stone-500 mt-3 pt-2.5 border-t border-stone-100">
                {statusText}
              </p>
            )}
          </section>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Two-Column Editorial Output: Report (Left) + Critic Review (Right) */}
        {result && (
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Research Report */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-lg p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500">
                  Final Research Document
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 border border-stone-200 px-2.5 py-1 rounded hover:bg-stone-50 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Markdown"}
                </button>
              </div>
              <article className="prose prose-stone prose-sm max-w-none prose-headings:font-semibold prose-a:text-stone-900 prose-a:underline">
                <ReactMarkdown>{result.report}</ReactMarkdown>
              </article>
            </div>

            {/* Critic Chain Audit Panel */}
            <aside className="bg-white border border-stone-200 rounded-lg p-5">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-200">
                <ShieldCheck className="w-4 h-4 text-stone-800" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-stone-700">
                  Critic Evaluation
                </h2>
              </div>
              <div className="text-xs text-stone-700 whitespace-pre-line leading-relaxed font-sans">
                {result.feedback}
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}