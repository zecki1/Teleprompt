using Microsoft.EntityFrameworkCore;

namespace Teleprompt.Infrastructure.Data;

/// <summary>
/// Aplica as políticas de Row-Level Security no SQL Server.
/// Tabelas com coluna WorkspaceId são filtradas por SESSION_CONTEXT('WorkspaceId').
/// Idempotente: pode ser executado no startup e nas migrations.
/// </summary>
public static class RlsSetup
{
    private const string FilterFn = "dbo.fn_workspace_rls";

    private static readonly string[] ScopedTables =
    [
        "Projects", "Scripts", "Presenters", "Teams", "Activities", "TpSessions"
    ];

    public static void Apply(TelepromptDbContext db)
    {
        var connection = db.Database.GetDbConnection();
        var isSqlServer = connection.GetType().Name.Contains("SqlConnection", StringComparison.OrdinalIgnoreCase);
        if (!isSqlServer)
            return;

        if (db.Database.GetPendingMigrations().Any())
            return;

        db.Database.ExecuteSqlRaw($"""
            IF OBJECT_ID(N'{FilterFn}') IS NULL
            BEGIN
                EXEC(N'CREATE FUNCTION {FilterFn}(@WorkspaceId nvarchar(36))
                    RETURNS TABLE WITH SCHEMABINDING AS
                    RETURN SELECT 1 AS result
                    WHERE @WorkspaceId = CAST(SESSION_CONTEXT(N''WorkspaceId'') AS nvarchar(36))
                       OR CAST(SESSION_CONTEXT(N''IsSuperAdmin'') AS bit) = 1
                       OR SESSION_CONTEXT(N''WorkspaceId'') IS NULL');
            END;
            """);

        foreach (var table in ScopedTables)
        {
            db.Database.ExecuteSqlRaw($"""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.security_policies WHERE name = N'rls_{table}'
                )
                BEGIN
                    DECLARE @sql nvarchar(max) = N'
                        CREATE SECURITY POLICY [rls_{table}]
                        ADD FILTER PREDICATE {FilterFn}(WorkspaceId) ON dbo.[{table}],
                        ADD BLOCK PREDICATE {FilterFn}(WorkspaceId) ON dbo.[{table}] AFTER UPDATE';
                    EXEC sp_executesql @sql;
                END;
                """);
        }
    }
}
