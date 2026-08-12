using System.Data.Common;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace Teleprompt.Infrastructure.Data;

/// <summary>
/// Injeta o contexto de sessão (workspace/usuario) do SQL Server a cada conexão
/// aberta, habilitando as políticas de Row-Level Security por workspace.
/// </summary>
public sealed class RlsDbConnectionInterceptor : DbConnectionInterceptor
{
    private readonly IServiceProvider _services;

    public RlsDbConnectionInterceptor(IServiceProvider services)
    {
        _services = services;
    }

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        ApplySessionContext(connection);
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection, ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        ApplySessionContext(connection);
        await Task.CompletedTask;
    }

    private void ApplySessionContext(DbConnection connection)
    {
        if (connection is not SqlConnection || !connection.State.Equals(System.Data.ConnectionState.Open))
            return;

        using var scope = _services.CreateScope();
        var accessor = scope.ServiceProvider.GetService<WorkspaceAccessor>();
        if (accessor == null)
            return;

        using var cmd = connection.CreateCommand();
        cmd.CommandText = """
            EXEC sp_set_session_context @key = N'WorkspaceId', @value = @workspaceId, @read_only = 0;
            EXEC sp_set_session_context @key = N'UserId', @value = @userId, @read_only = 0;
            EXEC sp_set_session_context @key = N'IsSuperAdmin', @value = @isSuperAdmin, @read_only = 0;
            """;

        var p1 = cmd.CreateParameter();
        p1.ParameterName = "@workspaceId";
        p1.Value = (object?)accessor.WorkspaceId ?? DBNull.Value;
        cmd.Parameters.Add(p1);

        var p2 = cmd.CreateParameter();
        p2.ParameterName = "@userId";
        p2.Value = (object?)accessor.UserId ?? DBNull.Value;
        cmd.Parameters.Add(p2);

        var p3 = cmd.CreateParameter();
        p3.ParameterName = "@isSuperAdmin";
        p3.Value = accessor.IsSuperAdmin ? 1 : 0;
        cmd.Parameters.Add(p3);

        cmd.ExecuteNonQuery();
    }
}
