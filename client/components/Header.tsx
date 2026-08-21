import { Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { i18n } from "@/services/i18n";

export default function Header() {
  const t = (key: string) => i18n.t(key);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg transition-shadow">
              Ѳ
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">
              Q Pay
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t("nav.features")}
            </Link>
            <Link
              to="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t("nav.pricing")}
            </Link>
            <Link
              to="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t("nav.docs")}
            </Link>
            <Link
              to="/api"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              API
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/dashboard"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {t("nav.dashboard")}
            </Link>
            <Link
              to="/register/sme"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all hover:shadow-lg"
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
