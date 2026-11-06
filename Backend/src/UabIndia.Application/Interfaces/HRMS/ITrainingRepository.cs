using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Training & Development operations.
    /// </summary>
    public interface ITrainingRepository
    {
        #region TrainingCourse Operations

        Task<TrainingCourse?> GetCourseByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<TrainingCourse>> GetAllCoursesAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<TrainingCourse>> GetActiveCoursesAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<TrainingCourse>> GetCoursesByCategoryAsync(Guid tenantId, string category, int skip = 0, int take = 20);
        Task<IEnumerable<TrainingCourse>> GetCoursesByStatusAsync(Guid tenantId, TrainingCourseStatus status, int skip = 0, int take = 20);
        Task<TrainingCourse> CreateCourseAsync(TrainingCourse course);
        Task UpdateCourseAsync(TrainingCourse course);
        Task DeleteCourseAsync(Guid id, Guid tenantId);

        #endregion

        #region CourseEnrollment Operations

        Task<CourseEnrollment?> GetEnrollmentByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<CourseEnrollment>> GetEnrollmentsByCourseAsync(Guid courseId, Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<CourseEnrollment>> GetEnrollmentsByEmployeeAsync(Guid employeeId, Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<CourseEnrollment>> GetEnrollmentsByStatusAsync(Guid tenantId, EnrollmentStatus status, int skip = 0, int take = 20);
        Task<CourseEnrollment?> GetEnrollmentByCourseAndEmployeeAsync(Guid courseId, Guid employeeId, Guid tenantId);
        Task<IEnumerable<CourseEnrollment>> GetCompletedEnrollmentsAsync(Guid employeeId, Guid tenantId);
        Task<CourseEnrollment> CreateEnrollmentAsync(CourseEnrollment enrollment);
        Task UpdateEnrollmentAsync(CourseEnrollment enrollment);
        Task DeleteEnrollmentAsync(Guid id, Guid tenantId);

        #endregion

        #region TrainingAssessment Operations

        Task<TrainingAssessment?> GetAssessmentByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<TrainingAssessment>> GetAssessmentsByEnrollmentAsync(Guid enrollmentId, Guid tenantId);
        Task<IEnumerable<TrainingAssessment>> GetAssessmentsByCourseAsync(Guid courseId, Guid tenantId);
        Task<TrainingAssessment> CreateAssessmentAsync(TrainingAssessment assessment);
        Task UpdateAssessmentAsync(TrainingAssessment assessment);
        Task DeleteAssessmentAsync(Guid id, Guid tenantId);

        #endregion

        #region TrainingCertificate Operations

        Task<TrainingCertificate?> GetCertificateByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<TrainingCertificate>> GetCertificatesByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<TrainingCertificate?> GetCertificateByNumberAsync(string certificateNumber, Guid tenantId);
        Task<TrainingCertificate> CreateCertificateAsync(TrainingCertificate certificate);
        Task UpdateCertificateAsync(TrainingCertificate certificate);

        #endregion

        #region TrainingRequest Operations

        Task<TrainingRequest?> GetRequestByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<TrainingRequest>> GetRequestsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<TrainingRequest>> GetRequestsByStatusAsync(Guid tenantId, TrainingRequestStatus status, int skip = 0, int take = 20);
        Task<IEnumerable<TrainingRequest>> GetPendingRequestsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<TrainingRequest> CreateRequestAsync(TrainingRequest request);
        Task UpdateRequestAsync(TrainingRequest request);
        Task DeleteRequestAsync(Guid id, Guid tenantId);

        #endregion

        #region Statistics

        Task<int> GetTotalEnrollmentsAsync(Guid courseId, Guid tenantId);
        Task<int> GetCompletedEnrollmentsCountAsync(Guid courseId, Guid tenantId);
        Task<decimal> GetAverageScoreAsync(Guid courseId, Guid tenantId);
        Task<Dictionary<string, int>> GetEnrollmentsByCategoryAsync(Guid tenantId);
        Task<int> GetEmployeeCertificatesCountAsync(Guid employeeId, Guid tenantId);

        #endregion
    }
}
