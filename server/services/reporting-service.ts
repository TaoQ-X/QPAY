/**
 * Advanced Reporting Service
 * Custom reports with exports, scheduling, and templates
 */

export interface Report {
  id: string;
  businessId: string;
  name: string;
  type: "transaction" | "settlement" | "analytics" | "fraud" | "kyc" | "custom";
  filters: ReportFilter[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  schedule?: {
    frequency: "once" | "daily" | "weekly" | "monthly";
    recipients: string[];
    isActive: boolean;
  };
  status: "draft" | "generating" | "ready" | "error";
  format: ("csv" | "pdf" | "json" | "excel")[];
  createdAt: Date;
  generatedAt?: Date;
  expiresAt?: Date;
}

export interface ReportFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in";
  value: any;
}

export interface ReportData {
  reportId: string;
  title: string;
  summary: ReportSummary;
  data: Record<string, any>[];
  metadata: {
    totalRows: number;
    generatedAt: Date;
    generatedBy: string;
  };
}

export interface ReportSummary {
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  netAmount: number;
  successRate: number;
  averageTransactionSize: number;
}

export class ReportingService {
  private reports: Map<string, Report> = new Map();
  private reportData: Map<string, ReportData> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize report templates
   */
  private initializeTemplates() {
    const templates: ReportTemplate[] = [
      {
        id: "tmpl_daily_summary",
        name: "Daily Summary",
        description: "Daily transaction and settlement summary",
        type: "transaction",
        defaultFilters: [{ field: "createdAt", operator: "equals", value: "today" }],
        fields: [
          "date",
          "total_transactions",
          "total_amount",
          "success_rate",
          "total_fees",
        ],
      },
      {
        id: "tmpl_settlement_report",
        name: "Settlement Report",
        description: "Detailed settlement tracking and status",
        type: "settlement",
        defaultFilters: [],
        fields: [
          "settlement_id",
          "amount",
          "status",
          "date",
          "bank_account",
          "transaction_count",
        ],
      },
      {
        id: "tmpl_fraud_analysis",
        name: "Fraud Analysis",
        description: "Fraud detection and risk analysis",
        type: "fraud",
        defaultFilters: [{ field: "fraud_detected", operator: "equals", value: true }],
        fields: [
          "transaction_id",
          "fraud_score",
          "risk_factors",
          "amount",
          "status",
          "resolution",
        ],
      },
      {
        id: "tmpl_monthly_analytics",
        name: "Monthly Analytics",
        description: "Complete monthly performance metrics",
        type: "analytics",
        defaultFilters: [{ field: "period", operator: "equals", value: "current_month" }],
        fields: [
          "period",
          "total_revenue",
          "transaction_volume",
          "active_customers",
          "growth_rate",
          "churn_rate",
          "average_transaction_value",
        ],
      },
    ];

    templates.forEach((t) => this.templates.set(t.id, t));
  }

  /**
   * Create a new report
   */
  async createReport(data: {
    businessId: string;
    name: string;
    type: Report["type"];
    filters: ReportFilter[];
    dateRange: { startDate: Date; endDate: Date };
    format: Report["format"];
    schedule?: Report["schedule"];
  }): Promise<Report> {
    const id = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const report: Report = {
      id,
      businessId: data.businessId,
      name: data.name,
      type: data.type,
      filters: data.filters,
      dateRange: data.dateRange,
      status: "draft",
      format: data.format,
      schedule: data.schedule,
      createdAt: new Date(),
    };

    this.reports.set(id, report);
    console.log(`[Report] Created: ${id}`);

    return report;
  }

  /**
   * Generate report
   */
  async generateReport(reportId: string): Promise<ReportData | null> {
    const report = this.reports.get(reportId);
    if (!report) return null;

    try {
      report.status = "generating";

      // Simulate data generation
      const reportData = await this.buildReportData(report);

      report.status = "ready";
      report.generatedAt = new Date();
      report.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      this.reportData.set(reportId, reportData);

      console.log(`[Report] Generated: ${reportId}`);
      return reportData;
    } catch (error) {
      report.status = "error";
      console.error(`[Report] Error generating ${reportId}:`, error);
      return null;
    }
  }

  /**
   * Build report data based on report type
   */
  private async buildReportData(report: Report): Promise<ReportData> {
    const mockTransactions = this.generateMockTransactions(report);

    const summary: ReportSummary = {
      totalTransactions: mockTransactions.length,
      totalAmount: mockTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalFees: mockTransactions.reduce((sum, t) => sum + (t.fee || 0), 0),
      netAmount: mockTransactions.reduce((sum, t) => sum + (t.amount - (t.fee || 0)), 0),
      successRate:
        mockTransactions.filter((t) => t.status === "confirmed").length /
        mockTransactions.length,
      averageTransactionSize:
        mockTransactions.reduce((sum, t) => sum + t.amount, 0) / mockTransactions.length,
    };

    return {
      reportId: report.id,
      title: report.name,
      summary,
      data: mockTransactions,
      metadata: {
        totalRows: mockTransactions.length,
        generatedAt: new Date(),
        generatedBy: "system",
      },
    };
  }

  /**
   * Export report to different formats
   */
  async exportReport(
    reportId: string,
    format: "csv" | "pdf" | "json" | "excel"
  ): Promise<Buffer | null> {
    const reportData = this.reportData.get(reportId);
    if (!reportData) return null;

    try {
      switch (format) {
        case "csv":
          return this.exportToCSV(reportData);
        case "json":
          return this.exportToJSON(reportData);
        case "excel":
          return this.exportToExcel(reportData);
        case "pdf":
          return this.exportToPDF(reportData);
        default:
          return null;
      }
    } catch (error) {
      console.error(`[Report] Export error:`, error);
      return null;
    }
  }

  /**
   * Export to CSV
   */
  private exportToCSV(reportData: ReportData): Buffer {
    let csv = `${reportData.title}\n`;
    csv += `Generated: ${reportData.metadata.generatedAt.toISOString()}\n\n`;

    // Summary section
    csv += "SUMMARY\n";
    csv += `Total Transactions,${reportData.summary.totalTransactions}\n`;
    csv += `Total Amount,${reportData.summary.totalAmount.toFixed(2)}\n`;
    csv += `Total Fees,${reportData.summary.totalFees.toFixed(2)}\n`;
    csv += `Net Amount,${reportData.summary.netAmount.toFixed(2)}\n`;
    csv += `Success Rate,${(reportData.summary.successRate * 100).toFixed(2)}%\n\n`;

    // Data section
    csv += "TRANSACTIONS\n";
    if (reportData.data.length > 0) {
      const headers = Object.keys(reportData.data[0]);
      csv += headers.join(",") + "\n";

      reportData.data.forEach((row) => {
        csv += headers.map((h) => row[h]).join(",") + "\n";
      });
    }

    return Buffer.from(csv, "utf-8");
  }

  /**
   * Export to JSON
   */
  private exportToJSON(reportData: ReportData): Buffer {
    const json = JSON.stringify(
      {
        title: reportData.title,
        summary: reportData.summary,
        data: reportData.data,
        metadata: reportData.metadata,
      },
      null,
      2
    );

    return Buffer.from(json, "utf-8");
  }

  /**
   * Export to Excel (simplified - in production use xlsx library)
   */
  private exportToExcel(reportData: ReportData): Buffer {
    // In production: Use xlsx or ExcelJS library
    // For now: Return CSV in Excel format
    return this.exportToCSV(reportData);
  }

  /**
   * Export to PDF (simplified - in production use pdf library)
   */
  private exportToPDF(reportData: ReportData): Buffer {
    // In production: Use pdfkit or other PDF library
    // For now: Return CSV content
    const csv = this.exportToCSV(reportData);
    return csv;
  }

  /**
   * Get report
   */
  getReport(reportId: string): Report | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * List reports for business
   */
  listReports(businessId: string, type?: Report["type"]): Report[] {
    return Array.from(this.reports.values()).filter(
      (r) => r.businessId === businessId && (!type || r.type === type)
    );
  }

  /**
   * Delete report
   */
  deleteReport(reportId: string): boolean {
    const deleted = this.reports.delete(reportId);
    if (deleted) {
      this.reportData.delete(reportId);
    }
    return deleted;
  }

  /**
   * Schedule report
   */
  async scheduleReport(reportId: string, schedule: Report["schedule"]): Promise<boolean> {
    const report = this.reports.get(reportId);
    if (!report) return false;

    report.schedule = schedule;

    // In production: Set up cron job or scheduled task
    console.log(`[Report] Scheduled: ${reportId} (${schedule.frequency})`);

    return true;
  }

  /**
   * Get available templates
   */
  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template
   */
  getTemplate(templateId: string): ReportTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Create report from template
   */
  createReportFromTemplate(
    businessId: string,
    templateId: string,
    customName?: string
  ): Report | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const report: Report = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      businessId,
      name: customName || template.name,
      type: template.type,
      filters: template.defaultFilters,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
      status: "draft",
      format: ["csv", "pdf"],
      createdAt: new Date(),
    };

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Get report statistics
   */
  getStats(businessId: string) {
    const businessReports = this.listReports(businessId);
    const generated = businessReports.filter((r) => r.status === "ready");
    const scheduled = businessReports.filter((r) => r.schedule?.isActive);

    return {
      totalReports: businessReports.length,
      generatedReports: generated.length,
      scheduledReports: scheduled.length,
      byType: {
        transaction: businessReports.filter((r) => r.type === "transaction").length,
        settlement: businessReports.filter((r) => r.type === "settlement").length,
        analytics: businessReports.filter((r) => r.type === "analytics").length,
        fraud: businessReports.filter((r) => r.type === "fraud").length,
      },
    };
  }

  /**
   * Generate mock transactions for report
   */
  private generateMockTransactions(report: Report) {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `txn_${i}`,
      amount: Math.random() * 10000,
      fee: Math.random() * 100,
      status: Math.random() > 0.05 ? "confirmed" : "failed",
      date: new Date(
        report.dateRange.startDate.getTime() +
          Math.random() *
            (report.dateRange.endDate.getTime() - report.dateRange.startDate.getTime())
      ),
      method: ["card", "bank", "crypto"][Math.floor(Math.random() * 3)],
    }));
  }
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: Report["type"];
  defaultFilters: ReportFilter[];
  fields: string[];
}

export default ReportingService;
