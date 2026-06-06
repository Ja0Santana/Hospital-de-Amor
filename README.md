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
*   **RNF81 – Salvamento Automático de Rascunhos (Must Have)**: O formulário de agendamento detecta e salva automaticamente o progresso do preenchimento a cada 30 segundos ou em transições de etapa no IndexedDB. Ao acessar a tela novamente, o paciente é questionado se deseja recuperar o rascunho anterior ou iniciar um novo.


### Módulo de Acompanhamento de Status e Feedback
*   **RF06 – Acompanhar Status (Must Have)**: Acompanhamento automático das solicitações vinculadas ao CPF do paciente logado, organizadas em um layout de accordion (cards expansíveis) com limpeza de estados ao alternar.
    *   **Filtros e Busca**: Barra de busca textual case-insensitive (busca por nome do exame ou código de protocolo) combinada com botões seletores (chips) de status com contadores numéricos em tempo real.
    *   **Confirmado**: Exibe data, hora, profissional, sala, ações de confirmação de presença (RF40), reagendamento (RF53) e emite a credencial com QR Code dinâmico.
    *   **Cancelado**: Apresenta justificativa do cancelamento inserida pela regulação e fluxo corretivo de substituição de anexos (RF88).
    *   **Em análise**: Mostra estimativa de tempo de resposta baseada nas triagens do mês.
*   **RF20 – Cancelar Solicitação (Must Have)**: Permite que o paciente cancele solicitações ativas diretamente no Portal, registrando o motivo e gerando os devidos logs.
*   **RF39 – Visualizar Detalhes e Instruções (Must Have)**: Detalhes de consultas confirmadas e instruções específicas disponíveis para visualização ou impressão.
*   **RF41 – Coletar Feedback do Paciente (Could Have)**: Pesquisa de satisfação NPS (0 a 10) e caixa de comentário obrigatório salvos no IndexedDB de forma integrada.
*   **RF67 – Diário de Sintomas e Bem-estar (Must Have)**: Painel diário para registro clínico e de humor do paciente.
    *   **Registro Completo**: Permite informar humor diário via escala de emojis (Péssimo a Ótimo), selecionar sintomas frequentes (Náusea, Fadiga, Dor de cabeça, etc.) ou sintomas personalizados, além de notas de texto salvas no IndexedDB.
    *   **Gráfico de Evolução Dinâmico**: Visualização da evolução da saúde nos últimos 7 dias renderizada em tempo real através de um gráfico de área e linha SVG dinâmico e interativo (com sementeira automática de histórico).
    *   **Widget Flutuante de Registro Rápido**: Lembrete fixado no canto inferior direito (`fixed bottom-6 right-6`) que permite preencher o diário a partir de qualquer tela do portal. O widget é ocultado na tela principal do diário para evitar redundância.
    *   **Bloqueio e Desbloqueio Inteligente**: Bloqueia o preenchimento duplicado exibindo a mensagem *"Volte todo dia para manter seu status atualizado"*, mas oferece um botão de destravamento manual se o paciente passar mal e precisar registrar outro status no mesmo dia.
*   **RF50 – Central de Lembretes Automáticos (Must Have)**: Exibição dinâmica de alertas de alta prioridade no topo da Dashboard, notificando o paciente sobre o preparo obrigatório de exames confirmados (ex: jejum) e lembrando do preenchimento pendente do diário de sintomas do dia atual.
*   **RF88 – Substituição de Documentos Pendentes (Must Have)**: Permite que o paciente realize a substituição de documentos com pendências ou marcados como ilegíveis diretamente a partir da tela de acompanhamento de status de agendamentos cujo status seja "Cancelado", alterando o status da solicitação de volta para "Em análise" após o upload corretivo.

### Módulo de Histórico Clínico e Localização
*   **RF51 – Importação de Histórico Clínico Externo (Must Have)**: Carteira de exames e laudos externos digitalizada. Permite o upload de arquivos de outras clínicas (PDF, JPG, PNG de até 5MB) com metadados obrigatórios (título, tipo do documento, data e especialidade médica), com pesquisa em tempo real, contadores de arquivos, filtros de visualização por tipo e exclusão com diálogo de confirmação de segurança.
*   **RF57 – Localização de Unidades (Must Have)**: Sistema buscador de filiais que detecta a geolocalização do usuário, calcula a distância em km para as 16 unidades de atendimento, tratamento e reabilitação oficiais do Hospital de Amor (Fórmula de Haversine), e coloca a unidade mais próxima em destaque no topo. Inclui links rápidos para abrir direções e rotas no Google Maps e Waze.

### Identidade Visual, Tipografia e Acessos
*   **Seletor de Portal no Login**: Adicionado um seletor visual por abas no cabeçalho do login que divide o acesso entre "Portal do Paciente" (fluxo principal) e "Portal do Doador" (exibindo uma tela informativa de "Em Breve" detalhando os futuros recursos).
*   **Tipografia Institucional Comfortaa**: Importada e configurada a fonte geométrica **Comfortaa** para todos os textos nominativos de marca (`HOSPITAL DE AM♥R`), aplicando o coração rosa choque no lugar da letra "O", perfeitamente alinhada à identidade visual e logotipo oficial.
*   **RNF84 – Ajuda Contextual com Tooltips (Must Have)**: Dicas flutuantes acessíveis (ativadas por hover ou foco do teclado/touch) nos principais campos de formulário de agendamento, orientando o usuário e conectando com o link de "Saiba mais" para a Central de Ajuda.
*   **RNF86 – Acessibilidade de Fontes (Must Have)**: Opção de acessibilidade visual na qual o usuário pode aumentar ou diminuir a escala de tamanho das fontes de texto do portal (Menor, Padrão, Médio, Grande, G+), com persistência de preferências no `localStorage` e aumento de 6.25% (17px) no tamanho base padrão para melhor legibilidade.

### Segurança, Privacidade e LGPD
*   **RNF45 – Garantir Conformidade LGPD (Must Have)**: Checkboxes destacados de consentimento de dados de saúde no cadastro e no envio de exames.
*   **RNF76 – Encerramento de Sessão por Inatividade (Must Have)**: Temporizador global que encerra a sessão e desloga o paciente automaticamente após 14 minutos de ociosidade, apresentando um modal de contagem regressiva de 60 segundos com opção de estender a sessão ativa.
*   **RNF78 – Proteção contra Força Bruta (Must Have)**: Limitação rigorosa de 5 tentativas consecutivas de senha inválida por CPF, bloqueando acessos adicionais temporariamente por 2 minutos no IndexedDB com timer dinâmico de liberação na interface.
*   **RNF83 – Validador de Complexidade de Senha (Must Have)**: Componente interativo de feedback visual que valida os critérios fortes de senha (mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial) nas telas de cadastro de pacientes e na troca de senha no perfil.
*   **RF56 – Painel de Privacidade e Gestão de Dados (Could Have / Must Have LGPD)**:
    *   **Preferências de Comunicação**: Opt-In/Opt-Out para notificações via E-mail, SMS e WhatsApp.
    *   **Portabilidade (Direito de Acesso)**: Botão de exportação que compila todos os dados cadastrais do paciente e o histórico completo de agendamentos dele em um arquivo JSON para download.
    *   **Direito ao Esquecimento (Exclusão)**: Exclui permanentemente todos os registros do usuário e seus exames correspondentes do IndexedDB, efetuando logout automático.
    *   **Log de Auditoria**: Exibição dos logs de processamento das informações pessoais (acessos, logins, consentimentos e alterações de dados).
*   **Recuperação de Senha Segura**:
    *   Exibição do e-mail mascarado (ex: `an**.*z@email.com`) sob as regras da LGPD.
    *   **Simulador de Caixa de Entrada (Inbox Sandbox)**: Simulador visual integrado de e-mail seguro enviado pelo hospital contendo link clicável de redefinição de senha que atualiza os dados no IndexedDB.
*   **RNF82 – Restringir Tipos de Arquivos (Must Have)**: Bloqueio de upload por tipo de arquivo (MIME Type) e prevenção de arquivos executáveis maliciosos. Limite máximo de tamanho fixado em 5MB por arquivo.



