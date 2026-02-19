// White-Label Solutions for Q Pay
// Complete customization and branding for partners

export interface WhiteLabelBranding {
  partnerId: string;
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string; // Hex color
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCSS: string;
  emailTemplates: Map<string, EmailTemplate>;
  customDomains: string[];
  customSubdomain?: string;
  displayName: string;
  supportEmail: string;
  supportPhone?: string;
  supportWebsite?: string;
  legalCompanyName: string;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  type: "payment_confirmation" | "receipt" | "invoice" | "settlement" | "dispute" | "alert";
}

export interface WhiteLabelCheckoutConfig {
  partnerId: string;
  logoPosition: "top_left" | "top_center" | "top_right" | "hidden";
  showPoweredBy: boolean;
  customHeaderText?: string;
  customFooterText?: string;
  supportedPaymentMethods: string[];
  defaultPaymentMethod?: string;
  theme: "light" | "dark" | "custom";
  customCSSClass?: string;
  redirectAfterPayment: boolean;
  redirectUrl?: string;
  showOrderSummary: boolean;
  showShippingAddress: boolean;
  requireShippingAddress: boolean;
  termsUrl?: string;
  privacyUrl?: string;
  refundPolicyUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelDashboard {
  partnerId: string;
  menuStructure: DashboardMenu[];
  customReports: DashboardReport[];
  defaultCharts: string[];
  hideQPayBranding: boolean;
  customMetrics: CustomMetric[];
  themeSettings: ThemeSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMenu {
  id: string;
  label: string;
  icon: string;
  path: string;
  submenu?: DashboardMenu[];
  hidden: boolean;
  order: number;
}

export interface DashboardReport {
  id: string;
  name: string;
  type: "transactions" | "revenue" | "customers" | "performance" | "custom";
  metrics: string[];
  frequency: "daily" | "weekly" | "monthly" | "custom";
  recipients: string[];
  enabled: boolean;
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  displayFormat: "number" | "currency" | "percentage" | "chart";
  refreshInterval: number; // minutes
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  buttonStyle: "rounded" | "square" | "pill";
  fontFamily: string;
  fontSize: number;
}

export interface WhiteLabelAPIConfig {
  partnerId: string;
  customApiBaseUrl: string;
  apiVersion: string;
  enabledEndpoints: string[];
  rateLimit: number; // requests per minute
  webHookSecret: string;
  ipWhitelist: string[];
  enableIPWhitelist: boolean;
  customHeaders: Map<string, string>;
  authentication: "api_key" | "oauth2" | "jwt";
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelIntegration {
  partnerId: string;
  integrationType: "accounting" | "crm" | "erp" | "pos" | "ecommerce" | "custom";
  integrationName: string;
  configuration: Record<string, unknown>;
  webhookUrl: string;
  isActive: boolean;
  lastSyncDate?: Date;
  syncFrequency: "realtime" | "hourly" | "daily" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelPartnerConfig {
  partnerId: string;
  partnerName: string;
  partnerType: "agency" | "fintech" | "enterprise" | "saas" | "marketplace";
  status: "active" | "inactive" | "suspended" | "trial";
  tier: "starter" | "professional" | "enterprise" | "custom";
  contractEndDate: Date;
  supportTier: "standard" | "priority" | "24x7";
  branding: WhiteLabelBranding;
  checkoutConfig: WhiteLabelCheckoutConfig;
  dashboardConfig: WhiteLabelDashboard;
  apiConfig: WhiteLabelAPIConfig;
  customizations: CustomizationLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomizationLog {
  id: string;
  type: string;
  description: string;
  changedBy: string;
  changeDate: Date;
  details: Record<string, unknown>;
}

// ============= White-Label Branding Manager =============

export class WhiteLabelBrandingManager {
  private brandings: Map<string, WhiteLabelBranding> = new Map();

  createBranding(config: {
    partnerId: string;
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    supportEmail: string;
    legalCompanyName: string;
    address: Address;
  }): WhiteLabelBranding {
    const branding: WhiteLabelBranding = {
      partnerId: config.partnerId,
      companyName: config.companyName,
      logoUrl: config.logoUrl,
      faviconUrl: "",
      primaryColor: config.primaryColor,
      secondaryColor: this.generateComplementaryColor(config.primaryColor),
      accentColor: this.generateAccentColor(config.primaryColor),
      fontFamily: "Inter, sans-serif",
      customCSS: "",
      emailTemplates: new Map(),
      customDomains: [],
      displayName: config.companyName,
      supportEmail: config.supportEmail,
      legalCompanyName: config.legalCompanyName,
      address: config.address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.initializeEmailTemplates(branding);
    this.brandings.set(config.partnerId, branding);
    return branding;
  }

  private initializeEmailTemplates(branding: WhiteLabelBranding): void {
    const templates: EmailTemplate[] = [
      {
        id: "payment_confirmation",
        name: "Payment Confirmation",
        subject: `Payment Confirmation from ${branding.companyName}`,
        htmlBody: `
          <h1>Payment Confirmed</h1>
          <p>Thank you for your payment to {{merchant_name}}.</p>
          <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
          <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p>If you have any questions, contact us at {{support_email}}</p>
        `,
        textBody: `Payment Confirmed\n\nAmount: {{amount}} {{currency}}\nTransaction ID: {{transaction_id}}\nDate: {{date}}`,
        variables: ["amount", "currency", "transaction_id", "date", "merchant_name", "support_email"],
        type: "payment_confirmation",
      },
      {
        id: "receipt",
        name: "Receipt",
        subject: `Receipt from ${branding.companyName}`,
        htmlBody: `
          <h1>Receipt</h1>
          <p>Your receipt for transaction {{transaction_id}}</p>
          <p><strong>Items:</strong></p>
          <ul>{{items_list}}</ul>
          <p><strong>Total:</strong> {{total_amount}} {{currency}}</p>
        `,
        textBody: `Receipt\n\nTransaction ID: {{transaction_id}}\nTotal: {{total_amount}} {{currency}}`,
        variables: ["transaction_id", "items_list", "total_amount", "currency"],
        type: "receipt",
      },
      {
        id: "invoice",
        name: "Invoice",
        subject: `Invoice from ${branding.companyName}`,
        htmlBody: `
          <h1>Invoice</h1>
          <p>Invoice #{{invoice_number}} dated {{invoice_date}}</p>
          <p><strong>Due Date:</strong> {{due_date}}</p>
          <p><strong>Total Amount Due:</strong> {{total_amount}} {{currency}}</p>
        `,
        textBody: `Invoice\n\nInvoice #: {{invoice_number}}\nDue Date: {{due_date}}\nTotal: {{total_amount}} {{currency}}`,
        variables: ["invoice_number", "invoice_date", "due_date", "total_amount", "currency"],
        type: "invoice",
      },
    ];

    templates.forEach((template) => {
      branding.emailTemplates.set(template.id, template);
    });
  }

  private generateComplementaryColor(hexColor: string): string {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;

    const comp = (255 - r).toString(16).padStart(2, "0") +
                 (255 - g).toString(16).padStart(2, "0") +
                 (255 - b).toString(16).padStart(2, "0");

    return `#${comp}`;
  }

  private generateAccentColor(hexColor: string): string {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = Math.min(255, ((rgb >> 16) & 255) + 30);
    const g = Math.min(255, ((rgb >> 8) & 255) + 30);
    const b = Math.min(255, (rgb & 255) + 30);

    const accent = r.toString(16).padStart(2, "0") +
                   g.toString(16).padStart(2, "0") +
                   b.toString(16).padStart(2, "0");

    return `#${accent}`;
  }

  getBranding(partnerId: string): WhiteLabelBranding | null {
    return this.brandings.get(partnerId) || null;
  }

  updateBranding(partnerId: string, updates: Partial<WhiteLabelBranding>): boolean {
    const branding = this.brandings.get(partnerId);
    if (!branding) return false;

    Object.assign(branding, updates, {
      updatedAt: new Date(),
    });

    return true;
  }

  addCustomDomain(partnerId: string, domain: string): boolean {
    const branding = this.brandings.get(partnerId);
    if (!branding) return false;

    if (!branding.customDomains.includes(domain)) {
      branding.customDomains.push(domain);
      branding.updatedAt = new Date();
    }

    return true;
  }

  updateEmailTemplate(partnerId: string, templateId: string, template: Partial<EmailTemplate>): boolean {
    const branding = this.brandings.get(partnerId);
    if (!branding) return false;

    const existing = branding.emailTemplates.get(templateId);
    if (!existing) return false;

    Object.assign(existing, template);
    branding.updatedAt = new Date();

    return true;
  }
}

// ============= White-Label Checkout Manager =============

export class WhiteLabelCheckoutManager {
  private checkoutConfigs: Map<string, WhiteLabelCheckoutConfig> = new Map();

  createCheckoutConfig(
    partnerId: string,
    config: Partial<WhiteLabelCheckoutConfig>
  ): WhiteLabelCheckoutConfig {
    const checkoutConfig: WhiteLabelCheckoutConfig = {
      partnerId,
      logoPosition: config.logoPosition || "top_left",
      showPoweredBy: config.showPoweredBy ?? true,
      customHeaderText: config.customHeaderText,
      customFooterText: config.customFooterText,
      supportedPaymentMethods: config.supportedPaymentMethods || [
        "card",
        "apple_pay",
        "google_pay",
      ],
      defaultPaymentMethod: config.defaultPaymentMethod,
      theme: config.theme || "light",
      customCSSClass: config.customCSSClass,
      redirectAfterPayment: config.redirectAfterPayment ?? false,
      redirectUrl: config.redirectUrl,
      showOrderSummary: config.showOrderSummary ?? true,
      showShippingAddress: config.showShippingAddress ?? true,
      requireShippingAddress: config.requireShippingAddress ?? false,
      termsUrl: config.termsUrl,
      privacyUrl: config.privacyUrl,
      refundPolicyUrl: config.refundPolicyUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.checkoutConfigs.set(partnerId, checkoutConfig);
    return checkoutConfig;
  }

  getCheckoutConfig(partnerId: string): WhiteLabelCheckoutConfig | null {
    return this.checkoutConfigs.get(partnerId) || null;
  }

  generateCheckoutHTML(partnerId: string): string {
    const config = this.checkoutConfigs.get(partnerId);
    if (!config) return "";

    const logoDisplay = config.logoPosition !== "hidden"
      ? `<div class="checkout-logo ${config.logoPosition}"><img src="{{logo_url}}" alt="Logo" /></div>`
      : "";

    const poweredByDisplay = config.showPoweredBy
      ? `<div class="powered-by">Powered by Q Pay</div>`
      : "";

    return `
      <div class="qpay-checkout ${config.theme}">
        ${logoDisplay}
        ${config.customHeaderText ? `<div class="checkout-header">${config.customHeaderText}</div>` : ""}
        <div class="checkout-container">
          ${config.showOrderSummary ? "<div class='order-summary'>{{order_summary}}</div>" : ""}
          <div class="payment-methods">
            ${config.supportedPaymentMethods.map((method) => `<div class="payment-method" data-method="${method}">{{${method}_widget}}</div>`).join("")}
          </div>
        </div>
        ${config.customFooterText ? `<div class="checkout-footer">${config.customFooterText}</div>` : ""}
        ${poweredByDisplay}
      </div>
    `;
  }
}

// ============= White-Label Dashboard Manager =============

export class WhiteLabelDashboardManager {
  private dashboardConfigs: Map<string, WhiteLabelDashboard> = new Map();

  createDashboard(partnerId: string): WhiteLabelDashboard {
    const dashboard: WhiteLabelDashboard = {
      partnerId,
      menuStructure: this.getDefaultMenuStructure(),
      customReports: [],
      defaultCharts: ["revenue", "transactions", "payment_methods", "chargebacks"],
      hideQPayBranding: true,
      customMetrics: [],
      themeSettings: {
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        accentColor: "#007bff",
        textColor: "#333333",
        backgroundColor: "#f5f5f5",
        borderColor: "#dddddd",
        buttonStyle: "rounded",
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboardConfigs.set(partnerId, dashboard);
    return dashboard;
  }

  private getDefaultMenuStructure(): DashboardMenu[] {
    return [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "grid",
        path: "/dashboard",
        hidden: false,
        order: 1,
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: "activity",
        path: "/transactions",
        hidden: false,
        order: 2,
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "bar-chart",
        path: "/analytics",
        hidden: false,
        order: 3,
      },
      {
        id: "reports",
        label: "Reports",
        icon: "document",
        path: "/reports",
        hidden: false,
        order: 4,
      },
      {
        id: "customers",
        label: "Customers",
        icon: "users",
        path: "/customers",
        hidden: false,
        order: 5,
      },
      {
        id: "settings",
        label: "Settings",
        icon: "settings",
        path: "/settings",
        hidden: false,
        order: 6,
      },
    ];
  }

  getDashboard(partnerId: string): WhiteLabelDashboard | null {
    return this.dashboardConfigs.get(partnerId) || null;
  }

  addCustomReport(partnerId: string, report: DashboardReport): boolean {
    const dashboard = this.dashboardConfigs.get(partnerId);
    if (!dashboard) return false;

    dashboard.customReports.push(report);
    dashboard.updatedAt = new Date();

    return true;
  }

  addCustomMetric(partnerId: string, metric: CustomMetric): boolean {
    const dashboard = this.dashboardConfigs.get(partnerId);
    if (!dashboard) return false;

    dashboard.customMetrics.push(metric);
    dashboard.updatedAt = new Date();

    return true;
  }

  updateTheme(partnerId: string, theme: Partial<ThemeSettings>): boolean {
    const dashboard = this.dashboardConfigs.get(partnerId);
    if (!dashboard) return false;

    Object.assign(dashboard.themeSettings, theme);
    dashboard.updatedAt = new Date();

    return true;
  }
}

// ============= White-Label Partner Manager =============

export class WhiteLabelPartnerManager {
  private partners: Map<string, WhiteLabelPartnerConfig> = new Map();
  private brandingManager: WhiteLabelBrandingManager;
  private checkoutManager: WhiteLabelCheckoutManager;
  private dashboardManager: WhiteLabelDashboardManager;

  constructor() {
    this.brandingManager = new WhiteLabelBrandingManager();
    this.checkoutManager = new WhiteLabelCheckoutManager();
    this.dashboardManager = new WhiteLabelDashboardManager();
  }

  createPartnerConfig(config: {
    partnerId: string;
    partnerName: string;
    partnerType: "agency" | "fintech" | "enterprise" | "saas" | "marketplace";
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    supportEmail: string;
    legalCompanyName: string;
    address: Address;
  }): WhiteLabelPartnerConfig {
    const branding = this.brandingManager.createBranding({
      partnerId: config.partnerId,
      companyName: config.companyName,
      logoUrl: config.logoUrl,
      primaryColor: config.primaryColor,
      supportEmail: config.supportEmail,
      legalCompanyName: config.legalCompanyName,
      address: config.address,
    });

    const checkoutConfig = this.checkoutManager.createCheckoutConfig(
      config.partnerId,
      {
        logoPosition: "top_center",
        showPoweredBy: false,
        theme: "custom",
      }
    );

    const dashboardConfig = this.dashboardManager.createDashboard(
      config.partnerId
    );

    const partnerConfig: WhiteLabelPartnerConfig = {
      partnerId: config.partnerId,
      partnerName: config.partnerName,
      partnerType: config.partnerType,
      status: "active",
      tier: "starter",
      contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      supportTier: "standard",
      branding,
      checkoutConfig,
      dashboardConfig,
      apiConfig: {
        partnerId: config.partnerId,
        customApiBaseUrl: `https://api.${config.partnerName.toLowerCase()}.qpay.io`,
        apiVersion: "v1",
        enabledEndpoints: ["payments", "settlements", "reports", "webhooks"],
        rateLimit: 1000,
        webHookSecret: `sk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`,
        ipWhitelist: [],
        enableIPWhitelist: false,
        customHeaders: new Map(),
        authentication: "api_key",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      customizations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.partners.set(config.partnerId, partnerConfig);
    return partnerConfig;
  }

  getPartnerConfig(partnerId: string): WhiteLabelPartnerConfig | null {
    return this.partners.get(partnerId) || null;
  }

  logCustomization(
    partnerId: string,
    type: string,
    description: string,
    changedBy: string,
    details: Record<string, unknown>
  ): boolean {
    const partner = this.partners.get(partnerId);
    if (!partner) return false;

    partner.customizations.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      changedBy,
      changeDate: new Date(),
      details,
    });

    partner.updatedAt = new Date();
    return true;
  }

  upgradeTier(partnerId: string, newTier: "starter" | "professional" | "enterprise" | "custom"): boolean {
    const partner = this.partners.get(partnerId);
    if (!partner) return false;

    const tierUpgrades: Record<string, number> = {
      starter: 100,
      professional: 1000,
      enterprise: 10000,
      custom: 50000,
    };

    partner.tier = newTier;
    partner.apiConfig.rateLimit = tierUpgrades[newTier];
    partner.updatedAt = new Date();

    return true;
  }

  getSystemCapabilities(): {
    supportedIntegrations: string[];
    customizationOptions: string[];
    whitelabelFeatures: string[];
  } {
    return {
      supportedIntegrations: [
        "Shopify",
        "WooCommerce",
        "Magento",
        "BigCommerce",
        "Stripe",
        "PayPal",
        "QuickBooks",
        "Salesforce",
        "HubSpot",
        "Slack",
        "Zapier",
      ],
      customizationOptions: [
        "Custom branding (logos, colors, fonts)",
        "Custom checkout flow",
        "Custom dashboard and reports",
        "Custom API endpoints",
        "Custom email templates",
        "Custom domain support",
        "Custom payment methods",
        "Custom fee structures",
        "Custom settlement rules",
        "Custom compliance settings",
      ],
      whitelabelFeatures: [
        "100% branded experience",
        "Custom API base URLs",
        "Dedicated support team",
        "SLA guarantees",
        "Custom feature development",
        "White-label SDKs",
        "Multi-region deployment",
        "Custom compliance assistance",
        "Revenue sharing options",
        "Co-marketing opportunities",
      ],
    };
  }
}

// ============= Export Main Service =============

export class WhiteLabelService {
  public brandingManager: WhiteLabelBrandingManager;
  public checkoutManager: WhiteLabelCheckoutManager;
  public dashboardManager: WhiteLabelDashboardManager;
  public partnerManager: WhiteLabelPartnerManager;

  constructor() {
    this.brandingManager = new WhiteLabelBrandingManager();
    this.checkoutManager = new WhiteLabelCheckoutManager();
    this.dashboardManager = new WhiteLabelDashboardManager();
    this.partnerManager = new WhiteLabelPartnerManager();
  }
}
