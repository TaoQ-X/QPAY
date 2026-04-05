import { EventEmitter } from "events";

export interface Region {
  id: string;
  name: string;
  location: string;
  endpoint: string;
  latency: number; // ms
  isHealthy: boolean;
  capacity: number; // requests/sec
  activeConnections: number;
  lastHealthCheck: Date;
}

export interface AutoScaleConfig {
  minInstances: number;
  maxInstances: number;
  targetCPUUtilization: number; // 0-100
  targetMemoryUtilization: number; // 0-100
  targetRequestLatency: number; // ms
  scaleUpThreshold: number; // scale up if any metric exceeds this
  scaleDownThreshold: number; // scale down if all metrics below this
}

export interface LoadBalancerStats {
  totalRequests: number;
  averageLatency: number;
  errorRate: number;
  activeConnections: number;
  regionDistribution: Record<string, number>;
  healthyRegions: number;
  unhealthyRegions: number;
}

export interface MetricsSnapshot {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorCount: number;
  activeConnections: number;
}

class ScalabilityService extends EventEmitter {
  private regions: Map<string, Region> = new Map();
  private autoScaleConfig: AutoScaleConfig;
  private requestCounter: number = 0;
  private errorCounter: number = 0;
  private latencyArray: number[] = [];
  private metricsHistory: MetricsSnapshot[] = [];
  private currentMetrics: MetricsSnapshot | null = null;

  constructor() {
    super();
    this.autoScaleConfig = {
      minInstances: 3,
      maxInstances: 50,
      targetCPUUtilization: 70,
      targetMemoryUtilization: 80,
      targetRequestLatency: 200,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
    };
    
    this.initializeRegions();
    this.startHealthChecks();
    this.startMetricsCollection();
  }

  /**
   * Initialize default regions for global deployment
   */
  private initializeRegions(): void {
    const defaultRegions = [
      {
        id: "us-east-1",
        name: "US East",
        location: "N. Virginia",
        endpoint: "https://us-east-1.qpay.io",
      },
      {
        id: "eu-west-1",
        name: "EU West",
        location: "Ireland",
        endpoint: "https://eu-west-1.qpay.io",
      },
      {
        id: "ap-southeast-1",
        name: "Asia Pacific",
        location: "Singapore",
        endpoint: "https://ap-southeast-1.qpay.io",
      },
      {
        id: "me-south-1",
        name: "Middle East",
        location: "Bahrain",
        endpoint: "https://me-south-1.qpay.io",
      },
      {
        id: "ap-northeast-1",
        name: "Japan",
        location: "Tokyo",
        endpoint: "https://ap-northeast-1.qpay.io",
      },
    ];

    defaultRegions.forEach(region => {
      this.regions.set(region.id, {
        ...region,
        latency: Math.random() * 50 + 10,
        isHealthy: true,
        capacity: 10000,
        activeConnections: 0,
        lastHealthCheck: new Date(),
      });
    });
  }

  /**
   * Add a new region for deployment
   */
  addRegion(region: Omit<Region, "latency" | "isHealthy" | "activeConnections" | "lastHealthCheck">): void {
    this.regions.set(region.id, {
      ...region,
      latency: 0,
      isHealthy: true,
      activeConnections: 0,
      lastHealthCheck: new Date(),
    });
    this.emit("regionAdded", region.id);
  }

  /**
   * Get the best region based on latency and health
   */
  getBestRegion(userLocation?: string): Region | null {
    const healthyRegions = Array.from(this.regions.values()).filter(r => r.isHealthy);
    
    if (healthyRegions.length === 0) return null;

    // Sort by latency and capacity utilization
    healthyRegions.sort((a, b) => {
      const aScore = a.latency + (a.activeConnections / a.capacity) * 100;
      const bScore = b.latency + (b.activeConnections / b.capacity) * 100;
      return aScore - bScore;
    });

    return healthyRegions[0];
  }

  /**
   * Route request to appropriate region
   */
  routeRequest(userLocation: string, requestPath: string): { region: Region; endpoint: string } | null {
    const region = this.getBestRegion(userLocation);
    if (!region) return null;

    region.activeConnections++;
    this.requestCounter++;

    return {
      region,
      endpoint: `${region.endpoint}${requestPath}`,
    };
  }

  /**
   * Release connection from region
   */
  releaseConnection(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region && region.activeConnections > 0) {
      region.activeConnections--;
    }
  }

  /**
   * Health check for all regions
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      for (const [regionId, region] of this.regions) {
        try {
          const startTime = Date.now();
          
          // Simulate health check request
          const isHealthy = await this.checkRegionHealth(region);
          const latency = Date.now() - startTime;
          
          region.isHealthy = isHealthy;
          region.latency = latency;
          region.lastHealthCheck = new Date();

          if (!isHealthy) {
            this.emit("regionUnhealthy", regionId);
          }
        } catch (error) {
          region.isHealthy = false;
          this.emit("healthCheckFailed", { regionId, error });
        }
      }

      // Check if auto-scaling is needed
      this.evaluateAutoScaling();
    }, 30000); // Health check every 30 seconds
  }

  /**
   * Check if a region is healthy
   */
  private async checkRegionHealth(region: Region): Promise<boolean> {
    // Simulate health check with 95% success rate
    const healthScore = Math.random();
    return healthScore > 0.05;
  }

  /**
   * Collect metrics for monitoring and auto-scaling
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      const cpuUsage = Math.random() * 100; // Simulated CPU usage
      const memoryUsage = Math.random() * 100; // Simulated memory usage
      const avgLatency = this.latencyArray.length > 0
        ? this.latencyArray.reduce((a, b) => a + b, 0) / this.latencyArray.length
        : 0;

      this.currentMetrics = {
        timestamp: new Date(),
        cpuUsage,
        memoryUsage,
        requestsPerSecond: this.requestCounter,
        averageLatency: avgLatency,
        errorCount: this.errorCounter,
        activeConnections: Array.from(this.regions.values()).reduce(
          (sum, r) => sum + r.activeConnections,
          0
        ),
      };

      this.metricsHistory.push(this.currentMetrics);
      
      // Keep only last 1000 metrics (about 8 hours at 30s interval)
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory.shift();
      }

      // Reset counters
      this.requestCounter = 0;
      this.errorCounter = 0;
      this.latencyArray = [];
    }, 30000); // Collect metrics every 30 seconds
  }

  /**
   * Evaluate if auto-scaling is needed
   */
  private evaluateAutoScaling(): void {
    if (!this.currentMetrics) return;

    const metrics = this.currentMetrics;
    const totalInstances = this.regions.size;

    // Scale up if metrics exceed thresholds
    if (
      metrics.cpuUsage > this.autoScaleConfig.scaleUpThreshold ||
      metrics.memoryUsage > this.autoScaleConfig.scaleUpThreshold ||
      metrics.averageLatency > this.autoScaleConfig.targetRequestLatency
    ) {
      if (totalInstances < this.autoScaleConfig.maxInstances) {
        this.emit("scaleUp", { reason: "High resource utilization", metrics });
      }
    }

    // Scale down if all metrics are low
    if (
      metrics.cpuUsage < this.autoScaleConfig.scaleDownThreshold &&
      metrics.memoryUsage < this.autoScaleConfig.scaleDownThreshold &&
      metrics.averageLatency < this.autoScaleConfig.targetRequestLatency / 2
    ) {
      if (totalInstances > this.autoScaleConfig.minInstances) {
        this.emit("scaleDown", { reason: "Low resource utilization", metrics });
      }
    }
  }

  /**
   * Record request latency for monitoring
   */
  recordLatency(latencyMs: number): void {
    this.latencyArray.push(latencyMs);
  }

  /**
   * Record request error
   */
  recordError(): void {
    this.errorCounter++;
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    const regions = Array.from(this.regions.values());
    const healthyRegions = regions.filter(r => r.isHealthy);
    const regionDistribution: Record<string, number> = {};

    regions.forEach(region => {
      regionDistribution[region.id] = region.activeConnections;
    });

    return {
      totalRequests: this.requestCounter,
      averageLatency: this.latencyArray.length > 0
        ? this.latencyArray.reduce((a, b) => a + b, 0) / this.latencyArray.length
        : 0,
      errorRate: this.requestCounter > 0
        ? (this.errorCounter / this.requestCounter) * 100
        : 0,
      activeConnections: regions.reduce((sum, r) => sum + r.activeConnections, 0),
      regionDistribution,
      healthyRegions: healthyRegions.length,
      unhealthyRegions: regions.length - healthyRegions.length,
    };
  }

  /**
   * Get all regions
   */
  getRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get region by ID
   */
  getRegion(regionId: string): Region | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get metrics history for monitoring
   */
  getMetricsHistory(limit: number = 100): MetricsSnapshot[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): MetricsSnapshot | null {
    return this.currentMetrics;
  }

  /**
   * Update auto-scale configuration
   */
  updateAutoScaleConfig(config: Partial<AutoScaleConfig>): void {
    this.autoScaleConfig = { ...this.autoScaleConfig, ...config };
    this.emit("autoScaleConfigUpdated", this.autoScaleConfig);
  }

  /**
   * Get auto-scale configuration
   */
  getAutoScaleConfig(): AutoScaleConfig {
    return { ...this.autoScaleConfig };
  }

  /**
   * Simulate request with latency tracking
   */
  async simulateRequest(regionId: string, handler: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    const region = this.regions.get(regionId);

    try {
      const result = await handler();
      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      return result;
    } catch (error) {
      this.recordError();
      throw error;
    } finally {
      if (region) {
        this.releaseConnection(regionId);
      }
    }
  }

  /**
   * Get capacity utilization by region
   */
  getCapacityUtilization(): Record<string, number> {
    const utilization: Record<string, number> = {};

    this.regions.forEach((region, regionId) => {
      utilization[regionId] = (region.activeConnections / region.capacity) * 100;
    });

    return utilization;
  }

  /**
   * Get cost estimation for current configuration
   */
  getScalingCostEstimate(): {
    hourlyRate: number;
    dailyRate: number;
    monthlyRate: number;
    regionsActive: number;
  } {
    const healthyRegions = Array.from(this.regions.values()).filter(r => r.isHealthy).length;
    const costPerRegionPerHour = 50; // Simulated cost in USD

    return {
      hourlyRate: healthyRegions * costPerRegionPerHour,
      dailyRate: healthyRegions * costPerRegionPerHour * 24,
      monthlyRate: healthyRegions * costPerRegionPerHour * 24 * 30,
      regionsActive: healthyRegions,
    };
  }

  /**
   * Load balancing algorithm: Round Robin
   */
  roundRobinRegion(): Region | null {
    const healthyRegions = Array.from(this.regions.values()).filter(r => r.isHealthy);
    if (healthyRegions.length === 0) return null;

    // Simple round-robin (in production, use a counter for proper rotation)
    return healthyRegions[Math.floor(Math.random() * healthyRegions.length)];
  }

  /**
   * Load balancing algorithm: Least Connections
   */
  leastConnectionsRegion(): Region | null {
    const healthyRegions = Array.from(this.regions.values()).filter(r => r.isHealthy);
    if (healthyRegions.length === 0) return null;

    return healthyRegions.reduce((least, region) =>
      region.activeConnections < least.activeConnections ? region : least
    );
  }

  /**
   * Load balancing algorithm: Weighted Round Robin
   */
  weightedRoundRobinRegion(): Region | null {
    const healthyRegions = Array.from(this.regions.values()).filter(r => r.isHealthy);
    if (healthyRegions.length === 0) return null;

    // Weight by capacity and latency
    const totalWeight = healthyRegions.reduce((sum, r) => 
      sum + (r.capacity / r.latency), 0
    );

    let random = Math.random() * totalWeight;
    for (const region of healthyRegions) {
      random -= region.capacity / region.latency;
      if (random <= 0) return region;
    }

    return healthyRegions[0];
  }
}

export const scalabilityService = new ScalabilityService();
