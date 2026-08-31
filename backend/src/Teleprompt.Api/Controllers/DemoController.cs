using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Teleprompt.Application.Dtos;
using Teleprompt.Domain.Enums;

namespace Teleprompt.Api.Controllers;

/// <summary>
/// Dados de demonstração (degustação) sem login. Retorna um workspace 100%
/// fictício com projetos, roteiros, usuários e apresentadores orgânicos,
/// criados exclusivamente para explorar a UI. Nenhum dado real de cliente
/// (SENAI/Firestore) é exposto aqui — isolamento total (LGPD).
/// </summary>
[ApiController]
[Route("api/v1/demo")]
[AllowAnonymous]
public class DemoController : ControllerBase
{
    private const string WorkspaceId = "demo-workspace-pixel";

    private static readonly DateTime Now = DateTime.UtcNow;

    [HttpGet("workspace")]
    public ActionResult<DemoWorkspaceDto> GetWorkspace()
    {
        var projects = BuildProjects();
        var scripts = BuildScripts(projects);
        var users = BuildUsers();
        var presenters = BuildPresenters();
        var activities = BuildActivities();

        return Ok(new DemoWorkspaceDto(
            new WorkspaceDto(
                WorkspaceId,
                "Estúdio Pixel",
                users[0].Id,
                "Pro",
                Now.AddMonths(-4).ToString("O")),
            users,
            presenters,
            projects,
            scripts,
            activities));
    }

    private static List<DemoUserDto> BuildUsers()
    {
        // Usuário "admin" = dono (SuperAdmin) com acesso total.
        // Usuário "tecnico" = operação de estúdio, acesso restrito.
        // Os demais são a equipe fictícia para popular a listagem de usuários.
        return new List<DemoUserDto>
        {
            new("demo-admin", "admin@estudiopixel.demo", "Marina Duarte", "SuperAdmin",
                true, true, true, true, true, true, true, false, WorkspaceId),
            new("demo-tecnico", "tecnico@estudiopixel.demo", "Caio Ferraz", "Técnico",
                false, true, false, false, false, false, false, true, WorkspaceId),
            new("demo-editor", "editor@estudiopixel.demo", "Rafaela Nunes", "editor",
                false, true, false, false, false, false, false, false, WorkspaceId),
            new("demo-revisor", "revisor@estudiopixel.demo", "Thiago Bezerra", "validador",
                false, false, true, true, false, false, false, false, WorkspaceId),
            new("demo-videomaker", "video@estudiopixel.demo", "Larissa Prado", "Técnico",
                false, false, false, false, false, false, false, false, WorkspaceId)
        };
    }

    private static List<PresenterDto> BuildPresenters()
    {
        return new List<PresenterDto>
        {
            new("demo-presenter-1", "Helena Costa", "helena@estudiopixel.demo", "(11) 98888-0001"),
            new("demo-presenter-2", "Diego Antunes", "diego@estudiopixel.demo", "(11) 98888-0002"),
            new("demo-presenter-3", "Sofia Lima", "sofia@estudiopixel.demo", "(11) 98888-0003"),
            new("demo-presenter-4", "Bruno Ribeiro", "bruno@estudiopixel.demo", "(11) 98888-0004")
        };
    }

    private static List<ProjectDto> BuildProjects()
    {
        return new List<ProjectDto>
        {
            Proj("demo-proj-1", "Série Culinária — Sabores do Dia", "PIX-01", "EmAndamento", "EmAndamento", 32),
            Proj("demo-proj-2", "Microlearning — Primeiros Socorros", "PIX-02", "InProgress", "EmAndamento", 21),
            Proj("demo-proj-3", "Podcast Sinais & Produtividade", "PIX-03", "Paused", "Pausado", 15),
            Proj("demo-proj-4", "Campanha Institucional — Boas Práticas", "PIX-04", "Completed", "Concluido", 48),
            Proj("demo-proj-5", "Trilha de Onboarding — Novos Talentos", "PIX-05", "Awaiting", "Backlog", 6),
        };

        static ProjectDto Proj(string id, string name, string code, string status, string bucket, int age)
            => new(id, name, code, null, WorkspaceId, status, bucket, Now.AddDays(-age).ToString("O"));
    }

    private static List<ScriptDto> BuildScripts(List<ProjectDto> projects)
    {
        var map = projects.ToDictionary(p => p.Id);
        var list = new List<ScriptDto>();

        Add("demo-script-1", "demo-proj-1", "Episódio 1 — Café da Manhã Rápido", ScriptStatus.Aprovado,
            """
            Cena 1
            Tempo: 60 segundos

            [Loc]: Bem-vindo ao Sabores do Dia! Hoje a gente prepara um café da manhã completo em menos de quinze minutos.
            [Let1]: Café da manhã em 15 minutos
            [Pron1]: ca-fé da ma-nhã
            [Url1]: https://youtube.com/saboresdodia
            [Img1]: https://picsum.photos/seed/sabores-cafe/640/360

            Cena 2
            Tempo: 40 segundos

            [Loc]: Comece pela aveia, que precisa de três minutinhos de molho enquanto a frigideira aquece. Depois, os ovos.
            [Let2]: Aveia de molho + frigideira quente

            Cena 3
            Tempo: 30 segundos

            [Loc]: Monte o prato e finalize com as frutas da estação. Simples, gostoso e sem enrolação.
            [enc]: Até a próxima!
            """,
            "Módulo 1", "Episódios", "Episódio 1", "Helena Costa");
        Add("demo-script-2", "demo-proj-1", "Episódio 2 — Almoço de Panela (Revisão)", ScriptStatus.EmRevisao,
            """
            Cena 1
            Tempo: 55 segundos

            [Loc]: No episódio de hoje, a receita é aquele almoço de panela que rende para a semana inteira.
            [Let1]: Almoço que rende a semana
            [Url1]: https://picsum.photos/seed/sabores-panela/640/360

            Cena 2
            Tempo: 45 segundos

            [Loc]: Feijão, legumes e o tempero da casa. Deixe cozinhando em fogo baixo e aproveite o tempo para organizar os potes.
            [enc]: Bom apetite!
            """,
            "Módulo 1", "Episódios", "Episódio 2", "Diego Antunes");
        Add("demo-script-3", "demo-proj-1", "Episódio 3 — Sobremesa Sem Açúcar", ScriptStatus.Rascunho,
            """
            Cena 1
            Tempo: 50 segundos

            [Loc]: Sobremesa saudável não precisa ser sem graça. Hoje a gente usa banana e cacau.
            [Let1]: Sobremesa com banana e cacau
            [Img1]: https://picsum.photos/seed/sabores-sobremesa/640/360

            Cena 2
            Tempo: 35 segundos

            [Loc]: Amasse a banana, misture o cacau e leve ao forno por vinte minutos. Fica pronto um brownie leve.
            [enc]: Aproveite!
            """,
            "Módulo 1", "Bônus", "Bônus 1", "Helena Costa");
        Add("demo-script-4", "demo-proj-1", "Episódio 4 — Lanche das Crianças", ScriptStatus.Aprovado,
            """
            Cena 1
            Tempo: 45 segundos

            [Loc]: Um lanche divertido e nutritivo para a criançada. Rápido de montar e bonito no prato.
            [Let1]: Lanche divertido e nutritivo
            [Enc2]: Crianças ajudando

            Cena 2
            Tempo: 30 segundos

            [Loc]: Frutas em formatos de estrela e um sanduíche colorido. A apresentação faz toda a diferença.
            [enc]: Bom lanche!
            """,
            "Módulo 1", "Episódios", "Episódio 4", "Sofia Lima");
        Add("demo-script-5", "demo-proj-2", "Módulo 1 — Como Agir em Desmaios", ScriptStatus.Aprovado,
            """
            Cena 1
            Tempo: 70 segundos

            [Loc]: Primeiros socorros salvam vidas. Hoje você aprende o básico sobre desmaios.
            [Let1]: Desmaios: como agir
            [Pron1]: des-mai-os

            Cena 2
            Tempo: 50 segundos

            [Loc]: Deite a pessoa, eleve as pernas e verifique a respiração. Acione o serviço médico se preciso.
            [Let2]: Acione o serviço de emergência
            [Img2]: https://picsum.photos/seed/socorro-desmaio/640/360

            Cena 3
            Tempo: 30 segundos

            [Loc]: Nunca ofereça líquidos a quem está desacordado. Anote o horário do ocorrido.
            [enc]: Continue no próximo módulo.
            """,
            "Trilha 1", "Primeiros Socorros", "Aula 01", "Bruno Ribeiro");
        Add("demo-script-6", "demo-proj-2", "Módulo 1 — Queimaduras Leves", ScriptStatus.Rascunho,
            """
            Cena 1
            Tempo: 60 segundos

            [Loc]: Queimaduras são comuns no dia a dia. Saiba diferenciar o que tratar em casa do que exige hospital.
            [Let1]: Queimaduras leves
            [Img1]: https://picsum.photos/seed/socorro-queimadura/640/360

            Cena 2
            Tempo: 45 segundos

            [Loc]: Para queimaduras leves, resfrie com água corrente por dez minutos. Nunca use pasta de dente ou manteiga.
            [enc]: Cuidado redobrado.
            """,
            "Trilha 1", "Primeiros Socorros", "Aula 02", "Rafaela Nunes");
        Add("demo-script-7", "demo-proj-3", "Episódio 12 — Foco Profundo na Prática", ScriptStatus.Gravado,
            """
            Cena 1
            Tempo: 40 segundos

            [Loc]: No episódio de hoje, falamos sobre foco profundo e os vilões da produtividade.
            [Let1]: Foco profundo
            [Url1]: https://spotify.com/sinais

            Cena 2
            Tempo: 35 segundos

            [Loc]: Desative notificações, defina uma meta de sessão e trabalhe em blocos de vinte e cinco minutos.
            [enc]: Obrigado por ouvir!
            """,
            "Temporada 2", "Episódios", "Episódio 12", "Diego Antunes");
        Add("demo-script-8", "demo-proj-4", "Video Institucional — Nossos Valores", ScriptStatus.Concluido,
            """
            Cena 1
            Tempo: 50 segundos

            [Loc]: Há dez anos entregando conhecimento com qualidade, ética e cuidado.
            [Let1]: Nossos valores
            [Img1]: https://picsum.photos/seed/institucional-valores/640/360

            Cena 2
            Tempo: 40 segundos

            [Loc]: Inovação, respeito e compromisso com a comunidade guiam cada conteúdo que produzimos.
            [enc]: Obrigado por fazer parte.
            """,
            "Institucional", "Raiz", "Vídeo 01", "Sofia Lima");
        Add("demo-script-9", "demo-proj-4", "Depoimento — Egressos de Sucesso", ScriptStatus.Gravado,
            """
            Cena 1
            Tempo: 45 segundos

            [Loc]: Nossos egressos contam como a formação transformou suas trajetórias.
            [Let1]: Egressos de sucesso

            Cena 2
            Tempo: 35 segundos

            [Loc]: Realizamos três entrevistas em estúdio e uma externa. Roteiro pronto para captação.
            [enc]: Desligando câmeras.
            """,
            "Institucional", "Depoimentos", "Depoimento 02", "Bruno Ribeiro");
        Add("demo-script-10", "demo-proj-5", "Boas-vindas — Primeiro Dia", ScriptStatus.Rascunho,
            """
            Cena 1
            Tempo: 40 segundos

            [Loc]: Boas-vindas ao time! Neste vídeo você conhece nossa cultura e o que esperar na primeira semana.
            [Let1]: Boas-vindas ao time
            [Img1]: https://picsum.photos/seed/onboarding-1/640/360

            Cena 2
            Tempo: 30 segundos

            [Loc]: Apresente-se ao seu gestor, explore o ambiente e marque o encontro com o RH.
            [enc]: Bom começo!
            """,
            "Trilha Ing", "Boas-vindas", "Aula 01", "Larissa Prado");
        Add("demo-script-11", "demo-proj-5", "Ferramentas Internas (Revisão)", ScriptStatus.EmRevisao,
            """
            Cena 1
            Tempo: 55 segundos

            [Loc]: Conheça as ferramentas que usamos no dia a dia e os canais onde você encontra ajuda.
            [Let1]: Ferramentas internas

            Cena 2
            Tempo: 35 segundos

            [Loc]: Acesso ao portal, e-mail e comunicação interna. Tudo em um só lugar.
            [enc]: Até a próxima!
            """,
            "Trilha Ing", "Ferramentas", "Aula 02", "Rafaela Nunes");
        Add("demo-script-12", "demo-proj-5", "Cultura & Colaboração", ScriptStatus.Aprovado,
            """
            Cena 1
            Tempo: 45 segundos

            [Loc]: Nossa cultura é de colaboração: todo mundo ensina e aprende.
            [Let1]: Cultura de colaboração

            Cena 2
            Tempo: 30 segundos

            [Loc]: Participe das reuniões abertas e compartilhe suas ideias sem medo.
            [enc]: Bem-vindo ao time!
            """,
            "Trilha Ing", "Cultura", "Aula 03", "Thiago Bezerra");

        return list;

        void Add(string id, string projectId, string title, ScriptStatus status, string content,
            string folder, string subfolder, string lesson, string presenterName)
        {
            var project = map[projectId];
            list.Add(new ScriptDto(
                id, projectId, WorkspaceId, title, content, status.ToString(),
                false, null, 3, Now.AddDays(-5).ToString("O"), Now.AddDays(-1).ToString("O"),
                folder, subfolder, lesson, false,
                "demo-editor", "Rafaela Nunes",
                "demo-revisor", "Thiago Bezerra",
                "demo-videomaker", "Larissa Prado",
                "demo-admin", "Marina Duarte",
                project.Name, PresenterIds: ResolvePresenter(presenterName)));
        }
    }

    private static List<string>? ResolvePresenter(string presenterName)
    {
        return presenterName switch
        {
            "Helena Costa" => new List<string> { "demo-presenter-1" },
            "Diego Antunes" => new List<string> { "demo-presenter-2" },
            "Sofia Lima" => new List<string> { "demo-presenter-3" },
            "Bruno Ribeiro" => new List<string> { "demo-presenter-4" },
            _ => null
        };
    }

    private static List<ActivityDto> BuildActivities()
    {
        return new List<ActivityDto>
        {
            new("demo-act-1", "Create", "Marina Duarte criou o workspace Estúdio Pixel", "demo-admin", Now.AddDays(-32).ToString("O")),
            new("demo-act-2", "Create", "Rafaela Nunes criou o roteiro Episódio 1 — Café da Manhã Rápido", "demo-editor", Now.AddDays(-18).ToString("O")),
            new("demo-act-3", "Update", "Thiago Bezerra aprovou o roteiro Módulo 1 — Como Agir em Desmaios", "demo-revisor", Now.AddDays(-9).ToString("O")),
            new("demo-act-4", "Version", "Rafaela Nunes criou a versão 2 do roteiro Boas-vindas — Primeiro Dia", "demo-editor", Now.AddDays(-4).ToString("O")),
            new("demo-act-5", "Comment", "Caio Ferraz comentou em Ferramentas Internas (Revisão)", "demo-tecnico", Now.AddDays(-2).ToString("O")),
            new("demo-act-6", "Record", "Diego Antunes marcou como gravado o Episódio 12 — Foco Profundo na Prática", "demo-videomaker", Now.AddDays(-1).ToString("O"))
        };
    }
}
