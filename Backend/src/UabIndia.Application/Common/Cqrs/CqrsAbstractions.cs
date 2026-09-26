using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Common.Cqrs
{
    /// <summary>
    /// Marker interface for a CQRS command that produces a result of type TResult.
    /// </summary>
    public interface ICommand<out TResult>
    {
    }

    /// <summary>
    /// Marker interface for a CQRS command that does not return a value.
    /// </summary>
    public interface ICommand : ICommand<Unit>
    {
    }

    /// <summary>
    /// Marker interface for a CQRS query that returns data of type TResult.
    /// </summary>
    public interface IQuery<out TResult>
    {
    }

    /// <summary>
    /// Represents a void or empty result for commands.
    /// </summary>
    public readonly struct Unit : IEquatable<Unit>
    {
        public static readonly Unit Value = new();
        public bool Equals(Unit other) => true;
        public override bool Equals(object? obj) => obj is Unit;
        public override int GetHashCode() => 0;
        public override string ToString() => "()";
        public static bool operator ==(Unit first, Unit second) => true;
        public static bool operator !=(Unit first, Unit second) => false;
    }

    /// <summary>
    /// Handler interface for executing a command that yields TResult.
    /// </summary>
    public interface ICommandHandler<in TCommand, TResult> where TCommand : ICommand<TResult>
    {
        Task<TResult> HandleAsync(TCommand command, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Handler interface for executing a command without a return value.
    /// </summary>
    public interface ICommandHandler<in TCommand> : ICommandHandler<TCommand, Unit> where TCommand : ICommand
    {
    }

    /// <summary>
    /// Handler interface for executing a query.
    /// </summary>
    public interface IQueryHandler<in TQuery, TResult> where TQuery : IQuery<TResult>
    {
        Task<TResult> HandleAsync(TQuery query, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Unified application dispatcher mediating commands and queries.
    /// </summary>
    public interface IDispatcher
    {
        Task<TResult> SendAsync<TResult>(ICommand<TResult> command, CancellationToken cancellationToken = default);
        Task SendAsync(ICommand command, CancellationToken cancellationToken = default);
        Task<TResult> QueryAsync<TResult>(IQuery<TResult> query, CancellationToken cancellationToken = default);
    }
}
