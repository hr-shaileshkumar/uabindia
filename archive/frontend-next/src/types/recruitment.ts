// Recruitment Types

export interface JobPosting {
  id: string;
  jobTitle: string;
  jobDescription: string;
  department: string;
  numberOfPositions: number;
  experienceRequired: number;
  minSalary: number;
  maxSalary: number;
  postingDate: Date;
  closingDate: Date;
  status: 'Open' | 'Closed' | 'OnHold' | 'Filled';
  createdBy: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  resumeUrl: string;
  currentCompany?: string;
  currentRole?: string;
  experience: number;
  expectedSalary: number;
  createdDate: Date;
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  candidateId: string;
  applicationDate: Date;
  status: 'Applied' | 'Shortlisted' | 'Interviewed' | 'Offered' | 'Rejected' | 'Accepted';
  appliedVia: string;
  coverLetter?: string;
}

export interface InterviewSchedule {
  id: string;
  applicationId: string;
  interviewDate: Date;
  interviewTime: string;
  interviewType: 'PhoneScreen' | 'TechnicalRound' | 'HRRound' | 'FinalRound';
  interviewer: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export interface InterviewFeedback {
  id: string;
  interviewScheduleId: string;
  rating: number; // 1-5
  technicalSkills?: number;
  communicationSkills?: number;
  culturalFit?: number;
  comments?: string;
  recommendation: 'StrongYes' | 'Yes' | 'Maybe' | 'No' | 'StrongNo';
  feedbackDate: Date;
}

export interface JobOffer {
  id: string;
  applicationId: string;
  jobPostingId: string;
  offerDate: Date;
  salary: number;
  designation: string;
  reportingTo: string;
  joiningDate: Date;
  status: 'Offered' | 'Accepted' | 'Rejected' | 'Withdrawn';
}

export interface CreateJobPostingRequest {
  jobTitle: string;
  jobDescription: string;
  department: string;
  numberOfPositions: number;
  experienceRequired: number;
  minSalary: number;
  maxSalary: number;
  closingDate: Date;
}

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  resumeUrl: string;
  experience: number;
  expectedSalary: number;
}

export interface CreateApplicationRequest {
  jobPostingId: string;
  candidateId: string;
  coverLetter?: string;
}
