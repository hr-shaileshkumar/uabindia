# ==============================================================================
# Multi-stage Dockerfile for UabIndia API (.NET 10)
# ==============================================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy solution and project definitions for caching restore layer
COPY ["UabIndia.sln", "./"]
COPY ["src/UabIndia.Core/UabIndia.Core.csproj", "src/UabIndia.Core/"]
COPY ["src/UabIndia.Application/UabIndia.Application.csproj", "src/UabIndia.Application/"]
COPY ["src/UabIndia.Infrastructure/UabIndia.Infrastructure.csproj", "src/UabIndia.Infrastructure/"]
COPY ["src/UabIndia.Identity/UabIndia.Identity.csproj", "src/UabIndia.Identity/"]
COPY ["src/UabIndia.Billing/UabIndia.Billing.csproj", "src/UabIndia.Billing/"]
COPY ["src/UabIndia.Api/UabIndia.Api.csproj", "src/UabIndia.Api/"]
COPY ["tests/UabIndia.Tests/UabIndia.Tests.csproj", "tests/UabIndia.Tests/"]

# Restore NuGet packages
RUN dotnet restore "src/UabIndia.Api/UabIndia.Api.csproj"

# Copy source code and build release bundle
COPY . .
WORKDIR "/src/src/UabIndia.Api"
RUN dotnet publish "UabIndia.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ==============================================================================
# Production Runtime Container
# ==============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

# Install runtime dependencies & security non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

COPY --from=build /app/publish .

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "UabIndia.Api.dll"]
