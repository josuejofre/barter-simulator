# PRD_SYDE-31 (Parte 3 de 3) – Especificação Funcional: Fase 2 (WSys Integrado)
## Modalidade Barter (Nutrade) – Automação Integral com WSys CTRM & Motor Fiscal

* **Identificador:** PRD_SYDE-31_FASE2
* **Card Jira:** SYDE-31 (Épico de Integração)
* **Versão:** v1.0
* **Status:** Especificação Pronta para Engenharia / Backoffice
* **Documento Pai:** [PRD_SYDE-31_Visao_Geral_Solucao.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Visao_Geral_Solucao.md)
* **Documento Complementar:** [PRD_SYDE-31_Fase1_MVP_Manual.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Fase1_MVP_Manual.md)

---

## 🎯 1. Objetivo & Visão da Fase 2

A **Fase 2 (SYDE-31)** representa o estado da arte e a automação digital completa do fluxo de Barter na plataforma Syde.

### Objetivos Principais:
1. **Conexão Direta com a Mesa Nutrade:** Consumo em tempo real dos preços oficiais de balcão futuro gerados pelo sistema corporativo **WSys CTRM 2.10.1** da Syngenta.
2. **Automação Tributária Transparente (Motor Fiscal):** O RTV não precisa calcular nem memorizar alíquotas estaduais ou decretos de UPF/FETHAB/FUNDERSUL; ao selecionar o Estado e a Praça, o sistema aplica instantaneamente a regra tributária correspondente.
3. **Conversão Cambial Automatizada via PTAX BACEN:** Para simulações em Dólar (USD), o BFF consome a cotação oficial diária PTAX do Banco Central para converter as taxas estaduais fixadas em Reais.
4. **Governança de Mercado (Monitoramento CBOT):** Alerta proativo e disclaimer contratual quando a simulação ocorrer fora do pregão de Chicago.

---

## 📸 2. Telas do Protótipo Homologado (Fase 2)

### 2.1. Formulário Integrado ao WSys (Estado, Praça e Distâncias)
Na Fase 2, o usuário seleciona a Campanha, a Cultura e a Praça Polo. A cotação é carregada automaticamente do WSys e as distâncias de terra (chão) e asfalto estão na mesma linha:

![Formulário Fase 2 - WSys Integrado](prints_prd/03_fase2_formulario_wsys.png)

---

### 2.2. Resultados Simulados com Alerta CBOT e Gráfico de Mercado
O resultado exibe o banner informativo de status da Bolsa de Chicago (pregão aberto/fechado), cards de comparação com outras modalidades de crédito e gráfico de tendências:

![Resultados Fase 2 - WSys e CBOT](prints_prd/04_fase2_resultado_wsys.png)

---

### 2.3. Motor Fiscal do Syde (Tabela de Regras Tributárias por Praça/UF)
Módulo centralizado onde a equipe de operações e fiscal cadastra e atualiza as regras estaduais (Funrural, FETHAB, FUNDERSUL, FUNDEINFRA) e monitora a Cotação PTAX:

![Motor Fiscal Syde](prints_prd/05_motor_fiscal_pracas.png)

---

## 📝 3. Mapeamento Detalhado dos Campos da Fase 2

| Campo em Tela | ID do Elemento | Origem dos Dados | Regra de Negócio & Automação |
|---|---|:---:|---|
| **Cotação da Commodity (FOB)** | `sim-preco-bruto` | API WSys (`VL_PrecoBase` ou `VL_PrecoBRL`) | Consumido automaticamente do endpoint `/api/integracao/odin/precos`. O RTV recebe o preço oficial homologado da mesa para a safra. |
| **Frete Base de Rota Polo** | Interno / WSys | API WSys (`VL_CustoFrete`) | Frete rodoviário contratado da cidade polo até o porto de exportação ou terminal ferroviário. |
| **Estado (UF)** | `v2-sim-estado` | Cadastro de Praças | Filtra dinamicamente as cidades polo disponíveis no dropdown de praças. |
| **Praça Logística (WSys)** | `v2-sim-regiao` | Catálogo Odin (`/cidades`) | Cidade homologada pela mesa. Ao selecionar a praça, o sistema aplica automaticamente a matriz fiscal e as tarifas de frete da região. |
| **Distância Chão (KM)** | `v2-sim-dist-chao` | Entrada RTV (inicia em 0) | KM adicional de terra da fazenda até a praça. **Posicionado na linha de baixo junto com Dist. Asfalto.** |
| **Distância Asfalto (KM)** | `v2-sim-dist-asfalto` | Entrada RTV (inicia em 0) | KM adicional de rodovia da fazenda até a praça. **Posicionado na mesma linha que Dist. Chão.** |
| **Alíquota Funrural (%)** | Matriz Fiscal Syde | Configuração / Praça | Padrão nacional 1,63% (Pessoa Física). |
| **Outros Impostos Base NF (%)** | Matriz Fiscal Syde | Configuração / Praça | Identificado automaticamente pela UF: 1,65% em Goiás (FUNDEINFRA); 1,20% no Piauí (FDI); 0% nos demais. |
| **Taxa Fixa Estadual (R$/ton)** | Matriz Fiscal Syde | Configuração / Praça | Puxado automaticamente por UF: MT = R$ 51,50/ton (FETHAB+IAGRO); MS = R$ 27,55/ton (FUNDEMS+FUNDERSUL). Convertido para saca conforme a cultura. |
| **Cotação do Dólar (PTAX)** | BFF / BACEN | API Banco Central | Cotação oficial de fechamento da PTAX Venda. Utilizada para converter tributos fixados em R$ para simulações em USD. |
| **Status Pregão CBOT** | Componente visual | Relógio de Mercado | Exibe badge verde quando o pregão está em andamento (10:30–15:20 e 21:00–09:45) e badge amarelo indicando preço indicativo fora de horário. |

---

## 🧮 4. Explicação dos Cálculos Automatizados da Fase 2

A lógica de cálculo da Fase 2 é idêntica à matemática financeira homologada na Fase 1, com a vantagem de **alimentar as variáveis de forma 100% automatizada**:

### 1. Formação do Preço Líquido de Originação:
```text
Preço Líquido = Preço Bruto FOB (WSys) - Dedução Total de Impostos - Frete Unitário
```

### 2. Conversão Automática de Tributos por Cultura:
O Motor Fiscal armazena o valor em **R$/tonelada** e converte automaticamente para **R$/saca** de acordo com a cultura selecionada no simulador:

```text
Dedução Fixa por Saca (R$/sc) = Valor UPF por Tonelada / Sacas por Tonelada

Onde:
- Soja, Milho e Café: 1.000 kg / 60 kg = 16,6667 sacas por tonelada.
  * Mato Grosso: R$ 51,50 / 16,6667 = R$ 3,09 por saca.
  * Mato Grosso do Sul: R$ 27,55 / 16,6667 = R$ 1,65 por saca.
- Algodão: 1.000 kg / 15 kg = 66,6667 sacas/arrobas por tonelada.
  * Mato Grosso: R$ 51,50 / 66,6667 = R$ 0,77 por saca/arroba.
  * Mato Grosso do Sul: R$ 27,55 / 66,6667 = R$ 0,41 por saca/arroba.
```

### 3. Conversão Cambial em USD via PTAX Oficial:
Nas simulações em Dólar, o backend aplica automaticamente a cotação PTAX Venda:

```text
Dedução Fixa em USD = Dedução Fixa em R$ / Cotação PTAX BACEN
```

### 4. Dedução Percentual sobre a NF:
```text
Dedução Percentual = Preço Bruto FOB * ((Funrural % + Impostos Estaduais NF %) / 100)
```

### 5. Volume Contratual de Sacas da CPR:
O Incentivo Barter abate diretamente o saldo financiado, gerando o número final de sacas que constará na CPR:

```text
Juros do Período = (Dias de Prazo / 360) * (Taxa Anual Barter % / 100)
Preço Pedido TP = Valor da Operação / (1 + Juros do Período)
Taxa de Incentivo (%) = (Dias de Prazo / 30) * Taxa Mensal de Incentivo (% a.m.)
Incentivo Barter ($) = Preço Pedido TP * (Taxa de Incentivo (%) / 100)

Volume de Sacas da CPR = Teto((Valor da Operação - Incentivo Barter) / Preço Líquido da Saca)
```

### 6. Cashback Financeiro da Campanha:
```text
Cashback da Campanha ($) = Valor da Operação * (Percentual de Cashback % / 100)
```
*(Valor financeiro devolvido em dinheiro ao produtor, sem alteração no volume de sacas da CPR).*

---

## 🔌 5. Especificação Técnica da Integração WSys CTRM 2.10.1

### 5.1. Autenticação na API WSys
* **Endpoint:** `POST https://wsys.syngentadigitalapps.com:444/api/integracao/loginintegracao`
* **Retorno:** Bearer Token JWT válido por **8 horas**.
* **Estratégia de Cache:** O BFF Syde renova o token preventivamente com 7h30 de uso para evitar rejeições em requisições de RTVs.

### 5.2. Catálogo de Cidades Homologadas
* **Endpoint:** `GET /api/integracao/odin/cidades`
* **Tratamento Obrigatório:** Aplicar função `.trim()` nos nomes de cidades recebidos para remover espaços em branco gerados pelo banco legatário do WSys.

### 5.3. Formação de Preço em Tempo Real
* **Endpoint:** `GET /api/integracao/odin/precos`
* **Parâmetros Mandatórios da Requisição:**
  * `currencyISO`: `'BRL'` ou `'USD'`
  * `productID`: Código da commodity (ex: `'0000001'` para Soja)
  * `pricingName`: Nome descritivo do lote (ex: `'SOJA 2025/2026 - PORTOS - PARANAGUA - MAR/26'`)
  * `city`: Nome da cidade (ex: `'PARANAGUA'`)
  * `UF`: Sigla da UF de 2 letras (ex: `'PR'`)
  * `logisticsTypeName`: `'FOB'`
  * `startDate`: Data de início do período de entrega (`aaaa-mm-dd`) — **Obrigatório sob pena de Erro 500 no WSys**
  * `endDate`: Data de fim do período de entrega (`aaaa-mm-dd`) — **Obrigatório sob pena de Erro 500 no WSys**
  * `DT_Vencto`: Data de liquidação/pagamento do contrato (`aaaa-mm-dd`)
* **Campos Consumidos da Resposta:**
  * `VL_PrecoBase`: Cotação em moeda base (USD).
  * `VL_PrecoBRL`: Cotação em Reais (BRL).
  * `VL_CustoFrete`: Custo total do frete da rota contratada.
  * `ST_PrecoValido`: Confirmação de integridade de preço.

---

## 🏛️ 6. Modelo de Dados do Motor Fiscal Syde

```typescript
interface TributacaoRegionalBarter {
  id: string; // UUID da regra
  uf: string; // Ex: 'MT', 'MS', 'GO', 'PR', 'BA'
  nomePracaDescricao: string; // Ex: 'Mato Grosso - Polo Sorriso'
  codigoIbgeCidade?: string; // Código IBGE de 7 dígitos para exceções
  funruralPerc: number; // Padrão: 1.63%
  impostoEstadualNfPerc: number; // Ex: 1.65% (GO) ou 1.20% (PI)
  nomeTributoEstadual?: string; // Ex: 'FUNDEINFRA', 'FDI'
  aplicaIndexadorUpf: boolean; // true para MT e MS
  upfPorTonelada: number; // Ex: 51.50 em MT; 27.55 em MS
  ativo: boolean;
  atualizadoEm: string;
}
```

---

## ✅ 7. Critérios de Aceite para Engenharia (Fase 2)

* **CA-F2-01 (Consumo WSys):** O simulador deve preencher `sim-preco-bruto` e frete base diretamente a partir da resposta da API WSys `/precos`.
* **CA-F2-02 (Injeção Obrigatória de Datas):** O BFF deve enviar mandatoriamente `startDate` e `endDate` deduzidos da campanha para evitar Erro 500 do WSys.
* **CA-F2-03 (Tratamento de Lote Inexistente):** Caso o WSys retorne `PrecosMonitorar: []`, exibir alerta contextual orientando o RTV a selecionar praça vizinha ou contatar a mesa, sem travar as outras modalidades.
* **CA-F2-04 (Alinhamento Chão e Asfalto):** Os campos `v2-sim-dist-chao` e `v2-sim-dist-asfalto` devem estar posicionados na linha de baixo, alinhados lado a lado.
* **CA-F2-05 (Automação Fiscal por UF/Cultura):** Ao mudar de cultura (ex: Soja para Algodão) ou de Praça (ex: Sorriso para Dourados), a taxa fixa por saca deve ser recalculada instantaneamente sem ação manual do usuário.
* **CA-F2-06 (PTAX Automática em USD):** Em simulações USD, as taxas fixas estaduais devem ser convertidas pela cotação PTAX Venda do Banco Central integrada no BFF.
