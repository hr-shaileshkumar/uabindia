using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for Training & Development operations.
    /// Provides CRUD and query operations with multi-tenancy enforcement.
    /// </summary>
    public class TrainingRepository : ITrainingRepository
    {
        private readonly ApplicationDbContext _context;

        public TrainingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        #region TrainingCourse Operations

        public async Task<TrainingCourse?> GetCourseByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.TrainingCourses
                .AsNoTracking()
                .Where(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted)
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetAllCoursesAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.TrainingCourses
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetActiveCoursesAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            var now = DateTime.UtcNow;
            return await _context.TrainingCourses
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && 
                           !c.IsDeleted && 
                           c.Status == TrainingCourseStatus.InProgress &&
                           c.StartDate <= now &&
                           c.EndDate >= now)
                .OrderBy(c => c.StartDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetCoursesByCategoryAsync(Guid tenantId, string category, int skip = 0, int take = 20)
        {
            return await _context.TrainingCourses
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && 
                           !c.IsDeleted && 
                           c.Category == category)
                .OrderByDescending(c => c.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetCoursesByStatusAsync(Guid tenantId, TrainingCourseStatus status, int skip = 0, int take = 20)
        {
            return await _context.TrainingCourses
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && 
                           !c.IsDeleted && 
                           c.Status == status)
                .OrderByDescending(c => c.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<TrainingCourse> CreateCourseAsync(TrainingCourse course)
        {
            _context.TrainingCourses.Add(course);
            await _context.SaveChangesAsync();
            return course;
        }

        public async Task UpdateCourseAsync(TrainingCourse course)
        {
            _context.TrainingCourses.Update(course);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCourseAsync(Guid id, Guid tenantId)
        {
            var course = await _context.TrainingCourses
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            
            if (course != null)
            {
                course.IsDeleted = true;
                _context.TrainingCourses.Update(course);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region CourseEnrollment Operations

        public async Task<CourseEnrollment?> GetEnrollmentByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted)
                .Include(e => e.Course)
                .Include(e => e.Assessments)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<CourseEnrollment>> GetEnrollmentsByCourseAsync(Guid courseId, Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.CourseId == courseId && 
                           e.TenantId == tenantId && 
                           !e.IsDeleted)
                .OrderByDescending(e => e.EnrollmentDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<CourseEnrollment>> GetEnrollmentsByEmployeeAsync(Guid employeeId, Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.EmployeeId == employeeId && 
                           e.TenantId == tenantId && 
                           !e.IsDeleted)
                .Include(e => e.Course)
                .OrderByDescending(e => e.EnrollmentDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<CourseEnrollment>> GetEnrollmentsByStatusAsync(Guid tenantId, EnrollmentStatus status, int skip = 0, int take = 20)
        {
            return await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && 
                           !e.IsDeleted && 
                           e.Status == status)
                .OrderByDescending(e => e.EnrollmentDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<CourseEnrollment?> GetEnrollmentByCourseAndEmployeeAsync(Guid courseId, Guid employeeId, Guid tenantId)
        {
            return await _context.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && 
                                          e.EmployeeId == employeeId && 
                                          e.TenantId == tenantId && 
                                          !e.IsDeleted);
        }

        public async Task<IEnumerable<CourseEnrollment>> GetCompletedEnrollmentsAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.EmployeeId == employeeId && 
                           e.TenantId == tenantId && 
                           !e.IsDeleted && 
                           e.Status == EnrollmentStatus.Completed)
                .OrderByDescending(e => e.CompletionDate)
                .ToListAsync();
        }

        public async Task<CourseEnrollment> CreateEnrollmentAsync(CourseEnrollment enrollment)
        {
            _context.CourseEnrollments.Add(enrollment);
            
            // Update course enrollment count
            var course = await _context.TrainingCourses.FindAsync(enrollment.CourseId);
            if (course != null)
            {
                course.CurrentEnrollment += 1;
                _context.TrainingCourses.Update(course);
            }

            await _context.SaveChangesAsync();
            return enrollment;
        }

        public async Task UpdateEnrollmentAsync(CourseEnrollment enrollment)
        {
            _context.CourseEnrollments.Update(enrollment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteEnrollmentAsync(Guid id, Guid tenantId)
        {
            var enrollment = await _context.CourseEnrollments
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);
            
            if (enrollment != null)
            {
                enrollment.IsDeleted = true;

                
                // Decrement course enrollment count
                var course = await _context.TrainingCourses.FindAsync(enrollment.CourseId);
                if (course != null && course.CurrentEnrollment > 0)
                {
                    course.CurrentEnrollment -= 1;
                    _context.TrainingCourses.Update(course);
                }

                _context.CourseEnrollments.Update(enrollment);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region TrainingAssessment Operations

        public async Task<TrainingAssessment?> GetAssessmentByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.TrainingAssessments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
        }

        public async Task<IEnumerable<TrainingAssessment>> GetAssessmentsByEnrollmentAsync(Guid enrollmentId, Guid tenantId)
        {
            return await _context.TrainingAssessments
                .AsNoTracking()
                .Where(a => a.EnrollmentId == enrollmentId && 
                           a.TenantId == tenantId && 
                           !a.IsDeleted)
                .OrderBy(a => a.AssessmentDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingAssessment>> GetAssessmentsByCourseAsync(Guid courseId, Guid tenantId)
        {
            return await _context.TrainingAssessments
                .AsNoTracking()
                .Where(a => a.Enrollment.CourseId == courseId && 
                           a.TenantId == tenantId && 
                           !a.IsDeleted)
                .Include(a => a.Enrollment)
                .OrderByDescending(a => a.AssessmentDate)
                .ToListAsync();
        }

        public async Task<TrainingAssessment> CreateAssessmentAsync(TrainingAssessment assessment)
        {
            _context.TrainingAssessments.Add(assessment);
            await _context.SaveChangesAsync();
            return assessment;
        }

        public async Task UpdateAssessmentAsync(TrainingAssessment assessment)
        {
            _context.TrainingAssessments.Update(assessment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAssessmentAsync(Guid id, Guid tenantId)
        {
            var assessment = await _context.TrainingAssessments
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);
            
            if (assessment != null)
            {
                assessment.IsDeleted = true;

                _context.TrainingAssessments.Update(assessment);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region TrainingCertificate Operations

        public async Task<TrainingCertificate?> GetCertificateByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.TrainingCertificates
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
        }

        public async Task<IEnumerable<TrainingCertificate>> GetCertificatesByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.TrainingCertificates
                .AsNoTracking()
                .Where(c => c.Enrollment.EmployeeId == employeeId && 
                           c.TenantId == tenantId && 
                           !c.IsDeleted)
                .Include(c => c.Enrollment)
                .OrderByDescending(c => c.IssuedDate)
                .ToListAsync();
        }

        public async Task<TrainingCertificate?> GetCertificateByNumberAsync(string certificateNumber, Guid tenantId)
        {
            return await _context.TrainingCertificates
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CertificateNumber == certificateNumber && 
                                         c.TenantId == tenantId && 
                                         !c.IsDeleted);
        }

        public async Task<TrainingCertificate> CreateCertificateAsync(TrainingCertificate certificate)
        {
            _context.TrainingCertificates.Add(certificate);
            await _context.SaveChangesAsync();
            return certificate;
        }

        public async Task UpdateCertificateAsync(TrainingCertificate certificate)
        {
            _context.TrainingCertificates.Update(certificate);
            await _context.SaveChangesAsync();
        }

        #endregion

        #region TrainingRequest Operations

        public async Task<TrainingRequest?> GetRequestByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.TrainingRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
        }

        public async Task<IEnumerable<TrainingRequest>> GetRequestsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.TrainingRequests
                .AsNoTracking()
                .Where(r => r.EmployeeId == employeeId && 
                           r.TenantId == tenantId && 
                           !r.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingRequest>> GetRequestsByStatusAsync(Guid tenantId, TrainingRequestStatus status, int skip = 0, int take = 20)
        {
            return await _context.TrainingRequests
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId && 
                           !r.IsDeleted && 
                           r.Status == status)
                .OrderByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingRequest>> GetPendingRequestsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.TrainingRequests
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId && 
                           !r.IsDeleted && 
                           r.Status == TrainingRequestStatus.Submitted)
                .OrderBy(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<TrainingRequest> CreateRequestAsync(TrainingRequest request)
        {
            _context.TrainingRequests.Add(request);
            await _context.SaveChangesAsync();
            return request;
        }

        public async Task UpdateRequestAsync(TrainingRequest request)
        {
            _context.TrainingRequests.Update(request);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteRequestAsync(Guid id, Guid tenantId)
        {
            var request = await _context.TrainingRequests
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);
            
            if (request != null)
            {
                request.IsDeleted = true;

                _context.TrainingRequests.Update(request);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Statistics

        public async Task<int> GetTotalEnrollmentsAsync(Guid courseId, Guid tenantId)
        {
            return await _context.CourseEnrollments
                .CountAsync(e => e.CourseId == courseId && 
                                e.TenantId == tenantId && 
                                !e.IsDeleted);
        }

        public async Task<int> GetCompletedEnrollmentsCountAsync(Guid courseId, Guid tenantId)
        {
            return await _context.CourseEnrollments
                .CountAsync(e => e.CourseId == courseId && 
                                e.TenantId == tenantId && 
                                !e.IsDeleted && 
                                e.Status == EnrollmentStatus.Completed);
        }

        public async Task<decimal> GetAverageScoreAsync(Guid courseId, Guid tenantId)
        {
            var scores = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.CourseId == courseId && 
                           e.TenantId == tenantId && 
                           !e.IsDeleted && 
                           e.Score.HasValue)
                .Select(e => e.Score.GetValueOrDefault())
                .ToListAsync();

            return scores.Any() ? (decimal)scores.Average() : 0;
        }

        public async Task<Dictionary<string, int>> GetEnrollmentsByCategoryAsync(Guid tenantId)
        {
            var result = await _context.CourseEnrollments
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted)
                .Include(e => e.Course)
                .GroupBy(e => e.Course.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToListAsync();

            return result.ToDictionary(x => x.Category, x => x.Count);
        }

        public async Task<int> GetEmployeeCertificatesCountAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.TrainingCertificates
                .CountAsync(c => c.Enrollment.EmployeeId == employeeId && 
                                c.TenantId == tenantId && 
                                !c.IsDeleted);
        }

        #endregion
    }
}
