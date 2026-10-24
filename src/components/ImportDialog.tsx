import { useState } from "react";
import { parseTranscript, type TranscriptResult } from "../transcript";
import { formatGeneds } from "../geneds";

interface Props {
  onApply: (t: TranscriptResult) => void;
  onClose: () => void;
}

export function ImportDialog({ onApply, onClose }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const parsed = text.trim() ? parseTranscript(text) : null;

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr("");
    setFileName(f.name);
    setBusy(true);
    try {
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        const { pdfToText } = await import("../pdf");
        setText(await pdfToText(f));
      } else setText(await f.text());
    } catch (e) {
      setErr(`Couldn't read that file: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const byTerm = new Map<string, NonNullable<typeof parsed>["courses"]>();
  for (const c of parsed?.courses ?? []) byTerm.set(c.term, [...(byTerm.get(c.term) ?? []), c]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Import Testudo unofficial transcript</h2>
        <p className="modal-sub">
          Testudo → Unofficial Transcript → print/save as PDF and upload it, or select all on the page and paste the text. Completed,
          in-progress and transfer/AP courses replace what's in your plan; planned courses are kept.
        </p>
        <label
          className={`dropzone ${over ? "over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input type="file" accept=".pdf,.txt,application/pdf,text/plain" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <b>{busy ? "Reading PDF…" : fileName ? fileName : "Drop your transcript PDF here"}</b>
          <span className="muted">{fileName && !busy ? "Drop another file to replace it" : "or click to choose a file"}</span>
        </label>
        {err && <div className="error">{err}</div>}
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="…or paste transcript text here" rows={8} />
        {parsed && (
          <div className="preview">
            <div>
              <b>{parsed.courses.length}</b> courses, <b>{parsed.courses.reduce((n, c) => n + c.credits, 0)}</b> credits
              {parsed.exemptions.length > 0 && <> · GenEd exemptions: {parsed.exemptions.join(", ")}</>}
              {parsed.majors.length > 0 && <> · Major: {parsed.majors.join(", ")}</>}
              {parsed.minors.length > 0 && <> · Minor: {parsed.minors.join(", ")}</>}
            </div>
            {parsed.warnings.map((w) => (
              <div key={w} className="warn-text">
                ⚠ {w}
              </div>
            ))}
            <div className="preview-terms">
              {[...byTerm].map(([term, cs]) => (
                <div key={term}>
                  <b>{term}</b>
                  <ul>
                    {cs.map((c, i) => (
                      <li key={i}>
                        {c.code || <i>GenEd credit</i>} · {c.credits} cr{c.grade ? ` · ${c.grade}` : ""}
                        {c.geneds ? ` · ${formatGeneds(c.geneds)}` : ""}
                        {c.source === "inprogress" ? " · in progress" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!parsed?.courses.length} onClick={() => parsed && onApply(parsed)}>
            Import {parsed?.courses.length ?? 0} courses
          </button>
        </div>
      </div>
    </div>
  );
}
