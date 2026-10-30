# StudyFlow 🎯

> Aplicação web simples, acolhedora e responsiva para ajudar estudantes iniciantes a organizar metas de estudo, prazos e cronogramas práticos, com persistência local e exportação para o Google Agenda.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

<!-- Espaço reservado para a demonstração e captura de tela -->
## 📱 Demonstração Online
> **Link da aplicação em produção:** [https://seu-usuario.github.io/studyflow/](https://seu-usuario.github.io/studyflow/) *(substitua pelo link após o deploy)*

```
[ ESPAÇO RESERVADO PARA SCREENSHOT OU GIF DA APLICAÇÃO ]
Exemplo: Adicione aqui uma captura da tela principal exibindo os objetivos e o modal de cronograma.
```

---

## 💡 O Problema que o StudyFlow Resolve

Estudantes em fase inicial de estudos (como vestibulandos, concurseiros e iniciantes em programação) enfrentam frequentemente:
- **Sobrecarga de ferramentas complexas:** Aplicativos corporativos tradicionais (Notion, Jira, Trello) trazem dezenas de configurações e opções que desviam o foco do estudante.
- **Dificuldade de mensurar o tempo:** Falta de clareza sobre o que vence primeiro e como quebrar grandes matérias em sessões menores de estudo.
- **Perda de progresso sem cadastro:** Obrigatoriedade de criar contas com senha para simplesmente registrar o que precisa ser lido ou praticado na semana.

O **StudyFlow** foi projetado com uma interface acolhedora e direta: você abre a página, define o que precisa estudar com seu prazo, gera um cronograma compatível com seus dias livres e mantém tudo salvo automaticamente no seu próprio navegador.

---

## ✨ Funcionalidades Implementadas

- [x] **Cadastro e Gestão de Metas:** Adicione objetivos com título obrigatório, anotações/descrição, prazo limite e status (*Não iniciado*, *Em andamento* ou *Concluído*).
- [x] **Edição e Exclusão Segura:** Edição rápida de campos e diálogo modal de confirmação antes de qualquer remoção, evitando exclusões acidentais.
- [x] **Cálculo Inteligente de Prazos:** Identificação automática de metas urgentes (*"Vence hoje!"*, *"Vence amanhã"*, *"Vence em X dias"*) e alertas de atraso (*"Atrasado há X dias"*), calculados por datas puras de calendário (imunes a problemas de fuso horário e horário de verão).
- [x] **Métricas em Tempo Real:** Painel com contagem total de metas, divisão por status e barra percentual de progresso dos estudos.
- [x] **Filtros e Busca Instantânea:** Abas de status com contadores reativos, busca textual por título ou descrição e opções de ordenação.
- [x] **Persistência Local Confiável (`localStorage`):** Os dados persistem entre recarregamentos (`F5`) e fechamentos de aba, com validação estrutural de segurança para evitar corrupção de dados.
- [x] **Gerador de Cronogramas de Estudo:** Distribui sessões de estudo nos dias da semana em que o estudante tem disponibilidade (ex: Segundas, Quartas e Sextas) com duração personalizada (30m, 45m, 1h, 1h30).
- [x] **Exportação para Google Agenda (.ics):** Download em 1 clique de arquivo de calendário no formato padronizado RFC 5545, 100% no navegador (sem permissões invasivas ou necessidade de login).
- [x] **Integração Preparada para IA:** Suporte arquitetural para enriquecer títulos e tópicos das sessões via endpoint seguro (`/api/generate-schedule`), mantendo o gerador local como fallback resiliente e gratuito.

---

## 🛠️ Tecnologias Utilizadas

- **[React 19](https://react.dev/)**: Componentes funcionais e hooks modernos (`useState`, `useEffect`, `useMemo`).
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estrita de entidades, formulários e operações de data.
- **[Vite](https://vitejs.dev/)**: Build rápido, bundle otimizado e ambiente de desenvolvimento leve.
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Estilização atômica, responsiva e acessível.
- **[Lucide React](https://lucide.dev/)**: Ícones leves e coerentes com a experiência educacional.

---

## 🚀 Como Instalar e Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Gerenciador de pacotes `npm` (incluso com o Node)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/studyflow.git
   cd studyflow
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra o endereço indicado no terminal (normalmente `http://localhost:3000` ou `http://localhost:5173`).

5. **Para gerar a versão de produção (Build):**
   ```bash
   npm run build
   ```

6. **Para checar a integridade dos tipos TypeScript:**
   ```bash
   npm run lint
   ```

---

## 🧠 Como Funciona o Gerador de Cronogramas

O gerador de cronogramas do StudyFlow foi desenvolvido para funcionar sob qualquer circunstância:

1. **Cálculo de Calendário:**  
   O estudante escolhe a data limite, os dias da semana disponíveis (ex.: Terças e Quintas), a duração (ex.: 60 minutos) e o horário de início (ex.: 19:00). O motor calcula as datas válidas entre amanhã e o prazo final.
2. **Distribuição Pedagógica:**  
   O conteúdo é distribuído de forma progressiva:
   - **Primeiras sessões:** Introdução, escopo e fundamentos teóricos.
   - **Sessões intermediárias:** Conceitos centrais, fichamento e resolução de exercícios.
   - **Sessões finais:** Aplicação prática, testes e autoavaliação.
3. **Resiliência e Custo Zero (Offline First):**  
   O sistema possui suporte a enriquecimento por IA via backend. No entanto, se o usuário estiver offline, a rota não existir ou a quota gratuita for excedida, o **motor local gera o cronograma instantaneamente**, garantindo custo zero e funcionamento ininterrupto.

---

## 📅 Como Funciona a Exportação para o Google Agenda

- O botão **"Baixar para Google Agenda (.ics)"** gera dinamicamente um arquivo de calendário compatível com a especificação internacional **RFC 5545**.
- Cada sessão vira um evento com:
  - Título da sessão e descrição detalhada.
  - Data e horário de início e término calculados com precisão.
  - Formato de *Floating Local Time* (o evento se adapta ao horário exato do dispositivo do estudante).
- **Sem login ou burocracia:** O arquivo `.ics` é criado localmente pelo navegador via `Blob` e pode ser importado diretamente no Google Calendar, Apple Calendar ou Outlook em poucos segundos.

---

## ⚠️ Limitações Atuais

- **Armazenamento no Navegador:** Por utilizar `localStorage`, os dados ficam salvos apenas no dispositivo e navegador onde foram criados. Limpar o histórico/dados de navegação removerá as metas salvas.
- **Disponibilidade da IA em Deploy Estático:** Em hospedagens puramente estáticas (como GitHub Pages) que não possuem servidor Node.js ativo, a geração de cronogramas opera automaticamente no **Modo Local**, que é 100% funcional, seguro e gratuito.
- **Importação no Calendário:** A aplicação gera e entrega o arquivo `.ics`. O ato de importar o arquivo para o Google Calendar é manual (basta abrir o Google Agenda e arrastar o arquivo ou selecionar "Importar").

---

## 🔮 Melhorias Futuras (Roadmap)

- [ ] Exportação e importação de backup em arquivo JSON para troca de dispositivo.
- [ ] Suporte a modo escuro (Dark Mode).
- [ ] Notificações no navegador para metas que vencem no dia.
- [ ] Backend opcional para sincronização de contas em nuvem.

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** — consulte o arquivo [LICENSE](LICENSE) para obter mais detalhes.

---

Desenvolvido por **Samuel Guedes** como projeto de portfólio para demonstrar fundamentos sólidos em React, TypeScript, arquitetura frontend e boas práticas de código.
