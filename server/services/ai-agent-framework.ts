import crypto from "crypto";

export interface Task {
  id: string;
  type: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  assignedAgent: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  feedback?: number; // 0-100 quality score
}

export interface AgentMemory {
  id: string;
  agentId: string;
  type: "experience" | "rule" | "pattern" | "optimization";
  content: string;
  dataPoints: any[];
  successRate: number;
  timestamp: Date;
  appliedCount: number;
}

export interface AgentPerformance {
  agentId: string;
  totalTasksCompleted: number;
  successRate: number;
  averageExecutionTime: number;
  qualityScore: number;
  learningScore: number;
  lastUpdated: Date;
}

export interface AgentDecision {
  taskId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  selectedAlternative: string;
  timestamp: Date;
}

export abstract class AIAgent {
  protected id: string;
  protected name: string;
  protected role: string;
  protected capabilities: string[];
  protected memory: Map<string, AgentMemory>;
  protected decisionHistory: Map<string, AgentDecision>;
  protected taskQueue: Task[];
  protected performanceMetrics: AgentPerformance;
  protected learningRate: number = 0.1;

  constructor(name: string, role: string, capabilities: string[]) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.memory = new Map();
    this.decisionHistory = new Map();
    this.taskQueue = [];
    this.performanceMetrics = {
      agentId: this.id,
      totalTasksCompleted: 0,
      successRate: 100,
      averageExecutionTime: 0,
      qualityScore: 100,
      learningScore: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Process a task assigned to this agent
   */
  async executeTask(task: Task): Promise<void> {
    task.status = "in_progress";
    task.assignedAgent = this.id;
    task.startedAt = new Date();

    try {
      // Check if similar task has been done before
      const precedent = this.findPrecedent(task.type, task.description);
      if (precedent && precedent.successRate > 0.8) {
        // Apply learned pattern
        task.result = await this.applyLearning(task, precedent);
      } else {
        // Execute task with reasoning
        task.result = await this.reason(task);
      }

      task.status = "completed";
      task.completedAt = new Date();

      // Learn from this experience
      await this.learnFromExperience(task);
      this.recordDecision(task);

      this.updatePerformanceMetrics(true, task);
    } catch (error) {
      task.status = "failed";
      task.error = String(error);
      this.updatePerformanceMetrics(false, task);
    }
  }

  /**
   * Make decisions with reasoning
   */
  protected async reason(task: Task): Promise<any> {
    const context = this.gatherContext(task);
    const options = await this.generateOptions(task, context);
    const decision = this.evaluateOptions(options, context);
    
    return await this.executeDecision(task, decision);
  }

  /**
   * Gather context for decision making
   */
  protected gatherContext(task: Task): any {
    return {
      taskType: task.type,
      priority: task.priority,
      historicalSimilarTasks: this.findSimilarTasks(task.type),
      recentDecisions: this.getRecentDecisions(5),
      systemState: this.getSystemState(),
    };
  }

  /**
   * Generate alternative options for a task
   */
  protected async generateOptions(task: Task, context: any): Promise<string[]> {
    // This will be overridden by subclasses
    return ["default_option"];
  }

  /**
   * Evaluate and select best option
   */
  protected evaluateOptions(options: string[], context: any): string {
    // Score each option based on past performance
    const scores = options.map(option => {
      const relatedMemories = Array.from(this.memory.values()).filter(
        m => m.content.includes(option)
      );
      const avgSuccessRate =
        relatedMemories.length > 0
          ? relatedMemories.reduce((sum, m) => sum + m.successRate, 0) /
            relatedMemories.length
          : 0.5;
      return { option, score: avgSuccessRate };
    });

    // Select highest scoring option
    return scores.sort((a, b) => b.score - a.score)[0].option;
  }

  /**
   * Execute the decision
   */
  protected async executeDecision(task: Task, decision: string): Promise<any> {
    // Override in subclasses
    return { decision, executedAt: new Date() };
  }

  /**
   * Find similar past tasks (precedent)
   */
  protected findPrecedent(taskType: string, description: string): AgentMemory | null {
    const relevant = Array.from(this.memory.values())
      .filter(m => m.type === "experience" && m.content.includes(taskType))
      .sort((a, b) => b.successRate - a.successRate);

    return relevant.length > 0 ? relevant[0] : null;
  }

  /**
   * Apply learned patterns to new task
   */
  protected async applyLearning(task: Task, precedent: AgentMemory): Promise<any> {
    return {
      appliedLearning: true,
      precedentId: precedent.id,
      pattern: precedent.content,
      result: await this.executeDecision(task, precedent.content),
    };
  }

  /**
   * Learn from completed task experience
   */
  protected async learnFromExperience(task: Task): Promise<void> {
    if (task.status === "completed" && task.feedback) {
      const memory: AgentMemory = {
        id: crypto.randomUUID(),
        agentId: this.id,
        type: "experience",
        content: `${task.type}: ${task.description}`,
        dataPoints: [task.result],
        successRate: task.feedback / 100,
        timestamp: new Date(),
        appliedCount: 0,
      };

      this.memory.set(memory.id, memory);

      // Extract rules and patterns
      if (task.feedback >= 80) {
        this.extractRule(task);
      }
    }
  }

  /**
   * Extract generalizable rules from successful tasks
   */
  protected extractRule(task: Task): void {
    // Analyze patterns and create rules for future use
    const rule: AgentMemory = {
      id: crypto.randomUUID(),
      agentId: this.id,
      type: "rule",
      content: `Rule for ${task.type}: ${this.generateRuleText(task)}`,
      dataPoints: [],
      successRate: 0.85,
      timestamp: new Date(),
      appliedCount: 0,
    };

    this.memory.set(rule.id, rule);
  }

  /**
   * Generate rule text (to be overridden)
   */
  protected generateRuleText(task: Task): string {
    return `When handling ${task.type}, consider: ${task.description}`;
  }

  /**
   * Record decision made for audit trail
   */
  protected recordDecision(task: Task): void {
    const decision: AgentDecision = {
      taskId: task.id,
      decision: task.result?.decision || "completed",
      reasoning: task.result?.reasoning || "Task completed",
      confidence: task.feedback ? task.feedback / 100 : 0.5,
      alternatives: [],
      selectedAlternative: task.result?.decision || "default",
      timestamp: new Date(),
    };

    this.decisionHistory.set(task.id, decision);
  }

  /**
   * Find similar past tasks for pattern recognition
   */
  protected findSimilarTasks(taskType: string): Task[] {
    return this.taskQueue.filter(
      t => t.type === taskType && t.status === "completed"
    );
  }

  /**
   * Get recent decisions made
   */
  protected getRecentDecisions(count: number): AgentDecision[] {
    return Array.from(this.decisionHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  /**
   * Get current system state
   */
  protected getSystemState(): any {
    return {
      timestamp: new Date(),
      agentStatus: "operational",
      memoryUsage: this.memory.size,
      successRate: this.performanceMetrics.successRate,
    };
  }

  /**
   * Update performance metrics
   */
  protected updatePerformanceMetrics(success: boolean, task: Task): void {
    const metrics = this.performanceMetrics;
    metrics.totalTasksCompleted++;

    const newSuccessRate =
      (metrics.successRate * (metrics.totalTasksCompleted - 1) +
        (success ? 100 : 0)) /
      metrics.totalTasksCompleted;
    metrics.successRate = newSuccessRate;

    if (task.completedAt && task.startedAt) {
      const executionTime = task.completedAt.getTime() - task.startedAt.getTime();
      metrics.averageExecutionTime =
        (metrics.averageExecutionTime * (metrics.totalTasksCompleted - 1) +
          executionTime) /
        metrics.totalTasksCompleted;
    }

    if (task.feedback) {
      metrics.qualityScore =
        (metrics.qualityScore * (metrics.totalTasksCompleted - 1) +
          task.feedback) /
        metrics.totalTasksCompleted;
    }

    metrics.learningScore = Math.min(
      100,
      (this.memory.size / 10) * 10 + (newSuccessRate - 50)
    );
    metrics.lastUpdated = new Date();
  }

  /**
   * Get agent status and performance
   */
  getStatus(): any {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      capabilities: this.capabilities,
      performance: this.performanceMetrics,
      memorySize: this.memory.size,
      pendingTasks: this.taskQueue.filter(t => t.status === "pending").length,
      recentDecisions: this.getRecentDecisions(5),
    };
  }

  /**
   * Share knowledge with other agents
   */
  shareKnowledge(): Map<string, AgentMemory> {
    // Return high-confidence memories that could help other agents
    const shareable = new Map<string, AgentMemory>();

    for (const [id, memory] of this.memory) {
      if (memory.successRate > 0.75 && memory.appliedCount > 2) {
        shareable.set(id, memory);
      }
    }

    return shareable;
  }

  /**
   * Receive knowledge from other agents
   */
  absorbeKnowledge(knowledge: Map<string, AgentMemory>): void {
    for (const [, memory] of knowledge) {
      if (!this.memory.has(memory.id)) {
        // Adapt knowledge to this agent's context
        const adapted = { ...memory, appliedCount: 0 };
        this.memory.set(adapted.id, adapted);
      }
    }
  }

  /**
   * Continuous learning and self-improvement
   */
  async improveProcess(): Promise<void> {
    // Analyze recent decisions
    const recentDecisions = this.getRecentDecisions(10);
    const failedDecisions = recentDecisions.filter(d => d.confidence < 0.6);

    if (failedDecisions.length > 0) {
      // Identify patterns in failures
      for (const failed of failedDecisions) {
        const patterns = this.analyzeFailurePattern(failed);
        if (patterns) {
          this.createImprovedRule(patterns);
        }
      }
    }

    // Optimize based on performance
    if (this.performanceMetrics.qualityScore < 70) {
      this.optimizeDecisionMaking();
    }
  }

  /**
   * Analyze failure patterns
   */
  protected analyzeFailurePattern(decision: AgentDecision): any {
    return {
      pattern: "Low confidence decision",
      suggestion: "Gather more context before deciding",
      recommendation: "Use more conservative approach",
    };
  }

  /**
   * Create improved rules based on failures
   */
  protected createImprovedRule(patterns: any): void {
    const rule: AgentMemory = {
      id: crypto.randomUUID(),
      agentId: this.id,
      type: "rule",
      content: `Improvement: ${patterns.recommendation}`,
      dataPoints: [patterns],
      successRate: 0.7,
      timestamp: new Date(),
      appliedCount: 0,
    };

    this.memory.set(rule.id, rule);
  }

  /**
   * Optimize decision-making process
   */
  protected optimizeDecisionMaking(): void {
    // Reduce option generation complexity if success rate is low
    // Increase confidence thresholds
    // Request more human oversight
  }

  /**
   * Get agent's knowledge base
   */
  getKnowledgeBase(): any {
    return {
      experiences: Array.from(this.memory.values()).filter(m => m.type === "experience"),
      rules: Array.from(this.memory.values()).filter(m => m.type === "rule"),
      patterns: Array.from(this.memory.values()).filter(m => m.type === "pattern"),
      optimizations: Array.from(this.memory.values()).filter(m => m.type === "optimization"),
    };
  }
}
