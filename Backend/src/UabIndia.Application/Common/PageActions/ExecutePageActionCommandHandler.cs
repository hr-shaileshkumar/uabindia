using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Common.Cqrs;

namespace UabIndia.Application.Common.PageActions
{
    public class ExecutePageActionCommandHandler : ICommandHandler<ExecutePageActionCommand, PageActionResult>
    {
        private readonly IEnumerable<IPageActionHandler> _handlers;

        public ExecutePageActionCommandHandler(IEnumerable<IPageActionHandler> handlers)
        {
            _handlers = handlers;
        }

        public async Task<PageActionResult> HandleAsync(ExecutePageActionCommand command, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(command);

            var handler = _handlers.FirstOrDefault(h => h.CanHandle(command.ActionType, command.ActionKey));
            if (handler == null)
            {
                return PageActionResult.Failed($"No handler registered for page action type '{command.ActionType}' or key '{command.ActionKey}'.");
            }

            try
            {
                return await handler.ExecuteAsync(command, cancellationToken);
            }
            catch (Exception ex)
            {
                return PageActionResult.Failed($"Execution failed: {ex.Message}");
            }
        }
    }
}
