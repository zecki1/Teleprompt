import {
  environment
} from "./chunk-DHSNSXHE.js";
import {
  HttpClient,
  HttpParams
} from "./chunk-3SDTMM4U.js";
import {
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-SBUHLZV6.js";

// src/app/core/services/api.service.ts
var ApiService = class _ApiService {
  constructor(http) {
    this.http = http;
    this.getMe = () => this.get("/auth/me");
    this.getUsers = () => this.get("/users");
    this.getUser = (id) => this.get(`/users/${id}`);
    this.updateProfile = (request) => this.put("/users/me", request);
    this.updatePermissions = (id, request) => this.put(`/users/${id}/permissions`, request);
    this.deleteUser = (id) => this.delete(`/users/${id}`);
    this.getMyWorkspaces = () => this.get("/workspaces/mine");
    this.createWorkspace = (request) => this.post("/workspaces", request);
    this.getWorkspace = (id) => this.get(`/workspaces/${id}`);
    this.updateWorkspace = (id, request) => this.put(`/workspaces/${id}`, request);
    this.joinWorkspace = (request) => this.post("/workspaces/join", request);
    this.addWorkspaceMember = (id, request) => this.post(`/workspaces/${id}/members`, request);
    this.getWorkspaceMembers = (id) => this.get(`/workspaces/${id}/members`);
    this.getTeams = (workspaceId) => {
      const params = {};
      if (workspaceId)
        params["workspaceId"] = workspaceId;
      return this.get("/teams", params);
    };
    this.createTeam = (request) => this.post("/teams", request);
    this.getTeam = (id) => this.get(`/teams/${id}`);
    this.updateTeam = (id, request) => this.put(`/teams/${id}`, request);
    this.deleteTeam = (id) => this.delete(`/teams/${id}`);
    this.addTeamMember = (id, request) => this.post(`/teams/${id}/members`, request);
    this.getTeamMembers = (id) => this.get(`/teams/${id}/members`);
    this.getProjects = (workspaceId) => {
      const params = {};
      if (workspaceId)
        params["workspaceId"] = workspaceId;
      return this.get("/projects", params);
    };
    this.createProject = (request) => this.post("/projects", request);
    this.getProject = (id) => this.get(`/projects/${id}`);
    this.updateProject = (id, request) => this.put(`/projects/${id}`, request);
    this.deleteProject = (id) => this.delete(`/projects/${id}`);
    this.getProjectScripts = (id) => this.get(`/projects/${id}/scripts`);
    this.getScripts = (projectId, workspaceId) => {
      const params = {};
      if (projectId)
        params["projectId"] = projectId;
      if (workspaceId)
        params["workspaceId"] = workspaceId;
      return this.get("/scripts", params);
    };
    this.createScript = (request) => this.post("/scripts", request);
    this.getScript = (id) => this.get(`/scripts/${id}`);
    this.updateScript = (id, request) => this.put(`/scripts/${id}`, request);
    this.deleteScript = (id) => this.delete(`/scripts/${id}`);
    this.parseScript = (request) => this.post("/scripts/parse", request);
    this.getScriptVersions = (id) => this.get(`/scripts/${id}/versions`);
    this.createScriptVersion = (id, request) => this.post(`/scripts/${id}/versions`, request);
    this.revertScriptVersion = (id, versionNumber) => this.post(`/scripts/${id}/versions/${versionNumber}/revert`);
    this.getScriptComments = (id) => this.get(`/scripts/${id}/comments`);
    this.addScriptComment = (id, body) => this.post(`/scripts/${id}/comments`, { body });
    this.resolveScriptComment = (id, commentId) => this.put(`/scripts/${id}/comments/${commentId}`);
    this.getScriptChecklist = (id) => this.get(`/scripts/${id}/checklist`);
    this.updateScriptChecklist = (id, items) => this.put(`/scripts/${id}/checklist`, { items });
    this.lockScript = (id) => this.post(`/scripts/${id}/lock`);
    this.unlockScript = (id) => this.post(`/scripts/${id}/unlock`);
    this.createTpSession = (request) => this.post("/tp/sessions", request);
    this.getTpSession = (id) => this.get(`/tp/sessions/${id}`);
    this.updateTpSession = (id, request) => this.put(`/tp/sessions/${id}`, request);
    this.markRecorded = (id, scriptId) => this.post(`/tp/sessions/${id}/recorded`, { scriptId });
    this.getPresenters = () => this.get("/presenters");
    this.createPresenter = (request) => this.post("/presenters", request);
    this.updatePresenter = (id, request) => this.put(`/presenters/${id}`, request);
    this.deletePresenter = (id) => this.delete(`/presenters/${id}`);
    this.getActivities = (page = 1, pageSize = 50) => this.get("/activities", { page: page.toString(), pageSize: pageSize.toString() });
    this.getReports = (workspaceId) => {
      const params = {};
      if (workspaceId)
        params["workspaceId"] = workspaceId;
      return this.get("/reports", params);
    };
    this.getDebugLogs = (limit = 100) => this.get("/admin/debug-logs", { limit: limit.toString() });
    this.writeDebugLog = (level, source, message, metadataJson) => this.post("/admin/debug-logs", { level, source, message, metadataJson });
    this.getErrorReports = () => this.get("/admin/error-reports");
    this.createErrorReport = (screenshotUrl, description, logsJson) => this.post("/admin/error-reports", { screenshotUrl, description, logsJson });
    this.deleteErrorReport = (id) => this.delete(`/admin/error-reports/${id}`);
    this.upload = (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return this.http.post(`${environment.apiUrl}/upload`, formData);
    };
    this.exportJson = (id) => this.http.get(`${environment.apiUrl}/export/scripts/${id}/json`, { responseType: "blob" });
    this.exportPpt = (id) => this.http.get(`${environment.apiUrl}/export/scripts/${id}/ppt`, { responseType: "blob" });
    this.exportWord = (id) => this.http.get(`${environment.apiUrl}/export/scripts/${id}/word`, { responseType: "blob" });
  }
  get(path, params) {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          httpParams = httpParams.set(key, value);
        }
      });
    }
    return this.http.get(`${environment.apiUrl}${path}`, { params: httpParams });
  }
  post(path, body) {
    return this.http.post(`${environment.apiUrl}${path}`, body);
  }
  put(path, body) {
    return this.http.put(`${environment.apiUrl}${path}`, body);
  }
  delete(path) {
    return this.http.delete(`${environment.apiUrl}${path}`);
  }
  static {
    this.\u0275fac = function ApiService_Factory(t) {
      return new (t || _ApiService)(\u0275\u0275inject(HttpClient));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ApiService, factory: _ApiService.\u0275fac, providedIn: "root" });
  }
};

export {
  ApiService
};
//# sourceMappingURL=chunk-WFLGWPXD.js.map
