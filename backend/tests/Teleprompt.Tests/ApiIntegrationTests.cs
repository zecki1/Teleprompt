using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Teleprompt.Tests;

public class ApiIntegrationTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    private static StringContent Json(object body) =>
        new(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

    private async Task<string> LoginAsync(string email = "demo@teleprompt.app", string password = "Demo@12345")
    {
        var response = await _client.PostAsync("/api/v1/auth/login", Json(new { email, password }));
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("token").GetString()!;
    }

    private void Auth(string token)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task Register_login_e_me()
    {
        var email = $"user-{Guid.NewGuid():N}@test.com";
        var register = await _client.PostAsync("/api/v1/auth/register", Json(new
        {
            email,
            password = "Senha@123",
            displayName = "Usuário Teste"
        }));
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);

        var login = await _client.PostAsync("/api/v1/auth/login", Json(new { email, password = "Senha@123" }));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var token = await LoginAsync(email, "Senha@123");

        Auth(token);
        var me = await _client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var body = await me.Content.ReadAsStringAsync();
        Assert.Contains(email, body);
    }

    [Fact]
    public async Task Login_invalido_retorna_401()
    {
        var response = await _client.PostAsync("/api/v1/auth/login",
            Json(new { email = "nada@test.com", password = "errada123" }));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Sem_token_retorna_401()
    {
        var response = await _client.GetAsync("/api/v1/scripts");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Fluxo_completo_projeto_roteiro_versao_comentario_checklist()
    {
        Auth(await LoginAsync());

        var project = await _client.PostAsync("/api/v1/projects", Json(new
        {
            name = "Projeto Teste",
            status = "Awaiting",
            bucket = "Backlog"
        }));
        Assert.Equal(HttpStatusCode.OK, project.StatusCode);
        var projectBody = await project.Content.ReadAsStringAsync();
        using var projectDoc = JsonDocument.Parse(projectBody);
        var projectId = projectDoc.RootElement.GetProperty("id").GetString()!;

        var script = await _client.PostAsync("/api/v1/scripts", Json(new
        {
            projectId,
            title = "Roteiro Teste",
            content = "Cena1\nTempo: 30s\n[Locução]: Fala original"
        }));
        Assert.Equal(HttpStatusCode.OK, script.StatusCode);
        using var scriptDoc = JsonDocument.Parse(await script.Content.ReadAsStringAsync());
        var scriptId = scriptDoc.RootElement.GetProperty("id").GetString()!;

        // Update gera versão (snapshot) e incrementa a versão atual
        var update = await _client.PutAsync($"/api/v1/scripts/{scriptId}", Json(new
        {
            content = "Cena1\nTempo: 30s\n[Locução]: Fala atualizada"
        }));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        using var updateDoc = JsonDocument.Parse(await update.Content.ReadAsStringAsync());
        Assert.Equal(2, updateDoc.RootElement.GetProperty("version").GetInt32());

        var versions = await _client.GetAsync($"/api/v1/scripts/{scriptId}/versions");
        using var versionsDoc = JsonDocument.Parse(await versions.Content.ReadAsStringAsync());
        Assert.Equal(1, versionsDoc.RootElement.GetArrayLength());

        // Comentário
        var comment = await _client.PostAsync($"/api/v1/scripts/{scriptId}/comments", Json(new
        {
            body = "Revisar"
        }));
        Assert.Equal(HttpStatusCode.OK, comment.StatusCode);

        // Checklist (sem Id)
        var checklist = await _client.PutAsync($"/api/v1/scripts/{scriptId}/checklist", Json(new
        {
            items = new[]
            {
                new { label = "Revisão ortográfica", required = true, isChecked = true }
            }
        }));
        Assert.Equal(HttpStatusCode.NoContent, checklist.StatusCode);

        var checklistGet = await _client.GetAsync($"/api/v1/scripts/{scriptId}/checklist");
        Assert.Equal(HttpStatusCode.OK, checklistGet.StatusCode);

        // Parser
        var parse = await _client.PostAsync("/api/v1/scripts/parse", Json(new
        {
            content = "Cena1\n[Let1]: Titulo\n[Locução]: Fala",
            paragraphsPerScene = 0
        }));
        Assert.Equal(HttpStatusCode.OK, parse.StatusCode);
        var parseBody = await parse.Content.ReadAsStringAsync();
        Assert.Contains("Titulo", parseBody);
    }

    [Fact]
    public async Task Relatorio_retorna_totais()
    {
        Auth(await LoginAsync());

        var response = await _client.GetAsync("/api/v1/reports");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.GetProperty("totalProjects").GetInt32() >= 1);
        Assert.True(doc.RootElement.GetProperty("totalScripts").GetInt32() >= 1);
    }

    [Fact]
    public async Task Atividades_requerem_permissao_do_usuario_logado()
    {
        Auth(await LoginAsync());

        var response = await _client.GetAsync("/api/v1/activities");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
