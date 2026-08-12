namespace Teleprompt.Domain.Enums;

public enum UserStatus
{
    Active = 0,
    Inactive = 1,
    Pending = 2
}

public enum ProjectStatus
{
    Awaiting = 0,
    InProgress = 1,
    Completed = 2,
    Paused = 3,
    Delayed = 4,
    Backlog = 5
}

public enum Bucket
{
    Backlog = 0,
    EmAndamento = 1,
    Pausado = 2,
    EmRevisao = 3,
    EmAjuste = 4,
    Concluido = 5
}

public enum WorkspacePlan
{
    Free = 0,
    Pro = 1,
    Enterprise = 2,
    Lifetime = 3
}

public enum ScriptStatus
{
    Rascunho = 0,
    EmRevisao = 1,
    Aprovado = 2,
    Gravado = 3,
    Concluido = 4
}

public enum ActivityType
{
    Create = 0,
    Update = 1,
    Delete = 2,
    Comment = 3,
    Version = 4,
    Revert = 5,
    Assign = 6,
    Record = 7,
    Login = 8,
    Permission = 9,
    Other = 10
}

public enum LogLevel
{
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
    Fatal = 4
}

public enum TpScrollMode
{
    Paragraph = 0,
    Scene = 1,
    HalfScene = 2,
    Continuous = 3
}
