namespace Teleprompt.Domain.Enums;

public enum Role
{
    SuperAdmin = 0,
    Diretor = 1,
    Coordenador = 2,
    Orientador = 3,
    Docente = 4,
    Especialista = 5,
    Assistente = 6,
    Analista = 7,
    Tutor = 8,
    Monitor = 9,
    Tecnico = 10,
    Estagiario = 11,
    Editor = 12,
    Validador = 13,
    Publico = 14
}

public static class RoleNames
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Diretor = "Diretor";
    public const string Coordenador = "Coordenador";
    public const string Orientador = "Orientador";
    public const string Docente = "Docente";
    public const string Especialista = "Especialista";
    public const string Assistente = "Assistente";
    public const string Analista = "Analista";
    public const string Tutor = "Tutor";
    public const string Monitor = "Monitor";
    public const string Tecnico = "Técnico";
    public const string Estagiario = "Estagiário";
    public const string Editor = "editor";
    public const string Validador = "validador";
    public const string Publico = "publico";

    public static string GetName(Role role) => role switch
    {
        Role.SuperAdmin => SuperAdmin,
        Role.Diretor => Diretor,
        Role.Coordenador => Coordenador,
        Role.Orientador => Orientador,
        Role.Docente => Docente,
        Role.Especialista => Especialista,
        Role.Assistente => Assistente,
        Role.Analista => Analista,
        Role.Tutor => Tutor,
        Role.Monitor => Monitor,
        Role.Tecnico => Tecnico,
        Role.Estagiario => Estagiario,
        Role.Editor => Editor,
        Role.Validador => Validador,
        Role.Publico => Publico,
        _ => Publico
    };

    public static bool TryGetRole(string? name, out Role role)
    {
        return Enum.TryParse<Role>(name, true, out role);
    }
}
