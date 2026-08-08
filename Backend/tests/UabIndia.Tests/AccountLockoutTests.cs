using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Core.Security;
using UabIndia.Infrastructure.Data;
using Xunit;

namespace UabIndia.Tests;

public sealed class AccountLockoutPolicyTests
{
    [Fact]
    public void IsLockedOut_ReturnsTrue_WhenLockoutEndIsInFuture()
    {
        var user = new User
        {
            LockoutEnabled = true,
            LockoutEnd = DateTime.UtcNow.AddMinutes(5)
        };

        Assert.True(AccountLockoutPolicy.IsLockedOut(user, DateTime.UtcNow));
    }

    [Fact]
    public void IsLockedOut_ReturnsFalse_WhenLockoutDisabled()
    {
        var user = new User
        {
            LockoutEnabled = false,
            LockoutEnd = DateTime.UtcNow.AddMinutes(5)
        };

        Assert.False(AccountLockoutPolicy.IsLockedOut(user, DateTime.UtcNow));
    }

    [Fact]
    public void RegisterFailedAttempt_SetsLockoutEnd_AfterMaxAttempts()
    {
        var user = new User();
        var utcNow = DateTime.UtcNow;

        for (var attempt = 1; attempt < AccountLockoutPolicy.DefaultMaxFailedAttempts; attempt++)
        {
            AccountLockoutPolicy.RegisterFailedAttempt(
                user,
                AccountLockoutPolicy.DefaultMaxFailedAttempts,
                AccountLockoutPolicy.DefaultLockoutDuration,
                utcNow);
        }

        Assert.Null(user.LockoutEnd);

        AccountLockoutPolicy.RegisterFailedAttempt(
            user,
            AccountLockoutPolicy.DefaultMaxFailedAttempts,
            AccountLockoutPolicy.DefaultLockoutDuration,
            utcNow);

        Assert.Equal(AccountLockoutPolicy.DefaultMaxFailedAttempts, user.AccessFailedCount);
        Assert.NotNull(user.LockoutEnd);
        Assert.True(user.LockoutEnd > utcNow);
    }

    [Fact]
    public void ResetFailedAttempts_ClearsCounters()
    {
        var user = new User
        {
            AccessFailedCount = 3,
            LockoutEnd = DateTime.UtcNow.AddMinutes(10)
        };

        AccountLockoutPolicy.ResetFailedAttempts(user);

        Assert.Equal(0, user.AccessFailedCount);
        Assert.Null(user.LockoutEnd);
    }
}
