using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Teleprompt.Infrastructure.Data;

namespace Teleprompt.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registra o DbContext. Provider padrão: SQL Server (produção/VM).
    /// Em desenvolvimento sem SQL Server, use "Database:Provider" = "Sqlite"
    /// (appsettings.Development.json) para rodar tudo localmente.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"] ?? "SqlServer";
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection não configurada.");

        services.AddDbContext<TelepromptDbContext>((sp, options) =>
        {
            if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                options.UseSqlite(connectionString);
            }
            else
            {
                options.UseSqlServer(connectionString, sql =>
                {
                    sql.MigrationsAssembly(typeof(TelepromptDbContext).Assembly.FullName);
                });
                options.AddInterceptors(new RlsDbConnectionInterceptor(sp));
            }
        });

        services.AddScoped<WorkspaceAccessor>();

        return services;
    }
}
