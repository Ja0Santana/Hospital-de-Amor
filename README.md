# Hospital de Amor - Portal do Paciente

Este repositório contém o front-end do MVP (Minimum Viable Product) do **Portal do Paciente** para o sistema de regulação e agendamentos oncológicos do **Hospital de Amor**. O projeto foi estruturado com foco em altíssima fidelidade de interface (rich aesthetics), simulando fluxos de dados de forma 100% dinâmica no lado do cliente utilizando persistência local com **IndexedDB** do navegador.

---

## 🛠️ Stack de Tecnologias

***Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)

* **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) para design responsivo e ágil
* **Componentes**: [shadcn/ui](https://ui.shadcn.com/) (primitives baseados em Radix UI para máxima acessibilidade)
* **Ícones**: [Lucide React](https://lucide.dev/)
* **Persistência Local**: API nativa do **IndexedDB** do navegador para armazenamento assíncrono de dados de exames, uploads binários convertidos em Base64 e tabelas de usuários de forma robusta ## 📋 Requisitos Implementados até o Momento

### 👤 Módulo do Paciente (Requisitos Funcionais)

* **RF01 – Solicitar Agendamento (Must Have)**: Formulário multi-etapas contendo pré-preenchimento de dados cadastrais, seleção dinâmica da especialidade/exame com instruções de preparo, upload de comprovante de encaminhamento médico (PDF/imagem com preview) e emissão de protocolo exclusivo (HA-AAAA-XXXX).
* **RF02 – Informar Cidade de Origem (Should Have)**: Detecção automática de municípios de Sergipe pelo DDD (79) no campo de contato, classificação interna por regiões de saúde no estado e formulário inteligente de UF para cidades externas.
* **RF04 – Visualizar Resumo da Solicitação (Must Have)**: Tela de revisão de todos os dados informados, preview dos documentos anexados, termos de conformidade e consentimento obrigatório com a LGPD antes do envio.
* **RF05 – Registrar Solicitação (Must Have)**: Persistência assíncrona dos agendamentos no banco IndexedDB sob o status inicial "Pendente", com geração de chave primária técnica e registro de logs de auditoria do IP/sessão.
* **RF06 – Acompanhar Status (Must Have)**: Listagem dinâmica com filtros textuais e seletores (chips) por status em tempo real. Permite visualizar instruções de preparo, reagendar consultas confirmadas, emitir credencial em QR Code e substituir anexos de solicitações canceladas.
* **RF07 – Simulador de Notificações de Status por E-mail (Must Have)**: Caixa de correio simulada (Inbox Sandbox) que centraliza e apresenta os e-mails disparados ao paciente conforme as transições de status da triagem, contendo botões interativos de ação rápida.
* **RF20 – Cancelar Solicitação (Must Have)**: Permite que o paciente realize o cancelamento voluntário de suas solicitações ativas diretamente pela interface, exigindo motivo descritivo e registrando o evento nos logs.
* **RF39 – Visualizar Detalhes e Instruções (Must Have)**: Exibição detalhada de agendamentos confirmados e orientações específicas clínicas e preparatórias, com suporte nativo a impressão direta.
* **RF40 – Confirmar Presença (Must Have)**: Funcionalidade de confirmação antecipada de presença no portal para consultas confirmadas, otimizando o fluxo na recepção e emitindo um recibo no histórico.
* **RF41 – Coletar Feedback do Paciente (Could Have)**: Formulário de avaliação de satisfação (escala NPS de 0 a 10) e comentário obrigatório integrado à visualização de consultas concluídas.
* **RF49 – Gerar credencial de acesso com QR code (Must Have)**: Geração client-side de credencial eletrônica em formato SVG contendo QR Code dinâmico do protocolo para validação rápida na recepção presencial.
* **RF50 – Central de Lembretes Automáticos (Must Have)**: Alertas e badges flutuantes na dashboard que alertam o paciente sobre o preparo obrigatório de exames (jejum) e lembram de preencher o Diário de Sintomas pendente.
* **RF51 – Importação de Histórico Clínico Externo (Must Have)**: Carteira de exames e laudos externos digitalizada. Permite o upload de arquivos de outras clínicas (PDF, JPG, PNG de até 5MB) com metadados obrigatórios (título, tipo, data e especialidade médica) e filtros de visualização.
* **RF52 – Robo-FAQ / Assistente Virtual (Must Have)**: Robô assistente para triagem e dúvidas frequentes, operando via busca de palavras-chave e atalhos de navegação interativos.
* **RF53 – Reagendamento de Agendamentos (Should Have)**: Painel de autoatendimento para reagendamento de consultas confirmadas, sugerindo automaticamente os próximos dias úteis e horários disponíveis na agenda médica.
* **RF56 – Painel de Privacidade e Gestão de Dados (Must Have / LGPD)**:
  * **Preferências de Comunicação**: Opt-In/Opt-Out para notificações do hospital via E-mail, SMS e WhatsApp.
  * **Portabilidade**: Exportação client-side de todos os dados cadastrais e histórico clínico do usuário em arquivo JSON estruturado.
  * **Direito ao Esquecimento**: Exclusão permanente de todos os dados do paciente e seus exames do IndexedDB, efetuando logout automático.
  * **Log de Auditoria**: Linha do tempo visual exibindo todas as ações realizadas sobre os dados pessoais (acessos, logins, alterações).
* **RF57 – Localização de Unidades (Must Have)**: Detector de geolocalização que calcula a distância (Fórmula de Haversine) do paciente até as 16 filiais oficiais do Hospital de Amor, exibindo a mais próxima em destaque com atalhos para Google Maps e Waze.
* **RF67 – Diário de Sintomas e Bem-estar (Must Have)**: Registro clínico e de humor diário via escala de emojis, sintomas frequentes/customizados e notas de texto. Apresenta gráfico evolutivo interativo dos últimos 7 dias em SVG e widget flutuante de registro rápido com bloqueio de duplicidade diária.
* **RF68 – Biblioteca de Orientações Médicas (Must Have)**: Download offline simulado de cartilhas informativas e instruções de preparo cirúrgico.
* **RF74 – Bloquear Cadastro Duplicado de CPF (Must Have)**: Validação matemática rígida dos dígitos verificadores do CPF no blur do input e impedimento de cadastro caso o documento já exista na base de dados IndexedDB.
* **RF88 – Substituição de Documentos Pendentes (Must Have)**: Substituição corretiva de comprovantes médicos recusados na triagem diretamente na aba de status de agendamentos cancelados, alterando o status da solicitação de volta para "Em análise".
* **RF90 – Carteira Digital do Paciente (ICE)**: Passaporte clínico em formato 3D (flip card) contendo informações do paciente na frente (dados e QR Code SVG) e a Ficha de Informações Clínicas de Emergência (F.I.C.E.) no verso (tipo sanguíneo, alergias, diagnósticos ativos e contatos).

---

### 🎗️ Módulo do Doador (Requisitos Funcionais)

* **RF10 – Incentivar fidelização (Must Have)**: Sistema de pontuação e fidelidade do doador baseado em doações concluídas, contendo níveis de engajamento (Bronze, Prata, Ouro, Platina e Diamante), resgate de badges de prestígio e painel de acompanhamento de pontos acumulados.
* **RF11 – Ver histórico de doações (Must Have)**: Painel com histórico detalhado das contribuições do usuário contendo valor, data e projeto financiado, com suporte a filtros e emissão de declaração anual de IR em PDF institucional estruturado.
* **RF19 – Convidar novos doadores (Should Have)**: Sistema de indicação de amigos por e-mail com trava anti-spam temporária (máximo de 3 envios por 10 minutos) e bônus de 100 pontos no programa de fidelidade ao efetivar o cadastro do indicado.
* **RF21 – Pagar por Pix (Must Have)**: Integração com checkout Pix apresentando QR Code estático/dinâmico gerado client-side, código copia-e-cola e temporizador de expiração de 300 segundos com cancelamento automático.
* **RF22 – Pagar por cartão (Must Have)**: Fluxo completo de simulação de pagamento via cartão de crédito (número, validade, CVV e nome do titular) com suporte a doações avulsas ou assinaturas mensais recorrentes.
* **RF23 – Pagar por boleto (Must Have)**: Emissão de boleto bancário simulado com geração de linha digitável do código de barras e link para impressão/visualização.
* **RF24 – Pagar por cryptomoedas (Could Have)**: Opção de contribuição por criptoativos (BTC/ETH) contendo endereço de carteira pública e simulação de validação da hash de transação na blockchain.
* **RF55 – Enviar Mensagem de Apoio (Could Have)**: Envio de breves mensagens e depoimentos de incentivo de doadores para exibição nos painéis internos de acolhimento do hospital.
* **RF60 – Mural de Transparência (Must Have)**: Painel público de prestação de contas contendo gráficos de rosca e barras SVG com a destinação dos recursos captados por setor, andamento de projetos vigentes e depoimentos de pacientes curados.
* **RF66 – Portal de Patrocínio Corporativo (Must Have)**: Canal dedicado para captação de doações de Pessoas Jurídicas (PJ), incluindo simulação de incentivos fiscais sobre o IR, seleção de cotas de investimento social e fluxo de upload de documentos corporativos (CNPJ, Estatuto Social).

---

### 📋 Requisitos do Portal Administrativo e de Regulação (Staff Portal)

* **RF03 – Parâmetros Operacionais de Exames (Must Have)**: Painel de cadastro e parametrização de exames por especialidade, controlando a duração da consulta em minutos, sala padrão, custo estimado, status de ativação e exigibilidade de comprovante de encaminhamento médico.
* **RF08 – Painel de Triagem (Must Have)**: Dashboard central contendo a fila de solicitações de exames recebidas, com estatísticas e contadores dinâmicos por status e indicadores visuais destacados para comprovação de anexo ausente.
* **RF09 – Ordenação Dinâmica e Cabeçalhos Clicáveis (Should Have)**: Ordenação ascendente/descendente da fila de triagem por data, prioridade, protocolo ou cidade, com persistência das preferências do cabeçalho no `localStorage`.
* **RF12 – Registrar observações (Should Have)**: Histórico de anotações internas dos reguladores estruturado de forma cronológica e imutável, permitindo sinalizar notas críticas com badge "Urgente" piscante na fila geral.
* **RF13 – Filtrar solicitações (Must Have)**: Barra de pesquisa por dados do paciente combinada com filtros operacionais por Cidade de Origem, Especialidade e Status operacional.
* **RF14 – Armazenar histórico (Must Have)**: Implementação de encadeamento criptográfico SHA-256 (`hash` e `previousHash`) para logs de auditoria imutáveis.
* **RF15 – Gerar relatórios (Must Have)**: Geração client-side de relatórios operacionais nos formatos PDF institucional, CSV (com BOM UTF-8) e Excel estruturado em tabelas HTML, com painel para agendamento de relatórios recorrentes.
* **RF16 – Exibir gráfico por cidade (Must Have)**: Gráfico donut SVG de distribuição de atendimentos por cidade (alternável entre valor absoluto e percentual) com filtragem de exames.
* **RF17 – Exibir gráfico por tipo de exame (Must Have)**: Gráfico de barras SVG com indicadores de capacidade máxima operacional e alertas de necessidade de manutenção preventiva.
* **RF18 – Exibir evolução da demanda (Must Have)**: Gráfico de linha SVG com projeção de demanda para os próximos 3 meses, média móvel, marcas de sazonalidade clínica (ex: Outubro Rosa) e legibilidade aprimorada de rótulos rotacionados.
* **RF25 – Exportar relatório em PDF (Must Have)**: Emissão de relatórios e fila ativa do tempo de espera em formato PDF estruturado com folha de estilos do hospital.
* **RF26 – Exportar relatório para Excel (Must Have)**: Exportação em CSV ou Excel das métricas de NPS e tempo de espera dos pacientes na recepção.
* **RF27 – Gerenciar usuários administrativos (Must Have)**: Gestão de colaboradores com restrição em nível de componente; botões de alteração de agendamentos e lote são exibidos apenas para perfis com permissão `confirm_appointments`.
* **RF28 – Definir níveis de acesso (Must Have)**: Suporte a login e concessão de acessos baseando-se em cargos e perfis customizados criados dinamicamente na plataforma, eliminando o bloqueio de papéis estáticos.
* **RF29 – Registrar auditoria de ações (Must Have)**: Gravação persistente e rastreável de todas as ações de reguladores no IndexedDB (CPF, nome, módulo, ação, data/hora e IP de origem), imutável contra deleções acidentais.
* **RF30 – Gerenciar filas de atendimento (Must Have)**: Interface para tráfego e transição de pacientes na fila de triagem (Pendente, Em análise, Confirmado, Cancelado, Follow-up).
* **RF31 – Definir prioridades de atendimento (Should Have)**: Classificação visual em Baixa, Média e Alta prioridade, destacando com tags especiais pacientes preferenciais e urgentes.
* **RF32 – Controlar capacidade de atendimento (Must Have)**: Bloqueio no banco local para novas marcações ou reagendamentos em dias com capacidade máxima atingida para o exame, gerando alertas a partir de 80% do preenchimento.
* **RF33 – Gerenciar Calendário Institucional (Must Have)**: Gestão de datas com bloqueio de agendamento em feriados ou finais de semana, com atalho para importação de feriados brasileiros dos anos de 2026 e 2027.
* **RF34 – Monitorar indicadores operacionais (Must Have)**: Dashboards com indicadores de eficiência de triagem, taxa de absenteísmo de consultas e ociosidade de salas.
* **RF37 – Realizar triagem administrativa (Must Have)**: Gaveta lateral de triagem com visualização/iframe de comprovante médico ampliado integrado para validação rápida do regulador.
* **RF38 – Confirmar Agendamento e data (Must Have)**: Validação rígida que impede o agendamento de consultas na mesma data, mesmo horário, utilizando o mesmo profissional médico ou a mesma sala/consultório.
* **RF42 – Analisar e processar análises de satisfação (NPS) (Must Have)**: Gráficos de monitoramento de feedbacks exibindo o score NPS consolidado e a divisão percentual e absoluta de promotores, passivos e detratores.
* **RF43 – Gerar relatório do histórico de Satisfação (Must Have)**: Histórico de respostas a pesquisas NPS exportável em PDF e planilhas, com opções de filtros por especialidade.
* **RF44 – Gerenciar lista de espera e realocar vagas (Must Have)**: Painel de controle que rastreia cancelamentos e sugere ativamente a realocação automática de pacientes prioritários da fila de espera para as vagas vagas.
* **RF46 – Integrar dados com Prontuário Eletrônico (PEP) (Must Have)**: Módulo de integração e sincronismo com o prontuário eletrônico do hospital (PEP) contendo logs de tentativas e controle de status de envio (Pendente, Erro, Sincronizado).
* **RF54 – Autenticar Duas Etapas (2FA) (Must Have)**: Exigibilidade de token temporário de 6 dígitos (validado via twoFactorAuth.ts) para acesso à área administrativa com bloqueio preventivo de segurança.
* **RF58 – Assinatura Digital de Laudos e Relatórios (Must Have)**: Assinatura jurídica via e-CPF (ICP-Brasil) para laudos de triagem concluídos, aplicando hash SHA-256 criptográfico inviolável.
* **RF61 – Painel de Chamada Visual (Lobby) (Must Have)**: Transmissão em tempo real de chamadas de pacientes para a TV da recepção presencial via BroadcastChannel, contendo alertas sonoros e histórico de chamadas ativas.
* **RF65 – Gestão de Escalas e Alocação de Salas (Must Have - Parcial)**: Validação de conflito de agendas de médicos e consultórios integrada ao painel de triagem, associando salas padrão a exames cadastrados.
* **RF71 – Dashboard de Tempo de Espera em Tempo Real (Should Have)**: Monitor em tempo real do fluxo de pacientes na recepção física do hospital, calculando médias de espera e disparando alertas para altos tempos de ociosidade na fila.
* **RF72 – Atualizar Contato do Paciente rapidamente (Should Have)**: Atualização instantânea dos dados do paciente e simulação híbrida de envio de tokens por WhatsApp Business e SMS direto do painel de triagem.
* **RF87 – Gerenciar Pendências administrativas e prazos de follow-up (Should Have)**: Mover solicitações para o status "Aguardando Follow-up", exigindo prazos máximos de resposta e disparando alertas visuais para follow-ups vencidos.
* **RF89 – Selecionar lotes de solicitações (Must Have)**: Funcionalidade de seleção múltipla de solicitações de exames para aprovação ou cancelamento em lote, otimizando o fluxo diário de triagem.
* **RF90 – Validar compatibilidade de recursos e profissionais (Must Have)**: Prevenção automatizada contra conflito de insumos físicos, salas operacionais e agenda profissional durante as marcações.

---

### ⚙️ Requisitos Não Funcionais (RNF)

* **RNF45 – Garantir conformidade legal e privacidade (LGPD) (Must Have)**: Checkboxes destacados de consentimento de dados de saúde no cadastro e no envio de exames.
* **RNF47 – Garantir acessibilidade (Must Have)**: Implementação de folhas de estilo específicas para modo Alto Contraste (classes de inversão de cores) e redimensionamento dinâmico do tamanho das fontes do portal.
* **RNF48 – Garantir performance de carga e estabilidade (Must Have - Parcial)**: Estrutura em SPA para carregar dados em menos de 1.5 segundos e persistência local por IndexedDB para assegurar o funcionamento offline da interface.
* **RNF62 – Gestão do Ciclo de Vida de Dados e Arquivamento Inteligente (Must Have)**: Rotina client-side de arquivamento automático (Cold Storage) de logs de auditoria e solicitações inativas há mais de 2 anos.
* **RNF64 – Monitoramento Contínuo e Observabilidade do Sistema (Must Have)**: Logs de auditoria persistentes gravados no IndexedDB cobrindo alterações cadastrais, tentativas e bloqueios de autenticação.
* **RNF76 – Encerramento de Sessão por Inatividade (Must Have)**: Temporizador global que desloga o usuário após 14 minutos de inatividade, exibindo modal de contagem regressiva de 60 segundos com opção de estender a sessão ativa.
* **RNF77 – Otimizar o peso de carregamento (Must Have - Não Implementado)**: Não aplicável diretamente ao front-end estático da SPA, além de manter o bundle de recursos o mais leve possível.
* **RNF78 – Proteger contra ataques de força bruta (Must Have)**: Bloqueio preventivo de acessos por CPF no IndexedDB após 5 tentativas consecutivas de senha incorreta, liberando o acesso apenas após um timer progressivo de 2 minutos.
* **RNF79 – Padronizar a identidade visual (Should Have)**: Uso de guia de estilo institucional unificado por Tailwind, tipografia Comfortaa com coração nos títulos de marca, e iconografia unificada da biblioteca Lucide React.
* **RNF80 – Garantir a compatibilidade multi-browser (Should Have - Parcial)**: Funcionamento do sistema sem quebras visuais ou falhas nos principais navegadores modernos (Chrome, Firefox, Edge e Safari).
* **RNF81 – Implementar o Salvamento Automático de Formulários (Must Have)**: Autosave a cada 30 segundos ou em transições de etapas do formulário de agendamento, com modal de recuperação ao recarregar a página.
* **RNF82 – Restringir Tipos de Ficheiros para Upload (Must Have)**: Bloqueio de upload por tipo de arquivo (MIME Type) e extensão (.exe, .bat, etc.) para segurança do servidor, limitando o tamanho a 5MB por arquivo.
* **RNF83 – Forçar a Complexidade de Palavras-Passe (Must Have)**: Indicador visual de senha forte nas telas de cadastro e alteração de perfil (maiúscula, minúscula, número, caractere especial e 8 caracteres), com botões `Eye/EyeOff`.
* **RNF84 – Disponibilizar Ajuda Contextual por Ecrã (Must Have)**: Tooltips ativados por hover ou foco de teclado orientando o preenchimento de campos complexos e fornecendo links diretos para a Central de Ajuda.
* **RNF85 – Padronizar o Formato de Data e Hora (Must Have)**: Sanitização automática de espaços extras em strings de entrada e validações de formatos locais (pt-BR) de CPF, datas e telefones.
* **RNF86 – Otimizar o Tempo de Resposta das Buscas (Must Have)**: Módulo de alteração de fontes com aumento de até 6.25% (17px) na fonte base com persistência das preferências do usuário no `localStorage`.

---

### 🛠️ Fluxos Auxiliares e Identidade Visual

* **Login e Cadastro Funcionais**: Login validando credenciais (CPF e senha) no banco IndexedDB. Cadastro de novas contas de pacientes com persistência local definitiva.
* **Sessão Dinâmica**: Recuperação automática do nome do paciente e geração de ID cadastral a partir dos dados do IndexedDB após o login para alimentar a Sidebar e Dashboard.
* **Seletor de Portal no Login**: Adicionado um seletor visual por abas no cabeçalho do login que divide o acesso entre "Portal do Paciente" e "Portal do Doador", direcionando o fluxo de forma integrada e adaptando dinamicamente a navegação, sidebar, tema (com detalhes azul primário/rosa choque) e restrições de privacidade de cada painel.
* **Tipografia Institucional Comfortaa**: Importada e configurada a fonte geométrica **Comfortaa** para todos os textos nominativos de marca (`HOSPITAL DE AM\u2665R`), aplicando o coração rosa choque no lugar da letra "O", perfeitamente alinhada à identidade visual e logotipo oficial.
* **Recuperação de Senha Segura**: Exibição do e-mail mascarado (ex: `an**.*z@email.com`) sob as regras da LGPD e Simulador de Caixa de Entrada (Inbox Sandbox) com link clicável de redefinição de senha que atualiza os dados no IndexedDB.

---

### Melhorias de UX/UI e Correções Técnicas

* **Sidebar do Paciente – Scroll e Rodapé Fixo**: Com fontes em tamanhos maiores (RNF86), o menu lateral do portal do paciente passava a ocultar o botão "Sair" fora da tela. A área de navegação agora é independentemente rolável (`overflow-y-auto`) e o bloco de rodapé (ação principal + Ajuda + Sair) é sempre visível com `shrink-0`.
* **Card "Próximo Evento" Dinâmico (Dashboard do Paciente)**: O card da Dashboard deixou de exibir dados fixos e passou a ler o próximo agendamento com status `Confirmado` e data definida pela triagem, ordenado pelo evento mais próximo. Quando não há nenhum confirmado, exibe um estado positivo com ícone verde e a mensagem *"Você não possui consultas ou exames confirmados no momento. Tudo em ordem!"*.
* **Fechamento de Modais/Sidebars via ESC e Clique Externo**: Todos os painéis laterais e modais do módulo administrativo (triagem, edição de usuários, edição de exames, diff de auditoria) passaram a fechar ao pressionar a tecla `Escape` ou ao clicar fora da área do painel.
* **Animação de Saída das Sidebars**: As gavetas do painel de triagem executam animação de saída reversa (`slide-out-to-right`) com `animationFillMode: forwards`, eliminando o flash visual ao fechar.
* **Sobreposição Branca Corrigida (Módulo Administrativo)**: Modais e sidebars foram desacoplados de containers com `animate-in fade-in` do Tailwind, que criavam um novo bloco de contenção e deslocavam elementos `fixed` ao rolar a página.
* **NPS com Confirmação e Bloqueio de Duplicidade**: O envio de avaliação NPS na tela de agendamentos exige confirmação explícita antes de submeter, e o formulário é substituído por uma mensagem de agradecimento permanente caso a avaliação já tenha sido registrada para aquele agendamento, impedindo múltiplos envios.
