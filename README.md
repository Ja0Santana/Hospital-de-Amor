# Hospital de Amor - Portal do Paciente

Este repositório contém o front-end do MVP (Minimum Viable Product) do **Portal do Paciente** para o sistema de regulação e agendamentos oncológicos do **Hospital de Amor**. O projeto foi estruturado com foco em altíssima fidelidade de interface (rich aesthetics), simulando fluxos de dados de forma 100% dinâmica no lado do cliente utilizando persistência local com **IndexedDB** do navegador.

---

## 🛠️ Stack de Tecnologias

*   **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
*   **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) para design responsivo e ágil
*   **Componentes**: [shadcn/ui](https://ui.shadcn.com/) (primitives baseados em Radix UI para máxima acessibilidade)
*   **Ícones**: [Lucide React](https://lucide.dev/)
*   **Persistência Local**: API nativa do **IndexedDB** do navegador para armazenamento assíncrono de dados de exames, uploads binários convertidos em Base64 e tabelas de usuários de forma robusta e ilimitada.

---

## 📋 Requisitos Implementados até o Momento

### Módulo de Identificação e Cadastro
*   **RF74 – Bloquear Cadastro Duplicado de CPF (Must Have)**: Valida matematicamente os dígitos verificadores do CPF durante a perda de foco (blur) e impede o cadastro caso o CPF já exista no IndexedDB.
*   **Login e Cadastro Funcionais**: Login validando credenciais (CPF e senha) no banco IndexedDB. Cadastro de novas contas de pacientes com persistência local definitiva.
*   **Sessão Dinâmica**: Recuperação automática do nome do paciente e geração de ID cadastral a partir dos dados do IndexedDB após o login para alimentar a Sidebar e Dashboard.

### Módulo de Agendamento e Solicitações
*   **RF01 – Solicitar Agendamento (Must Have)**: Formulário multi-etapas contendo:
    *   **Passo 1 (Dados Básicos)**: Pré-preenchimento automático dos dados do paciente logado com base em seu cadastro local.
    *   **Passo 2 (Atendimento)**: Seleção dinâmica da especialidade e do tipo de exame com exibição das respectivas orientações de preparo.
    *   **Passo 3 (Documentos e Revisão)**: Upload de comprovante de encaminhamento com preview e revisão na mesma tela (com botão de edição rápida de etapas).
    *   **Passo 4 (Confirmação)**: Emissão do número de protocolo exclusivo (HA-AAAA-XXXX) e instruções dos prazos da triagem.
*   **RF02 – Informar Cidade de Origem (Should Have)**: Campo obrigatório com auto-sugestão de Sergipe ao detectar DDD (79) no telefone e classificação das regiões de saúde (ex: Região de Lagarto, Aracaju).
*   **RF04 – Visualizar Resumo da Solicitação (Must Have)**: Tela de revisão com exibição de todos os dados inseridos, preview do arquivo anexado e checkbox obrigatório de consentimento da LGPD.
*   **RF05 – Registrar Solicitação (Must Have)**: Gravação assíncrona da solicitação com carimbo de data/hora no IndexedDB sob o status inicial "Pendente".

### Módulo de Acompanhamento de Status e Feedback
*   **RF06 – Acompanhar Status (Must Have)**: Busca por protocolo ou CPF exibindo linha do tempo de status (Pendente, Em análise, Confirmado, Cancelado).
    *   **Confirmado**: Exibe data, hora, profissional, sala e emite a credencial com QR Code dinâmico.
    *   **Cancelado**: Apresenta justificativa do cancelamento inserida pela regulação.
    *   **Em análise**: Mostra estimativa de tempo de resposta baseada nas triagens do mês.
*   **RF20 – Cancelar Solicitação (Must Have)**: Permite que o paciente cancele solicitações ativas diretamente no Portal, registrando o motivo e gerando os devidos logs.
*   **RF39 – Visualizar Detalhes e Instruções (Must Have)**: Detalhes de consultas confirmadas e instruções específicas disponíveis para visualização ou impressão.
*   **RF41 – Coletar Feedback do Paciente (Could Have)**: Pesquisa de satisfação NPS (0 a 10) e caixa de comentário obrigatório salvos no IndexedDB de forma integrada.

### Segurança, Privacidade e LGPD
*   **RNF45 – Garantir Conformidade LGPD (Must Have)**: Checkboxes destacados de consentimento de dados de saúde no cadastro e no envio de exames.
*   **RF56 – Painel de Privacidade e Gestão de Dados (Could Have / Must Have LGPD)**:
    *   **Preferências de Comunicação**: Opt-In/Opt-Out para notificações via E-mail, SMS e WhatsApp.
    *   **Portabilidade (Direito de Acesso)**: Botão de exportação que compila todos os dados cadastrais do paciente e o histórico completo de agendamentos dele em um arquivo JSON para download.
    *   **Direito ao Esquecimento (Exclusão)**: Exclui permanentemente todos os registros do usuário e seus exames correspondentes do IndexedDB, efetuando logout automático.
    *   **Log de Auditoria**: Exibição dos logs de processamento das informações pessoais (acessos, logins, consentimentos e alterações de dados).
*   **Recuperação de Senha Segura**:
    *   Exibição do e-mail mascarado (ex: `an**.*z@email.com`) sob as regras da LGPD.
    *   **Simulador de Caixa de Entrada (Inbox Sandbox)**: Simulador visual integrado de e-mail seguro enviado pelo hospital contendo link clicável de redefinição de senha que atualiza os dados no IndexedDB.
*   **RNF82 – Restringir Tipos de Arquivos (Must Have)**: Bloqueio de upload por tipo de arquivo (MIME Type) e prevenção de arquivos executáveis maliciosos. Limite máximo de tamanho fixado em 5MB por arquivo.

---

## 🎨 Identidade Visual e Layout

O projeto segue rigorosamente o design system institucional do **Hospital de Amor**:
*   Interface em Split-Screen premium na tela de login/cadastro.
*   Sidebar na tonalidade rosa pastel (`#FFF0F6`) contendo cabeçalho com avatar dinâmico do paciente ativo.
*   Tons de Rosa/Magenta escuro (`HSL 330 100% 38%`) empregados em botões primários, gradientes e sinalizações visuais.
*   Micro-interações de botões (active:scale, hover) e suporte a Dark Mode.
