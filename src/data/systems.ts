import type { System } from "@/types/system";

export const SYSTEMS: System[] = [
  // ── NÚCLEO ────────────────────────────────────────────────────────────
  {
    id: "logix", name: "ERP Logix", zone: "nucleo", core: true,
    status: "estavel", owner: "mercado", vendor: "TOTVS",
    units: ["corporativo"],
    desc: "ERP central do Grupo, rodando sobre banco Oracle. Concentra contabilidade, fiscal, financeiro, compras, estoque e manufatura. Praticamente todos os outros sistemas integram com ele.",
    modules: ["Contabilidade","Fiscal","Faturamento","Compras","Contas a Pagar","Contas a Receber / Tesouraria","Tributos e Impostos","Manufatura","Ativo Fixo","Recebimento","Pesagem","Estoques","WMS"],
    flows: [],
  },
  {
    id: "protheus", name: "ERP Protheus", zone: "nucleo", core: true,
    status: "estavel", owner: "mercado", vendor: "TOTVS",
    units: ["corporativo"],
    desc: "ERP de pessoas. Cuida de RH, ponto e medicina/segurança do trabalho. Devolve ao Logix a contabilização das provisões (folha, encargos).",
    modules: ["Gestão de RH","Gestão de Ponto","Gestão de Medicina e Segurança"],
    flows: [
      { to: "logix", label: "Contabilização das provisões — lançamentos contábeis", dir: "out" },
      { to: "logix", label: "Pagamentos: salários, adiantamentos, 13º, férias", dir: "out" },
    ],
  },

  // ── SUPRIMENTOS ──────────────────────────────────────────────────────
  {
    id: "paradigma", name: "Paradigma", zone: "suprimentos",
    status: "estavel", owner: "mercado", vendor: "Paradigma WebStore",
    units: ["corporativo"],
    desc: "Plataforma de e-procurement. Gere pedidos de compra, cotações e contratos com fornecedores antes de tudo virar pedido no Logix.",
    modules: ["Pedidos de Compra","Cotações","Contratos","e-Procurement"],
    flows: [{ to: "logix", label: "Integra pedidos / contratos / ordens de compra / fornecedores e cotações", dir: "both" }],
  },
  {
    id: "hub_aprovacao", name: "Hub de Aprovação de Pedidos", zone: "suprimentos",
    status: "estavel", owner: "proprio",
    units: ["corporativo"],
    desc: "Camada própria de workflow que centraliza as aprovações de pedidos de compra (alçadas, hierarquia, status) antes de efetivar no Logix.",
    modules: ["Workflow de alçadas","Aprovação multi-nível","Notificações"],
    flows: [
      { to: "logix", label: "Aprovações de pedidos", dir: "both" },
      { to: "paradigma", label: "Recebe pedidos para aprovação", dir: "in" },
    ],
  },
  {
    id: "flash", name: "Flash", zone: "suprimentos",
    status: "estavel", owner: "mercado", vendor: "Flash Benefícios",
    units: ["corporativo"],
    desc: "Gestão de despesas corporativas (cartão / reembolso). Devolve ao Logix os pagamentos e a contabilização das despesas.",
    modules: ["Despesas corporativas","Cartão corporativo"],
    flows: [{ to: "logix", label: "Pagamentos e contabilização", dir: "out" }],
  },

  // ── INTEGRAÇÃO ───────────────────────────────────────────────────────
  {
    id: "middleware", name: "Middleware Roncador (APIs)", zone: "integracao",
    status: "desenvolvimento", owner: "proprio",
    units: ["corporativo"],
    desc: "Camada de APIs próprias que faz a ponte entre os sistemas satélites e o banco Oracle do Logix. Em reestruturação para virar um middleware modular: módulo IATF, módulo Estoque, novo módulo Zendesk.",
    modules: ["Módulo Estoque (JWT, rate limit, validações)","Módulo IATF","Módulo Zendesk (novo)","Stored procedures Oracle"],
    flows: [
      { to: "logix", label: "Ponte segura para o banco Oracle", dir: "both" },
      { to: "zendesk", label: "Novo módulo de integração", dir: "both" },
      { to: "iatf", label: "Módulo IATF", dir: "both" },
    ],
  },
  {
    id: "dw", name: "DW Postgres — DW_SUPRIMENTOS", zone: "integracao",
    status: "desenvolvimento", owner: "proprio",
    units: ["corporativo"],
    desc: "Data Warehouse em PostgreSQL com dados de suprimentos. Alimenta os painéis de BI e é a base que o Chatbot IA consulta via SQL.",
    modules: ["Modelagem analítica","Cargas / ETL","Base do Chatbot e BI"],
    flows: [
      { to: "logix", label: "Extração de dados do ERP", dir: "in" },
      { to: "chatbot", label: "Fonte de dados consultada via SQL", dir: "out" },
    ],
  },

  // ── CAMPO ────────────────────────────────────────────────────────────
  {
    id: "gatec", name: "Gatec", zone: "campo",
    status: "melhorias", owner: "mercado", vendor: "Gatec",
    units: ["fazenda","mantiqueira"],
    desc: "Gestão agrícola: controles de lavoura, frotas e oficina/balança. Troca movimentações de estoque e aquisição de ativos com o Logix.",
    modules: ["Controles Agrícolas","Controle de Frotas","Oficina / Balança"],
    flows: [
      { to: "logix", label: "Baixas, insumos e movimentação de estoque", dir: "both" },
      { to: "logix", label: "Aquisição de ativos", dir: "out" },
    ],
  },
  {
    id: "barcode", name: "Barcode", zone: "campo",
    status: "melhorias", owner: "mercado",
    units: ["fazenda","mantiqueira"],
    desc: "Coletores/etiquetas para armazenagem, movimentação e controle de estoques no campo, sincronizando com o WMS do Logix.",
    modules: ["Armazenagem","Movimentação","Controle de Estoques"],
    flows: [{ to: "logix", label: "Integra recebimento, notas, armazenagem e movimentações", dir: "both" }],
  },
  {
    id: "solinftec", name: "Solinftec", zone: "campo",
    status: "melhorias", owner: "mercado", vendor: "Solinftec",
    units: ["fazenda","mantiqueira"],
    desc: "Agricultura digital: gestão da fazenda, monitor de produtividade e compartilhamento de mapas. Integra ordens de serviço agrícolas.",
    modules: ["Gestão Fazenda","Monitor de Produtividade","Map Sharing"],
    flows: [{ to: "logix", label: "Integra OSs agrícolas", dir: "both" }],
  },
  {
    id: "feedmanager", name: "Feed Manager", zone: "campo",
    status: "estavel", owner: "mercado",
    units: ["pecuaria"],
    desc: "Gestão de trato e controle de animais no confinamento/pasto.",
    modules: ["Gestão de Trato","Controle de Animais"],
    flows: [{ to: "logix", label: "Requisições, reserva de itens, apontamento de combustível, pesagem", dir: "both" }],
  },
  {
    id: "ideagri", name: "IdeAgri", zone: "campo",
    status: "estavel", owner: "mercado", vendor: "IdeAgri",
    units: ["pecuaria"],
    desc: "Gestão de IATF, DAGs, fazenda e lotes — controle de inseminação e de hormônios no rebanho.",
    modules: ["Gestão IATF / DAGs","Fazenda e Lotes","Controle de Inseminação","Controle de Hormônios"],
    flows: [{ to: "logix", label: "Integra reservas de itens de inseminação", dir: "both" }],
  },
  {
    id: "engeman", name: "Engeman", zone: "campo",
    status: "estavel", owner: "mercado", vendor: "Engeman",
    units: ["fazenda","mineradoras","mantiqueira"],
    desc: "Manutenção de ativos: taxa de falhas, disponibilidade, backlog e downtime.",
    modules: ["Manutenção de Ativos","Disponibilidade","Backlog / Downtime"],
    flows: [{ to: "logix", label: "Ativos e ordens de manutenção", dir: "both" }],
  },
  {
    id: "multbovinos", name: "MultBovinos", zone: "campo",
    status: "estavel", owner: "mercado", vendor: "MultBovinos",
    units: ["pecuaria"],
    desc: "Gestão de curral: estoque de animais, controle zoosanitário, pesos e medidas.",
    modules: ["Curral","Estoque de Animais","Controle Zoosanitário","Pesos e Medidas"],
    flows: [{ to: "logix", label: "Movimentação de estoque de animais", dir: "both" }],
  },
  {
    id: "sical", name: "Sical", zone: "campo",
    status: "melhorias", owner: "mercado",
    units: ["mineradoras"],
    desc: "Comercialização de produtos, gerando pedidos de venda integrados ao faturamento do Logix.",
    modules: ["Comercialização","Pedidos de Venda"],
    flows: [{ to: "logix", label: "Integra pedidos de venda no módulo Faturamento", dir: "out" }],
  },
  {
    id: "fast2mine", name: "Fast 2 Mine", zone: "campo",
    status: "desenvolvimento", owner: "mercado",
    units: ["mineradoras"],
    desc: "Operação de mineração: pesagem, gestão operacional e rastreamento de máquinas.",
    modules: ["Pesagem","Gestão Operacional","Rastreamento de Máquinas"],
    flows: [{ to: "logix", label: "Atualiza dados de pesagem", dir: "out" }],
  },
  {
    id: "mapfy", name: "Mapfy (Geosystem)", zone: "campo",
    status: "estavel", owner: "mercado", vendor: "Mapfy Geosystem",
    units: ["mantiqueira"],
    desc: "Gestão de mapas geográficos das áreas e talhões.",
    modules: ["Gestão de Mapas","Geoprocessamento"],
    flows: [{ to: "solinftec", label: "Camadas de mapa / geodados", dir: "both" }],
  },

  // ── INFRA ────────────────────────────────────────────────────────────
  {
    id: "clockin", name: "Clock In", zone: "infra",
    status: "estavel", owner: "mercado", vendor: "TOTVS",
    units: ["corporativo"],
    desc: "Marcação de ponto eletrônico, alimentando a gestão de ponto do Protheus.",
    modules: ["Marcação de Ponto"],
    flows: [{ to: "protheus", label: "Marcações de ponto", dir: "out" }],
  },
  {
    id: "monitoo", name: "Monitoo", zone: "infra",
    status: "estavel", owner: "mercado", vendor: "Monitoo",
    units: ["corporativo"],
    desc: "Monitoramento das estações de trabalho (produtividade / TI).",
    modules: ["Monitoramento das Estações de Trabalho"],
    flows: [{ to: "logix", label: "Movimentação ERP (previsto e realizado)", dir: "in" }],
  },

  // ── FISCAL ───────────────────────────────────────────────────────────
  {
    id: "anfe", name: "Anfe", zone: "fiscal",
    status: "estavel", owner: "mercado", vendor: "Anfe",
    units: ["corporativo"],
    desc: "Validação fiscal: confere divergências entre pedido e documento fiscal, monitora cancelamento de NFs e faz escrituração automática no módulo de Recebimento.",
    modules: ["Pedido x Documento fiscal","Monitoramento de cancelamento de NF","Escrituração automática"],
    flows: [{ to: "logix", label: "Integra XMLs, dados fiscais, ordens de compra e pedidos", dir: "both" }],
  },
  {
    id: "fluxocaixa", name: "Fluxo de Caixa B3", zone: "fiscal",
    status: "estavel", owner: "mercado", vendor: "B3",
    units: ["corporativo"],
    desc: "Fluxo de caixa previsto e realizado, com recebimento, faturamento, contas a pagar/receber e orçamento.",
    modules: ["Fluxo Previsto e Realizado","Recebimento","Faturamento","Contas a Pagar / Receber","Orçamento"],
    flows: [{ to: "logix", label: "Movimentação financeira do ERP", dir: "in" }],
  },

  // ── ANALYTICS ────────────────────────────────────────────────────────
  {
    id: "bi", name: "Relatórios, KPIs e BIs", zone: "analytics",
    status: "estavel", owner: "mercado", vendor: "Microsoft / TOTVS / Jaspersoft",
    units: ["corporativo"],
    desc: "Camada de relatórios e indicadores: Logix BI, Power BI e Jasper Report.",
    modules: ["Logix BI","Power BI","Jasper Report"],
    flows: [
      { to: "logix", label: "Dados do ERP para indicadores", dir: "in" },
      { to: "dw", label: "Dados do Data Warehouse", dir: "in" },
    ],
  },
  {
    id: "chatbot", name: "Chatbot IA — Oráculo", zone: "analytics",
    status: "desenvolvimento", owner: "parceria", vendor: "Marlabs",
    units: ["corporativo"],
    desc: "Agente conversacional (LangGraph + GPT) que traduz perguntas de negócio em SQL contra o DW Postgres, executa a consulta e narra a resposta em linguagem natural.",
    modules: ["LangGraph + GPT","Texto → SQL","Narrativa em linguagem natural"],
    flows: [{ to: "dw", label: "Consulta o DW via SQL gerado por IA", dir: "in" }],
  },

  // ── ATENDIMENTO ──────────────────────────────────────────────────────
  {
    id: "zendesk", name: "Zendesk", zone: "atendimento",
    status: "desenvolvimento", owner: "mercado", vendor: "Zendesk",
    units: ["corporativo"],
    desc: "Sistema de chamados, em evolução para ganhar mais funções: consulta e emissão de notas fiscais, cadastro de fornecedores e outros fluxos — integrando via middleware ao Logix.",
    modules: ["Chamados / Tickets","Consulta e emissão de NF (em evolução)","Cadastro de fornecedores (em evolução)"],
    flows: [{ to: "middleware", label: "Integra ao Logix via novo módulo do middleware", dir: "both" }],
  },
  {
    id: "site", name: "Site único (WordPress)", zone: "atendimento",
    status: "desenvolvimento", owner: "mercado", vendor: "WordPress",
    units: ["corporativo"],
    desc: "Consolidação dos dois sites institucionais em um só portal: Grupo Roncador (principal) + Fazenda Roncador (a ser redirecionado).",
    modules: ["gruporoncador.com.br (principal)","fazendaroncador.com.br (redirecionar)"],
    flows: [],
  },

  // ── FUTURO ───────────────────────────────────────────────────────────
  {
    id: "iatf", name: "Sistema IATF — Pecuária", zone: "futuro",
    status: "implantacao", owner: "proprio",
    units: ["pecuaria"],
    desc: "Sistema próprio de inseminação artificial em tempo fixo para a pecuária. Em fase de testes / homologação, prestes a entrar em produção. Integra-se ao Logix pelo módulo IATF do middleware.",
    modules: ["Protocolos IATF","Controle de lotes / animais","Homologação em andamento"],
    flows: [{ to: "middleware", label: "Integra via módulo IATF", dir: "both" }],
  },
  {
    id: "treinamentos", name: "Gestão de Treinamentos (RH)", zone: "futuro",
    status: "mapeamento", owner: "proprio",
    units: ["corporativo"],
    desc: "Projeto em mapeamento para o RH: trilhas, registros e controle de treinamentos das equipes. Propriedade a definir.",
    modules: ["A definir no levantamento"],
    flows: [{ to: "protheus", label: "Vínculo com dados de RH (a definir)", dir: "both" }],
  },
];
