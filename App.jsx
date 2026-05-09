import { useState, useRef } from "react";
import.meta.env.VITE_GEMINI_KEY
const STATUSES = {
  VERIFIED: { label: "Verified", color: "#10B981", bg: "#ECFDF5", icon: "✓" },
  INACCURATE: { label: "Inaccurate", color: "#F59E0B", bg: "#FFFBEB", icon: "⚠" },
  FALSE: { label: "False / No Evidence", color: "#EF4444", bg: "#FEF2F2", icon: "✗" },
  CHECKING: { label: "Checking...", color: "#6366F1", bg: "#EEF2FF", icon: "⟳" },
};

async function extractAndVerifyClaims(pdfBase64) {
  const res = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`, {
    method: "POST",
    body: JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: `Extract all factual claims from this PDF and return ONLY valid JSON array.

PDF Base64:
${pdfBase64}`
        }
      ]
    }
  ]
}),
    headers: { "Content-Type": "application/json" }
  });
  const extractData = await extractRes.json();
  const text =   extractData.candidates[0].content.parts[0].text;
  const clean = text.trim();
  return JSON.parse(clean);
}

async function verifySingleClaim(claim) {
  const res = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,{
    method: "POST",
    body: JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: `
Fact-check this claim:

${claim.claim}

Context:
${claim.context}

Return ONLY JSON in this format:

{
  "status": "VERIFIED",
  "confidence": 90,
  "explanation": "short explanation",
  "correction": null,
  "sources": []
}
`
        }
      ]
    }
  ]
}),
    headers: { "Content-Type": "application/json" }
  });
  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;
  const clean = text.trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { status: "FALSE", confidence: 0, explanation: "Could not verify this claim.", correction: null, sources: [] };
  }
}

export default function App() {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | extracting | verifying | done | error
  const [claims, setClaims] = useState([]);
  const [results, setResults] = useState({});
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") setFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStage("extracting");
    setResults({});
    setClaims([]);
    setProgress(0);

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const extracted = await extractAndVerifyClaims(base64);
      setClaims(extracted);
      setStage("verifying");

      for (let i = 0; i < extracted.length; i++) {
        const claim = extracted[i];
        setResults(prev => ({ ...prev, [claim.id]: { status: "CHECKING" } }));
        const verdict = await verifySingleClaim(claim);
        setResults(prev => ({ ...prev, [claim.id]: verdict }));
        setProgress(Math.round(((i + 1) / extracted.length) * 100));
      }
      setStage("done");
    } catch (e) {
      setErrorMsg(e.message || "An error occurred.");
      setStage("error");
    }
  };

  const summary = () => {
    const done = Object.values(results).filter(r => r.status !== "CHECKING");
    return {
      verified: done.filter(r => r.status === "VERIFIED").length,
      inaccurate: done.filter(r => r.status === "INACCURATE").length,
      false: done.filter(r => r.status === "FALSE").length,
    };
  };

  const s = summary();

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0D1B3E", padding: "18px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, background: "#00C6BE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#0D1B3E" }}>F</div>
        <div>
          <div style={{ color: "#FFF", fontWeight: 700, fontSize: 18, letterSpacing: -0.3 }}>FactCheck AI</div>
          <div style={{ color: "#7A96B0", fontSize: 12 }}>Automated PDF Fact-Verification Agent</div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
        {/* Upload area */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragOver ? "#00C6BE" : file ? "#10B981" : "#CBD5E1"}`,
            borderRadius: 16, background: dragOver ? "#E0F7F6" : file ? "#ECFDF5" : "#FFF",
            padding: "40px 24px", textAlign: "center", cursor: "pointer",
            transition: "all 0.2s", marginBottom: 24
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ fontSize: 40, marginBottom: 8 }}>{file ? "📄" : "⬆️"}</div>
          {file ? (
            <>
              <div style={{ fontWeight: 600, color: "#10B981", fontSize: 16 }}>{file.name}</div>
              <div style={{ color: "#6B7280", fontSize: 13 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 16 }}>Drop your PDF here or click to upload</div>
              <div style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>Marketing reports, press releases, research docs — any PDF with factual claims</div>
            </>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || stage === "extracting" || stage === "verifying"}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: !file || stage === "extracting" || stage === "verifying" ? "#CBD5E1" : "#0D1B3E",
            color: "#FFF", fontSize: 16, fontWeight: 700, cursor: !file || stage === "extracting" || stage === "verifying" ? "not-allowed" : "pointer",
            marginBottom: 28, transition: "background 0.2s"
          }}
        >
          {stage === "extracting" ? "📖 Extracting claims..." : stage === "verifying" ? `🔍 Verifying... ${progress}%` : "🔍 Analyze & Fact-Check PDF"}
        </button>

        {/* Progress bar */}
        {stage === "verifying" && (
          <div style={{ background: "#E2E8F0", borderRadius: 8, height: 8, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ background: "#00C6BE", height: "100%", width: `${progress}%`, transition: "width 0.4s", borderRadius: 8 }} />
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "16px 20px", color: "#991B1B", marginBottom: 20 }}>
            ❌ {errorMsg}
          </div>
        )}

        {/* Summary cards */}
        {claims.length > 0 && stage !== "extracting" && (
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Verified", val: s.verified, color: "#10B981", bg: "#ECFDF5" },
              { label: "Inaccurate", val: s.inaccurate, color: "#F59E0B", bg: "#FFFBEB" },
              { label: "False / No Evidence", val: s.false, color: "#EF4444", bg: "#FEF2F2" },
              { label: "Total Claims", val: claims.length, color: "#6366F1", bg: "#EEF2FF" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} style={{ flex: 1, background: bg, border: `1.5px solid ${color}30`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Claims list */}
        {claims.map((claim) => {
          const result = results[claim.id];
          const statusKey = result?.status || null;
          const st = statusKey ? STATUSES[statusKey] : null;

          return (
            <div key={claim.id} style={{
              background: st ? st.bg : "#FFF",
              border: `1.5px solid ${st ? st.color + "40" : "#E2E8F0"}`,
              borderRadius: 14, padding: "20px 22px", marginBottom: 14,
              transition: "all 0.3s"
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, minWidth: 28, borderRadius: "50%",
                  background: st ? st.color : "#CBD5E1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFF", fontSize: 14, fontWeight: 700,
                  animation: statusKey === "CHECKING" ? "spin 1s linear infinite" : "none"
                }}>
                  {st ? st.icon : "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: st ? st.color : "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {st ? st.label : "Pending"}
                    </span>
                    {result?.confidence !== undefined && statusKey !== "CHECKING" && (
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Confidence: <b>{result.confidence}%</b></span>
                    )}
                  </div>

                  <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 15, marginBottom: 6, lineHeight: 1.5 }}>
                    "{claim.claim}"
                  </div>

                  {result && statusKey !== "CHECKING" && (
                    <>
                      <div style={{ color: "#374151", fontSize: 13.5, lineHeight: 1.6, marginBottom: result.correction ? 8 : 0 }}>
                        {result.explanation}
                      </div>
                      {result.correction && (
                        <div style={{ background: "#FFF", border: "1px solid #FCD34D", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>✏ CORRECTION: </span>
                          <span style={{ fontSize: 13, color: "#78350F" }}>{result.correction}</span>
                        </div>
                      )}
                      {result.sources?.length > 0 && (
                        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {result.sources.map((src, i) => (
                            <span key={i} style={{ background: "#E2E8F0", color: "#475569", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
                              🔗 {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "20px", color: "#6B7280", fontSize: 14 }}>
            ✅ Fact-check complete · {claims.length} claims analyzed
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
