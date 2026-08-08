namespace UabIndia.Application.Interfaces
{
    /// <summary>
    /// Distinguishes HTTP API requests from background/offline work so audit and
    /// other request-scoped behavior can be applied consistently.
    /// </summary>
    public interface IRequestContext
    {
        bool IsHttpRequest { get; }
    }
}
