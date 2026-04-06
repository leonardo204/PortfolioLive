export function Footer() {
  return (
    <footer className="w-full py-10 bg-[#f1f4f7] mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Copyright */}
        <span className="text-xs tracking-widest uppercase text-[#586065]/70 font-medium">
          &copy; 2026 이용섭. Built with precision.
        </span>

        <div className="flex items-center gap-6">
          {/* Social Links */}
          <a
            href="https://github.com/leeyongsub7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-widest text-[#0053db] hover:text-[#0048c1] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-widest text-[#0053db] hover:text-[#0048c1] transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="mailto:leeyongsub7@gmail.com"
            className="text-xs font-bold uppercase tracking-widest text-[#0053db] hover:text-[#0048c1] transition-colors"
          >
            Email
          </a>

          {/* Admin — 눈에 띄지 않게 */}
          <a
            href="/admin"
            className="text-xs text-[#abb3b9] hover:text-[#586065] transition-colors"
          >
            admin
          </a>
        </div>
      </div>
    </footer>
  )
}
