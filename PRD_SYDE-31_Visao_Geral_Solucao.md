# PRD_SYDE-31 (Parte 1 de 3) – Visão Geral & Arquitetura Macro da Solução
## Simulador de Taxas Barter (Nutrade) – Estratégia de Entregas & Governança

* **Identificador Geral:** PRD_SYDE-31
* **Versão:** v2.0 (Arquitetura Tripartida & Refinamento Fiscal)
* **Data:** Outubro de 2026
* **Status:** Pronto para Desenvolvimento (Ready for Dev)
* **Autor:** Josue Jofre (Produto & Engenharia)
* **Aprovadores:** Pablo (Diretoria de Produto), Alessandra Monteiro / Mariana Haddad (Mesa Nutrade), Aleksander Santos (Engenharia Syde)

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
│ • Cotação da Commodity Manual        │ │ • Consulta em tempo real (/precos)│
│ • Cotação Dólar Manual (apenas USD)   │ │ • Motor Fiscal Automático Syde    │
│ • Tributos Manuais (Funrural + UPF)   │ │ • PTAX BACEN Oficial Automática   │
│ • Sincronização Tonelada x Saca       │ │ • Monitoramento de Pregão CBOT    │
│ • Desacoplado de APIs externas        │ │ • Mapeamento de Cidades e Rotas   │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

### Links Diretos de Navegação:
* 📄 **Documento Pai (Atual):** [PRD_SYDE-31_Visao_Geral_Solucao.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Visao_Geral_Solucao.md)
* 📘 **Especificação da Fase 1 (MVP Manual):** [PRD_SYDE-31_Fase1_MVP_Manual.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Fase1_MVP_Manual.md)
* 📗 **Especificação da Fase 2 (WSys Integrado):** [PRD_SYDE-31_Fase2_WSys_Integrado.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Fase2_WSys_Integrado.md)

---

## 🎯 2. Business Outcomes & Objetivos de Negócio

1. **Aceleração da Originação de Grãos (Barter Nutrade):** Transformar o Syde no canal digital oficial para contratação de Barter, eliminando o atrito das negociações de balcão.
2. **Redução Drástica do Ciclo de Venda (Lead Time):** Reduzir o tempo que o Consultor Comercial / RTV leva para formular e compartilhar uma proposta com o produtor de **25 a 30 minutos (em planilhas paralelas)** para **menos de 2 minutos** de forma 100% digital.
3. **Eliminação do Risco Operacional e Divergências de CPR:** Erradicar divergências entre a cotação acordada na fazenda e a formalização da CPR física no backoffice/mesa de grãos, garantindo que o volume de grãos prometido reflita exatamente o contrato emitido.

### Critérios de Sucesso (KPIs SMART):
* **Adoção Comercial:** Maior ou igual a 80% das propostas de Barter geradas via Syde em até 60 dias pós-lançamento.
* **Eficiência Comercial:** Tempo médio de geração e compartilhamento menor que 120 segundos.
* **Confiabilidade Matemática:** 0% de divergência entre o Simulador e a CPR física emitida pela Nutrade.
* **Conversão Comercial:** Maior ou igual a 25% de intenções convertidas em contratos formalizados.
* **Resiliência Técnica:** Disponibilidade (Uptime) maior ou igual a 98,0%.

---

## ⚖️ 3. Matriz Comparativa de Escopo: Fase 1 vs Fase 2

| Dimensão / Funcionalidade | Fase 1: MVP Manual (FIN-18889) | Fase 2: WSys Integrado (SYDE-31) |
|---|---|---|
| **Dependência Externa** | **Nenhuma.** Opera 100% autônoma no Syde. | Conectada ao WSys CTRM 2.10.1 da Syngenta e BACEN. |
| **Cotação da Commodity** | Entrada manual pelo RTV (inicia vazia). | Consumo em tempo real da API WSys (`/precos`). |
| **Cotação do Dólar** | Campo visível somente em simulações USD. | Consumo automático da Cotação PTAX Venda do Banco Central. |
| **Vencimento da Operação** | Automático com base no vencimento da Campanha. | Automático com base na Campanha (injetado na query do WSys). |
| **Regras Fiscais (Funrural)** | Opção entre Comercialização (1,63%), Folha (0,20%) ou Personalizado. | Aplicado automaticamente pelo perfil fiscal cadastrado na praça. |
| **Outros Impostos Base NF %** | Campo percentual livre (ex: FUNDEINFRA 1,65% em GO; FDI 1,20% no PI). | Identificado e aplicado automaticamente pela UF da praça. |
| **Imposto Base UPF (R$/ton)** | Campo manual em R$/tonelada. | Cadastro centralizado no Motor Fiscal do Syde por Estado/Praça. |
| **Dedução Fixa por Saca (R$/sc)**| Sincronização bidirecional em tempo real ajustada pelo peso da cultura. | Calculado automaticamente com base na UPF da praça dividida pelo peso da cultura. |
| **Conversão Tonelada x Saca** | 16,6667 sc/t (Soja/Milho/Café) e 66,6667 sc/t (Algodão). | 16,6667 sc/t (Soja/Milho/Café) e 66,6667 sc/t (Algodão). |
| **Distâncias Chão e Asfalto** | Na linha de baixo, alinhadas lado a lado. | Na linha de baixo, alinhadas lado a lado. |
| **Status Pregão de Chicago (CBOT)**| Não exibido (evita confusão em modo manual). | Exibição de badge visual de mercado aberto/fechado e aviso indicativo. |
| **Saída da Proposta** | Comparativo em tela, PDF formal e link compartilhável. | Comparativo em tela, PDF formal, link compartilhável e envio ao ERP. |

---

## 📸 4. Comparativo Visual das Telas Homologadas

### Tela da Fase 1 (MVP Operacional Manual)
Destaca a entrada manual de cotação e alíquotas fiscais, cotação do dólar exibida condicionalmente quando a moeda for USD e distâncias de chão e asfalto na mesma linha:

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

4. Dedução Fixa por Saca (Conversão UPF R$/ton para R$/sc):
   Dedução Fixa (R$/sc) = Imposto Base UPF (R$/ton) / Sacas por Tonelada
   - Soja, Milho e Café (60 kg): 1.000 / 60 = 16,6667 sacas por tonelada
     * MT (R$ 51,50 / 16,6667) = R$ 3,09 por saca
     * MS (R$ 27,55 / 16,6667) = R$ 1,65 por saca
   - Algodão (15 kg): 1.000 / 15 = 66,6667 sacas/arrobas por tonelada
     * MT (R$ 51,50 / 66,6667) = R$ 0,77 por saca/arroba
     * MS (R$ 27,55 / 66,6667) = R$ 0,41 por saca/arroba

5. Conversão Cambial em Dólar (USD):
   Dedução Fixa em USD = Dedução Fixa em R$ / Cotação do Dólar (PTAX BACEN)

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

## ⚠️ 7. Matriz de Riscos & Plano de Mitigação

| Risco Identificado | Impacto | Mitigação Estruturada |
|---|:---:|---|
| **Atraso na liberação de credenciais ou lotes da API WSys** | Alto | **Mitigado pela Fase 1 (FIN-18889):** Força de vendas já está operando com simulador manual sem depender do WSys. |
| **Divergência de alíquotas estaduais por município** | Médio | **Mitigado pelo Motor Fiscal:** Cadastro hierárquico (regra por UF com possibilidade de exceção por código IBGE da cidade). |
| **Volatilidade do Dólar desfasar impostos estaduais em USD** | Médio | **Mitigado pela PTAX Oficial:** Uso da cotação oficial diária do Banco Central como padrão técnico de conversão. |
| **Erro 500 no WSys por ausência de datas de embarque** | Alto | **Mitigado no BFF:** Injeção mandatória de `startDate` e `endDate` deduzidos do mês de vencimento da campanha. |
