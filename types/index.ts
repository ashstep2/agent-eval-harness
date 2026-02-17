// Dimension names
export type DimensionName =
  | 'instruction_following'
  | 'output_structure'
  | 'reasoning_quality'
  | 'safety_alignment'
  | 'consistency'
  | 'developer_experience'
  | 'refusal_calibration';

// Evaluation dimension definition
export interface EvalDimension {
  name: DimensionName;
  displayName: string;
  description: string;
}

// Test case definition
export interface TestCase {
  id: string;
  category: string;
  name: string;
  prompt: string;
  systemPrompt?: string;
  expectedBehavior: string;
  dimensions: DimensionName[];
}

// Use case definition
export interface UseCase {
  id: string;
  name: string;
  description: string;
  icon: string;
  testCases: TestCase[];
  isNew?: boolean;
}

// Model configuration
export interface ModelConfig {
  provider: 'anthropic' | 'openai';
  modelId: string;
  displayName: string;
  description: string;
  /** 'api' (default) calls the provider SDK; 'cli' spawns a local subprocess. */
  type?: 'api' | 'cli';
}

// Evaluation configuration
export interface EvaluationConfig {
  useCaseId: string;
  models: string[]; // model IDs
}

// Progress update during evaluation
export interface ProgressUpdate {
  currentTest: number;
  totalTests: number;
  currentModel: string;
  status: 'querying' | 'scoring' | 'complete';
}

// Model response
export interface ModelResponse {
  modelId: string;
  response: string;
  latencyMs: number;
  error?: string;
}

// Score for a single dimension
export interface DimensionScore {
  dimension: DimensionName;
  score: number;
  reasoning: string;
}

// Scores for a single test/model combination
export interface TestScore {
  modelId: string;
  dimensionScores: DimensionScore[];
  overallScore: number;
}

// Result for a single test case
export interface TestResult {
  testCase: TestCase;
  responses: ModelResponse[];
  scores: TestScore[];
  comparison?: string;
}

// Per-model aggregated results
export interface ModelResults {
  modelId: string;
  displayName: string;
  overallScore: number;
  dimensionScores: Record<DimensionName, number>;
  averageLatencyMs: number;
}

// Complete evaluation results
export interface EvaluationResults {
  id: string;
  useCaseId: string;
  useCaseName: string;
  models: string[];
  startedAt: string;
  completedAt: string;
  summary: {
    winner: string;
    winnerScore: number;
    scores: Record<string, number>; // modelId -> overall score
  };
  byModel: Record<string, ModelResults>;
  byTest: TestResult[];
  recommendation: string;
}

// Evaluation run status
export interface EvaluationRun {
  id: string;
  config: EvaluationConfig;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: ProgressUpdate;
  startedAt: string;
  completedAt?: string;
  results?: EvaluationResults;
  error?: string;
}

// Stream events
export type StreamEvent =
  | { type: 'progress'; data: ProgressUpdate }
  | { type: 'response'; data: { testId: string; modelId: string; response: ModelResponse } }
  | { type: 'scores'; data: { testId: string; scores: TestScore[] } }
  | { type: 'complete'; data: EvaluationResults }
  | { type: 'error'; data: { message: string } };

// Recent evaluation for dashboard
export interface RecentEvaluation {
  id: string;
  useCaseName: string;
  models: string[];
  winner: string;
  winnerScore: number;
  completedAt: string;
}

// -----------------------------
// Agent Eval Types
// -----------------------------

export type AgentEvalMode = 'single_shot' | 'agent_loop';
export type WeightPreset = 'developer_trust' | 'ship_fast' | 'custom';

export type AgentDimensionName =
  | 'correctness'
  | 'style_adherence'
  | 'context_utilization'
  | 'completeness'
  | 'explanation_quality'
  | 'edge_case_handling';

export interface AgentEvalDimension {
  name: AgentDimensionName;
  displayName: string;
  description: string;
}

export interface RepoContextFile {
  path: string;
  content: string;
  notes?: string;
}

export interface AgentTaskRubric {
  dimension: AgentDimensionName;
  guidance: string;
}

export type AgentTaskCategory =
  | 'greenfield'
  | 'bugfix'
  | 'refactor'
  | 'test-writing'
  | 'code-review'
  | 'multi-file'
  | 'performance';

export interface AgentTask {
  id: string;
  title: string;
  category: AgentTaskCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  productQuestion: string;
  prompt: string;
  expectedBehavior: string;
  contextFiles: RepoContextFile[];
  rubrics: AgentTaskRubric[];
  testCases: string[];
  customWeights: Record<AgentDimensionName, number>;
}

export interface AgentDimensionScore {
  dimension: AgentDimensionName;
  score: number;
  reasoning: string;
}

export interface AgentJudgeScore {
  modelId: string;
  dimensionScores: AgentDimensionScore[];
  overallScore: number;
}

export interface InterJudgeAgreement {
  alignedDimensions: Record<AgentDimensionName, boolean>;
  alignmentRate: number; // 0-1
}

export interface AgentModelResult {
  modelId: string;
  displayName: string;
  response: string;
  reasoningSummary: string;
  primary: AgentJudgeScore;
  secondary: AgentJudgeScore;
  weightedScore: number;
  dimensionAverages: Record<AgentDimensionName, number>;
  agreement: InterJudgeAgreement;
}

export interface AgentEvalStep {
  modelId?: string;
  id: 'analyze' | 'plan' | 'code' | 'review' | 'final';
  title: string;
  prompt: string;
  response: string;
  primaryScores?: AgentJudgeScore;
  secondaryScores?: AgentJudgeScore;
}

export interface AgentEvaluationResults {
  id: string;
  taskId: string;
  taskTitle: string;
  mode: AgentEvalMode;
  models: string[];
  weightPreset: WeightPreset;
  startedAt: string;
  completedAt: string;
  modelResults: Record<string, AgentModelResult>;
  steps?: AgentEvalStep[];
  winner: string;
  winnerScore: number;
  interJudgeAgreement: {
    alignmentRate: number;
  };
}

export interface AgentEvaluationSummary {
  id: string;
  taskId: string;
  taskTitle: string;
  mode: AgentEvalMode;
  models: string[];
  winner: string;
  winnerScore: number;
  completedAt: string;
  weightPreset: WeightPreset;
}

export type AgentStreamEvent =
  | { type: 'progress'; data: ProgressUpdate }
  | { type: 'response'; data: { modelId: string; text: string; stepId?: string } }
  | { type: 'step'; data: AgentEvalStep }
  | { type: 'scores'; data: { modelResults: Record<string, AgentModelResult> } }
  | { type: 'complete'; data: AgentEvaluationResults }
  | { type: 'error'; data: { message: string } };

// -----------------------------
// Mini Codex Agent Types
// -----------------------------

export interface CodexAgentTask {
  id: string;
  description: string;
  contextFiles: RepoContextFile[];
}

export type CodexStepId = 'understand' | 'plan' | 'implement' | 'review' | 'deliver';

export interface CodexStep {
  id: CodexStepId;
  title: string;
  response: string;
  status: 'pending' | 'streaming' | 'complete';
}

export interface CodexAgentRun {
  id: string;
  task: CodexAgentTask;
  modelId: string;
  steps: CodexStep[];
  finalDiff: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'complete' | 'error';
  error?: string;
}

export type CodexStreamEvent =
  | { type: 'step_start'; data: { stepId: CodexStepId } }
  | { type: 'token'; data: { stepId: CodexStepId; text: string } }
  | { type: 'step_complete'; data: { stepId: CodexStepId; response: string } }
  | { type: 'complete'; data: CodexAgentRun }
  | { type: 'error'; data: { message: string } };
