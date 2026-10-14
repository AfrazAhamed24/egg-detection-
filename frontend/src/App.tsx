import { useState, useEffect } from "react"
import {
  Plus,
  X,
  FileText,
  GraduationCap,
  Lightbulb,
  Users,
  Brain,
  Mail,
  ArrowRight,
  Check,
  FolderOpen,
} from "lucide-react"
import ThreeBackground from "./ThreeBackground"

function Instagram(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const s = props.size ?? 16
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

type Category = "All" | "SIH" | "PPT" | "Notes" | "Tools" | "Mindset"

type Resource = {
  id: number
  title: string
  desc: string
  category: Category
  link: string
  type: string
  date: string
  saves: number
}

const INITIAL: Resource[] = [
  { id: 0, title: "Lanezy — My SIH 2025 PPT (PS 25050) — Full PDF + Slides", desc: "SMART TRAFFIC MANAGEMENT SYSTEM FOR URBAN CONGESTION • Team 404 The Optimists • 6 pages: Cover, Lanezy pyramid, Technical Approach, Feasibility, Impact (30-40%), Research + UI/UX. Perfect reference for structure.", category: "PPT", link: "/pdfs/Lanezy_SIH2025_404TheOptimists.pdf", type: "PDF • 6 Slides", date: "Sep 06", saves: 428 },
  { id: 1, title: "SIH PPT Template — 6 Slides That Get Selected", desc: "The exact 6-slide structure I used after my first rejection. Includes Figma + PPT file, fonts & colors.", category: "PPT", link: "https://www.instagram.com/kalaitalkies.in", type: "Google Slides", date: "Sep 02", saves: 342 },
  { id: 2, title: "What is SIH? — First-Year Starter Guide (Tamil + English)", desc: "No jargon. Timeline, eligibility, software vs hardware, prize, and why you should try in 1st year.", category: "SIH", link: "https://www.instagram.com/kalaitalkies.in", type: "Blog + Reel", date: "Sep 04", saves: 210 },
  { id: 3, title: "How to Choose Problem Statement — 4-Filter Checklist", desc: "Don't pick 'easy' PS. Filter by domain fit, data, feasibility & novelty. Notion checklist inside.", category: "SIH", link: "https://www.instagram.com/kalaitalkies.in", type: "Notion", date: "Sep 01", saves: 189 },
  { id: 4, title: "Idea Validation Sheet — 1 Page Before You Lock PS", desc: "3 questions + 1 phone call script to prove your idea is real. Judges love this.", category: "Notes", link: "https://www.instagram.com/kalaitalkies.in", type: "Google Sheet", date: "Aug 28", saves: 124 },
  { id: 5, title: "Git & GitHub Starter Kit for Engg Students", desc: "Daily commit habit, README template, how to push your SIH project and make it your portfolio.", category: "Tools", link: "https://github.com", type: "GitHub", date: "Aug 22", saves: 98 },
  { id: 6, title: "Figma for PPTs — Make Your Slides Look Pro", desc: "5 min tutorial: how I design SIH PPTs in Figma so they don't look like wall of text.", category: "Tools", link: "https://www.instagram.com/kalaitalkies.in", type: "Figma", date: "Aug 20", saves: 76 },
  { id: 7, title: "Growth Mindset Notes — Tamil Engg Student Journey", desc: "Ship > Perfect, Document > Create, Tamil is power. My daily mindset notes.", category: "Mindset", link: "https://www.instagram.com/kalaitalkies.in", type: "Notes", date: "Aug 18", saves: 65 },
  { id: 8, title: "SIH Team Roles — Who You Actually Need (Not Just Friends)", desc: "6 roles: Coder x2, Designer, Research, Presenter, Manager. Notion team tracker included.", category: "SIH", link: "https://www.instagram.com/kalaitalkies.in", type: "Notion", date: "Aug 15", saves: 112 },
]

const CATEGORIES: Category[] = ["All", "SIH", "PPT", "Notes", "Tools", "Mindset"]

export default function App() {
  const [resources, setResources] = useState<Resource[]>(() => {
    try {
      const s = localStorage.getItem("kt_resources_simple")
      if (s) return JSON.parse(s)
    } catch {}
    return INITIAL
  })
  const [showAdd, setShowAdd] = useState(false)
  const [pdfDataUrl] = useState<string | null>(() => {
    try { return localStorage.getItem("kt_lanezy_pdf_dataurl") } catch { return null }
  })
  const [profileImg, setProfileImg] = useState<string | null>(() => {
    try { return localStorage.getItem("kt_profile_img") } catch { return null }
  })
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", desc: "", category: "SIH" as Category, link: "", type: "" })

  useEffect(() => { localStorage.setItem("kt_resources_simple", JSON.stringify(resources)) }, [resources])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.link.trim()) { showToast("Title + Link required da"); return }
    const newR: Resource = {
      id: Date.now(),
      title: form.title.trim(),
      desc: form.desc.trim() || "Shared by Kalai — resource for juniors.",
      category: form.category as Category,
      link: form.link.trim(),
      type: form.type.trim() || "Link",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      saves: 0,
    }
    setResources(prev => [newR, ...prev])
    setForm({ title: "", desc: "", category: "SIH", link: "", type: "" })
    setShowAdd(false)
    showToast("Resource added ✓ Visible instantly")
  }

  return (
    <div className="min-h-screen bg-[#080a14] text-[#111827] relative overflow-hidden">
      <ThreeBackground />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@500;700&display=swap');
      *{font-family:Inter, system-ui, -apple-system, sans-serif}
      .font-serif{font-family:"Instrument Serif", serif}
      .scrollbar-hide{scrollbar-width:none}.scrollbar-hide::-webkit-scrollbar{display:none}
      `}</style>
      <div className="pointer-events-none fixed inset-0 -z-[5] bg-gradient-to-b from-[#080a14]/20 via-transparent to-[#080a14]/60" aria-hidden />

      {/* NAV — glass */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div>
              <div className="font-extrabold tracking-tight leading-none text-[15px]">KALAI TALKS</div>
              <div className="text-[11px] tracking-wide text-[#6B7280] font-medium">X-Zora • Engineering • Innovation</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="inline-flex items-center gap-1.5"><GraduationCap size={14} /> Sharing what I learn</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://www.instagram.com/kalaitalkies.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#E5E2DC] bg-white px-3.5 py-2 text-sm font-semibold hover:bg-[#F3F1EA]"> <Instagram size={16} /> Instagram</a>
          </div>
        </div>
      </nav>

      {/* HERO — minimal */}
      <header className="mx-auto max-w-[1080px] px-4 sm:px-6 pt-8 pb-6">
        <div className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 sm:p-8 flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1D6] border border-[#F2C97D]/50 px-3 py-1 text-xs font-bold tracking-wide text-[#7A4B00]"><FolderOpen size={12} /> RESOURCE HUB • FOR JUNIORS</div>
            <h1 className="mt-3 font-extrabold tracking-tight leading-[0.95] text-[28px] sm:text-[36px]">Resources <span className="font-serif italic font-normal text-[#B45309]">I wish I had</span> when I started.</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280] max-w-[62ch]">I’m <span className="font-bold text-[#111827]">Kalaiyarasu</span> — a <span className="font-semibold text-[#111827]">5× Hackathon Winner, Project Expo Winner, and mentor</span> to aspiring student innovators. I’m the <span className="font-semibold text-[#111827]">CEO of X-Zora</span>, a platform focused on solving real-world challenges faced by engineering students, and the creator of <span className="font-semibold text-[#111827]">KalaiTalks</span>, where I share insights on projects, innovation, and engineering growth.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1EA] border border-[#E5E2DC] px-3 py-1.5 text-xs font-semibold"><Users size={12} /> For SIH juniors</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1EA] border border-[#E5E2DC] px-3 py-1.5 text-xs font-semibold"><FileText size={12} /> PPT • Notes • Tools</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1EA] border border-[#E5E2DC] px-3 py-1.5 text-xs font-semibold"><Brain size={12} /> Tamil + English</span>
            </div>
          </div>
          <div className="lg:w-[320px] shrink-0 grid gap-3">

            <div className="rounded-2xl border border-[#E5E2DC] bg-[#F8F7F3] p-4 flex items-center gap-3">
              <img src="/profile.jpg" alt="Kalaiyarasu" className="h-10 w-10 rounded-full object-cover bg-white border border-[#E5E2DC]" onError={(e) => { (e.target as HTMLImageElement).src = "https://i.pravatar.cc/100?img=15" }} />
              <div className="text-sm">
                <div className="font-bold leading-none">Kalaiyarasu</div>
                <div className="text-[#6B7280] text-xs">5× Hackathon Winner</div>
              </div>
              <a href="https://www.instagram.com/kalaitalkies.in" target="_blank" rel="noreferrer" className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white border border-[#E5E2DC]"><Instagram size={14} /></a>
            </div>
          </div>
        </div>
      </header>

      {/* FEATURED PDF — LANEZY SIH 2025 */}
      <section className="mx-auto max-w-[1080px] px-4 sm:px-6 pb-6">
        <div className="rounded-[24px] border border-white/20 bg-white/90 backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white p-4 sm:p-6 flex flex-col lg:flex-row gap-5 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#7c3aed]/20 via-transparent to-[#06b6d4]/20" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8A83C] px-3 py-1 text-black"><Lightbulb size={12} /> SIH 2025 • FEATURED PROJECT</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-white">PS 25050 • Software • Transportation</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#58D18F] px-2.5 py-1 text-black">Team 92770 • 404 The Optimists</span>
              </div>
              <h2 className="mt-3 font-extrabold tracking-tight leading-none text-[22px] sm:text-[26px]">Lanezy: AI-Powered Adaptive Traffic Control</h2>
              <p className="mt-1.5 text-sm font-medium text-white/70">Revolutionizing India's Roads — Smart signals, priority routing & real-time alerts</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={pdfDataUrl || "/pdfs/Lanezy_SIH2025_404TheOptimists.pdf"} download="Lanezy_SIH2025_404TheOptimists.pdf" className="inline-flex items-center gap-2 rounded-full bg-[#E8A83C] px-6 py-2.5 text-sm font-extrabold text-black hover:bg-[#F2C069] transition"><FileText size={16} /> Download PDF</a>
              </div>


            </div>

          </div>
        </div>
      </section>

      {/* FOOTER — glass */}
      <footer className="mt-6 border-t border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B7280]">
          <div>© 2026 Kalaiyarasu • CEO, X-Zora • Creator, KalaiTalks • <a href="https://www.instagram.com/kalaitalkies.in" target="_blank" rel="noreferrer" className="font-semibold text-[#111827] hover:underline">@kalaitalkies.in</a></div>
          <div className="flex items-center gap-2">
            <a href="https://www.instagram.com/kalaitalkies.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E2DC] bg-[#F8F7F3] px-3 py-1.5 font-semibold text-[#111827]"><Instagram size={14} /> DM for doubts</a>
            <a href="mailto:kalai2007velu@gmail.com" className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E2DC] bg-white px-3 py-1.5 font-semibold"><Mail size={14} /> Email</a>
          </div>
        </div>
      </footer>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div onClick={() => setShowAdd(false)} className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-[520px] rounded-[24px] border border-[#E5E2DC] bg-white shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#F3F1EA]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-3 py-1 text-xs font-bold text-white"><Plus size={12} /> SHARE RESOURCE</div>
                  <h2 className="mt-2 font-extrabold text-xl leading-tight">Add a resource juniors will thank you for</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Link to Drive, Notion, GitHub, Figma, Instagram post — anything useful.</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#E5E2DC] bg-white hover:bg-[#F8F7F3]"><X size={16} /></button>
              </div>
            </div>
            <form onSubmit={handleAdd} className="p-6 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold tracking-widest text-[#6B7280]">TITLE *</span>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., SIH PPT Template — 6 Slides" className="rounded-xl border border-[#E5E2DC] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827] placeholder:text-[#9CA3AF]" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold tracking-widest text-[#6B7280]">DESCRIPTION</span>
                <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={2} placeholder="What will juniors get? One line is enough." className="rounded-xl border border-[#E5E2DC] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827] placeholder:text-[#9CA3AF] resize-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold tracking-widest text-[#6B7280]">CATEGORY</span>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Category })} className="rounded-xl border border-[#E5E2DC] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827]">
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold tracking-widest text-[#6B7280]">TYPE</span>
                  <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="e.g., Notion, Drive, Figma" className="rounded-xl border border-[#E5E2DC] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827] placeholder:text-[#9CA3AF]" />
                </label>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold tracking-widest text-[#6B7280]">LINK *</span>
                <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." className="rounded-xl border border-[#E5E2DC] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#111827] placeholder:text-[#9CA3AF]" />
              </label>
              <button type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] py-3 text-sm font-bold text-white hover:bg-black">Share resource <ArrowRight size={16} /></button>
              <div className="text-center text-xs text-[#9CA3AF]">Saved locally in your browser • Edit by adding more</div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#111827] px-5 py-3 text-sm font-bold text-white shadow-xl flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-black"><Check size={12} /></span> {toast}
        </div>
      )}
    </div>
  )
}
