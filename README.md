# 🚀 Super Template Template v3.0

> **O Template Definitivo para Next.js 15**
> Focado em Acessibilidade (A11y), Internacionalização (i18n), UI Moderna e Performance.

Este repositório é uma solução "bateria inclusa" para desenvolvedores que querem iniciar um projeto Template sem perder dias configurando ferramentas básicas. Ele combina o poder do **Next.js 15 (App Router)** com a beleza do **Shadcn UI** e funcionalidades avançadas de acessibilidade nativa.

---

## 📋 Índice

1.  [Principais Funcionalidades](#-principais-funcionalidades)
2.  [Tech Stack e Dependências](#-tech-stack-e-dependências)
3.  [Estrutura de Pastas](#-estrutura-de-pastas)
4.  [Guia dos Componentes Customizados](#-guia-dos-componentes-customizados)
    *   [PreferencesProvider & i18n](#1-preferencesprovider--i18n-nativo)
    *   [Menu de Acessibilidade](#2-settingsmenu-acessibilidade)
    *   [Animações (AOS & Rewards)](#3-animações-aos--rewards)
5.  [Instalação e Uso](#-instalação-e-uso)
6.  [Personalização (Temas e CSS)](#-personalização-temas-e-css)
7.  [Solução de Problemas Comuns](#-solução-de-problemas-comuns)

---

## ✨ Principais Funcionalidades

*   **⚡ Next.js 15:** Utiliza a arquitetura mais recente (App Router, Server Components).
*   **🎨 UI Profissional:** Baseado em Shadcn UI + Tailwind CSS v3.4.
*   **🌍 Internacionalização Inline:** Sistema leve de tradução (PT/EN/ES) sem arquivos JSON complexos.
*   **♿ Acessibilidade Avançada:**
    *   **VLibras:** Widget governamental integrado.
    *   **Filtros de Daltonismo:** Protanopia, Deuteranopia, Tritanopia e Monocromático.
    *   **Dislexia:** Fonte `OpenDyslexic` (simulada) ativável por toggle.
    *   **Tamanho de Fonte:** Slider global para controle de tamanho de texto.
*   **🎉 Micro-interações:** Confetes e balões integrados para celebrar ações do usuário.
*   **✨ Scroll Animations:** Elementos animados ao rolar a página (AOS).
*   **🌗 Dark/Light Mode:** Persistência de tema automática.

---

## 🛠 Tech Stack e Dependências

Abaixo, a lista das principais bibliotecas utilizadas e seu propósito no projeto:

### Core Framework
*   **`next` (v15)**: O framework React para produção.
*   **`react` / `react-dom` (v19 RC)**: Biblioteca de interface.
*   **`typescript`**: Superset JavaScript para tipagem estática.

### Estilização & UI
*   **`tailwindcss` (v3.4)**: Framework CSS utilitário.
*   **`tailwindcss-animate`**: Plugin para animações CSS.
*   **`lucide-react`**: Biblioteca padrão de ícones (leve e SVG).
*   **`react-icons`**: Biblioteca secundária para ícones de marcas (Github, React, Stripe).
*   **`clsx` & `tailwind-merge`**: Utilitários para combinar classes CSS condicionalmente (Crucial para Shadcn).

### Componentes & Lógica
*   **`@radix-ui/*`**: Primitivos acessíveis (Headless UI) que alimentam o Shadcn (Dialog, Switch, Slider, Accordion, etc).
*   **`sonner`**: Biblioteca de Toasts (notificações) moderna e empilhável.
*   **`date-fns`**: Manipulação leve de datas.
*   **`react-day-picker`**: Componente de calendário.

### Efeitos Visuais
*   **`aos` (Animate On Scroll)**: Biblioteca para animar elementos quando entram na viewport.
*   **`react-rewards`**: Biblioteca para disparar efeitos de confete e balões.
*   **`next-themes`**: Gerenciador de tema (Dark/Light) que evita o "flash of unstyled content".

---

## 📂 Estrutura de Pastas

O projeto segue uma arquitetura limpa e modular dentro de `src/`:

```text
src/
├── app/
│   ├── layout.tsx           # Entry point. Configura Providers, Header, Footer e Fontes.
│   ├── page.tsx             # Landing Page (Showcase de todos os componentes).
│   └── globals.css          # Variáveis CSS, Filtros de Acessibilidade e Configuração Tailwind.
│
├── components/
│   ├── accessibility/
│   │   └── vlibras-widget.tsx  # Wrapper do widget VLibras com tipagem TS corrigida.
│   │
│   ├── layout/
│   │   ├── site-header.tsx     # Barra de navegação superior fixa.
│   │   └── site-footer.tsx     # Rodapé do site.
│   │
│   ├── providers/
│   │   ├── aos-init.tsx            # Inicializador do AOS (Client Component).
│   │   └── preferences-provider.tsx # O CÉREBRO. Gerencia Contexto de Idioma, Tema e A11y.
│   │
│   ├── ui/                  # Pasta contendo todos os componentes atômicos do Shadcn (Button, Card...).
│   │
│   ├── language-switcher.tsx # Dropdown para troca de idioma.
│   └── settings-menu.tsx     # Sheet (Lateral) com todas as configurações de acessibilidade.
│
├── lib/
│   └── utils.ts             # Função helper `cn()` para classes CSS.
```

📘 Guia dos Componentes Customizados
1. PreferencesProvider & i18n Nativo
Local: src/components/providers/preferences-provider.tsx
Este provider envolve toda a aplicação. Ele salva as preferências do usuário no localStorage e disponibiliza o componente <Text />.
Como usar tradução em qualquer lugar:
```tsx
import { Text } from "@/components/providers/preferences-provider";

// Dentro do seu componente:
<h1>
  <Text 
    pt="Bem-vindo ao meu Template" 
    en="Welcome to my Template" 
    es="Bienvenido a mi Template" 
  />
</h1>
```
O texto muda instantaneamente quando o usuário troca o idioma no menu.
2. SettingsMenu (Acessibilidade)
Local: src/components/settings-menu.tsx
Este componente é um Sheet (Painel Lateral) que permite ao usuário controlar:
Fonte: Alternar para OpenDyslexic.
Tamanho: Slider para aumentar/diminuir a fonte base (rem).
Cores: Filtros CSS globais para daltônismo.
Tema: Claro, Escuro ou Sistema.
3. Animações (AOS & Rewards)
AOS (Scroll):
Basta adicionar o atributo data-aos em qualquer elemento HTML/JSX.
```tsx
<div data-aos="fade-up" data-aos-delay="200">
  Conteúdo animado
</div>
```
Rewards (Confete/Balões):
Utilize o hook useReward.
```tsx
import { useReward } from 'react-rewards';

const { reward } = useReward('meuId', 'confetti');

return (
  <button onClick={reward}>
    <span id="meuId" /> {/* O span é o ponto de origem */}
    Clique aqui
  </button>
)
```
🚀 Instalação e Uso
Clone o repositório:
```bash
git clone https://seu-repo.com/super-template.git
```
Instale as dependências:
```bash
npm install
# ou
pnpm install
```
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse:
Abra http://localhost:3000 no seu navegador.
🎨 Personalização (Temas e CSS)
O arquivo src/app/globals.css é o coração do estilo.
Mudando a Cor Primária
O template usa variáveis CSS (padrão Shadcn). Para mudar a cor de destaque (atualmente um tom escuro/preto estilo Vercel) para Azul, por exemplo, edite as variáveis :root:
```css
/* src/app/globals.css */
:root {
  /* ... */
  --primary: 221.2 83.2% 53.3%; /* HSL para Azul */
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```
Filtros de Acessibilidade
As classes .mode-protanopia, .mode-deuteranopia, etc., aplicam filtros SVG/CSS em todo o <body>. Você pode ajustar a intensidade desses filtros no final do arquivo globals.css.
🔧 Solução de Problemas Comuns
1. Erro: Unknown at rule @theme ou @apply
Isso acontece porque o VS Code pode estar esperando Tailwind v4 ou não reconhece as diretivas.
Solução: Certifique-se de que o globals.css usa a sintaxe @tailwind base; (v3) e não @import "tailwindcss"; (v4), conforme configurado neste template.
Dica: Crie uma pasta .vscode/settings.json e adicione "css.lint.unknownAtRules": "ignore".
2. Erro: Hydration failed
Geralmente causado por renderizar algo no servidor diferente do cliente (ex: ler localStorage direto no render).
Solução: O nosso PreferencesProvider já trata isso usando um estado mounted e useEffect, garantindo que o conteúdo pesado só carregue após a hidratação.
3. Erro: Element type is invalid
Geralmente causado por exportar um componente como export default e tentar importar como { Component } (ou vice-versa).
Solução: Todos os componentes deste template usam Named Exports (export function SiteHeader). Verifique suas importações.
📜 Licença
Este projeto é de código aberto e está sob a licença MIT. Sinta-se livre para usar em projetos pessoais ou comerciais.
Desenvolvido com ❤️ usando o Super Template Template.
