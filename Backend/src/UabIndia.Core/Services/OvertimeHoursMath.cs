using System;
using UabIndia.Core.Entities;

namespace UabIndia.Core.Services
{
    public static class OvertimeHoursMath
    {
        public static (decimal TotalHours, decimal NetHours) Calculate(TimeSpan start, TimeSpan end, int breakMinutes)
        {
            var duration = end - start;
            if (duration <= TimeSpan.Zero)
                duration = duration.Add(TimeSpan.FromDays(1));

            var totalHours = (decimal)(duration.TotalMinutes / 60d);
            var netHours = totalHours - (breakMinutes / 60m);
            if (netHours <= 0)
                throw new InvalidOperationException("Overtime hours must be greater than zero");

            return (
                Math.Round(totalHours, 2, MidpointRounding.AwayFromZero),
                Math.Round(netHours, 2, MidpointRounding.AwayFromZero));
        }

        public static void Apply(OvertimeRequest request)
        {
            var (totalHours, netHours) = Calculate(request.StartTime, request.EndTime, request.BreakMinutes);
            request.TotalHours = totalHours;
            request.NetOvertimeHours = netHours;
        }
    }
}
