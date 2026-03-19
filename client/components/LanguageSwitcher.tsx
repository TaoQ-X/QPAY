import { useState } from "react";
import { Globe } from "lucide-react";
import { i18n } from "@/services/i18n";

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = i18n.getCurrentLanguage();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "he", name: "עברית", flag: "🇮🇱" },
  ];

  const handleLanguageChange = (lang: "en" | "he") => {
    i18n.setLanguage(lang);
    setIsOpen(false);
    // Trigger re-render by reloading or using state update
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
        title="Change Language"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang === "en" ? "EN" : "עב"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code as "en" | "he")}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 transition ${
                currentLang === lang.code ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang === lang.code && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
