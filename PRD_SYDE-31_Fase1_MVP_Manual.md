# PRD_SYDE-31 (Parte 2 de 3) – Especificação Funcional: Fase 1 (MVP Manual)
## Modalidade Barter (Nutrade) – Operação Comercial Desacoplada

* **Identificador:** PRD_SYDE-31_FASE1
* **Card Jira:** FIN-18889 (Subordinação Técnica: SYDE-31)
* **Versão:** v1.0
* **Status:** Pronto para Desenvolvimento / Validação de Mesa
* **Documento Pai:** [PRD_SYDE-31_Visao_Geral_Solucao.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Visao_Geral_Solucao.md)
* **Documento Complementar:** [PRD_SYDE-31_Fase2_WSys_Integrado.md](file:///c:/Users/jj/OneDrive/Projetos/Barter%20Simulator/PRD_SYDE-31_Fase2_WSys_Integrado.md)

---

## 🎯 1. Objetivo & Justificativa de Negócio da Fase 1

O objetivo da **Fase 1 (FIN-18889)** é disponibilizar com velocidade imediata o Simulador de Barter Nutrade para os Consultores Comerciais e RTVs da Syngenta/Syde.

### Por que a Fase 1 é Manual?
1. **Independência Tecnológica:** A integração com a API WSys CTRM 2.10.1 envolve contratos de rede corporativa e validação de lotes BLIP da safra. A Fase 1 permite que a força de vendas simule propostas desde o primeiro dia sem travas externas.
2. **Eliminação do Cadastro Tributário Rígido:** No início da safra, nem todas as praças municipais estão cadastradas com regras de fundos estaduais no banco. Permitir que o RTV informe a alíquota ou taxa fixa diretamente viabiliza a negociação imediata em qualquer polo do Brasil.
3. **Redução do Lead Time Comercial:** Substitui as planilhas paralelas manuais de Excel por um sistema padronizado, seguro e homologado com geração de proposta em PDF e link compartilhável.

---

## 📸 2. Telas do Protótipo Homologado (Fase 1)

### 2.1. Formulário Inicial de Simulação Manual (Moeda Real - BRL)
Na tela inicial da Fase 1, a cotação do commodity inicia em branco para digitação obrigatória, os campos de distância de chão e asfalto estão na mesma linha e o painel de impostos permite parametrização flexível:

![Formulário Fase 1 - Entrada Manual](prints_prd/01_fase1_formulario_manual.png)

---

### 2.2. Simulação em Dólar (USD) – Exibição da Cotação do Dólar
Ao selecionar a moeda **Dólar (USD)**, o formulário exibe imediatamente o container destacado em amarelo para inserção da **Cotação do Dólar (R$/USD)**, indispensável para converter as taxas estaduais (fixadas em Reais pela lei estadual) para Dólar na CPR:

![Formulário Fase 1 - Cotação do Dólar em USD](prints_prd/01b_fase1_dolar_cotacao.png)

---

### 2.3. Resultados da Simulação e Comparativo Comercial (Fase 1)
Após preencher a cotação e clicar em **Simular**, o sistema renderiza o resumo executivo da operação, o volume de troca e o ranking contra as modalidades Syde, CRA Agro e Fiso (sem exibir o widget de mercado de Chicago, exclusivo da Fase 2):

![Resultado da Simulação Fase 1](prints_prd/02_fase1_resultado_calculado.png)

---

## 📝 3. Mapeamento Detalhado dos Novos Campos da Fase 1

| Campo em Tela | ID do Elemento | Tipo / Formato | Comportamento & Regra de Negócio |
|---|---|:---:|---|
| **Cotação da Commodity (Preço Bruto FOB) \*** | `v1-sim-preco-bruto` | Numérico (`0.00`) | **Obrigatório.** Inicia em branco (`value=""`). O botão Simular bloqueia a operação e emite alerta visual se o campo não for preenchido com valor superior a zero. |
| **Cotação do Dólar (R$/USD) \*** | `v1-sim-cotacao-dolar` | Numérico (`0.0000`) | **Visível apenas se a moeda for Dólar (USD).** Se a moeda for BRL, o campo fica oculto (`display: none`). Utilizado como divisor das taxas fixas estaduais para apurar a dedução em USD. Padrão sugerido: cotação PTAX recente (ex: 5,6378), editável livremente. |
| **Vencimento da Operação (Mês de Entrega)** | Informativo / Automático | Texto / Badge | **Removido seletor manual.** O mês de entrega passa a ser exibido automaticamente com base na data de vencimento da Campanha comercial selecionada (ex: `Maio / 2027`). |
| **Praça / Região (Opcional)** | `v1-sim-regiao` | Texto livre | Campo de preenchimento livre pelo RTV (ex: `Campo Novo do Parecis`, `Sorriso`, `Rio Verde`), apenas para registro visual na proposta e impressão no PDF. |
| **Distância Chão (KM)** | `v1-sim-dist-chao` | Numérico inteiro | Distância em estrada de terra da fazenda até a rodovia/polo. Inicia com `0`. **Posicionado na linha de baixo, alinhado lado a lado com Dist. Asfalto.** |
| **Distância Asfalto (KM)** | `v1-sim-dist-asfalto` | Numérico inteiro | Distância em rodovia asfaltada da fazenda até a praça de entrega. Inicia com `0`. **Posicionado na mesma linha que Dist. Chão.** |
| **Modalidade Funrural** | `v1-sim-funrural-tipo` | Dropdown | Opções: <br>1. `Comercialização (1,63%)` (alimenta automaticamente 1,63% no campo percentual).<br>2. `Folha de Pagamento (0,20%)` (alimenta automaticamente 0,20%).<br>3. `Personalizado` (foca o campo percentual para digitação livre). |
| **Alíquota Funrural (%)** | `v1-sim-funrural-pct` | Percentual (`0.00%`) | Percentual efetivo que será deduzido sobre o Preço Bruto da commodity. Editável pelo usuário. |
| **Outros Impostos Base NF (%)** | `v1-sim-imposto-estadual-pct` | Percentual (`0.00%`) | Percentual livre para fundos estaduais incidentes sobre o valor da NF (ex: 1,65% FUNDEINFRA em GO; 1,20% FDI no PI; 0,00% nos demais estados). |
| **Impostos Base UPF (R$/ton)** | `v1-sim-imposto-upf-ton` | Numérico (`0.00`) | Valor em Reais por tonelada legislado pelo estado (ex: MT = R$ 51,50/ton; MS = R$ 27,55/ton). **Sincronizado bidirecionalmente em tempo real com a Dedução Fixa por Saca.** |
| **Dedução Fixa por Saca (R$/sc)** | `v1-sim-taxa-fixa` | Numérico (`0.00`) | Valor em Reais retido por saca na CPR. **Sincronizado bidirecionalmente em tempo real com o campo R$/tonelada, aplicando o peso oficial da cultura selecionada.** |
| **Toggle Aplicar Deduções Fiscais** | `v1-sim-descontos` | Booleano (Toggle) | Padrão: **Ligado**. Quando desligado, desabilita visualmente a área de impostos e zera as deduções, simulando a entrega bruta isenta. |
| **Observações da Operação** | `v1-sim-obs` | Texto livre | Espaço para anotações do RTV (ex: CPF/CNPJ do titular da fazenda entregadora dos grãos). Reflete no resumo e no PDF. |

---

## 🧮 4. Explicação Clara e Passo a Passo dos Novos Cálculos

Para evitar qualquer confusão com sintaxes matemáticas complexas, todas as etapas de cálculo da Fase 1 estão descritas abaixo em formato de linguagem natural e operações aritméticas diretas.

### Passo 1: Conversão Bidirecional de Impostos (R$/tonelada para R$/saca)
Quando o RTV digita o valor em **R$/tonelada** (ex: R$ 51,50 do FETHAB/IAGRO em MT), o simulador converte automaticamente para **R$/saca** dividindo pela quantidade de sacas que cabem em 1 tonelada (1.000 kg).

```text
Sacas por Tonelada:
- Para Soja, Milho e Café (sacas de 60 kg): 1.000 kg / 60 kg = 16,6667 sacas por tonelada.
- Para Algodão (sacas ou arrobas de 15 kg): 1.000 kg / 15 kg = 66,6667 sacas por tonelada.

Fórmula de Conversão:
Dedução Fixa por Saca (R$/sc) = Imposto Base UPF (R$/ton) / Sacas por Tonelada
```

**Exemplos Práticos:**
* **Soja em Mato Grosso (MT):**
  `R$ 51,50 / 16,6667 = R$ 3,09 por saca`.
* **Algodão em Mato Grosso (MT):**
  `R$ 51,50 / 66,6667 = R$ 0,77 por saca/arroba`.
* **Soja em Mato Grosso do Sul (MS):**
  `R$ 27,55 / 16,6667 = R$ 1,65 por saca`.
* **Algodão em Mato Grosso do Sul (MS):**
  `R$ 27,55 / 66,6667 = R$ 0,41 por saca/arroba`.

*(A sincronização é de mão dupla: se o RTV alterar a Dedução Fixa por Saca para R$ 3,09, o campo de R$/tonelada se atualiza imediatamente para R$ 51,50).*

---

### Passo 2: Conversão da Taxa Fixa Estadual para Simulações em Dólar (USD)
Como as leis estaduais determinam a retenção em Reais (R$), quando a simulação for em **Dólar (USD)** a taxa fixa em Reais é convertida dividindo pela cotação do dólar informada:

```text
Dedução Fixa em USD = Dedução Fixa em R$ / Cotação do Dólar
```

*Exemplo:* Soja MT (R$ 3,09 por saca) com Cotação do Dólar a 5,6378:
* `3,09 / 5,6378 = USD 0,55 por saca`.

---

### Passo 3: Apuração das Deduções Percentuais e Tributação Total
A dedução percentual aplica a alíquota total do Funrural e dos impostos de NF sobre o Preço Bruto da commodity:

```text
Dedução Percentual por Saca = Preço Bruto * ((Funrural % + Outros Impostos Base NF %) / 100)
Dedução Total de Impostos = Dedução Percentual por Saca + Dedução Fixa por Saca
```

*Exemplo Prático (Soja MT a R$ 103,00, Funrural 1,63%, Taxa Fixa R$ 3,09):*
1. Dedução Percentual: `103,00 * (1,63% + 0,00%) = R$ 1,68 por saca`.
2. Dedução Fixa: `R$ 3,09 por saca`.
3. Dedução Total de Impostos: `1,68 + 3,09 = R$ 4,77 por saca`.

---

### Passo 4: Formação do Preço Líquido (Porteira)
O Preço Líquido recebido pelo produtor é o Preço Bruto menos a Dedução Total de Impostos e o frete de deslocamento da fazenda:

```text
Despesa de Frete da Fazenda = (Distância Chão * Tarifa Chão) + (Distância Asfalto * Tarifa Asfalto)
Frete Unitário por Saca = Despesa de Frete da Fazenda / Volume Preliminar de Sacas
Preço Líquido da Saca = Preço Bruto - Dedução Total de Impostos - Frete Unitário por Saca
```

*Exemplo com Frete Zero (KM 0 de chão e KM 0 de asfalto):*
* Preço Líquido: `103,00 - 4,77 - 0,00 = R$ 98,23 por saca`.

---

### Passo 5: Juros do Período e Preço Pedido TP (Valor Presente)
O crédito financiado de insumos é trazido a valor presente utilizando a taxa de juros anual e os dias corridos até o vencimento:

```text
Juros do Período = (Dias de Prazo / 360) * (Taxa de Juros Anual % / 100)
Preço Pedido TP = Valor da Operação a Prazo / (1 + Juros do Período)
```

*Exemplo (Operação de R$ 1.000.000,00 a prazo, 216 dias, 14,40% a.a.):*
* Juros do Período: `(216 / 360) * 14,40% = 8,64%`.
* Preço Pedido TP: `1.000.000,00 / (1 + 0,0864) = R$ 920.471,28`.

---

### Passo 6: Incentivo de Prazo Barter (Desconto Comercial)
Desconto comercial sobre o preço do insumo, proporcional aos dias corridos da operação:

```text
Taxa de Incentivo de Prazo (%) = (Dias de Prazo / 30) * Taxa Mensal de Incentivo (% a.m.)
Incentivo Barter ($) = Preço Pedido TP * (Taxa de Incentivo de Prazo (%) / 100)
```

*Exemplo (Taxa de incentivo de 0,50% ao mês, 216 dias):*
* Taxa de Incentivo: `(216 / 30) * 0,50% = 3,60%`.
* Incentivo Barter em R$: `920.471,28 * 3,60% = R$ 33.136,97`.

---

### Passo 7: Volume Contratual de Sacas da CPR (Física)
Quantidade de sacas que o produtor se compromete a entregar na CPR. **O Incentivo Barter reduz o saldo da operação antes da divisão pelo Preço Líquido**, diminuindo o número de sacas a entregar:

```text
Volume de Sacas da CPR = Teto((Valor da Operação a Prazo - Incentivo Barter) / Preço Líquido da Saca)
```

*Exemplo:*
* Saldo com Desconto: `1.000.000,00 - 33.136,97 = R$ 966.863,03`.
* Preço Líquido: `R$ 98,23 por saca`.
* Sacas da CPR: `966.863,03 / 98,23 = 9.843 sacas a entregar`.

---

### Passo 8: Devolução Financeira em Dinheiro de Cashback da Campanha
O Cashback da Campanha (ex: 4,50%) é um **benefício financeiro pago em dinheiro ou compensado em conta** ao produtor. **Ele NÃO reduz o volume físico de sacas da CPR**:

```text
Cashback da Campanha ($) = Valor da Operação a Prazo * (Percentual de Cashback % / 100)
```

*Exemplo (4,50% sobre R$ 1.000.000,00):*
* Cashback: `1.000.000,00 * 4,50% = R$ 45.000,00 devolvidos em dinheiro`.

---

## ✅ 5. Critérios de Aceite para Engenharia (Fase 1)

* **CA-F1-01 (Cotação Obrigatória):** O campo `v1-sim-preco-bruto` deve iniciar vazio. O clique em "Simular" sem preenchimento deve destacar o campo e não exibir resultados.
* **CA-F1-02 (Cotação Dólar Condicional):** O campo `v1-sim-cotacao-dolar` só deve ser renderizado quando a moeda selecionada for USD.
* **CA-F1-03 (Alinhamento Chão e Asfalto):** Os campos `v1-sim-dist-chao` e `v1-sim-dist-asfalto` devem estar dispostos lado a lado na mesma linha em resoluções desktop e tablet.
* **CA-F1-04 (Sincronização Fiscal Bidirecional):** Qualquer alteração em `v1-sim-imposto-upf-ton` deve recalcular `v1-sim-taxa-fixa` imediatamente com base na cultura ativa (60 kg para soja/milho/café e 15 kg para algodão), e vice-versa.
* **CA-F1-05 (Desacoplamento de WSys):** A Fase 1 não deve realizar nenhuma chamada HTTP externa para o endpoint do WSys ou exibir banners de mercado futuro de Chicago.
