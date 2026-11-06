using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace UabIndia.Application.Common.Cqrs
{
    public class ApplicationDispatcher : IDispatcher
    {
        private readonly IServiceProvider _serviceProvider;

        public ApplicationDispatcher(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<TResult> SendAsync<TResult>(ICommand<TResult> command, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(command);

            var commandType = command.GetType();
            var handlerType = typeof(ICommandHandler<,>).MakeGenericType(commandType, typeof(TResult));

            var handler = _serviceProvider.GetService(handlerType);
            if (handler == null)
            {
                throw new InvalidOperationException($"No command handler registered for '{commandType.Name}' returning '{typeof(TResult).Name}'.");
            }

            var method = handlerType.GetMethod(nameof(ICommandHandler<ICommand<TResult>, TResult>.HandleAsync));
            if (method == null)
            {
                throw new InvalidOperationException($"Handler for '{commandType.Name}' is missing HandleAsync method.");
            }

            var task = (Task<TResult>)method.Invoke(handler, new object[] { command, cancellationToken })!;
            return await task;
        }

        public async Task SendAsync(ICommand command, CancellationToken cancellationToken = default)
        {
            await SendAsync<Unit>(command, cancellationToken);
        }

        public async Task<TResult> QueryAsync<TResult>(IQuery<TResult> query, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(query);

            var queryType = query.GetType();
            var handlerType = typeof(IQueryHandler<,>).MakeGenericType(queryType, typeof(TResult));

            var handler = _serviceProvider.GetService(handlerType);
            if (handler == null)
            {
                throw new InvalidOperationException($"No query handler registered for '{queryType.Name}' returning '{typeof(TResult).Name}'.");
            }

            var method = handlerType.GetMethod(nameof(IQueryHandler<IQuery<TResult>, TResult>.HandleAsync));
            if (method == null)
            {
                throw new InvalidOperationException($"Handler for '{queryType.Name}' is missing HandleAsync method.");
            }

            var task = (Task<TResult>)method.Invoke(handler, new object[] { query, cancellationToken })!;
            return await task;
        }
    }
}
