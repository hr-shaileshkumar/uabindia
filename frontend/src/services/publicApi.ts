import axios from "axios";
import apiClient from "./apiClient";
import type { PublicAudience } from "@/lib/public-audience";

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
  minSalary?: number;
  maxSalary?: number;
  postedDate?: string;
  closingDate?: string | null;
};

export type PublicJobPostingsResponse = {
  jobPostings: PublicJobPosting[];
  total: number;
  page: number;
  limit: number;
};

export type PublicWebsitePageResponse = {
  pageType?: string;
  title?: string;
  contentJson?: string;
  isPublished?: boolean;
};

export type PublicSitePage = {
  key: string;
  label: string;
  path: string;
  isEnabled: boolean;
  isPublished: boolean;
  placements: string[];
};

export type PublicSiteManifestResponse = {
  audience: PublicAudience;
  tenantResolved: boolean;
  homePath: string;
  tenant?: PublicTenant | null;
  pages: PublicSitePage[];
};

export type PublicSiteMetric = {
  label: string;
  value: string;
  helper: string;
};

export type PublicSiteStat = {
  value: number;
  suffix: string;
  label: string;
  helper?: string;
};

export type PublicSiteCoverage = {
  name: string;
  sector: string;
  mark: string;
  count: number;
};

export type PublicSiteSocialProof = {
  showCustomerReferences: boolean;
  showTestimonials: boolean;
  note: string;
};

export type PublicSiteDataResponse = {
  audience: PublicAudience;
  generatedAtUtc: string;
  heroMetrics: PublicSiteMetric[];
  dashboardMetrics: PublicSiteMetric[];
  summaryStats: PublicSiteStat[];
  industryCoverage: PublicSiteCoverage[];
  socialProof: PublicSiteSocialProof;
};

const PUBLIC_API_COOLDOWN_MS = 60_000;
const SILENT_PUBLIC_HEADERS = { headers: { "X-Silent-Error": "1" } };
const pendingOptionalPublicReads = new Map<string, Promise<unknown>>();
let optionalPublicReadRetryAt = 0;

const shouldSilenceOptionalPublicRead = () => Date.now() < optionalPublicReadRetryAt;

const isTransientConnectionError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status ?? 0;
  if ((status >= 500 && status <= 504) || status === 404) {
    return true;
  }
  if (error.response) return false;
  const code = (error.code || "").toUpperCase();
  return code === "ERR_NETWORK" || code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ECONNABORTED" || code === "ETIMEDOUT";
};

const runOptionalPublicRead = <T>(key: string, execute: () => Promise<T>): Promise<T> => {
  if (shouldSilenceOptionalPublicRead()) {
    return Promise.reject(new Error("PUBLIC_API_UNAVAILABLE"));
  }

  const pending = pendingOptionalPublicReads.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const request = execute()
    .then((response) => {
      optionalPublicReadRetryAt = 0;
      return response;
    })
    .catch((error: unknown) => {
      if (isTransientConnectionError(error)) {
        optionalPublicReadRetryAt = Date.now() + PUBLIC_API_COOLDOWN_MS;
      }
      throw error;
    })
    .finally(() => {
      pendingOptionalPublicReads.delete(key);
    });

  pendingOptionalPublicReads.set(key, request as Promise<unknown>);
  return request;
};

export const publicApi = {
  getCompanyProfile: (audience: PublicAudience = "tenant") =>
    runOptionalPublicRead(`public-company-profile:${audience}`, () =>
      apiClient.get<PublicCompanyProfileResponse>(
        `/public/company-profile?audience=${encodeURIComponent(audience)}`,
        SILENT_PUBLIC_HEADERS
      )
    ),
  getWebsitePage: (pageType: string, audience: PublicAudience = "tenant") =>
    runOptionalPublicRead(`public-website-page:${audience}:${pageType}`, () =>
      apiClient.get<PublicWebsitePageResponse>(
        `/public/website-pages/${pageType}?audience=${encodeURIComponent(audience)}`,
        SILENT_PUBLIC_HEADERS
      )
    ),
  getSiteManifest: (audience: PublicAudience) =>
    runOptionalPublicRead(`public-site-manifest:${audience}`, () =>
      apiClient.get<PublicSiteManifestResponse>(`/public/site-manifest?audience=${encodeURIComponent(audience)}`, SILENT_PUBLIC_HEADERS)
    ),
  getSiteData: (audience: PublicAudience = "tenant") =>
    runOptionalPublicRead(`public-site-data:${audience}`, () =>
      apiClient.get<PublicSiteDataResponse>(
        `/public/site-data?audience=${encodeURIComponent(audience)}`,
        SILENT_PUBLIC_HEADERS
      )
    ),
  submitContact: (
    payload: PublicContactRequest,
    audience: PublicAudience = "tenant",
    context: "contact" | "request-access" = "contact"
  ) =>
    apiClient.post(
      `/public/contact?audience=${encodeURIComponent(audience)}&context=${encodeURIComponent(context)}`,
      payload
    ),
  getActiveJobPostings: (page = 1, limit = 12, audience: PublicAudience = "tenant") =>
    runOptionalPublicRead(`public-job-postings:${audience}:${page}:${limit}`, () =>
      apiClient.get<PublicJobPostingsResponse>(
        `/recruitment/job-postings/active?page=${page}&limit=${limit}&audience=${encodeURIComponent(audience)}`,
        SILENT_PUBLIC_HEADERS
      )
    ),
  applyForJob: (payload: {
    jobPostingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    currentCompany?: string;
    currentDesignation?: string;
    yearsOfExperience?: number;
    coverLetter?: string;
    sourceOfRecruit?: string;
  }) =>
    apiClient.post<{ message: string; candidate?: { id: string } }>(
      "/recruitment/apply",
      payload
    ),
};
