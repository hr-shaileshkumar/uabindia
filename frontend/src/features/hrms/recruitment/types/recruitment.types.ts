import { mapJobPosting } from "@/features/hrms/hooks/useRecruitmentJobPostings";

export type JobPostingRow = ReturnType<typeof mapJobPosting>;

export type JobPostingFormState = {
  title: string;
  description: string;
  department: string;
  location: string;
  level: string;
  jobType: string;
  minSalary: string;
  maxSalary: string;
  closingDate: string;
  numberOfPositions: string;
  requiredSkills: string;
};
