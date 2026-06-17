import { Step } from "react-joyride";

export const DASHBOARD_TOUR: Step[] = [
  {
    target: "[data-tour='dashboard-projects']",
    content: "Aqui você vê todos os seus projetos. Clique em um para filtrar os roteiros daquele projeto.",
    title: "Projetos",
    placement: "bottom",
  },
  {
    target: "[data-tour='dashboard-status-filter']",
    content: "Filtre os roteiros por status: Rascunho, Em Revisão, Revisado, Gravado, etc.",
    title: "Filtros de Status",
    placement: "bottom",
  },
  {
    target: "[data-tour='dashboard-new-script']",
    content: "Crie um novo roteiro dentro do projeto selecionado.",
    title: "Novo Roteiro",
    placement: "left",
  },
  {
    target: "[data-tour='dashboard-new-project']",
    content: "Crie um novo projeto para organizar seus roteiros.",
    title: "Novo Projeto",
    placement: "left",
  },
  {
    target: "[data-tour='dashboard-script-list']",
    content: "Todos os roteiros do projeto aparecem aqui. Clique para editar, use os botões para excluir, comentar ou atribuir equipe.",
    title: "Lista de Roteiros",
    placement: "left",
  },
  {
    target: "[data-tour='dashboard-team-btn']",
    content: "Atribua editores, revisores e videomakers aos roteiros. Esta opção aparece se você tiver permissão de atribuição.",
    title: "Equipe",
    placement: "left",
  },
];

export const PROJECTS_TOUR: Step[] = [
  {
    target: "[data-tour='projects-title']",
    content: "Gerencie todos os seus projetos de teleprompter aqui.",
    title: "Projetos",
    placement: "bottom",
  },
  {
    target: "[data-tour='projects-create']",
    content: "Clique para criar um novo projeto. Dê um nome e um código opcional.",
    title: "Criar Projeto",
    placement: "left",
  },
  {
    target: "[data-tour='projects-list']",
    content: "Seus projetos aparecem aqui em cards. Clique em um para ver os roteiros daquele projeto no Dashboard.",
    title: "Lista de Projetos",
    placement: "right",
  },
  {
    target: "[data-tour='projects-view-toggle']",
    content: "Alterne entre visualização em cards ou lista.",
    title: "Modo de Exibição",
    placement: "left",
  },
];

export const EDITOR_TOUR: Step[] = [
  {
    target: "[data-tour='editor-title']",
    content: "Digite o título do seu roteiro aqui.",
    title: "Título do Roteiro",
    placement: "bottom",
  },
  {
    target: "[data-tour='editor-toolbar']",
    content: "Use estes botões para adicionar cenas, falas (Loc), letreiros (Let), imagens (Img), aberturas (Abe) e encerramentos (Enc).",
    title: "Ferramentas",
    placement: "bottom",
  },
  {
    target: "[data-tour='editor-add-scene']",
    content: "Adicione uma nova cena ao seu roteiro.",
    title: "Adicionar Cena",
    placement: "top",
  },
  {
    target: "[data-tour='editor-save']",
    content: "Salve seu roteiro. Você pode escolher o status (rascunho, revisão, etc.) e vincular a um projeto.",
    title: "Salvar",
    placement: "left",
  },
  {
    target: "[data-tour='editor-tp']",
    content: "Abra o teleprompter para ler o roteiro ao vivo com rolagem automática.",
    title: "Teleprompter (TP)",
    placement: "left",
  },
  {
    target: "[data-tour='editor-comments']",
    content: "Veja e adicione comentários no roteiro. Útil para revisões em equipe.",
    title: "Comentários",
    placement: "left",
  },
  {
    target: "[data-tour='editor-versions']",
    content: "Histórico de versões salvas do roteiro. Você pode restaurar versões anteriores.",
    title: "Versões",
    placement: "left",
  },
];

export const TP_TOUR: Step[] = [
  {
    target: "[data-tour='tp-text']",
    content: "O texto do roteiro aparece aqui e rola automaticamente na velocidade configurada.",
    title: "Texto do Teleprompter",
    placement: "center",
  },
  {
    target: "[data-tour='tp-speed']",
    content: "Ajuste a velocidade da rolagem. Use + e - para acelerar ou diminuir.",
    title: "Velocidade",
    placement: "top",
  },
  {
    target: "[data-tour='tp-play-pause']",
    content: "Inicie ou pause a rolagem do texto.",
    title: "Play / Pause",
    placement: "top",
  },
  {
    target: "[data-tour='tp-restart']",
    content: "Reinicie o texto do início.",
    title: "Reiniciar",
    placement: "top",
  },
  {
    target: "[data-tour='tp-mark-recorded']",
    content: "Marque o roteiro como gravado quando finalizar a gravação.",
    title: "Marcar como Gravado",
    placement: "top",
  },
  {
    target: "[data-tour='tp-sidebar']",
    content: "Personalize a aparência: cor de fundo, tamanho da fonte, faixa de leitura central e mais.",
    title: "Controles de Estilo",
    placement: "left",
  },
];

export const getTourByPath = (pathname: string): { steps: Step[]; tourKey: string } | null => {
  if (pathname.startsWith("/dashboard")) return { steps: DASHBOARD_TOUR, tourKey: "tour_dashboard" };
  if (pathname.startsWith("/projects")) return { steps: PROJECTS_TOUR, tourKey: "tour_projects" };
  if (pathname.startsWith("/editor")) return { steps: EDITOR_TOUR, tourKey: "tour_editor" };
  if (pathname.startsWith("/tp/")) return { steps: TP_TOUR, tourKey: "tour_tp" };
  return null;
};
