using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Teleprompt.Tests;

public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbFile = Path.Combine(Path.GetTempPath(), $"teleprompt-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "Sqlite",
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_dbFile}",
                ["Jwt:Key"] = "test-secret-key-with-more-than-32-characters-1234567890",
                ["Jwt:Issuer"] = "teleprompt",
                ["Jwt:Audience"] = "teleprompt-client",
                ["Cors:Origins"] = "http://localhost:3000"
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (File.Exists(_dbFile)) File.Delete(_dbFile);
    }
}
