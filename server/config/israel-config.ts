/**
 * Q Pay - Israel Region Configuration & Localization
 * Hebrew translations and Israel-specific settings
 */

export interface RegionConfig {
  code: string;
  name: string;
  hebrewName: string;
  language: 'en' | 'he';
  currency: string;
  timezone: string;
  locale: string;
  compliance: {
    frameworks: string[];
    regulator: string;
    kyc_required: boolean;
    reporting_requirements: string[];
  };
  bankingHours: {
    open: string;
    close: string;
    daysOpen: string[];
  };
  holidays: string[];
  paymentMethods: {
    primary: string[];
    secondary: string[];
    notSupported: string[];
  };
  taxSettings: {
    vat: number;
    vatApplicable: boolean;
    businessTaxId: string; // Mispar Zihuy Yishuv format
  };
}

export interface HebrewLocalization {
  common: {
    currency: string;
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
  navigation: {
    home: string;
    features: string;
    pricing: string;
    documentation: string;
    dashboard: string;
    logout: string;
  };
  registration: {
    title: string;
    businessName: string;
    businessType: string;
    industry: string;
    country: string;
    companySize: string;
    submit: string;
    step1: string;
    step2: string;
    step3: string;
    businessInfo: string;
    settlementSetup: string;
    contactInfo: string;
    taxId: string; // Mispar Zihuy Yishuv
  };
  payments: {
    title: string;
    amount: string;
    currency: string;
    paymentMethod: string;
    bankTransfer: string;
    bit: string;
    creditCard: string;
    cryptocurrency: string;
    description: string;
    fee: string;
    total: string;
    processing: string;
    completed: string;
    failed: string;
  };
  settlements: {
    title: string;
    frequency: string;
    daily: string;
    weekly: string;
    monthly: string;
    estimatedTime: string;
    bankDetails: string;
    accountNumber: string;
  };
  errors: {
    invalidAmount: string;
    invalidPayment: string;
    networkError: string;
    validationError: string;
    unknownError: string;
    insufficientFunds: string;
    invalidPaymentMethod: string;
  };
  messages: {
    registrationSuccess: string;
    paymentPending: string;
    paymentCompleted: string;
    settlementScheduled: string;
    welcome: string;
  };
  support: {
    email: string;
    phone: string;
    hours: string;
    faq: string;
    documentation: string;
    contact: string;
  };
}

// Israel Region Configuration
export const israelConfig: RegionConfig = {
  code: 'IL',
  name: 'Israel',
  hebrewName: 'ישראל',
  language: 'he',
  currency: 'ILS',
  timezone: 'Asia/Jerusalem',
  locale: 'he-IL',
  compliance: {
    frameworks: ['PCI-DSS', 'GDPR', 'Israeli Privacy Law', 'Bank of Israel Regulations'],
    regulator: 'Bank of Israel (בנק ישראל)',
    kyc_required: true,
    reporting_requirements: [
      'Tax Authority (Misrad HaMisim)',
      'Money Laundering Report (PISA)',
      'Transaction Reporting over 100,000 ILS',
      'Annual Compliance Report',
    ],
  },
  bankingHours: {
    open: '08:00',
    close: '17:00',
    daysOpen: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  },
  holidays: [
    '2024-04-22', // Passover Seder
    '2024-04-23', // Passover
    '2024-04-29', // Passover
    '2024-05-14', // Independence Day
    '2024-06-12', // Shavuot
    '2024-10-03', // Rosh Hashanah
    '2024-10-12', // Yom Kippur
    '2024-10-17', // Sukkot
    '2024-10-24', // Simchat Torah
  ],
  paymentMethods: {
    primary: ['bank_transfer', 'bit', 'credit_card'],
    secondary: ['crypto', 'international_wire'],
    notSupported: ['check', 'cash_on_delivery'],
  },
  taxSettings: {
    vat: 0.17, // 17% VAT
    vatApplicable: true,
    businessTaxId: 'IL_MISPAR_ZIHUY_YISHUV', // Format: XXXXXXXXX
  },
};

// Hebrew Localization Strings
export const hebrewTranslations: HebrewLocalization = {
  common: {
    currency: 'שקל ישראלי (ILS)',
    language: 'עברית',
    timezone: 'שעון ישראל (Asia/Jerusalem)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
  },

  navigation: {
    home: 'בעמוד הבית',
    features: 'תכונות',
    pricing: 'תמחור',
    documentation: 'תיעוד',
    dashboard: 'לוח הבקרה',
    logout: 'התנתקות',
  },

  registration: {
    title: 'רישום עסק חדש',
    businessName: 'שם העסק',
    businessType: 'סוג העסק',
    industry: 'תעשייה',
    country: 'מדינה',
    companySize: 'גודל החברה',
    submit: 'שלח',
    step1: 'מידע על העסק',
    step2: 'הגדרת יישוב',
    step3: 'מידע התקשורת',
    businessInfo: 'מיד על העסק שלך',
    settlementSetup: 'העדפות יישוב',
    contactInfo: 'מידע יצירת קשר',
    taxId: 'מספר זיהוי יישוב (מס"ז)',
  },

  payments: {
    title: 'תשלומים',
    amount: 'סכום',
    currency: 'מטבע',
    paymentMethod: 'שיטת תשלום',
    bankTransfer: 'העברה בנקאית',
    bit: 'ביט (Bit)',
    creditCard: 'כרטיס אשראי',
    cryptocurrency: 'קריפטוגרפיה',
    description: 'תיאור',
    fee: 'עמלה',
    total: 'סה"כ',
    processing: 'בעיבוד',
    completed: 'הושלם',
    failed: 'נכשל',
  },

  settlements: {
    title: 'יישובים',
    frequency: 'תדירות יישוב',
    daily: 'יומי',
    weekly: 'שבועי',
    monthly: 'חודשי',
    estimatedTime: 'זמן משוער',
    bankDetails: 'פרטי בנק',
    accountNumber: 'מספר חשבון',
  },

  errors: {
    invalidAmount: 'סכום לא חוקי',
    invalidPayment: 'תשלום לא תקין',
    networkError: 'שגיאת רשת',
    validationError: 'שגיאת אימות',
    unknownError: 'שגיאה לא ידועה',
    insufficientFunds: 'אין מספיק כספים',
    invalidPaymentMethod: 'שיטת תשלום לא תקינה',
  },

  messages: {
    registrationSuccess: 'ההרשמה הושלמה בהצלחה!',
    paymentPending: 'התשלום בעיבוד',
    paymentCompleted: 'התשלום הושלם בהצלחה',
    settlementScheduled: 'היישוב תוזמן',
    welcome: 'ברוכים הבאים ל-Q Pay',
  },

  support: {
    email: 'support@qpay.io',
    phone: '+972-XX-XXX-XXXX',
    hours: 'ראשון - חמישי: 08:00 - 17:00 (שעון ישראל)',
    faq: 'שאלות נפוצות',
    documentation: 'תיעוד',
    contact: 'צור קשר',
  },
};

// Company Size Configurations
export const companySizeConfig = {
  small: {
    label: 'Small (עסק קטן)',
    range: '1-50 employees',
    monthlyFeeLimit: 500, // 500 ILS
    transactionFee: 0.025, // 2.5%
    cryptoFee: 0.0, // 0% on crypto
    monthlyVolume: 25000, // 25,000 ILS
    supportTier: 'email',
    features: [
      'בדיקת תשלום בזמן אמת',
      'דוחות בסיסיים',
      'תמיכה בדוא"ל',
      'יישוב יומי',
      'תמיכה בקריפטו',
    ],
  },
  medium: {
    label: 'Medium (עסק בינוני)',
    range: '51-500 employees',
    monthlyFeeLimit: 1500, // 1,500 ILS
    transactionFee: 0.015, // 1.5%
    cryptoFee: 0.0, // 0% on crypto
    monthlyVolume: null, // Unlimited
    supportTier: 'phone',
    features: [
      'בדיקת תשלום בזמן אמת',
      'דוחות מתקדמים',
      'תמיכה בטלפון',
      'יישוב חד יומי',
      'API ו-Webhook',
      'Webhook integrations',
      'מנהל חשבון',
    ],
  },
  large: {
    label: 'Large (עסק גדול)',
    range: '500+ employees',
    monthlyFeeLimit: 5000, // 5,000 ILS
    transactionFee: 0.005, // 0.5%
    cryptoFee: 0.0, // 0% on crypto
    monthlyVolume: null, // Unlimited
    supportTier: '24/7',
    features: [
      'בדיקת תשלום בזמן אמת',
      'דוחות מאובטחים',
      'תמיכה 24/7',
      'יישוב מיידי',
      'API מותאם אישית',
      'פתרונות לבן תווית',
      'צוות ייעודי',
      'ניתוחי AI',
    ],
  },
};

// Bank Integration Settings (Israel)
export const israeliBankSettings = {
  bankHolidaysAffectSettlement: true,
  minimumTransferAmount: 100, // 100 ILS
  maximumDailyTransfer: 1000000, // 1,000,000 ILS
  requiredDocuments: [
    'תעודות רישום עסק',
    'תעודות מס',
    'מסמכי זהות',
  ],
};

// Regulatory Configuration
export const israeliRegulatoryConfig = {
  requiredReports: [
    {
      name: 'Money Laundering Report (דוח הלבנת הון)',
      frequency: 'Quarterly',
      threshold: 100000, // 100,000 ILS
    },
    {
      name: 'Tax Report (דוח מס)',
      frequency: 'Annually',
      threshold: 0,
    },
    {
      name: 'Bank Authority Compliance (דוח בנק ישראל)',
      frequency: 'Monthly',
      threshold: 0,
    },
  ],
  kyc_requirements: {
    individual: ['ID number', 'Address proof', 'Phone number'],
    business: ['Tax ID (Mispar Zihuy Yishuv)', 'Business registration', 'Beneficial owners'],
  },
  dataResidency: 'Israel', // Store sensitive data in Israel
  encryption: 'AES-256-GCM',
  backupLocation: 'EU (GDPR Compliant)',
};

// Get config by region
export function getRegionConfig(regionCode: string): RegionConfig | null {
  if (regionCode === 'IL') {
    return israelConfig;
  }
  return null;
}

// Get translations by region
export function getTranslations(regionCode: string, language: string) {
  if (regionCode === 'IL' && language === 'he') {
    return hebrewTranslations;
  }
  // Default to English
  return null;
}

// Format currency for region
export function formatCurrency(amount: number, regionCode: string): string {
  if (regionCode === 'IL') {
    return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
  }
  return `${amount.toLocaleString()}`;
}

// Format date for region
export function formatDate(date: Date, regionCode: string): string {
  if (regionCode === 'IL') {
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString();
}

// Check if it's a banking holiday in Israel
export function isIsraeliBankingHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return israelConfig.holidays.includes(dateString);
}

// Get settlement date (accounting for bank holidays and hours)
export function getIsraeliSettlementDate(
  baseDate: Date,
  frequencyDays: number
): Date {
  let currentDate = new Date(baseDate);

  for (let i = 0; i < frequencyDays; i++) {
    currentDate.setDate(currentDate.getDate() + 1);

    // Skip weekends (Friday and Saturday)
    while (currentDate.getDay() === 5 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Skip bank holidays
    if (isIsraeliBankingHoliday(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return currentDate;
}
