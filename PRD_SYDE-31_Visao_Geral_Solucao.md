# PRD_SYDE-31 (Parte 1 de 3) – Visão Geral & Arquitetura Macro da Solução
## Simulador de Taxas Barter (Nutrade) – Estratégia de Entregas & Governança

* **Identificador Geral:** PRD_SYDE-31
* **Versão:** v2.1 (Alinhamento de Escopo Mínimo, Taxas e Governança – Reunião 27/10/2026)
* **Data:** 27 de outubro de 2026
* **Status:** Pronto para Desenvolvimento / Homologação (Ready for Dev)
* **Autor:** Josue Jofre (Produto & Engenharia)
* **Aprovadores / Participantes do Alinhamento 27/10/2026:**
  * **Leonardo Vale** (Liderança de Barter Syngenta / Nutrade)
  * **Pablo** (Diretoria de Produto)
  * **Jessica Moraes** (Design de Produto)
  * **Aleksander Santos** (Engenharia Syde)
  * **Bruno Vedovatte** (Operações Barter)
  * **Alessandra Monteiro / Mariana Haddad** (Mesa de Grãos Nutrade)

---

## 🧭 1. Estrutura da Documentação em 3 Partes

Para garantir clareza técnica e direcionamento cirúrgico para os times de desenvolvimento, produto e mesa de grãos, a documentação oficial do Simulador Barter é organizada em **3 documentos complementares**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PRD PAI: VISÃO GERAL & ARQUITETURA MACRO                  │
│                     [PRD_SYDE-31_Visao_Geral_Solucao.md]                    │
│      (Business Outcomes, KPIs, Matriz Comparativa, Feature Flags e Riscos)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│     PARTE 2: PRD FILHO - FASE 1       │ │    PARTE 3: PRD FILHO - FASE 2    │
│    [PRD_SYDE-31_Fase1_MVP_Manual.md]  │ │[PRD_SYDE-31_Fase2_WSys_Integrado] │
│                                       │ │                                   │
│ • Card Jira: FIN-18889                │ │ • Card Jira: SYDE-31              │
│ • MVP Operacional Manual              │ │ • Automação WSys CTRM 2.10.1      │
│ • Entrada Manual de Cotação da        │ │ • Consulta em tempo real          │
│   Commodity (inicia em branco)        │ │   (/api/integracao/odin/precos)   │
│ • Cotação do Dólar Futuro             │ │ • Motor Fiscal Automático Syde    │
│   (visível somente em USD)            │ │ • PTAX BACEN Oficial Automática   │
│ • Estado (UF) em primeiro lugar       │ │ • Monitoramento de Pregão CBOT    │
│ • Funrural Unificado (1,63% ou 0,20%) │ │ • Mapeamento de Cidades e Rotas   │
│ • Tributos Estaduais Automatizados    │ │ • Foco: Soja, Milho e Algodão     │
│   (FETHAB, FUNDEMS, FUNDEINFRA, FDI)  │ │   (Café automatizado via CRM)     │
│ • Aviso Oficial da Mesa de Barter     │ │ • Aviso Oficial da Mesa de Barter │
│ • Desacoplado de APIs externas        │ │ • Conectado à esteira corporativa │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

### Links Diretos de Navegação:
* 📄 **Documento Pai (Atual):** [PRD_SYDE-31_Visao_Geral_Solucao.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Visao_Geral_Solucao.md)
* 📘 **Especificação da Fase 1 (MVP Manual):** [PRD_SYDE-31_Fase1_MVP_Manual.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Fase1_MVP_Manual.md)
* 📗 **Especificação da Fase 2 (WSys Integrado):** [PRD_SYDE-31_Fase2_WSys_Integrado.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Fase2_WSys_Integrado.md)

---

## 🎯 2. Business Outcomes & Objetivos de Negócio

1. **Aceleração da Originação de Grãos (Barter Nutrade):** Transformar o Syde no canal digital oficial para contratação de Barter na campanha da safra 2027/28, eliminando o atrito das negociações de balcão e de planilhas locais.
2. **Redução Drástica do Ciclo de Venda (Lead Time):** Reduzir o tempo que o Consultor Comercial / RTV leva para formular e compartilhar uma proposta com o produtor de **25 a 30 minutos (em planilhas paralelas)** para **menos de 2 minutos** de forma 100% digital e segura.
3. **Eliminação do Risco Operacional e Divergências de CPR:** Erradicar divergências entre a cotação acordada na fazenda e a formalização da CPR física no backoffice/mesa de grãos, assegurando que o volume de grãos prometido reflita com exatidão o contrato formal.

### Critérios de Sucesso (KPIs SMART):
* **Adoção Comercial:** Maior ou igual a 80% das propostas de Barter geradas via Syde em até 60 dias pós-lançamento.
* **Eficiência Comercial:** Tempo médio de geração e compartilhamento menor que 120 segundos.
* **Confiabilidade Matemática:** 0% de divergência entre o Simulador e a CPR física emitida pela Nutrade.
* **Conversão Comercial:** Maior ou igual a 25% de intenções convertidas em contratos formalizados.
* **Resiliência Técnica:** Disponibilidade (Uptime) maior ou igual a 98,0%.

---

## ⚖️ 3. Matriz Comparativa de Escopo: Fase 1 vs Fase 2 (Alinhada em 27/10/2026)

| Dimensão / Funcionalidade | Fase 1: MVP Manual (FIN-18889) | Fase 2: WSys Integrado (SYDE-31) |
|---|---|---|
| **Público & Cronograma** | Lançamento na primeira/segunda quinzena de Novembro/2026 (Safra 27/28). | Integração homologada em Dezembro/2026 para uso pleno em Janeiro/2027. |
| **Dependência Externa** | **Nenhuma.** Opera 100% autônoma no Syde. | Conectada ao WSys CTRM 2.10.1 da Syngenta e BACEN. |
| **Aviso ao RTV / Comercial** | Banner informativo oficial direcionando à Mesa de Barter para cotações vigentes. | Banner oficial direcionando à Mesa de Barter e indicador CBOT. |
| **Posicionamento de Campos** | **Estado (UF)** em 1º lugar, seguido de **Commodity**, Cotação e Dólar Futuro. | **Estado (UF)** em 1º lugar, seguido de **Commodity**, Praça WSys e Dólar Futuro. |
| **Commodities Suportadas** | **Soja, Milho e Algodão** (Café excluído por ser cotado direto no CRM Salesforce). | **Soja, Milho e Algodão** (Café excluído pelo mesmo racional). |
| **Cotação da Commodity** | Entrada manual pelo RTV (inicia vazia para preenchimento obrigatório). | Consumo em tempo real da API WSys (`/api/integracao/odin/precos`). |
| **Cotação do Dólar Futuro** | Campo `Cotação do Dólar Futuro (R$/USD)` visível apenas em simulações USD. | Consumo automático da Cotação PTAX Venda do Banco Central / WSys. |
| **Vencimento da Operação** | Automático com base no vencimento da Campanha (campo de mês manual removido). | Automático com base na Campanha (injetado na query do WSys). |
| **Regras Fiscais (Funrural)** | **Seletor Unificado:** Comercialização (1,63%) ou Folha de Pagamento (0,20%). | **Seletor Unificado:** Comercialização (1,63%) ou Folha de Pagamento (0,20%). |
| **Outros Impostos Base NF %** | Auto-carregado pela UF: FUNDEINFRA 1,65% (GO), FDI 1,20% (PI), 0,00% (demais). | Identificado e aplicado automaticamente pela UF da praça. |
| **Imposto Base UPF (R$/ton)** | Auto-carregado por UF + Cultura: FETHAB R$ 51,50/t (MT), FUNDEMS R$ 27,55/t (MS). | Cadastro centralizado no Motor Fiscal do Syde por Estado/Praça. |
| **Dedução Fixa por Saca (R$/sc)**| Calculado automaticamente (R$/ton / sacas por ton). Ex: MT Soja = R$ 3,09/sc. | Calculado automaticamente com base na UPF da praça dividida pelo peso da cultura. |
| **Conversão Tonelada x Saca** | 16,6667 sc/t (Soja e Milho - 60 kg) e 66,6667 sc/t (Algodão - 15 kg). | 16,6667 sc/t (Soja e Milho - 60 kg) e 66,6667 sc/t (Algodão - 15 kg). |
| **Fretes & Distâncias** | Dist. Asfalto e Dist. Chão alinhadas lado a lado na mesma linha. | Dist. Asfalto e Dist. Chão alinhadas lado a lado na mesma linha. |
| **Tarifas de Frete por KM** | Padronizadas nacionalmente por KM de chão e asfalto conforme confirmado em reunião. | Parametrizadas na esteira comercial da praça polo. |
| **Saída da Proposta** | Comparativo em tela, PDF formal e link compartilhável. | Comparativo em tela, PDF formal, link compartilhável e envio ao ERP. |

---

## 📸 4. Comparativo Visual das Telas Homologadas

### Tela da Fase 1 (MVP Operacional Manual)
Destaca o banner da Mesa de Barter, Estado (UF) como primeiro seletor, entrada manual da cotação, Funrural unificado (1,63% ou 0,20%), tributos estaduais automáticos e distâncias de asfalto e chão na mesma linha:

![Protótipo Fase 1](prints_prd/01b_fase1_dolar_cotacao.png)

---

### Tela da Fase 2 (WSys Integrado & CBOT)
Destaca a seleção de praça conectada ao catálogo do WSys, motor fiscal automatizado, distâncias de chão e asfalto na mesma linha e banner de monitoramento da CBOT:

![Protótipo Fase 2](prints_prd/04_fase2_resultado_wsys.png)

---

## 🧮 5. Síntese Matemática Homologada (Válida para Fase 1 e Fase 2)

Todas as fórmulas operam sem notação matemática complexa, assegurando total transparência para engenharia e negócios:

```text
1. Preço Líquido da Commodity:
   Preço Líquido = Preço Bruto - Dedução Total de Impostos - Frete Unitário da Fazenda

2. Dedução Total de Impostos por Saca:
   Dedução Total de Impostos = Dedução Percentual + Dedução Fixa por Saca

3. Dedução Percentual:
   Dedução Percentual = Preço Bruto * ((Funrural % + Outros Impostos Base NF %) / 100)
   Onde:
   - Funrural: 1,63% (Comercialização) ou 0,20% (Folha de Pagamento)
   - Outros Impostos Base NF (%): 1,65% em GO (FUNDEINFRA), 1,20% no PI (FDI), 0,00% nos demais

4. Dedução Fixa por Saca (Conversão UPF R$/ton para R$/sc):
   Dedução Fixa (R$/sc) = Imposto Base UPF (R$/ton) / Sacas por Tonelada
   - Soja e Milho (60 kg): 1.000 / 60 = 16,6667 sacas por tonelada
     * MT Soja (R$ 51,50 / 16,6667) = R$ 3,09 por saca
     * MT Milho (R$ 14,00 / 16,6667) = R$ 0,84 por saca (ou R$ 0,37 conforme alíquota específica)
     * MS Soja (R$ 27,55 / 16,6667) = R$ 1,65 por saca
     * MS Milho (R$ 14,00 / 16,6667) = R$ 0,84 por saca
   - Algodão (15 kg): 1.000 / 15 = 66,6667 sacas/arrobas por tonelada
     * MT (R$ 51,50 / 66,6667) = R$ 0,77 por saca/arroba
     * MS (R$ 27,55 / 66,6667) = R$ 0,41 por saca/arroba
   - Demais Estados: R$ 0,00 por saca

5. Conversão Cambial em Dólar (USD):
   Dedução Fixa em USD = Dedução Fixa em R$ / Cotação do Dólar Futuro

6. Saldo Base e Volume de Sacas da CPR Física:
   Preço Pedido TP = Valor da Operação / (1 + Juros do Período)
   Incentivo Barter ($) = Preço Pedido TP * ((Dias de Prazo / 30) * Taxa Mensal Incentivo % / 100)
   Volume de Sacas da CPR = Teto((Valor da Operação - Incentivo Barter) / Preço Líquido da Saca)

7. Cashback da Campanha (Devolução Financeira em Dinheiro):
   Cashback ($) = Valor da Operação * (Percentual de Cashback % / 100)
   (Creditado em dinheiro na conta do produtor; NÃO altera sacas da CPR).
```

---

## 🚩 6. Governança por Feature Flags & Rollout

O avanço e a convivência entre as fases são governados por Feature Flags:

| Feature Flag | Camada | Padrão | Finalidade |
|---|:---:|:---:|---|
| `ff_barter_nutrade_ui` | Frontend | `true` | Ativa a visualização da modalidade Barter no comparativo. |
| `ff_barter_wsys_integration` | BFF | `false` (Fase 1) / `true` (Fase 2) | Chaveia a origem dos dados: quando `false`, opera no modo MVP Manual (Fase 1); quando `true`, conecta com a API WSys e motor fiscal automático (Fase 2). |
| `ff_barter_kill_switch` | Global | `false` | **Kill Switch:** Oculta imediatamente o Barter em caso de divergência crítica, mantendo as modalidades Syde, Fiso e Syngenta ativas. |
| `ff_barter_cbot_alert` | Frontend | `true` (Fase 2) | Exibe o banner de horário de funcionamento da Bolsa de Chicago. |

---

## ⚠️ 7. Matriz de Riscos & Plano de Mitigação (Reunião 27/10/2026)

| Risco Identificado | Impacto | Mitigação Estruturada |
|---|:---:|---|
| **Atraso na liberação de credenciais ou lotes da API WSys** | Alto | **Mitigado pela Fase 1 (FIN-18889):** Força de vendas já está operando com simulador manual sem depender do WSys. |
| **Divergência de alíquotas estaduais por município** | Médio | **Mitigado pela parametrização por Estado e Commodity:** As regras de FETHAB, FUNDEMS, FUNDEINFRA e FDI já estão pré-configuradas e vinculadas à UF selecionada. |
| **Volatilidade do Dólar desfasar impostos estaduais em USD** | Médio | **Mitigado pela Cotação do Dólar Futuro:** Uso explícito do Dólar Futuro informado ou da PTAX oficial diária para conversão das taxas fixas. |
| **RTV preencher cotação spot em vez de futuro** | Médio | **Mitigado pelos rótulos claros e banner da Mesa:** Inclusão mandatória do aviso oficial para consulta à Mesa de Barter. |
