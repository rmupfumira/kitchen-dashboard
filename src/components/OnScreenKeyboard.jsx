import { useEffect, useRef, useState } from "react";
import { ArrowBigUp, Delete, CornerDownLeft, X } from "lucide-react";

/**
 * In-app touch keyboard. Desktop Chromium on Linux (the Pi kiosk) has no
 * built-in on-screen keyboard, so this slides up whenever a text field is
 * focused and types into it. Keys use mousedown-preventDefault so the focused
 * input never blurs; values are written via the native setter + an `input`
 * event so React's onChange fires, and Enter is dispatched as a real keydown.
 */
const ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

function setNativeValue(el, value) {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value); else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function isTextField(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName !== "INPUT") return false;
  const t = (el.getAttribute("type") || "text").toLowerCase();
  return ["text", "search", "email", "url", "tel", "number", "password", ""].includes(t);
}

export default function OnScreenKeyboard() {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const onFocusIn = (e) => { if (isTextField(e.target)) { targetRef.current = e.target; setOpen(true); } };
    const onFocusOut = () => {
      setTimeout(() => {
        if (!isTextField(document.activeElement)) { targetRef.current = null; setOpen(false); setShift(false); }
      }, 60);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => { document.removeEventListener("focusin", onFocusIn); document.removeEventListener("focusout", onFocusOut); };
  }, []);

  if (!open) return null;

  const type = (ch) => {
    const el = targetRef.current; if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    setNativeValue(el, el.value.slice(0, s) + ch + el.value.slice(e));
    const pos = s + ch.length;
    try { el.setSelectionRange(pos, pos); } catch { /* number inputs disallow */ }
    if (shift) setShift(false);
  };
  const backspace = () => {
    const el = targetRef.current; if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    if (s === e && s > 0) { setNativeValue(el, el.value.slice(0, s - 1) + el.value.slice(e)); try { el.setSelectionRange(s - 1, s - 1); } catch {} }
    else if (s !== e) { setNativeValue(el, el.value.slice(0, s) + el.value.slice(e)); try { el.setSelectionRange(s, s); } catch {} }
  };
  const enter = () => {
    const el = targetRef.current; if (!el) return;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
  };
  const close = () => { const el = targetRef.current; targetRef.current = null; setOpen(false); setShift(false); try { el && el.blur(); } catch {} };
  const lbl = (k) => (shift ? k.toUpperCase() : k);

  return (
    <div className="osk" onMouseDown={(e) => e.preventDefault()}>
      <div className="osk-keys">
        {ROWS.map((row, i) => (
          <div className="osk-row" key={i}>
            {i === 3 && <button type="button" className={"osk-key osk-mod" + (shift ? " on" : "")} onClick={() => setShift((s) => !s)} aria-label="Shift"><ArrowBigUp size={24} strokeWidth={2} /></button>}
            {row.map((k) => <button type="button" className="osk-key" key={k} onClick={() => type(lbl(k))}>{lbl(k)}</button>)}
            {i === 3 && <button type="button" className="osk-key osk-mod" onClick={backspace} aria-label="Backspace"><Delete size={24} strokeWidth={2} /></button>}
          </div>
        ))}
        <div className="osk-row">
          <button type="button" className="osk-key osk-fn" onClick={close}><X size={20} strokeWidth={2.2} /> Close</button>
          <button type="button" className="osk-key osk-space" onClick={() => type(" ")} aria-label="Space">space</button>
          <button type="button" className="osk-key osk-fn osk-enter" onClick={enter}><CornerDownLeft size={20} strokeWidth={2.2} /> Enter</button>
        </div>
      </div>
    </div>
  );
}
