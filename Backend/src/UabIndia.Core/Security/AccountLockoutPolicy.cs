using System;
using UabIndia.Core.Entities;

namespace UabIndia.Core.Security
{
    public static class AccountLockoutPolicy
    {
        public const int DefaultMaxFailedAttempts = 5;
        public static readonly TimeSpan DefaultLockoutDuration = TimeSpan.FromMinutes(15);

        public static bool IsLockedOut(User user, DateTime utcNow)
        {
            return user.LockoutEnabled
                && user.LockoutEnd.HasValue
                && user.LockoutEnd.Value > utcNow;
        }

        public static void RegisterFailedAttempt(User user, int maxAttempts, TimeSpan lockoutDuration, DateTime utcNow)
        {
            user.AccessFailedCount++;
            if (user.AccessFailedCount >= maxAttempts)
            {
                user.LockoutEnd = utcNow.Add(lockoutDuration);
            }
        }

        public static void ResetFailedAttempts(User user)
        {
            user.AccessFailedCount = 0;
            user.LockoutEnd = null;
        }
    }
}
