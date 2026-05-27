// Training & Development Types

export interface TrainingProgram {
  id: string;
  programName: string;
  description: string;
  category: 'Technical' | 'Soft Skills' | 'Management' | 'Compliance' | 'Other';
  duration: number; // in hours
  provider?: string;
  startDate: Date;
  endDate: Date;
  maxEnrollments: number;
  status: 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
  createdBy: string;
}

export interface TrainingCourse {
  id: string;
  courseName: string;
  description: string;
  courseCode: string;
  duration: number; // in hours
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  provider: string;
  cost: number;
  createdDate: Date;
}

export interface TrainingEnrollment {
  id: string;
  employeeId: string;
  trainingProgramId: string;
  enrollmentDate: Date;
  completionDate?: Date;
  status: 'Enrolled' | 'InProgress' | 'Completed' | 'Cancelled';
  score?: number;
  certificateUrl?: string;
}

export interface TrainingCertification {
  id: string;
  employeeId: string;
  certificationName: string;
  certificationBody: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  certificateUrl: string;
  status: 'Active' | 'Expired' | 'Revoked';
}

export interface TrainingFeedback {
  id: string;
  enrollmentId: string;
  rating: number; // 1-5
  contentRelevance?: number;
  instructorQuality?: number;
  overallExperience?: number;
  comments?: string;
  suggestedTopics?: string;
  feedbackDate: Date;
}

export interface SkillGap {
  id: string;
  employeeId: string;
  skillName: string;
  currentLevel: 'Basic' | 'Intermediate' | 'Advanced';
  requiredLevel: 'Basic' | 'Intermediate' | 'Advanced';
  recommendedTraining?: string;
  trainingStatus: 'NotStarted' | 'InProgress' | 'Completed';
}

export interface CreateTrainingProgramRequest {
  programName: string;
  description: string;
  category: 'Technical' | 'Soft Skills' | 'Management' | 'Compliance' | 'Other';
  duration: number;
  provider?: string;
  startDate: Date;
  endDate: Date;
  maxEnrollments: number;
}

export interface CreateEnrollmentRequest {
  employeeId: string;
  trainingProgramId: string;
}

export interface CreateCertificationRequest {
  employeeId: string;
  certificationName: string;
  certificationBody: string;
  issueDate: Date;
  certificateNumber: string;
  certificateUrl: string;
  expiryDate?: Date;
}
