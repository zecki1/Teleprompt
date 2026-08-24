using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Teleprompt.Migrator;

/// <summary>
/// Cliente REST do Firestore autenticado com e-mail/senha do Firebase Auth
/// (identitytoolkit). Não requer pacote externo nem chave de conta de serviço.
/// </summary>
public sealed class FirestoreClient
{
    private readonly HttpClient _http = new();
    private readonly string _apiKey;
    private readonly string _projectId;

    private string? _idToken;
    private string? _refreshToken;

    /// <summary>UID da conta autenticada.</summary>
    public string Uid { get; private set; } = "";

    public FirestoreClient(string apiKey, string projectId)
    {
        _apiKey = apiKey;
        _projectId = projectId;
    }

    private string Base => $"https://firestore.googleapis.com/v1/projects/{_projectId}/databases/(default)/documents";

    /// <summary>Autentica via Firebase Auth (e-mail + senha).</summary>
    public async Task SignInAsync(string email, string password)
    {
        var res = await _http.PostAsJsonAsync(
            $"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={_apiKey}",
            new { email, password, returnSecureToken = true });

        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        if (!res.IsSuccessStatusCode)
        {
            var msg = json.TryGetProperty("error", out var err) ? err.GetProperty("message").GetString() : "erro desconhecido";
            throw new InvalidOperationException($"Falha no login Firebase: {msg}");
        }

        _idToken = json.GetProperty("idToken").GetString();
        _refreshToken = json.GetProperty("refreshToken").GetString();
        Uid = json.GetProperty("localId").GetString() ?? "";
    }

    public async Task EnsureTokenAsync()
    {
        if (_idToken is not null) return;

        // Token expirou (~1h): renova via refresh_token grant.
        var res = await _http.PostAsync(
            $"https://securetoken.googleapis.com/v1/token?key={_apiKey}",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = _refreshToken!,
            }));

        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        res.EnsureSuccessStatusCode();
        _idToken = json.GetProperty("id_token").GetString();
        _refreshToken = json.GetProperty("refresh_token").GetString();
    }

    /// <summary>Lista todos os documentos de uma coleção, paginando automaticamente.</summary>
    public async Task<List<FsDoc>> ListAllAsync(string collection, int pageSize = 300)
    {
        var all = new List<FsDoc>();
        var pageToken = (string?)null;

        do
        {
            await EnsureTokenAsync();
            var url = $"{Base}/{collection}?pageSize={pageSize}";
            if (pageToken is not null) url += $"&pageToken={Uri.EscapeDataString(pageToken)}";

            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Authorization = new("Bearer", _idToken);

            var res = await _http.SendAsync(req);
            var body = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                throw new InvalidOperationException($"Erro ao ler '{collection}': HTTP {(int)res.StatusCode} — {body[..Math.Min(200, body.Length)]}");

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("documents", out var docs))
            {
                foreach (var d in docs.EnumerateArray())
                    all.Add(FsDoc.From(d));
            }

            pageToken = root.TryGetProperty("nextPageToken", out var tok) ? tok.GetString() : null;
        } while (pageToken is not null);

        return all;
    }

    /// <summary>Lista documentos de uma subcoleção (ex.: scripts/{id}/versions).</summary>
    public Task<List<FsDoc>> ListSubcollectionAsync(string parentCollection, string parentId, string subcollection)
        => ListAllCoreAsync($"{parentCollection}/{parentId}/{subcollection}");

    /// <summary>
    /// Lista documentos de uma coleção via consulta estruturada filtrada por campo
    /// (contorna regras que exigem belongsToMyWorkspace em consultas de lista).
    /// </summary>
    public async Task<List<FsDoc>> RunQueryAsync(string collectionId, string whereField, string equalsValue)
    {
        await EnsureTokenAsync();

        var body = new
        {
            structuredQuery = new
            {
                from = new[] { new { collectionId } },
                where = new
                {
                    fieldFilter = new
                    {
                        field = new { fieldPath = whereField },
                        op = "EQUAL",
                        value = new { stringValue = equalsValue },
                    },
                },
            },
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, $"{Base}:runQuery")
        {
            Content = JsonContent.Create(body),
        };
        req.Headers.Authorization = new("Bearer", _idToken);

        var res = await _http.SendAsync(req);
        var bodyText = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erro ao consultar '{collectionId}' (workspace={equalsValue[..Math.Min(8, equalsValue.Length)]}…): HTTP {(int)res.StatusCode}");

        var docs = new List<FsDoc>();
        foreach (var element in JsonSerializer.Deserialize<JsonElement>(bodyText).EnumerateArray())
        {
            if (element.TryGetProperty("document", out var d))
                docs.Add(FsDoc.From(d));
        }
        return docs;
    }

    /// <summary>
    /// Lê uma coleção inteira: tenta listagem direta e, se as regras negarem,
    /// cai para consultas filtradas pelos workspaces da própria conta.
    /// </summary>
    public async Task<(List<FsDoc> docs, List<string> partialWorkspaces)> ListAllOrPerWorkspaceAsync(string collection)
    {
        try
        {
            return (await ListAllAsync(collection), new List<string>());
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("403"))
        {
            // Descobre os workspaces da conta autenticada e consulta um a um.
            var self = await GetDocumentAsync("users", Uid);
            var workspaceIds = new List<string>();
            if (self.StrOrNull("workspaceId") is { Length: > 0 } primary) workspaceIds.Add(primary);
            workspaceIds.AddRange(self.StrList("workspaces").Where(w => !workspaceIds.Contains(w)));

            var all = new List<FsDoc>();
            foreach (var ws in workspaceIds)
                all.AddRange(await RunQueryAsync(collection, "workspaceId", ws));

            return (all, workspaceIds);
        }
    }

    /// <summary>Lê um documento único pelo caminho coleção/id.</summary>
    public async Task<FsDoc> GetDocumentAsync(string collection, string id)
    {
        await EnsureTokenAsync();
        using var req = new HttpRequestMessage(HttpMethod.Get, $"{Base}/{collection}/{id}");
        req.Headers.Authorization = new("Bearer", _idToken);

        var res = await _http.SendAsync(req);
        var body = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erro ao ler {collection}/{id}: HTTP {(int)res.StatusCode}");

        return FsDoc.From(JsonSerializer.Deserialize<JsonElement>(body));
    }

    private async Task<List<FsDoc>> ListAllCoreAsync(string path)
    {        var all = new List<FsDoc>();
        var pageToken = (string?)null;

        do
        {
            await EnsureTokenAsync();
            var url = $"{Base}/{path}?pageSize=300";
            if (pageToken is not null) url += $"&pageToken={Uri.EscapeDataString(pageToken)}";

            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Authorization = new("Bearer", _idToken);

            var res = await _http.SendAsync(req);
            var body = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                throw new InvalidOperationException($"Erro ao ler '{path}': HTTP {(int)res.StatusCode} — {body[..Math.Min(200, body.Length)]}");

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("documents", out var docs))
            {
                foreach (var d in docs.EnumerateArray())
                    all.Add(FsDoc.From(d));
            }

            pageToken = root.TryGetProperty("nextPageToken", out var tok) ? tok.GetString() : null;
        } while (pageToken is not null);

        return all;
    }
}

/// <summary>Documento Firestore desserializado: Id + campos tipados convertidos.</summary>
public sealed class FsDoc
{
    public required string Id { get; init; }
    public required Dictionary<string, object?> Fields { get; init; }

    public static FsDoc From(JsonElement el)
    {
        var name = el.GetProperty("name").GetString()!;
        var id = name[(name.LastIndexOf('/') + 1)..];

        var fields = new Dictionary<string, object?>();
        if (el.TryGetProperty("fields", out var f))
        {
            foreach (var prop in f.EnumerateObject())
                fields[prop.Name] = ParseValue(prop.Value);
        }

        return new FsDoc { Id = id, Fields = fields };
    }

    private static object? ParseValue(JsonElement v)
    {
        var type = v.EnumerateObject().First();
        return type.Value.ValueKind == JsonValueKind.Null
            ? null
            : type.Name switch
            {
                "stringValue" => type.Value.GetString(),
                "booleanValue" => type.Value.GetBoolean(),
                "integerValue" => (object)long.Parse(type.Value.GetString()!),
                "doubleValue" => type.Value.GetDouble(),
                "timestampValue" => DateTime.Parse(type.Value.GetString()!).ToUniversalTime(),
                "nullValue" => null,
                "arrayValue" => ParseArray(type.Value),
                "mapValue" => ParseMap(type.Value),
                _ => type.Value.ToString(),
            };
    }

    private static List<object?> ParseArray(JsonElement v)
    {
        var list = new List<object?>();
        if (v.TryGetProperty("values", out var values))
            foreach (var item in values.EnumerateArray())
                list.Add(ParseValue(item));
        return list;
    }

    private static Dictionary<string, object?> ParseMap(JsonElement v)
    {
        var map = new Dictionary<string, object?>();
        if (v.TryGetProperty("fields", out var f))
            foreach (var prop in f.EnumerateObject())
                map[prop.Name] = ParseValue(prop.Value);
        return map;
    }

    // ---- Helpers de leitura ----

    public string Str(string key, string fallback = "") =>
        Fields.TryGetValue(key, out var v) && v is string s ? s : fallback;

    public string? StrOrNull(string key) =>
        Fields.TryGetValue(key, out var v) && v is string s && s.Length > 0 ? s : null;

    public bool Bool(string key, bool fallback = false) =>
        Fields.TryGetValue(key, out var v) && v is bool b ? b : fallback;

    public double Num(string key, double fallback = 0) =>
        Fields.TryGetValue(key, out var v)
            ? v switch
            {
                double d => d,
                long l => l,
                int i => i,
                _ => fallback
            }
            : fallback;

    public List<string> StrList(string key) =>
        Fields.TryGetValue(key, out var v) && v is List<object?> l
            ? l.OfType<string>().ToList()
            : new();

    public Dictionary<string, string>? MapOfStrings(string key) =>
        Fields.TryGetValue(key, out var v) && v is Dictionary<string, object?> m
            ? m.Where(kv => kv.Value is string).ToDictionary(kv => kv.Key, kv => (string)kv.Value!)
            : null;

    public object? Raw(string key) => Fields.TryGetValue(key, out var v) ? v : null;

    /// <summary>Data de criação: campo createdAt (string ISO ou timestamp) ou época.</summary>
    public DateTime CreatedAt()
    {
        if (Fields.TryGetValue("createdAt", out var v))
        {
            if (v is DateTime dt) return dt;
            if (v is string s && DateTime.TryParse(s, out var parsed)) return parsed.ToUniversalTime();
        }
        return DateTime.UtcNow;
    }

    public DateTime UpdatedAtOrCreated()
    {
        if (Fields.TryGetValue("updatedAt", out var v))
        {
            if (v is DateTime dt) return dt;
            if (v is string s && DateTime.TryParse(s, out var parsed)) return parsed.ToUniversalTime();
        }
        return CreatedAt();
    }
}
