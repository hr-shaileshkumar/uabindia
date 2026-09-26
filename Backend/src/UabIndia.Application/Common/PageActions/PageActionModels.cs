using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Common.Cqrs;

namespace UabIndia.Application.Common.PageActions
{
    public class ExecutePageActionCommand : ICommand<PageActionResult>
    {
        public string PageKey { get; set; } = string.Empty;
        public string ActionKey { get; set; } = string.Empty;
        public string ActionType { get; set; } = "custom"; // workflowTrigger | statusTransition | cloneRecord | batchUpdate | custom
        public Guid? EntityId { get; set; }
        public List<Guid> SelectedIds { get; set; } = new();
        public Dictionary<string, object?> Parameters { get; set; } = new();
        public Guid UserId { get; set; }
        public Guid TenantId { get; set; }
    }

    public class PageActionResult
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
        public string? NextAction { get; set; } // refresh | navigate | openModal | notify
        public string? RedirectUrl { get; set; }

        public static PageActionResult Succeeded(string message, object? data = null, string? nextAction = "refresh", string? redirectUrl = null) =>
            new()
            {
                Success = true,
                Message = message,
                Data = data,
                NextAction = nextAction,
                RedirectUrl = redirectUrl
            };

        public static PageActionResult Failed(string message) =>
            new()
            {
                Success = false,
                Message = message,
                NextAction = "notify"
            };
    }

    public interface IPageActionHandler
    {
        bool CanHandle(string actionType, string actionKey);
        Task<PageActionResult> ExecuteAsync(ExecutePageActionCommand command, CancellationToken cancellationToken = default);
    }
}
