/**
 * Internationalization Service
 * Support for Hebrew and English with automatic detection
 */

export type Language = "en" | "he";

export interface TranslationKeys {
  [key: string]: {
    en: string;
    he: string;
  };
}

const translations: TranslationKeys = {
  // Navigation
  "nav.home": { en: "Home", he: "בית" },
  "nav.features": { en: "Features", he: "תכונות" },
  "nav.pricing": { en: "Pricing", he: "תמחור" },
  "nav.docs": { en: "Documentation", he: "תיעוד" },
  "nav.api": { en: "API", he: "API" },
  "nav.dashboard": { en: "Dashboard", he: "לוח בקרה" },
  "nav.getStarted": { en: "Get Started", he: "בואו נתחיל" },

  // Common actions
  "action.create": { en: "Create", he: "יצור" },
  "action.edit": { en: "Edit", he: "ערוך" },
  "action.delete": { en: "Delete", he: "מחק" },
  "action.save": { en: "Save", he: "שמור" },
  "action.cancel": { en: "Cancel", he: "בטל" },
  "action.download": { en: "Download", he: "הורד" },
  "action.upload": { en: "Upload", he: "העלה" },
  "action.export": { en: "Export", he: "ייצא" },
  "action.import": { en: "Import", he: "ייבא" },
  "action.search": { en: "Search", he: "חפש" },
  "action.filter": { en: "Filter", he: "סנן" },
  "action.submit": { en: "Submit", he: "שלח" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", he: "לוח בקרה" },
  "dashboard.welcome": { en: "Welcome to your QPay dashboard", he: "ברוכים הבאים ללוח הבקרה של QPay" },
  "dashboard.totalRevenue": { en: "Total Revenue", he: "סה\"כ הכנסות" },
  "dashboard.transactions": { en: "Transactions", he: "עסקאות" },
  "dashboard.activeCustomers": { en: "Active Customers", he: "לקוחות פעילים" },
  "dashboard.nextSettlement": { en: "Next Settlement", he: "התיישבות הבאה" },

  // Admin
  "admin.title": { en: "Admin Dashboard", he: "לוח בקרה מנהל" },
  "admin.systemHealth": { en: "System Health", he: "בריאות המערכת" },
  "admin.uptime": { en: "Uptime", he: "זמן הפעילות" },
  "admin.users": { en: "Users", he: "משתמשים" },
  "admin.kycQueue": { en: "KYC Queue", he: "תור KYC" },

  // Payments
  "payment.title": { en: "Payments", he: "תשלומים" },
  "payment.amount": { en: "Amount", he: "סכום" },
  "payment.currency": { en: "Currency", he: "מטבע" },
  "payment.method": { en: "Payment Method", he: "שיטת תשלום" },
  "payment.status": { en: "Status", he: "סטטוס" },
  "payment.successful": { en: "Successful", he: "הצליח" },
  "payment.failed": { en: "Failed", he: "נכשל" },
  "payment.pending": { en: "Pending", he: "בתהליך" },

  // Settlement
  "settlement.title": { en: "Settlements", he: "התיישבויות" },
  "settlement.date": { en: "Settlement Date", he: "תאריך התיישבות" },
  "settlement.amount": { en: "Amount", he: "סכום" },
  "settlement.status": { en: "Status", he: "סטטוס" },
  "settlement.completed": { en: "Completed", he: "הושלם" },
  "settlement.processing": { en: "Processing", he: "בעיבוד" },

  // API Keys
  "apikey.title": { en: "API Keys", he: "מפתחות API" },
  "apikey.generate": { en: "Generate Key", he: "צור מפתח" },
  "apikey.name": { en: "Key Name", he: "שם המפתח" },
  "apikey.permissions": { en: "Permissions", he: "הרשאות" },
  "apikey.rateLimit": { en: "Rate Limit", he: "מגבלת קצב" },
  "apikey.created": { en: "Created", he: "נוצר" },
  "apikey.lastUsed": { en: "Last Used", he: "שימוש אחרון" },

  // Webhooks
  "webhook.title": { en: "Webhooks", he: "Webhooks" },
  "webhook.url": { en: "Webhook URL", he: "URL של Webhook" },
  "webhook.events": { en: "Events", he: "אירועים" },
  "webhook.status": { en: "Status", he: "סטטוס" },
  "webhook.test": { en: "Test", he: "בדוק" },

  // Reports
  "report.title": { en: "Reports", he: "דוחות" },
  "report.create": { en: "Create Report", he: "צור דוח" },
  "report.type": { en: "Report Type", he: "סוג דוח" },
  "report.dateRange": { en: "Date Range", he: "טווח תאריכים" },
  "report.export": { en: "Export", he: "ייצא" },
  "report.csv": { en: "Download as CSV", he: "הורד כ-CSV" },
  "report.pdf": { en: "Download as PDF", he: "הורד כ-PDF" },

  // KYC
  "kyc.title": { en: "KYC Verification", he: "אימות KYC" },
  "kyc.status": { en: "KYC Status", he: "סטטוס KYC" },
  "kyc.verified": { en: "Verified", he: "מאומת" },
  "kyc.pending": { en: "Pending", he: "בתהליך" },
  "kyc.rejected": { en: "Rejected", he: "דחוי" },

  // Disputes
  "dispute.title": { en: "Disputes", he: "סכסוכים" },
  "dispute.filed": { en: "Dispute Filed", he: "סכסוך הוגש" },
  "dispute.reason": { en: "Reason", he: "סיבה" },
  "dispute.resolution": { en: "Resolution", he: "פתרון" },

  // 2FA
  "2fa.title": { en: "Two-Factor Authentication", he: "אימות דו-שלבי" },
  "2fa.method": { en: "Authentication Method", he: "שיטת אימות" },
  "2fa.sms": { en: "SMS", he: "SMS" },
  "2fa.email": { en: "Email", he: "דוא\"ל" },
  "2fa.authenticator": { en: "Authenticator App", he: "אפליקציית אימות" },
  "2fa.code": { en: "Verification Code", he: "קוד אימות" },

  // Settings
  "settings.title": { en: "Settings", he: "הגדרות" },
  "settings.language": { en: "Language", he: "שפה" },
  "settings.timezone": { en: "Timezone", he: "אזור זמן" },
  "settings.currency": { en: "Currency", he: "מטבע" },
  "settings.notifications": { en: "Notifications", he: "הודעות" },
  "settings.security": { en: "Security", he: "אבטחה" },

  // Messages
  "msg.success": { en: "Success", he: "הצלחה" },
  "msg.error": { en: "Error", he: "שגיאה" },
  "msg.warning": { en: "Warning", he: "אזהרה" },
  "msg.info": { en: "Information", he: "מידע" },
  "msg.loading": { en: "Loading...", he: "טוען..." },
  "msg.noData": { en: "No data available", he: "אין נתונים זמינים" },

  // Auth
  "auth.login": { en: "Login", he: "התחברות" },
  "auth.logout": { en: "Logout", he: "התנתקות" },
  "auth.email": { en: "Email", he: "דוא\"ל" },
  "auth.password": { en: "Password", he: "סיסמה" },
  "auth.register": { en: "Register", he: "הרשמה" },
  "auth.forgotPassword": { en: "Forgot Password?", he: "שכחת סיסמה?" },

  // Billing
  "billing.plan": { en: "Plan", he: "תוכנית" },
  "billing.price": { en: "Price", he: "מחיר" },
  "billing.upgrade": { en: "Upgrade", he: "שדרג" },
  "billing.downgrade": { en: "Downgrade", he: "דרג למטה" },
  "billing.monthly": { en: "Monthly", he: "חודשי" },
  "billing.annually": { en: "Annually", he: "שנתי" },
};

export class I18nService {
  private currentLanguage: Language = this.detectLanguage();

  /**
   * Detect user language from browser
   */
  private detectLanguage(): Language {
    if (typeof window === "undefined") return "en";

    // Check localStorage
    const stored = localStorage.getItem("preferred_language");
    if (stored === "he" || stored === "en") return stored;

    // Check browser language
    const browserLang = navigator.language || navigator.languages?.[0];
    if (browserLang?.startsWith("he")) return "he";

    return "en";
  }

  /**
   * Set current language
   */
  setLanguage(language: Language) {
    this.currentLanguage = language;
    localStorage.setItem("preferred_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get translated string
   */
  t(key: string): string {
    const parts = translations[key];
    if (!parts) {
      console.warn(`Translation missing: ${key}`);
      return key;
    }
    return parts[this.currentLanguage];
  }

  /**
   * Get translated string with replacements
   */
  tReplace(key: string, replacements: Record<string, string>): string {
    let text = this.t(key);
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{{${placeholder}}}`, value);
    });
    return text;
  }

  /**
   * Get all translations for a language
   */
  getAllTranslations(language: Language): Record<string, string> {
    const result: Record<string, string> = {};
    Object.entries(translations).forEach(([key, values]) => {
      result[key] = values[language];
    });
    return result;
  }

  /**
   * Add custom translations
   */
  addTranslations(newTranslations: TranslationKeys) {
    Object.assign(translations, newTranslations);
  }
}

// Create singleton instance
export const i18n = new I18nService();

// Initialize on app load
if (typeof window !== "undefined") {
  const lang = i18n.getCurrentLanguage();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
}
