import apiClient from "./apiClient";

export type PublicCompanyProfile = {
  id: string;
  name: string;
  legalName?: string;
  websiteUrl?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  email?: string;
  phoneNumber?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  hrPersonName?: string;
  hrPersonEmail?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type PublicTenant = {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
};

export type PublicCompanyProfileResponse = {
  tenant?: PublicTenant | null;
  company?: PublicCompanyProfile | null;
  brandingJson?: string;
};

export type PublicContactRequest = {
  name: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  subject?: string;
  message: string;
};

export type PublicJobPosting = {
  id: string;
  title: string;
  location?: string;
  jobType?: string;
  level?: string;
  department?: string;
  postedDate?: string;
  closingDate?: string | null;
};

export type PublicJobPostingsResponse = {
  jobPostings: PublicJobPosting[];
  total: number;
  page: number;
  limit: number;
};

export const publicApi = {
  getCompanyProfile: () =>
    apiClient.get<PublicCompanyProfileResponse>("/public/company-profile"),
  submitContact: (payload: PublicContactRequest) =>
    apiClient.post("/public/contact", payload),
  getActiveJobPostings: (page = 1, limit = 12) =>
    apiClient.get<PublicJobPostingsResponse>(
      `/recruitment/job-postings/active?page=${page}&limit=${limit}`
    ),
};
