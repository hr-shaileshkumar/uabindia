using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace UabIndia.Infrastructure.Data
{
    public class TenantModelCacheKeyFactory : IModelCacheKeyFactory
    {
        public object Create(DbContext context, bool designTime)
        {
            if (context is ApplicationDbContext tenantContext)
            {
                return new { Type = context.GetType(), Schema = tenantContext.CurrentTenantSchema, DesignTime = designTime };
            }

            return new { Type = context.GetType(), Schema = string.Empty, DesignTime = designTime };
        }
    }
}
