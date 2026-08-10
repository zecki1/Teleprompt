import { describe, it, expect } from "vitest";
import { getTourByPath, DASHBOARD_TOUR, PROJECTS_TOUR, EDITOR_TOUR, TP_TOUR } from "./tour-steps";

describe("getTourByPath", () => {
  it("mapeia cada rota para o tour correto", () => {
    expect(getTourByPath("/dashboard")?.tourKey).toBe("tour_dashboard");
    expect(getTourByPath("/dashboard/outra")?.tourKey).toBe("tour_dashboard");
    expect(getTourByPath("/projects")?.tourKey).toBe("tour_projects");
    expect(getTourByPath("/editor/abc123")?.tourKey).toBe("tour_editor");
    expect(getTourByPath("/editor/new")?.tourKey).toBe("tour_editor");
    expect(getTourByPath("/tp/abc123")?.tourKey).toBe("tour_tp");
  });

  it("retorna null para rotas sem tour", () => {
    expect(getTourByPath("/login")).toBeNull();
    expect(getTourByPath("/")).toBeNull();
    expect(getTourByPath("/admin")).toBeNull();
  });

  it("todos os tours possuem steps com título e conteúdo", () => {
    for (const tour of [DASHBOARD_TOUR, PROJECTS_TOUR, EDITOR_TOUR, TP_TOUR]) {
      expect(tour.length).toBeGreaterThan(0);
      for (const step of tour) {
        expect(step.title).toBeTruthy();
        expect(step.content).toBeTruthy();
        expect(step.target).toBeTruthy();
      }
    }
  });
});
