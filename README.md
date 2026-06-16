# Hospital de Amor - Portal do Paciente

Este repositório contém o front-end do MVP (Minimum Viable Product) do **Portal do Paciente** para o sistema de regulação e agendamentos oncológicos do **Hospital de Amor**. O projeto foi estruturado com foco em altíssima fidelidade de interface (rich aesthetics), simulando fluxos de dados de forma 100% dinâmica no lado do cliente utilizando persistência local com **IndexedDB** do navegador.

---

## 🛠️ Stack de Tecnologias

***Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)

* **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) para design responsivo e ágil
* **Componentes**: [shadcn/ui](https://ui.shadcn.com/) (primitives baseados em Radix UI para máxima acessibilidade)
* **Ícones**: [Lucide React](https://lucide.dev/)
* **Persistência Local**: API nativa do **IndexedDB** do navegador para armazenamento assíncrono de dados de exames, uploads binários convertidos em Base64 e tabelas de usuários de forma robusta e ilimitada.

---

## 📋 Requisitos Implementados até o Momento

### Requisitos Funcionais (RF)

* **RF01 – Solicitar Agendamento (Must Have)**: Formulário multi-etapas contendo:
  * **Passo 1 (Dados Básicos)**: Pré-preenchimento automático dos dados do paciente logado com base em seu cadastro local.
  * **Passo 2 (Atendimento)**: Seleção dinâmica da especialidade e do tipo de exame com exibição das respectivas orientações de preparo.
  * **Passo 3 (Documentos e Revisão)**: Upload de comprovante de encaminhamento com preview e revisão na mesma tela (com botão de edição rápida de etapas).
  * **Passo 4 (Confirmação)**: Emissão do número de protocolo exclusivo (HA-AAAA-XXXX) e instruções dos prazos da triagem.
* **RF02 – Informar Cidade de Origem (Should Have)**: Campo obrigatório com auto-sugestão de Sergipe ao detectar DDD (79) no telefone e classificação das regiões de saúde (ex: Região de Lagarto, Aracaju).
* **RF04 – Visualizar Resumo da Solicitação (Must Have)**: Tela de revisão com exibição de todos os dados inseridos, preview do arquivo anexado e checkbox obrigatório de consentimento da LGPD.
* **RF05 – Registrar Solicitação (Must Have)**: Gravação assíncrona da solicitação com carimbo de data/hora no IndexedDB sob o status inicial "Pendente".
* **RF06 – Acompanhar Status (Must Have)**: Acompanhamento automático das solicitações vinculadas ao CPF do paciente logado, organizadas em um layout de accordion (cards expansíveis) com limpeza de estados ao alternar.
  * **Filtros e Busca**: Barra de busca textual case-insensitive (busca por nome do exame ou código de protocolo) combinada com botões seletores (chips) de status com contadores numéricos em tempo real.
  * **Confirmado**: Exibe data, hora, profissional, sala, ações de confirmação de presença (RF40), reagendamento (RF53) e emite a credencial com QR Code dinâmico.
  * **Cancelado**: Apresenta justificativa do cancelamento inserida pela regulação e fluxo corretivo de substituição de anexos (RF88).
  * **Em análise**: Mostra estimativa de tempo de resposta baseada nas triagens do mês.
* **RF07 – Simulador de Notificações de Status por E-mail (Must Have)**: Ambiente de simulação integrado (Inbox Sandbox) que consolida em tempo real as notificações de e-mail enviadas conforme mudanças de estado nos agendamentos (boas-vindas, confirmação de envio de solicitação, início da triagem administrativa, confirmação definitiva de consulta/exame com instruções clínicas de preparo, confirmação de presença, feedback de NPS e recusas com motivos de pendências). Os e-mails contam com botões interativos de Call-to-Action (CTA) integrados para navegação fluida de retorno.
* **RF20 – Cancelar Solicitação (Must Have)**: Permite que o paciente cancele solicitações ativas diretamente no Portal, registrando o motivo e gerando os devidos logs.
* **RF39 – Visualizar Detalhes e Instruções (Must Have)**: Detalhes de consultas confirmadas e instruções específicas disponíveis para visualização ou impressão.
* **RF40 – Confirmar Presença (Must Have)**: Permite o registro antecipado de presença no portal para exames confirmados, gerando um recibo no histórico e otimizando a recepção.
* **RF41 – Coletar Feedback do Paciente (Could Have)**: Pesquisa de satisfação NPS (0 a 10) e caixa de comentário obrigatório salvos no IndexedDB de forma integrada.
* **RF50 – Central de Lembretes Automáticos (Must Have)**: Exibição dinâmica de alertas de alta prioridade no topo da Dashboard, notificando o paciente sobre o preparo obrigatório de exames confirmados (ex: jejum) e lembrando do preenchimento pendente do diário de sintomas do dia atual.
* **RF51 – Importação de Histórico Clínico Externo (Must Have)**: Carteira de exames e laudos externos digitalizada. Permite o upload de arquivos de outras clínicas (PDF, JPG, PNG de até 5MB) com metadados obrigatórios (título, tipo do documento, data e especialidade médica), com pesquisa em tempo real, contadores de arquivos, filtros de visualização por tipo e exclusão com diálogo de confirmação de segurança.
* **RF52 – Robo-FAQ / Assistente Virtual (Must Have)**: Sistema interativo de chatbot que responde dúvidas frequentes de forma dinâmica baseado em palavras-chave e atalhos rápidos com indicador de digitação de forma responsiva.
* **RF53 – Reagendamento de Agendamentos (Should Have)**: Abre painel de reagendamento para consultas confirmadas, sugerindo os próximos dias úteis e horários livres e persistindo a alteração no banco local.
* **RF56 – Painel de Privacidade e Gestão de Dados (Could Have / Must Have LGPD)**:
  * **Preferências de Comunicação**: Opt-In/Opt-Out para notificações via E-mail, SMS e WhatsApp.
  * **Portabilidade (Direito de Acesso)**: Botão de exportação que compila todos os dados cadastrais do paciente e o histórico completo de agendamentos dele em um arquivo JSON para download.
  * **Direito ao Esquecimento (Exclusão)**: Exclui permanentemente todos os registros do usuário e seus exames correspondentes do IndexedDB, efetuando logout automático.
  * **Log de Auditoria**: Exibição dos logs de processamento das informações pessoais (acessos, logins, consentimentos e alterações de dados).
* **RF57 – Localização de Unidades (Must Have)**: Sistema buscador de filiais que detecta a geolocalização do usuário, calcula a distância em km para as 16 unidades de atendimento, tratamento e reabilitação oficiais do Hospital de Amor (Fórmula de Haversine), e coloca a unidade mais próxima em destaque no topo. Inclui links rápidos para abrir direções e rotas no Google Maps e Waze.
* **RF67 – Diário de Sintomas e Bem-estar (Must Have)**: Painel diário para registro clínico e de humor do paciente.
  * **Registro Completo**: Permite informar humor diário via escala de emojis (Péssimo a Ótimo), selecionar sintomas frequentes (Náusea, Fadiga, Dor de cabeça, etc.) ou sintomas personalizados, além de notas de texto salvas no IndexedDB.
  * **Gráfico de Evolução Dinâmico**: Visualização da evolução da saúde nos últimos 7 dias renderizada em tempo real através de um gráfico de área e linha SVG dinâmico e interativo (com sementeira automática de histórico).
  * **Widget Flutuante de Registro Rápido**: Lembrete fixado no canto inferior direito que permite preencher o diário a partir de qualquer tela do portal. O widget é ocultado na tela principal do diário para evitar redundância.
  * **Bloqueio e Desbloqueio Inteligente**: Bloqueia o preenchimento duplicado exibindo a mensagem *"Volte todo dia para manter seu status atualizado"*, mas oferece um botão de destravamento manual se o paciente passar mal e precisar registrar outro status no mesmo dia.
* **RF68 – Biblioteca de Orientações Médicas (Must Have)**: Acesso e download físico de cartilhas informativas e preparos cirúrgicos e de exames com tela de simulação de progresso de download offline.
* **RF74 – Bloquear Cadastro Duplicado de CPF (Must Have)**: Valida matematicamente os dígitos verificadores do CPF durante a perda de foco (blur) e impede o cadastro caso o CPF já exista no IndexedDB.
* **RF88 – Substituição de Documentos Pendentes (Must Have)**: Permite que o paciente realize a substituição de documentos com pendências ou marcados como ilegíveis diretamente a partir da tela de acompanhamento de status de agendamentos cujo status seja "Cancelado", alterando o status da solicitação de volta para "Em análise" após o upload corretivo.
* **RF90 – Carteira Digital do Paciente (ICE)**: Desenvolvido um passaporte clínico digital interativo com efeito 3D (flip card) ao clique:
  * **Frente**: Exibe o logotipo oficial do Hospital de Amor (transparente), dados de identificação do paciente (Nome, CPF formatado sem quebra de linha, ID do Cartão) e QR Code dinâmico gerado em SVG vetorial.
  * **Verso**: Apresenta a Ficha de Informações Clínicas de Emergência (F.I.C.E.) contendo Tipo Sanguíneo destacado, Alergias catalogadas, Diagnósticos clínicos ativos, Contato de emergência e ações integradas para chamada telefônica rápida e impressão da carteira.
  * **Dashboard e Configurações**: Integrado um botão de atalho direto na Dashboard para exibição da carteira, e uma seção no perfil para preenchimento e edição das informações de saúde persistidas localmente no IndexedDB.

---

### Requisitos Não Funcionais (RNF)

* **RNF45 – Garantir Conformidade LGPD (Must Have)**: Checkboxes destacados de consentimento de dados de saúde no cadastro e no envio de exames.
* **RNF76 – Encerramento de Sessão por Inatividade (Must Have)**: Temporizador global que encerra a sessão e desloga o paciente automaticamente após 14 minutos de ociosidade, apresentando um modal de contagem regressiva de 60 segundos com opção de estender a sessão ativa.
* **RNF78 – Proteção contra Força Bruta (Must Have)**: Limitação rigorosa de 5 tentativas consecutivas de senha inválida por CPF, bloqueando acessos adicionais temporariamente por 2 minutos no IndexedDB com timer dinâmico de liberação na interface.
* **RNF81 – Salvamento Automático de Rascunhos (Must Have)**: O formulário de agendamento detecta e salva automaticamente o progresso do preenchimento a cada 30 segundos ou em transições de etapa no IndexedDB. Ao acessar a tela novamente, o paciente é questionado se deseja recuperar o rascunho anterior ou iniciar um novo.
* **RNF82 – Restringir Tipos de Arquivos (Must Have)**: Bloqueio de upload por tipo de arquivo (MIME Type) e prevenção de arquivos executáveis maliciosos. Limite máximo de tamanho fixado em 5MB por arquivo.
* **RNF83 – Validador e Visualizador de Complexidade de Senha (Must Have)**: Componente interativo de feedback visual que valida os critérios fortes de senha (mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial) nas telas de cadastro de pacientes e na troca de senha no perfil. Adiciona botões de alternância (`Eye`/`EyeOff`) para revelar/ocultar a senha em todos os inputs de autenticação e configuração.
* **RNF84 – Ajuda Contextual com Tooltips (Must Have)**: Dicas flutuantes acessíveis (ativadas por hover ou foco do teclado/touch) nos principais campos de formulário de agendamento, orientando o usuário e conectando com o link de "Saiba mais" para a Central de Ajuda.
* **RNF86 – Acessibilidade de Fontes (Must Have)**: Opção de acessibilidade visual na qual o usuário pode aumentar ou diminuir a escala de tamanho das fontes de texto do portal (Menor, Padrão, Médio, Grande, G+), com persistência de preferências no `localStorage` e aumento de 6.25% (17px) no tamanho base padrão para melhor legibilidade.

---

### Fluxos Auxiliares e Identidade Visual

* **Login e Cadastro Funcionais**: Login validando credenciais (CPF e senha) no banco IndexedDB. Cadastro de novas contas de pacientes com persistência local definitiva.
* **Sessão Dinâmica**: Recuperação automática do nome do paciente e geração de ID cadastral a partir dos dados do IndexedDB após o login para alimentar a Sidebar e Dashboard.
* **Seletor de Portal no Login**: Adicionado um seletor visual por abas no cabeçalho do login que divide o acesso entre "Portal do Paciente" e "Portal do Doador", direcionando o fluxo de forma integrada e adaptando dinamicamente a navegação, sidebar, tema (com detalhes azul primário/rosa choque) e restrições de privacidade de cada painel.
* **Tipografia Institucional Comfortaa**: Importada e configurada a fonte geométrica **Comfortaa** para todos os textos nominativos de marca (`HOSPITAL DE AM\u2665R`), aplicando o coração rosa choque no lugar da letra "O", perfeitamente alinhada à identidade visual e logotipo oficial.
* **Recuperação de Senha Segura**: Exibição do e-mail mascarado (ex: `an**.*z@email.com`) sob as regras da LGPD e Simulador de Caixa de Entrada (Inbox Sandbox) com link clicável de redefinição de senha que atualiza os dados no IndexedDB.

---

## 📋 Requisitos do Portal Administrativo e de Regulação (Staff Portal)

* **RF08 – Painel de Triagem (Must Have)**: Tela administrativa centralizada que exibe todas as solicitações recebidas, com cartões estatísticos contendo contadores em tempo real por status (Pendente, Em análise, Confirmado, Cancelado, Aguardando Follow-up) e indicação visual destacada caso o comprovante de encaminhamento médico esteja ausente.
* **RF13 – Filtros e Pesquisa na Triagem (Must Have)**: Permite aos triadores filtrar solicitações por Cidade de Origem, Especialidade e Status operacional.
* **RF37 – Área de Triagem de Documentos (Must Have)**: Gaveta/painel lateral de detalhes que renderiza em tempo real a foto ou PDF do encaminhamento médico anexado (com visualização direta e modo ampliado em iframe), possibilitando a análise clínica célere e a transição de status.
* **RF38 & RF90 – Prevenção Rápida de Choque de Horários (Must Have)**: Validação rígida que impede o agendamento de consultas na mesma data, mesmo horário, utilizando o mesmo profissional médico ou a mesma sala/consultório, alertando imediatamente o recepcionista em caso de conflito.
* **RF89 – Ações Administrativas em Lote (Must Have)**: Permite selecionar múltiplos registros na fila de triagem e realizar a alteração de status em lote (ex: mover para "Em análise" ou "Cancelado" de uma única vez).
* **RF27 & RF28 – Gestão de Perfis de Funcionários (Must Have)**: Interface restrita a gestores que possibilita cadastrar novos colaboradores da equipe administrativa e ativar ou desativar perfis de acesso (recepcionista, gestor, auditor), com trava de segurança que impede a autodesativação do usuário logado.
* **RF29 – Logs de Auditoria Imutáveis (Must Have)**: Módulo de conformidade regulatória que apresenta todos os logs de ações sensíveis ocorridas no sistema (CPF do operador, nome, módulo, ação descritiva, data/hora e IP de origem), gravados em formato permanente no IndexedDB.
* **RF09 – Ordenação Dinâmica e Cabeçalhos Clicáveis (Should Have)**: Permite ordenar a fila de triagem de forma crescente ou decrescente por data de criação, protocolo, paciente, prioridade ou cidade. As preferências do cabeçalho selecionado são persistidas no `localStorage`. Contém badges ativos para remoção de filtros individuais e botão de "Limpar Tudo".
* **RF12 – Observações Imutáveis e Notas Urgentes (Should Have)**: Substitui campos de texto editáveis por uma linha do tempo cronológica e imutável de anotações internas. Permite sinalizar notas como "Urgente", disparando um alerta visual piscante na listagem de triagem geral.
* **RF31 – Classificação de Prioridade Clínica (Should Have)**: Classificação de risco/prioridade da solicitação em Baixa, Média e Alta, com indicador de destaque visual dinâmico na listagem para agendamentos classificados com alta prioridade.
* **RF87 – Acompanhamento de Pendências e Follow-up (Should Have)**: Transição para o status "Aguardando Follow-up", exigindo uma data limite de retorno ou suspensão temporária com justificativa obrigatória. O sistema exibe um alerta visual proeminente na fila caso o retorno do follow-up esteja vencido em relação ao dia atual.
* **RF75 – Histórico Clínico & Badges de Retorno (Should Have)**: Resumo visual na gaveta de triagem indicando se o paciente possui consultas anteriores ou se é o primeiro atendimento na unidade. Caso o paciente tenha uma consulta confirmada há menos de 15 dias, exibe o selo "Possível Retorno".
* **RF72 – Recepção Rápida e Validação Híbrida (Should Have)**: Atualização instantânea dos dados de contato do paciente diretamente no painel de triagem, propagando o e-mail/telefone atualizados a todos os agendamentos relacionados. Contém painel interativo de simulação de envio de código de confirmação híbrida (via SMS e WhatsApp Business), simulando a tela de recepção no telefone do paciente.
* **RF03 – Parâmetros Operacionais de Exames (Must Have)**: Configuração de exames por especialidade, controlando a duração da consulta em minutos, sala padrão de exames, custo estimado do procedimento em BRL, exigibilidade ou não de encaminhamento médico e status de ativação (exames desativados não aparecem para novos agendamentos do paciente).
* **RF32 – Gestão de Limites de Capacidade (Must Have)**: Definição de capacidade diária máxima de agendamento por tipo de exame. O banco de dados impede novos agendamentos ou solicitações de reagendamento para dias com lotação máxima. O dashboard de triagem apresenta alertas visuais em tempo real e emite alertas na auditoria a partir de 80% do preenchimento das vagas diárias.
* **RF33 – Calendário Institucional e Bloqueios (Must Have)**: Controle de calendário com bloqueio manual de datas especiais ou feriados com justificativa, impedindo agendamentos nestes dias ou em finais de semana. Oferece ação rápida para importar feriados nacionais padrão brasileiros para os anos de 2026 e 2027.
* **RF27 – Perfis Dinâmicos e Controle de Acesso Granular (Must Have)**: O painel de triagem agora aplica restrições de acesso em nível de componente. O botão **"Agendar"** e as **ações em lote** (Colocar Em Análise / Cancelar) são renderizados somente para colaboradores com a permissão `confirm_appointments`. Funcionários com acesso exclusivo à triagem visualizam a fila e as fichas, sem poder confirmar ou alterar agendamentos.
* **RF28 – Roles Dinâmicas no Login Administrativo (Must Have)**: A tela de login do portal administrativo passou a aceitar colaboradores cadastrados com perfis personalizados criados dinamicamente (ex: "Auxiliar de Triagem"), removendo a restrição anterior que só validava roles estáticas pré-definidas no código.
* **RF29 – Persistência Real dos Logs de Auditoria (Must Have)**: Corrigida a raiz do bug que impedia o aparecimento dos logs na tela de auditoria. A função `initDb()` foi ajustada para retornar a instância em cache imediatamente sem re-executar o seeder, e a chamada `auditLogsStore.clear()` foi removida do `seedData`. A partir desta correção, todos os eventos auditáveis (edição de colaboradores, triagem, configurações) são gravados e persistem entre sessões.
* **RF14 – Auditoria com Encadeamento de Hash e Cold Storage (Must Have)**: Implementação de encadeamento criptográfico SHA-256 (`hash` e `previousHash`) para logs de auditoria imutáveis e rotina de arquivamento automático (Cold Storage) para solicitações inativas há mais de 2 anos.
* **RF15 – Exportação de Relatórios e Agendamento (Must Have)**: Geração de relatórios operacionais client-side nos formatos PDF institucional (rosa), CSV (com BOM UTF-8) e Excel estruturado em HTML. Painel de simulação de agendamento mensal de relatórios.
* **RF16 – Painel Analítico: Demanda por Cidade (Must Have)**: Gráfico donut SVG de distribuição de atendimentos por cidade (alternável entre quantitativo e percentual), com filtragem interativa da lista de exames.
* **RF17 – Painel Analítico: Demanda por Exame (Must Have)**: Gráfico de barras SVG (Top 5 e Bottom 5) com indicadores visuais de capacidade e alertas de manutenção de equipamentos ao atingir o limite.
* **RF18 – Painel Analítico: Evolução e Projeções (Must Have)**: Gráfico de linha SVG dinâmico exibindo a demanda real do semestre, média móvel, projeção de 3 meses, notas de contexto clínico (ex: Outubro Rosa) e rótulos de dados rotacionados a -45 graus para total legibilidade.

---

### Melhorias de UX/UI e Correções Técnicas

* **Sidebar do Paciente – Scroll e Rodapé Fixo**: Com fontes em tamanhos maiores (RNF86), o menu lateral do portal do paciente passava a ocultar o botão "Sair" fora da tela. A área de navegação agora é independentemente rolável (`overflow-y-auto`) e o bloco de rodapé (ação principal + Ajuda + Sair) é sempre visível com `shrink-0`.
* **Card "Próximo Evento" Dinâmico (Dashboard do Paciente)**: O card da Dashboard deixou de exibir dados fixos e passou a ler o próximo agendamento com status `Confirmado` e data definida pela triagem, ordenado pelo evento mais próximo. Quando não há nenhum confirmado, exibe um estado positivo com ícone verde e a mensagem *"Você não possui consultas ou exames confirmados no momento. Tudo em ordem!"*.
* **Fechamento de Modais/Sidebars via ESC e Clique Externo**: Todos os painéis laterais e modais do módulo administrativo (triagem, edição de usuários, edição de exames, diff de auditoria) passaram a fechar ao pressionar a tecla `Escape` ou ao clicar fora da área do painel.
* **Animação de Saída das Sidebars**: As gavetas do painel de triagem executam animação de saída reversa (`slide-out-to-right`) com `animationFillMode: forwards`, eliminando o flash visual ao fechar.
* **Sobreposição Branca Corrigida (Módulo Administrativo)**: Modais e sidebars foram desacoplados de containers com `animate-in fade-in` do Tailwind, que criavam um novo bloco de contenção e deslocavam elementos `fixed` ao rolar a página.
* **NPS com Confirmação e Bloqueio de Duplicidade**: O envio de avaliação NPS na tela de agendamentos exige confirmação explícita antes de submeter, e o formulário é substituído por uma mensagem de agradecimento permanente caso a avaliação já tenha sido registrada para aquele agendamento, impedindo múltiplos envios.
