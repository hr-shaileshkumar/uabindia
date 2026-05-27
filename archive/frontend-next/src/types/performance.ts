// Performance Appraisal Types

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  appraisalPeriodId: string;
  goalTitle: string;
  goalDescription: string;
  weightage: number;
  targetValue: string;
  actualValue?: string;
  status: 'Draft' | 'InProgress' | 'Completed' | 'NotAchieved';
  createdAt: Date;
}

export interface AppraisalRating {
  id: string;
  employeeId: string;
  appraisalPeriodId: string;
  ratingScale: number; // 1-5
  categoryName: string;
  comments?: string;
  ratedBy: string;
  ratedDate: Date;
}

export interface PerformanceAppraisal {
  id: string;
  employeeId: string;
  appraisalPeriodId: string;
  appraisalDate: Date;
  submittedDate?: Date;
  overallRating: number; // 1-5
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  managerName: string;
  managerComments?: string;
  strengths?: string;
  areasForImprovement?: string;
  developmentPlan?: string;
  goals: PerformanceGoal[];
  ratings: AppraisalRating[];
}

export interface AppraisalPeriod {
  id: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Closed' | 'Archived';
}

export interface PerformanceFeedback {
  id: string;
  appraisalId: string;
  feedbackFrom: string;
  feedbackText: string;
  feedbackDate: Date;
  isAnonymous: boolean;
}

export interface CreateAppraisalRequest {
  employeeId: string;
  appraisalPeriodId: string;
  managerName: string;
}

export interface UpdateAppraisalRequest {
  overallRating: number;
  managerComments?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
}
