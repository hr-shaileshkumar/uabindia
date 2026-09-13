using System.Threading.Tasks;
using UabIndia.Core.Services;

namespace UabIndia.Application.Interfaces
{
    public interface IPolicyEngine
    {
        Task<PolicyDecision> EvaluateAsync(PolicyContext context);
    }
}
