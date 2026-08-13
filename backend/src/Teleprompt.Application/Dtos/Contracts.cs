namespace Teleprompt.Application.Dtos;

public record RegisterRequest(string Email, string Password, string? DisplayName);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string Token);

public record AuthResponse(string Token, UserDto User);

public record UserDto(
    string Id, string? Email, string? DisplayName, string Role,
    bool IsSuperAdmin, bool CanManagePermissions, bool CanCollaborate,
    bool IsEditor, bool IsRevisor, bool CanRevert, bool CanViewAdmin,
    bool CanViewReports, bool CanViewActivityHistory, bool CanViewDebugLogs,
    bool CanAssign, bool RequiresChecklist, string Status, string? WorkspaceId);

public record UpdateProfileRequest(string? DisplayName, string? AvatarUrl);

public record UpdatePermissionsRequest(
    string Role, bool IsSuperAdmin, bool CanManagePermissions, bool CanCollaborate,
    bool IsEditor, bool IsRevisor, bool CanRevert, bool CanViewAdmin,
    bool CanViewReports, bool CanViewActivityHistory, bool CanViewDebugLogs,
    bool CanAssign, bool RequiresChecklist, string Status);

public record CreateWorkspaceRequest(string Name, string Plan = "Free");
public record WorkspaceDto(string Id, string Name, string OwnerId, string Plan, string CreatedAt);
public record JoinWorkspaceRequest(string Token);
public record AddMemberRequest(string Email);

public record CreateTeamRequest(string Name, string? Acronym, string WorkspaceId);
public record AddTeamMemberRequest(string UserId);

public record CreatePresenterRequest(string Name, string? Email, string? Phone);
public record PresenterDto(string Id, string Name, string? Email, string? Phone);

public record CreateProjectRequest(string Name, string? Code, string? ExternalLink, string? Status, string? Bucket);
public record ProjectDto(
    string Id, string Name, string? Code, string? ExternalLink,
    string WorkspaceId, string? Status, string? Bucket, string CreatedAt);

public record CreateScriptRequest(string ProjectId, string Title, string? Content = null);
public record UpdateScriptRequest(string? Title, string? Content, string? Status);
public record ScriptDto(
    string Id, string ProjectId, string WorkspaceId, string Title,
    string Content, string Status, bool IsLocked, string? LockedBy,
    int Version, string CreatedAt, string UpdatedAt);

public record ParseRequest(string Content, int ParagraphsPerScene = 0);

public record CreateVersionRequest(string Content);
public record VersionDto(string Id, int VersionNumber, string Content, string? CreatedBy, string CreatedAt);

public record CreateCommentRequest(string Body);
public record CommentDto(string Id, string AuthorId, string Body, bool IsResolved, string CreatedAt);

public record ChecklistItemDto(string? Id, string Label, bool Required, bool IsChecked, string? CheckedBy);
public record UpdateChecklistRequest(List<ChecklistItemDto> Items);

public record ActivityDto(string Id, string Type, string Description, string? UserId, string CreatedAt);

public record CreateTpSessionRequest(string ScriptId, string Mode = "Paragraph", double Speed = 1.0);
public record TpSessionDto(string Id, string ScriptId, string OwnerId, string Mode, double Speed, string ScrollStateJson);
public record UpdateTpSessionRequest(string Mode, double Speed, string? ScrollStateJson);
public record MarkRecordedRequest(string ScriptId);

public record CreateErrorReportRequest(string? ScreenshotUrl, string? Description, string? LogsJson);
public record ErrorReportDto(string Id, string? UserId, string? ScreenshotUrl, string? Description, string Status, string CreatedAt);

public record DebugLogDto(string Id, string Level, string Source, string Message, string CreatedAt);

public record ApiMessage(string Message);
