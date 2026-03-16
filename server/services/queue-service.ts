/**
 * Task Queue Service
 * Asynchronous job processing with retry logic
 * In production: Replace with Redis/Bull or RabbitMQ
 */

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  status: "pending" | "processing" | "completed" | "failed";
  retries: number;
  maxRetries: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
  priority: number;
}

export interface JobProcessor<T = any> {
  type: string;
  process: (job: QueueJob<T>) => Promise<any>;
  maxRetries?: number;
  timeout?: number;
}

export class QueueService {
  private queue: QueueJob[] = [];
  private processors: Map<string, JobProcessor> = new Map();
  private isProcessing: boolean = false;
  private jobHistory: QueueJob[] = [];
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
    totalRetried: 0,
  };

  constructor() {
    // Start processing queue
    this.startProcessing();
    console.log("✅ Queue service initialized");
  }

  /**
   * Register job processor
   */
  registerProcessor<T>(processor: JobProcessor<T>) {
    this.processors.set(processor.type, processor);
    console.log(`Registered processor: ${processor.type}`);
  }

  /**
   * Add job to queue
   */
  async addJob<T>(
    type: string,
    data: T,
    options: { priority?: number; maxRetries?: number } = {}
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: QueueJob<T> = {
      id: jobId,
      type,
      data,
      status: "pending",
      retries: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date(),
      priority: options.priority || 0,
    };

    // Insert based on priority (higher priority at front)
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (job.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, job);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.queue.push(job);
    }

    console.log(`[Queue] Added job: ${jobId} (type: ${type})`);
    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): QueueJob | null {
    return (
      this.queue.find((j) => j.id === jobId) ||
      this.jobHistory.find((j) => j.id === jobId) ||
      null
    );
  }

  /**
   * Start processing queue
   */
  private startProcessing() {
    setInterval(() => {
      this.processNextJob();
    }, 100); // Process every 100ms
  }

  /**
   * Process next job in queue
   */
  private async processNextJob() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.isProcessing = true;

    try {
      job.status = "processing";
      job.processedAt = new Date();

      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }

      // Execute with timeout
      const timeout = processor.timeout || 30000; // 30 seconds default
      const result = await Promise.race([
        processor.process(job),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Job timeout")), timeout)
        ),
      ]);

      job.status = "completed";
      this.stats.totalProcessed++;

      console.log(
        `[Queue] Completed job: ${job.id} (${job.type}) in ${Date.now() - job.createdAt.getTime()}ms`
      );

      // Move to history
      this.jobHistory.push(job);
      if (this.jobHistory.length > 1000) {
        this.jobHistory = this.jobHistory.slice(-1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Queue] Job failed: ${job.id}`, errorMessage);

      job.error = errorMessage;

      // Retry logic
      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = "pending";
        this.queue.push(job); // Re-queue
        this.stats.totalRetried++;

        console.log(
          `[Queue] Retrying job: ${job.id} (attempt ${job.retries}/${job.maxRetries})`
        );
      } else {
        job.status = "failed";
        this.stats.totalFailed++;

        // Move to history
        this.jobHistory.push(job);
        if (this.jobHistory.length > 1000) {
          this.jobHistory = this.jobHistory.slice(-1000);
        }

        console.error(`[Queue] Job failed permanently: ${job.id}`);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.isProcessing,
      totalProcessed: this.stats.totalProcessed,
      totalFailed: this.stats.totalFailed,
      totalRetried: this.stats.totalRetried,
      historyLength: this.jobHistory.length,
    };
  }

  /**
   * Get queue contents (for monitoring)
   */
  getQueueContents(limit: number = 50) {
    return this.queue.slice(0, limit).map((job) => ({
      id: job.id,
      type: job.type,
      status: job.status,
      priority: job.priority,
      retries: job.retries,
      maxRetries: job.maxRetries,
      createdAt: job.createdAt.toISOString(),
    }));
  }

  /**
   * Cleanup old history
   */
  cleanup() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialLength = this.jobHistory.length;

    this.jobHistory = this.jobHistory.filter(
      (job) => job.processedAt && new Date(job.processedAt) > oneDayAgo
    );

    console.log(`[Queue] Cleaned ${initialLength - this.jobHistory.length} old jobs`);
  }
}

/**
 * Pre-defined job processors
 */

export const createPaymentProcessor = () => ({
  type: "process_payment",
  process: async (job: QueueJob<any>) => {
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: "completed", txnId: `txn_${job.id}` });
      }, 1000);
    });
  },
  maxRetries: 5,
  timeout: 30000,
});

export const createSettlementProcessor = () => ({
  type: "process_settlement",
  process: async (job: QueueJob<any>) => {
    // Simulate settlement processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: "completed", settlementId: `settle_${job.id}` });
      }, 2000);
    });
  },
  maxRetries: 3,
  timeout: 60000,
});

export const createNotificationProcessor = () => ({
  type: "send_notification",
  process: async (job: QueueJob<any>) => {
    // Simulate sending notification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: "sent", to: job.data.email });
      }, 500);
    });
  },
  maxRetries: 3,
  timeout: 10000,
});

export const createAuditLogProcessor = () => ({
  type: "log_audit",
  process: async (job: QueueJob<any>) => {
    // Log to database
    return { status: "logged" };
  },
  maxRetries: 1,
  timeout: 5000,
});

export default QueueService;
