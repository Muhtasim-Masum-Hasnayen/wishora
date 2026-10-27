"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Check, Copy, Download, Gift, Heart, Image as ImageIcon,
  Palette, Play, RotateCcw, Upload,
  Share2, Sparkles, WandSparkles, X
} from "lucide-react";

type Relationship =
  | "Male Friend" | "Female Friend" | "Boyfriend" | "Girlfriend"
  | "Best Friend (Male)" | "Best Friend (Female)" | "Brother" | "Sister"
  | "Husband" | "Wife";

type Theme = {
  id: string; name: string; mood: string; bg: string; accent: string; accent2: string;
  text: string; emoji: string; description: string;
};

type Wish = {
  relationship: Relationship; themeId: string; recipient: string; sender: string;
  message: string; memory: string; photoUrl: string; date: string; reveal: boolean;
};

const relationships: { name: Relationship; icon: string; subtitle: string }[] = [
  { name: "Male Friend", icon: "🧢", subtitle: "For the bro" },
  { name: "Female Friend", icon: "🌷", subtitle: "For your girl friend" },
  { name: "Boyfriend", icon: "🖤", subtitle: "Your favorite guy" },
  { name: "Girlfriend", icon: "💗", subtitle: "Your favorite person" },
  { name: "Best Friend (Male)", icon: "🤜", subtitle: "Partner in chaos" },
  { name: "Best Friend (Female)", icon: "🫶", subtitle: "Your forever person" },
  { name: "Brother", icon: "🛹", subtitle: "Built-in bestie" },
  { name: "Sister", icon: "🦋", subtitle: "Sister by heart" },
  { name: "Husband", icon: "💍", subtitle: "My person, always" },
  { name: "Wife", icon: "🌹", subtitle: "My love, my home" }
];

const themes: Theme[] = [
  { id: "midnight", name: "Midnight Blue", mood: "Bold & electric", bg: "#0b1227", accent: "#77d8ff", accent2: "#9b8cff", text: "#f5f7ff", emoji: "🌌", description: "A little cosmic, a lot iconic." },
  { id: "bloom", name: "Petal Bloom", mood: "Soft & dreamy", bg: "#fff0f5", accent: "#e66b9a", accent2: "#a48be8", text: "#512b43", emoji: "🌸", description: "Soft colors for a beautiful soul." },
  { id: "velvet", name: "Velvet Love", mood: "Romantic & cinematic", bg: "#210f1b", accent: "#ff8bb8", accent2: "#e7b86b", text: "#fff1f7", emoji: "💌", description: "For the love story that feels like a film." },
  { id: "sunshine", name: "Golden Hour", mood: "Warm & joyful", bg: "#fff5df", accent: "#e68b38", accent2: "#dfb849", text: "#4b2c1c", emoji: "☀️", description: "Golden memories, brighter days." },
  { id: "lavender", name: "Lavender Sky", mood: "Whimsical & calm", bg: "#f2edff", accent: "#8c69d8", accent2: "#e18eb6", text: "#33264f", emoji: "🪻", description: "A little magic in every detail." },
  { id: "mono", name: "After Hours", mood: "Minimal & premium", bg: "#101010", accent: "#f5d98b", accent2: "#ffffff", text: "#f7f4ed", emoji: "✦", description: "Quiet luxury for a special person." }
];

const defaultWish: Wish = {
  relationship: "Girlfriend", themeId: "velvet", recipient: "Your favorite person",
  sender: "Someone who cares about you", message: "Happy Birthday to the person who makes ordinary days feel magical. I hope this new chapter brings you every little thing your heart has been wishing for. Keep shining, keep smiling, and never forget how special you are. 💗",
  memory: "My favorite memories are the little moments that somehow become the biggest ones.",
  photoUrl: "", date: "", reveal: true
};

function normalizeWish(value: unknown): Partial<Wish> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const normalized: Partial<Wish> = {};

  if (relationships.some(({ name }) => name === candidate.relationship)) {
    normalized.relationship = candidate.relationship as Relationship;
  }
  if (themes.some(({ id }) => id === candidate.themeId)) {
    normalized.themeId = candidate.themeId as string;
  }
  if (typeof candidate.recipient === "string") normalized.recipient = candidate.recipient.slice(0, 50);
  if (typeof candidate.sender === "string") normalized.sender = candidate.sender.slice(0, 50);
  if (typeof candidate.message === "string") normalized.message = candidate.message.slice(0, 1200);
  if (typeof candidate.memory === "string") normalized.memory = candidate.memory.slice(0, 400);
  if (typeof candidate.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date)) {
    normalized.date = candidate.date;
  }
  if (typeof candidate.photoUrl === "string") {
    if (/^data:image\/jpeg;base64,[\w+/]+=*$/.test(candidate.photoUrl) && candidate.photoUrl.length <= 500_000) {
      normalized.photoUrl = candidate.photoUrl;
    } else if (candidate.photoUrl.length <= 2048) {
      try {
        const photoUrl = new URL(candidate.photoUrl);
        if (photoUrl.protocol === "https:" || photoUrl.protocol === "http:") {
          normalized.photoUrl = photoUrl.toString();
        }
      } catch {
        normalized.photoUrl = "";
      }
    }
  }
  if (typeof candidate.reveal === "boolean") normalized.reveal = candidate.reveal;

  return Object.keys(normalized).length > 0 ? normalized : null;
}

function parseWishJson(value: string): Partial<Wish> | null {
  try {
    return normalizeWish(JSON.parse(value));
  } catch {
    return null;
  }
}

function safeDecode(value: string | null): Partial<Wish> | null {
  if (!value) return null;
  try {
    const bytes = Uint8Array.from(atob(value), character => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return parseWishJson(decoded) ?? parseWishJson(decodeURIComponent(decoded));
  } catch {
    // Older links may use URI-encoded JSON directly instead of Base64.
  }
  try {
    return parseWishJson(decodeURIComponent(value));
  } catch {
    return null;
  }
}
function encodeWish(wish: Wish) {
  const bytes = new TextEncoder().encode(JSON.stringify(wish));
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function compressPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choose a JPG, PNG, or WebP image."));
  }
  if (file.size > 12 * 1024 * 1024) {
    return Promise.reject(new Error("Choose an image smaller than 12 MB."));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (image.naturalWidth * image.naturalHeight > 40_000_000) {
        reject(new Error("This image is too large to process."));
        return;
      }

      let scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");

      const tryCompress = (attempt: number) => {
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser could not process this image."));
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error("Your browser could not compress this image."));
            return;
          }
          if (blob.size > 350 * 1024 && attempt < 8) {
            scale *= 0.8;
            tryCompress(attempt + 1);
            return;
          }
          if (blob.size > 350 * 1024) {
            reject(new Error("This image could not be reduced enough. Try a smaller image."));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Your browser could not read the processed image."));
          };
          reader.onerror = () => reject(new Error("Your browser could not read the processed image."));
          reader.readAsDataURL(blob);
        }, "image/jpeg", Math.max(0.45, 0.86 - attempt * 0.06));
      };

      tryCompress(0);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be opened."));
    };
    image.src = objectUrl;
  });
}

function themeFor(id: string) { return themes.find(t => t.id === id) ?? themes[0]; }

export default function Home() {
  const [wish, setWish] = useState<Wish>(defaultWish);
  const [activeStep, setActiveStep] = useState<"relationship" | "theme" | "personalize">("relationship");
  const [showPreview, setShowPreview] = useState(false);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const shared = safeDecode(params.get("wish"));
    if (shared) {
      setWish({ ...defaultWish, ...shared });
      setIsPublished(true);
      setShowPreview(true);
      setIsRevealOpen(false);
      return;
    }
    try {
      const saved = localStorage.getItem("wishora-draft");
      if (saved) {
        const draft = normalizeWish(JSON.parse(saved));
        if (draft) setWish({ ...defaultWish, ...draft });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted || isPublished) return;
    try { localStorage.setItem("wishora-draft", JSON.stringify(wish)); } catch {}
  }, [wish, mounted, isPublished]);

  const theme = useMemo(() => themeFor(wish.themeId), [wish.themeId]);
const update = useCallback(<K extends keyof Wish,>(
  key: K,
  value: Wish[K]
) => {
    setWish(prev => ({ ...prev, [key]: value }));
  }, []);

  async function handlePhotoUpload(file: File | undefined) {
    if (!file) return;
    setIsPhotoProcessing(true);
    try {
      update("photoUrl", await compressPhoto(file));
    } catch (error) {
      notify(error instanceof Error ? error.message : "The photo could not be uploaded.");
    } finally {
      setIsPhotoProcessing(false);
    }
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function copyLink() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("wish", encodeWish(wish));
    try {
      await navigator.clipboard.writeText(url.toString());
      setIsPublished(true);
      notify("Your share link is copied!");
    } catch {
      window.prompt("Copy your birthday link:", url.toString());
    }
  }

  function resetDraft() {
    setWish(defaultWish);
    setActiveStep("relationship");
    setShowPreview(false);
    setIsPublished(false);
    setIsRevealOpen(false);
    window.history.replaceState({}, "", window.location.pathname);
    try { localStorage.removeItem("wishora-draft"); } catch {}
    notify("Started a fresh wish.");
  }

  function downloadWish() {
    const content = `HAPPY BIRTHDAY, ${wish.recipient.toUpperCase()}!\n\n${wish.message}\n\nA memory to keep:\n${wish.memory}\n\nWith love,\n${wish.sender}\n\nMade with Wishora`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "birthday-wish.txt"; a.click();
    URL.revokeObjectURL(url);
    notify("Birthday wish downloaded.");
  }

  const publishedPage = isPublished && showPreview;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); resetDraft(); }}>
          <span className="brand-mark"><Gift size={20} strokeWidth={2.2} /></span>
          <span>wishora<span className="brand-period">.</span></span>
        </a>
        <nav className="top-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#themes">Themes</a>
          <span className="nav-pill"><span className="live-dot" /> Free to create</span>
        </nav>
        <button className="top-cta" onClick={() => { setActiveStep("relationship"); document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }); }}>
          Create a wish <ArrowUpRight size={16} />
        </button>
      </header>

      {publishedPage ? (
        <section className="published-view">
          <div className="published-top"><span className="eyebrow"><Sparkles size={14}/> A WISH MADE JUST FOR YOU</span><button className="icon-button" onClick={() => { setIsPublished(false); setShowPreview(false); }} aria-label="Close preview"><X size={18}/></button></div>
          <BirthdayCard wish={wish} theme={theme} revealOpen={isRevealOpen} onReveal={() => setIsRevealOpen(true)} />
          <div className="published-actions"><button className="button button-secondary" onClick={copyLink}><Copy size={16}/> Copy share link</button><button className="button button-primary" onClick={downloadWish}><Download size={16}/> Download wish</button><button className="button button-ghost" onClick={() => { setIsPublished(false); setShowPreview(false); setActiveStep("personalize"); }}>Edit this wish</button></div>
          <p className="published-note">This shareable wish is stored inside its URL. Keep the link somewhere safe.</p>
        </section>
      ) : (
        <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-spark">✳</span> MAKE THEIR DAY FEEL DIFFERENT</div>
              <h1>A little website.<br/><span>A whole lot of</span> <em>love.</em></h1>
              <p className="hero-description">Turn your feelings into a beautiful birthday surprise. Pick a vibe, add your memories, and send them a link they’ll never expect.</p>
              <div className="hero-actions">
                <button className="button button-primary button-large" onClick={() => { setActiveStep("relationship"); document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }); }}>Create your birthday site <ArrowRight size={18}/></button>
                <a className="text-link" href="#how-it-works"><span className="play-circle"><Play size={12} fill="currentColor"/></span> See how it works</a>
              </div>
              <div className="hero-social-proof"><div className="avatar-stack"><span>💗</span><span>🎂</span><span>✨</span><span>🫶</span></div><div><strong>Made for your favorite people</strong><small>No coding. No design skills. Just feelings.</small></div></div>
            </div>
            <div className="hero-art" aria-label="Birthday website preview">
              <div className="art-glow glow-one"/><div className="art-glow glow-two"/>
              <div className="floating-note note-one">a little surprise ✦</div>
              <div className="floating-note note-two"><Heart size={14} fill="currentColor"/> made with love</div>
              <div className="mock-browser">
                <div className="browser-bar"><div className="browser-dots"><i/><i/><i/></div><div className="browser-url"><span/> wishora.site/for-you</div><Share2 size={13}/></div>
                <div className="mock-page">
                  <div className="mock-stars">✦　·　✧　　✦</div><div className="mock-heart">♡</div>
                  <div className="mock-small">A LITTLE SOMETHING FOR YOU</div>
                  <h3>Happy Birthday,<br/><i>beautiful soul.</i></h3>
                  <p>Some people make the world<br/>feel a little more magical.</p>
                  <div className="mock-photo"><div className="mock-photo-inner">✿</div><span>our favorite moments</span></div>
                  <div className="mock-button">Open your letter <ArrowRight size={12}/></div>
                  <div className="mock-bottom">MADE WITH ♡ JUST FOR YOU</div>
                </div>
              </div>
              <div className="floating-sticker sticker-one">✿</div><div className="floating-sticker sticker-two">♡</div><div className="floating-sticker sticker-three">✧</div>
            </div>
          </section>

          <section className="relationship-strip">
            <div><span className="strip-label">WHO ARE WE CELEBRATING?</span><p>There’s a vibe for every kind of love.</p></div>
            <div className="relationship-chips">{relationships.slice(0, 6).map(r => <button key={r.name} className={wish.relationship === r.name ? "relationship-chip selected" : "relationship-chip"} onClick={() => update("relationship", r.name)}>{r.icon} {r.name.replace(" (Male)", "").replace(" (Female)", "")}</button>)}<button className="relationship-chip more-chip" onClick={() => { setActiveStep("relationship"); document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }); }}>+ 4 more</button></div>
          </section>

          <section className="builder-section section-wrap" id="builder">
            <div className="section-heading"><div><div className="eyebrow">YOUR SURPRISE STARTS HERE</div><h2>Make it <em>personal.</em></h2><p>Three little steps. One unforgettable birthday.</p></div><div className="step-indicator"><span className={activeStep === "relationship" ? "step-number active" : "step-number"}>01</span><i/><span className={activeStep === "theme" ? "step-number active" : "step-number"}>02</span><i/><span className={activeStep === "personalize" ? "step-number active" : "step-number"}>03</span></div></div>
            <div className="builder-layout">
              <div className="builder-panel">
                <div className="builder-panel-header"><div><span className="panel-kicker">STEP {activeStep === "relationship" ? "01" : activeStep === "theme" ? "02" : "03"} / 03</span><h3>{activeStep === "relationship" ? "Who’s the lucky one?" : activeStep === "theme" ? "Pick their kind of magic." : "Add the little details."}</h3><p>{activeStep === "relationship" ? "Choose the relationship that fits your person." : activeStep === "theme" ? "Choose a look that feels like them." : "The more personal, the more memorable."}</p></div><div className="panel-icon">{activeStep === "relationship" ? <Heart/> : activeStep === "theme" ? <Palette/> : <WandSparkles/>}</div></div>

                  {activeStep === "relationship" && <div className="relationship-grid">{relationships.map(r => <button key={r.name} onClick={() => update("relationship", r.name)} className={wish.relationship === r.name ? "relationship-option chosen" : "relationship-option"}><span className="relationship-emoji">{r.icon}</span><span className="relationship-option-text"><strong>{r.name}</strong><small>{r.subtitle}</small></span><span className="radio-check">{wish.relationship === r.name && <Check size={12}/>}</span></button>)}</div>}

                  {activeStep === "theme" && <div className="theme-grid" id="themes">{themes.map(t => <button key={t.id} className={wish.themeId === t.id ? "theme-option chosen" : "theme-option"} onClick={() => update("themeId", t.id)}><span className="theme-swatch" style={{ background: t.bg, color: t.accent }}><span className="swatch-stars">{t.emoji}</span><span className="swatch-line"/><span className="swatch-line short"/></span><span className="theme-option-meta"><strong>{t.name}</strong><small>{t.mood}</small></span><span className="radio-check">{wish.themeId === t.id && <Check size={12}/>}</span></button>)}</div>}

                  {activeStep === "personalize" && <div className="form-fields">
                    <div className="field-row"><label>THEIR NAME<input value={wish.recipient} onChange={e => update("recipient", e.target.value)} placeholder="e.g. Riya" maxLength={50}/></label><label>YOUR NAME<input value={wish.sender} onChange={e => update("sender", e.target.value)} placeholder="e.g. Your bestie" maxLength={50}/></label></div>
                    <label>BIRTHDAY DATE <span className="optional-label">OPTIONAL</span><input type="date" value={wish.date} onChange={e => update("date", e.target.value)}/></label>
                    <label>YOUR BIRTHDAY MESSAGE<textarea value={wish.message} onChange={e => update("message", e.target.value)} placeholder="Write something from the heart..." rows={5} maxLength={1200}/><small className="field-hint">{wish.message.length}/1200 characters</small></label>
                    <label>A FAVORITE MEMORY <span className="optional-label">OPTIONAL</span><textarea value={wish.memory} onChange={e => update("memory", e.target.value)} placeholder="Remember that time when..." rows={3} maxLength={400}/></label>
                    <div className="photo-upload-field">
                      <span className="photo-upload-label">PHOTO <span className="optional-label">OPTIONAL</span></span>
                      <div className="photo-upload-controls">
                        <label className="button button-secondary photo-upload-button" htmlFor="photo-upload">
                          {isPhotoProcessing ? <><ImageIcon size={16}/> Preparing photo...</> : <><Upload size={16}/> Upload a photo</>}
                          <input id="photo-upload" className="photo-file-input" type="file" accept="image/jpeg,image/png,image/webp" disabled={isPhotoProcessing} onChange={event => { void handlePhotoUpload(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
                        </label>
                        {wish.photoUrl && <button type="button" className="remove-photo-button" onClick={() => update("photoUrl", "")}>Remove photo</button>}
                      </div>
                      <small className="field-hint" aria-live="polite">
                        {wish.photoUrl ? "Photo added and ready for your share link." : "JPG, PNG, or WebP. The image is resized to fit your share link."}
                      </small>
                    </div>
                    <label className="toggle-row"><span><strong>Surprise reveal screen</strong><small>Let them tap to open the birthday surprise.</small></span><button type="button" className={wish.reveal ? "toggle on" : "toggle"} onClick={() => update("reveal", !wish.reveal)} aria-label="Toggle surprise reveal"><span/></button></label>
                  </div>}

                  <div className="builder-footer">
                    <button className="button button-ghost" onClick={() => activeStep === "relationship" ? resetDraft() : setActiveStep(activeStep === "personalize" ? "theme" : "relationship")}><RotateCcw size={15}/>{activeStep === "relationship" ? "Reset" : "Back"}</button>
                    {activeStep !== "personalize" ? <button className="button button-primary" onClick={() => setActiveStep(activeStep === "relationship" ? "theme" : "personalize")}>Continue <ArrowRight size={16}/></button> : <button className="button button-primary" onClick={() => { setShowPreview(true); setIsPublished(false); setIsRevealOpen(false); document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" }); }}>Preview your site <ArrowRight size={16}/></button>}
                  </div>
                </div>

                <div className="preview-panel" id="preview">
                  <div className="preview-top"><div><span className="panel-kicker">LIVE PREVIEW</span><strong>Your birthday website</strong></div><span className="preview-live"><i/> LIVE</span></div>
                  <div className="preview-canvas"><BirthdayCard wish={wish} theme={theme} revealOpen={isRevealOpen} onReveal={() => setIsRevealOpen(true)} compact/></div>
                  <div className="preview-bottom"><span><span className="tiny-dot"/> Changes update as you type</span><button onClick={() => { setShowPreview(true); setIsPublished(false); setIsRevealOpen(false); }}>Expand preview <ArrowUpRight size={14}/></button></div>
                </div>
              </div>
              {showPreview && <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Birthday website preview"><div className="modal-head"><div><span className="panel-kicker">YOUR CREATION</span><h3>Look at that. It’s personal.</h3></div><button className="icon-button" onClick={() => setShowPreview(false)} aria-label="Close"><X/></button></div><BirthdayCard wish={wish} theme={theme} revealOpen={isRevealOpen} onReveal={() => setIsRevealOpen(true)}/><div className="modal-actions"><button className="button button-secondary" onClick={downloadWish}><Download size={16}/> Download wish</button><button className="button button-primary" onClick={copyLink}><Share2 size={16}/> Copy shareable link</button></div><p className="modal-footnote">Anyone with the link can view this wish. Avoid including private information.</p></div>}

          </section>

          <section className="how-section" id="how-it-works"><div className="section-wrap"><div className="center-heading"><div className="eyebrow">LESS SCROLLING, MORE FEELING</div><h2>Thoughtful doesn’t have to be <em>complicated.</em></h2><p>Make something that feels like you, in a few easy steps.</p></div><div className="how-grid"><div className="how-card"><div className="how-icon lilac">01</div><h3>Choose your person</h3><p>Best friend, sibling, soulmate — start with the relationship and the right vibe.</p><span className="how-deco">♡</span></div><div className="how-card"><div className="how-icon peach">02</div><h3>Make it yours</h3><p>Add their name, your message, favorite memories and a theme that fits.</p><span className="how-deco">✳</span></div><div className="how-card"><div className="how-icon mint">03</div><h3>Send the surprise</h3><p>Copy your unique link and send it to them. Let the happy tears begin.</p><span className="how-deco">↗</span></div></div></div></section>

          <section className="bottom-cta"><div className="cta-spark spark-a">✦</div><div className="cta-spark spark-b">♡</div><span className="eyebrow">THEY DESERVE SOMETHING EXTRA</span><h2>Make their birthday<br/>a little more <em>magical.</em></h2><p>Your first Wishora surprise is just a few clicks away.</p><button className="button button-light button-large" onClick={() => { setActiveStep("relationship"); document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" }); }}>Let’s make their day <ArrowRight size={17}/></button></section>
          <footer className="footer"><a className="brand" href="#"><span className="brand-mark"><Gift size={18}/></span><span>wishora<span className="brand-period">.</span></span></a><span>Made for the moments that matter. <Heart size={13} fill="currentColor"/></span><span className="developer-credit"><strong>Developer &amp; QA</strong> Muhtasim Masum Hasnayen <span>(MASUM)</span></span><span>© 2026 Wishora · A little love goes a long way.</span></footer>
        </>
      )}
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </main>
  );
}

function BirthdayCard({ wish, theme, revealOpen, onReveal, compact = false }: { wish: Wish; theme: Theme; revealOpen: boolean; onReveal: () => void; compact?: boolean }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showReveal = wish.reveal && !revealOpen;

  useEffect(() => {
    setPhotoFailed(false);
  }, [wish.photoUrl]);

  return (
    <div className={`birthday-card ${compact ? "birthday-card-compact" : ""}`} style={{ "--wish-bg": theme.bg, "--wish-accent": theme.accent, "--wish-accent2": theme.accent2, "--wish-text": theme.text } as React.CSSProperties}>
      <div className="wish-decoration wish-decoration-one">✦</div><div className="wish-decoration wish-decoration-two">✧</div><div className="wish-decoration wish-decoration-three">♡</div><div className="wish-decoration wish-decoration-four">✳</div>
      {showReveal ? <div className="reveal-content"><div className="reveal-orbit"><Gift size={compact ? 24 : 32}/><span>✦</span></div><span className="wish-eyebrow">A LITTLE SURPRISE FOR YOU</span><h3>Hey, {wish.recipient || "you"}<br/><em>this is for you.</em></h3><p>Someone made something special just for you.</p><button className="wish-button" onClick={onReveal}>Open your surprise <ArrowRight size={14}/></button><small>Made with ♡, just for you</small></div> :
      <div className="wish-main"><span className="wish-eyebrow">{wish.relationship.toUpperCase()} EDITION · A DAY TO CELEBRATE</span><div className="wish-big-heart">♡</div><h3>Happy Birthday,<br/><em>{wish.recipient || "beautiful soul"}.</em></h3><p className="wish-intro">Today is all about celebrating you.</p>
        {wish.photoUrl && !photoFailed ? <div className="wish-photo"><img src={wish.photoUrl} alt={`${wish.recipient}'s memory`} onError={() => setPhotoFailed(true)}/></div> : <div className="wish-art-photo"><span>{theme.emoji}</span><small>A little moment, a lot of meaning</small></div>}
        <div className="wish-message">{wish.message || "Wishing you a day full of joy, love and beautiful surprises."}</div>
        {wish.memory && <div className="wish-memory"><span>✦ A MEMORY TO KEEP</span><p>“{wish.memory}”</p></div>}
        <div className="wish-signoff"><span>With love,</span><strong>{wish.sender || "Someone who cares"}</strong></div>
        <div className="wish-footer">MADE WITH <Heart size={10} fill="currentColor"/> ON WISHORA</div>
      </div>}
    </div>
  );
}
