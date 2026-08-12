namespace Teleprompt.Api.Services;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "teleprompt";
    public string Audience { get; set; } = "teleprompt-client";
}
