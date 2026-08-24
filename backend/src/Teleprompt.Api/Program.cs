using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Teleprompt.Api.Hubs;
using Teleprompt.Api.Middleware;
using Teleprompt.Api.Services;
using Teleprompt.Domain.Constants;
using Teleprompt.Infrastructure.Data;
using Teleprompt.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Teleprompt API",
        Version = "v1",
        Description = "Backend .NET (C#) + SQL Server do Teleprompt"
    });
});

builder.Services.AddInfrastructure(builder.Configuration);

var jwtSettings = new JwtSettings();
builder.Configuration.GetSection("Jwt").Bind(jwtSettings);
if (string.IsNullOrWhiteSpace(jwtSettings.Key))
    throw new InvalidOperationException("Jwt:Key não configurada no appsettings/UserSecrets.");
builder.Services.AddSingleton(jwtSettings);

builder.Services.AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<TelepromptDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "sub",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            // SignalR não envia Authorization header; usa query string em websocket.
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PolicyNames.SuperAdmin, p => p.RequireClaim(Permissions.IsSuperAdmin, "true"));
    options.AddPolicy(PolicyNames.ManagePermissions, p => p.RequireClaim(Permissions.CanManagePermissions, "true"));
    options.AddPolicy(PolicyNames.CanEdit, p => p.RequireAssertion(ctx =>
        ctx.User.HasClaim(c => c.Type == Permissions.IsEditor && c.Value == "true") ||
        ctx.User.HasClaim(c => c.Type == Permissions.IsSuperAdmin && c.Value == "true")));
    options.AddPolicy(PolicyNames.CanViewReports, p => p.RequireClaim(Permissions.CanViewReports, "true"));
    options.AddPolicy(PolicyNames.CanViewActivityHistory, p => p.RequireClaim(Permissions.CanViewActivityHistory, "true"));
    options.AddPolicy(PolicyNames.CanViewDebugLogs, p => p.RequireClaim(Permissions.CanViewDebugLogs, "true"));
    options.AddPolicy(PolicyNames.CanAssign, p => p.RequireClaim(Permissions.CanAssign, "true"));
    options.AddPolicy(PolicyNames.RequireRevert, p => p.RequireAssertion(ctx =>
        ctx.User.HasClaim(c => c.Type == Permissions.CanRevert && c.Value == "true") ||
        ctx.User.HasClaim(c => c.Type == Permissions.IsSuperAdmin && c.Value == "true")));
});

builder.Services.AddSignalR();

builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        var origins = (builder.Configuration["Cors:Origins"] ?? "http://localhost:3000")
            .Split(';', StringSplitOptions.RemoveEmptyEntries);
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("frontend");

// ---- Site estático: hub (/) + SPA Angular (/app) ----
// O build do Angular é copiado para wwwroot/app pelo script build-frontend
// (ou manualmente: ng build --output-path ../backend/src/Teleprompt.Api/wwwroot/app --base-href /app/).
var wwwroot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(wwwroot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseMiddleware<WorkspaceContextMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ScriptHub>("/hubs/script");
app.MapHub<TpHub>("/hubs/tp");

// Fallback da SPA Angular em /app/** (rotas de cliente, ex.: /app/editor/123).
if (Directory.Exists(Path.Combine(wwwroot, "app")))
    app.MapFallbackToFile("/app/{*path}", Path.Combine("app", "index.html"));

// Migrações + RLS + seed no startup (ambiente controlado).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TelepromptDbContext>();
    if (builder.Configuration["Database:Provider"] != "Sqlite")
        RlsSetup.Apply(db);
    await SeedData.SeedAsync(scope.ServiceProvider);
}

app.Run();

public static partial class PolicyNames
{
    public const string SuperAdmin = "SuperAdmin";
    public const string ManagePermissions = "ManagePermissions";
    public const string CanEdit = "CanEdit";
    public const string CanViewReports = "CanViewReports";
    public const string CanViewActivityHistory = "CanViewActivityHistory";
    public const string CanViewDebugLogs = "CanViewDebugLogs";
    public const string CanAssign = "CanAssign";
    public const string RequireRevert = "RequireRevert";
}

public partial class Program;
