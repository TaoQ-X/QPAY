import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

/**
 * Real-Time Event Streaming Module
 * WebSocket-based live updates for transactions, settlements, and notifications
 */

export interface RealTimeEvent {
  id: string;
  businessId: string;
  type: EventType;
  data: Record<string, any>;
  timestamp: Date;
  priority: "low" | "normal" | "high" | "critical";
}

export type EventType =
  | "transaction.created"
  | "transaction.confirmed"
  | "transaction.failed"
  | "settlement.created"
  | "settlement.completed"
  | "settlement.failed"
  | "payment.received"
  | "payment.refunded"
  | "kyc.status_changed"
  | "fraud.detected"
  | "alert.warning"
  | "alert.critical";

export class RealtimeEventService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Socket[]> = new Map();
  private eventQueue: RealTimeEvent[] = [];
  private eventHistory: RealTimeEvent[] = [];

  /**
   * Initialize Socket.IO server
   */
  initializeSocket(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupSocketHandlers();
    console.log("✅ Real-time event service initialized");
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Client subscribes to business events
      socket.on("subscribe", (businessId: string) => {
        socket.join(`business:${businessId}`);

        if (!this.connectedClients.has(businessId)) {
          this.connectedClients.set(businessId, []);
        }
        this.connectedClients.get(businessId)!.push(socket);

        // Send recent events from history
        const recentEvents = this.eventHistory
          .filter((e) => e.businessId === businessId)
          .slice(-20);

        socket.emit("history", recentEvents);
      });

      // Client unsubscribes
      socket.on("unsubscribe", (businessId: string) => {
        socket.leave(`business:${businessId}`);

        const clients = this.connectedClients.get(businessId);
        if (clients) {
          const idx = clients.indexOf(socket);
          if (idx > -1) {
            clients.splice(idx, 1);
          }
        }
      });

      // Acknowledge connectivity
      socket.on("ping", () => {
        socket.emit("pong");
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);

        // Remove from all subscribed businesses
        this.connectedClients.forEach((clients) => {
          const idx = clients.indexOf(socket);
          if (idx > -1) {
            clients.splice(idx, 1);
          }
        });
      });
    });
  }

  /**
   * Emit real-time event to subscribed clients
   */
  async emitEvent(event: RealTimeEvent) {
    try {
      // Add to history
      this.eventHistory.push(event);
      if (this.eventHistory.length > 10000) {
        this.eventHistory = this.eventHistory.slice(-10000);
      }

      // Add to queue
      this.eventQueue.push(event);

      if (!this.io) return;

      // Broadcast to subscribed clients
      this.io.to(`business:${event.businessId}`).emit("event", event);

      // Log critical events
      if (event.priority === "critical") {
        console.warn(`[CRITICAL] ${event.type}: ${JSON.stringify(event.data)}`);
      }

      // Process high-priority events
      if (event.priority === "high") {
        await this.processHighPriorityEvent(event);
      }
    } catch (error) {
      console.error("[RealTime] Error emitting event:", error);
    }
  }

  /**
   * Process high-priority events (fraud, critical alerts, etc.)
   */
  private async processHighPriorityEvent(event: RealTimeEvent) {
    switch (event.type) {
      case "fraud.detected":
        // Trigger fraud response
        console.error(`[FRAUD ALERT] Business ${event.businessId}:`, event.data);
        // Send to fraud management system
        break;

      case "settlement.failed":
        // Notify business about failed settlement
        console.warn(
          `[SETTLEMENT FAILED] Business ${event.businessId}:`,
          event.data
        );
        break;

      case "kyc.status_changed":
        // Handle KYC updates
        console.log(`[KYC UPDATE] Business ${event.businessId}:`, event.data);
        break;
    }
  }

  /**
   * Event factory methods
   */

  transactionCreated(businessId: string, transactionData: any) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "transaction.created",
      data: transactionData,
      timestamp: new Date(),
      priority: "normal",
    });
  }

  transactionConfirmed(businessId: string, transactionData: any) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "transaction.confirmed",
      data: transactionData,
      timestamp: new Date(),
      priority: "high",
    });
  }

  transactionFailed(businessId: string, transactionData: any, reason: string) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "transaction.failed",
      data: { ...transactionData, reason },
      timestamp: new Date(),
      priority: "high",
    });
  }

  settlementCreated(businessId: string, settlementData: any) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "settlement.created",
      data: settlementData,
      timestamp: new Date(),
      priority: "normal",
    });
  }

  settlementCompleted(businessId: string, settlementData: any) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "settlement.completed",
      data: settlementData,
      timestamp: new Date(),
      priority: "high",
    });
  }

  kycStatusChanged(businessId: string, status: string) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "kyc.status_changed",
      data: { status, updatedAt: new Date().toISOString() },
      timestamp: new Date(),
      priority: "high",
    });
  }

  fraudDetected(businessId: string, fraudData: any) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: "fraud.detected",
      data: fraudData,
      timestamp: new Date(),
      priority: "critical",
    });
  }

  alert(
    businessId: string,
    priority: "warning" | "critical",
    message: string,
    data?: any
  ) {
    return this.emitEvent({
      id: `evt_${Date.now()}`,
      businessId,
      type: priority === "warning" ? "alert.warning" : "alert.critical",
      data: { message, ...data },
      timestamp: new Date(),
      priority,
    });
  }

  /**
   * Get event statistics
   */
  getStats() {
    return {
      totalConnectedBusinesses: this.connectedClients.size,
      totalConnectedClients: Array.from(this.connectedClients.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
      eventQueueLength: this.eventQueue.length,
      historyLength: this.eventHistory.length,
      serverReady: this.io?.sockets?.sockets?.size || 0,
    };
  }

  /**
   * Get recent events for a business
   */
  getRecentEvents(businessId: string, limit: number = 50): RealTimeEvent[] {
    return this.eventHistory
      .filter((e) => e.businessId === businessId)
      .slice(-limit);
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    if (this.io) {
      this.io.close();
    }
    console.log("✅ Real-time event service shutdown");
  }
}

export default RealtimeEventService;
