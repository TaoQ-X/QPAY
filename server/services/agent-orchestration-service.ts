import { AIAgent, Task, AgentPerformance } from "./ai-agent-framework";
import { customerSuccessAgent } from "../agents/customer-success-agent";
import { transactionProcessingAgent } from "../agents/transaction-processing-agent";

interface AgentCapability {
  agent: AIAgent;
  capabilities: string[];
  utilization: number;
}

interface TaskAssignment {
  taskId: string;
  assignedAgents: string[];
  priority: "low" | "medium" | "high" | "critical";
  status: "assigned" | "in_progress" | "completed" | "failed";
  deadline?: Date;
  collaborationRequired: boolean;
}

/**
 * Agent Orchestration Service - manages all AI agents
 * Coordinates agent activities, balances workload, enables collaboration
 */
class AgentOrchestrationService {
  private agents: Map<string, AIAgent> = new Map();
  private taskQueue: Map<string, Task> = new Map();
  private assignments: Map<string, TaskAssignment> = new Map();
  private performanceHistory: AgentPerformance[] = [];
  private collaborations: Map<string, any> = new Map();
  private systemMetrics: any = {
    totalTasksProcessed: 0,
    totalTasksFailed: 0,
    averageTaskTime: 0,
    systemUptime: 0,
    lastOptimization: new Date(),
  };

  constructor() {
    this.registerAgents();
    this.startSystemMonitoring();
  }

  /**
   * Register all available agents
   */
  private registerAgents(): void {
    // Register built-in agents
    this.agents.set(customerSuccessAgent.id, customerSuccessAgent);
    this.agents.set(transactionProcessingAgent.id, transactionProcessingAgent);

    // Can register more agents here as they are created
  }

  /**
   * Assign task to appropriate agent(s)
   */
  assignTask(task: Task): TaskAssignment | null {
    // Find agent(s) capable of handling this task
    const capableAgents = this.findCapableAgents(task.type);

    if (capableAgents.length === 0) {
      console.error(`No agent capable of handling task type: ${task.type}`);
      return null;
    }

    // Select best agent based on workload and specialization
    const selectedAgent = this.selectOptimalAgent(capableAgents, task.priority);

    // Check if collaboration is needed
    const needsCollaboration =
      task.priority === "critical" || task.type.includes("complex");

    const assignment: TaskAssignment = {
      taskId: task.id,
      assignedAgents: [selectedAgent.id],
      priority: task.priority,
      status: "assigned",
      collaborationRequired: needsCollaboration,
    };

    if (needsCollaboration) {
      // Add backup agent for critical tasks
      const backupAgent = capableAgents.find(a => a.id !== selectedAgent.id);
      if (backupAgent) {
        assignment.assignedAgents.push(backupAgent.id);
      }
    }

    // Store assignment and execute
    this.assignments.set(task.id, assignment);
    this.taskQueue.set(task.id, task);

    // Execute task
    selectedAgent.executeTask(task);

    return assignment;
  }

  /**
   * Find agents capable of handling task type
   */
  private findCapableAgents(taskType: string): AIAgent[] {
    const capable: AIAgent[] = [];

    for (const agent of this.agents.values()) {
      if (agent["capabilities"]?.includes(taskType)) {
        capable.push(agent);
      }
    }

    return capable;
  }

  /**
   * Select optimal agent based on workload and performance
   */
  private selectOptimalAgent(agents: AIAgent[], priority: string): AIAgent {
    // Score each agent based on:
    // 1. Current utilization (prefer less busy)
    // 2. Performance history (prefer higher success rate)
    // 3. Specialization for task type

    let bestAgent = agents[0];
    let bestScore = -Infinity;

    for (const agent of agents) {
      const agentStatus = agent.getStatus();
      const utilizationScore = 1 - agentStatus.pendingTasks / 10; // Prefer less busy
      const performanceScore = agentStatus.performance.successRate / 100;
      const priorityMultiplier = priority === "critical" ? 1.5 : 1;

      const totalScore =
        (utilizationScore * 0.3 + performanceScore * 0.7) * priorityMultiplier;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Enable multi-agent collaboration
   */
  async enableCollaboration(
    taskId: string,
    primaryAgentId: string,
    secondaryAgentId: string
  ): Promise<void> {
    const primaryAgent = this.agents.get(primaryAgentId);
    const secondaryAgent = this.agents.get(secondaryAgentId);

    if (!primaryAgent || !secondaryAgent) return;

    // Share knowledge between agents
    const primaryKnowledge = primaryAgent.shareKnowledge();
    const secondaryKnowledge = secondaryAgent.shareKnowledge();

    primaryAgent.absorbeKnowledge(secondaryKnowledge);
    secondaryAgent.absorbeKnowledge(primaryKnowledge);

    // Store collaboration record
    this.collaborations.set(taskId, {
      agents: [primaryAgentId, secondaryAgentId],
      taskId,
      startTime: new Date(),
      sharedKnowledge: {
        from: primaryAgentId,
        to: secondaryAgentId,
        count: secondaryKnowledge.size,
      },
    });
  }

  /**
   * Start continuous system monitoring
   */
  private startSystemMonitoring(): void {
    setInterval(() => {
      this.monitorSystemHealth();
      this.optimizeAgentAllocation();
      this.shareKnowledgeAcrossAgents();
    }, 60000); // Every minute
  }

  /**
   * Monitor system health
   */
  private monitorSystemHealth(): void {
    const agentStatuses = Array.from(this.agents.values()).map(a => a.getStatus());

    // Calculate aggregate metrics
    const avgSuccessRate =
      agentStatuses.reduce((sum, s) => sum + s.performance.successRate, 0) /
      agentStatuses.length;

    const totalQueuedTasks = agentStatuses.reduce(
      (sum, s) => sum + s.pendingTasks,
      0
    );

    const systemHealth = {
      timestamp: new Date(),
      totalAgents: this.agents.size,
      averageSuccessRate: avgSuccessRate,
      totalQueuedTasks,
      systemUtilization: Math.min(totalQueuedTasks / (this.agents.size * 10), 1),
      agents: agentStatuses.map(s => ({
        agentId: s.id,
        name: s.name,
        successRate: s.performance.successRate,
        pendingTasks: s.pendingTasks,
        learningScore: s.performance.learningScore,
      })),
    };

    // Store metrics
    this.systemMetrics.lastHealthCheck = systemHealth;

    // Trigger alerts if needed
    if (avgSuccessRate < 80) {
      this.triggerAlert("Low system success rate", systemHealth);
    }

    if (totalQueuedTasks > this.agents.size * 5) {
      this.triggerAlert("High queue depth", systemHealth);
    }
  }

  /**
   * Optimize agent allocation based on performance
   */
  private optimizeAgentAllocation(): void {
    const agentStatuses = Array.from(this.agents.values()).map(a => a.getStatus());

    for (const status of agentStatuses) {
      if (status.performance.successRate < 70) {
        // This agent needs improvement
        this.requestAgentImprovement(status.id);
      }

      if (status.pendingTasks > status.performance.qualityScore / 10) {
        // Too much workload for quality
        this.rebalanceWorkload(status.id);
      }
    }

    this.systemMetrics.lastOptimization = new Date();
  }

  /**
   * Share knowledge across agents
   */
  private shareKnowledgeAcrossAgents(): void {
    const agents = Array.from(this.agents.values());

    // Each agent shares its high-confidence knowledge with others
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const knowledge1 = agents[i].shareKnowledge();
        const knowledge2 = agents[j].shareKnowledge();

        agents[i].absorbeKnowledge(knowledge2);
        agents[j].absorbeKnowledge(knowledge1);
      }
    }
  }

  /**
   * Request agent to improve performance
   */
  private async requestAgentImprovement(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Trigger improvement process
    await (agent as any).improveProcess();
  }

  /**
   * Rebalance workload among agents
   */
  private rebalanceWorkload(overloadedAgentId: string): void {
    const overloaded = this.agents.get(overloadedAgentId);
    if (!overloaded) return;

    // Find tasks assigned to overloaded agent that could be reassigned
    const reassignableTaskIds: string[] = [];

    for (const [taskId, assignment] of this.assignments) {
      if (
        assignment.assignedAgents.includes(overloadedAgentId) &&
        assignment.status === "assigned"
      ) {
        reassignableTaskIds.push(taskId);
      }
    }

    // Reassign to less busy agents
    for (const taskId of reassignableTaskIds.slice(0, 2)) {
      const task = this.taskQueue.get(taskId);
      if (task) {
        const newAgent = this.findCapableAgents(task.type).find(
          a => a.id !== overloadedAgentId
        );

        if (newAgent) {
          const assignment = this.assignments.get(taskId);
          if (assignment) {
            assignment.assignedAgents = [newAgent.id];
          }
        }
      }
    }
  }

  /**
   * Trigger system alert
   */
  private triggerAlert(message: string, context: any): void {
    console.warn(`[SYSTEM ALERT] ${message}`, context);
    // In production, this would integrate with monitoring system
  }

  /**
   * Get system dashboard
   */
  getSystemDashboard(): any {
    const agentStatuses = Array.from(this.agents.values()).map(a => a.getStatus());

    return {
      timestamp: new Date(),
      systemStatus: "operational",
      totalAgents: this.agents.size,
      metrics: {
        totalTasksProcessed: this.systemMetrics.totalTasksProcessed,
        averageSuccessRate:
          agentStatuses.reduce((sum, s) => sum + s.performance.successRate, 0) /
          agentStatuses.length,
        queuedTasks: this.taskQueue.size,
        systemLearningScore:
          agentStatuses.reduce((sum, s) => sum + s.performance.learningScore, 0) /
          agentStatuses.length,
      },
      agents: agentStatuses.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        status: "operational",
        successRate: `${s.performance.successRate.toFixed(1)}%`,
        qualityScore: `${s.performance.qualityScore.toFixed(1)}%`,
        learningScore: `${s.performance.learningScore.toFixed(1)}%`,
        pendingTasks: s.pendingTasks,
        capabilities: s.capabilities.length,
      })),
      recentCollaborations: Array.from(this.collaborations.values()).slice(-5),
    };
  }

  /**
   * Get agent performance report
   */
  getPerformanceReport(): any {
    const agentStatuses = Array.from(this.agents.values()).map(a => a.getStatus());

    return {
      reportDate: new Date(),
      agents: agentStatuses.map(s => ({
        agentId: s.id,
        name: s.name,
        tasksCompleted: s.performance.totalTasksCompleted,
        successRate: `${s.performance.successRate.toFixed(1)}%`,
        averageExecutionTime: `${s.performance.averageExecutionTime.toFixed(0)}ms`,
        qualityScore: `${s.performance.qualityScore.toFixed(1)}%`,
        learningScore: `${s.performance.learningScore.toFixed(1)}%`,
        knowledgeItems: s.memorySize,
        recommendation: this.getAgentRecommendation(s),
      })),
      systemWideMetrics: {
        avgSuccessRate:
          agentStatuses.reduce((sum, s) => sum + s.performance.successRate, 0) /
          agentStatuses.length,
        avgQualityScore:
          agentStatuses.reduce((sum, s) => sum + s.performance.qualityScore, 0) /
          agentStatuses.length,
        totalKnowledgeItems: agentStatuses.reduce(
          (sum, s) => sum + s.memorySize,
          0
        ),
      },
    };
  }

  /**
   * Get recommendation for agent
   */
  private getAgentRecommendation(agentStatus: any): string {
    if (agentStatus.performance.successRate > 95) {
      return "Excellent performance - consider expanding responsibilities";
    }
    if (agentStatus.performance.successRate < 80) {
      return "Needs support - allocate more learning opportunities";
    }
    if (agentStatus.performance.learningScore < 30) {
      return "Limited learning - needs more task exposure";
    }
    return "Performing well - maintain current trajectory";
  }

  /**
   * Execute bulk operations across agents
   */
  async executeBulkOperation(operation: string, targets: string[]): Promise<any> {
    const results: any[] = [];

    for (const targetId of targets) {
      const agent = this.agents.get(targetId);
      if (!agent) continue;

      let result: any;
      switch (operation) {
        case "improve_process":
          result = await (agent as any).improveProcess();
          break;
        case "knowledge_extraction":
          result = agent.getKnowledgeBase();
          break;
        case "performance_reset":
          // Reset performance metrics
          result = { reset: true };
          break;
        default:
          result = { error: "Unknown operation" };
      }

      results.push({ agentId: targetId, result });
    }

    return results;
  }

  /**
   * Export system state for backup/analysis
   */
  exportSystemState(): any {
    return {
      exportDate: new Date(),
      agents: Array.from(this.agents.values()).map(a => ({
        id: a.id,
        status: a.getStatus(),
        knowledge: a.getKnowledgeBase(),
      })),
      metrics: this.systemMetrics,
      collaborations: Array.from(this.collaborations.values()),
      taskQueue: Array.from(this.taskQueue.values()).map(t => ({
        id: t.id,
        type: t.type,
        status: t.status,
      })),
    };
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();
