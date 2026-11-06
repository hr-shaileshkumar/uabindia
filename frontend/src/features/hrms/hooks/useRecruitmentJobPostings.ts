import { useQuery } from "@tanstack/react-query";
import { hrmsApi } from "@/services/modules/hrms";

export type JobPostingRecord = {
  id: string;
  title?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  status?: string;
  isActive?: boolean;
};

export type JobPostingsResponse = {
  jobPostings: JobPostingRecord[];
  total: number;
  page: number;
  limit: number;
};

export const recruitmentJobPostingsQueryKey = (page: number, limit: number) =>
  ["recruitment", "job-postings", page, limit] as const;

export const useRecruitmentJobPostings = (page = 1, limit = 20) =>
  useQuery({
    queryKey: recruitmentJobPostingsQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await hrmsApi.recruitment.jobPostings(page, limit);
      return data as JobPostingsResponse;
    },
    staleTime: 30_000,
  });

export const mapJobPosting = (posting: JobPostingRecord) => ({
  id: posting.id,
  title: posting.title ?? posting.jobTitle ?? "Untitled role",
  department: posting.department ?? "—",
  location: posting.location ?? "—",
  status: posting.isActive === false || posting.status?.toLowerCase() === "closed" ? "Closed" : "Active",
});
