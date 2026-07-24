# Dicionário de Textos de Ajuda (Tooltips) - Simulador Barter Hub 2026

Este arquivo lista todos os textos explicativos associados aos ícones de interrogação (`?`) presentes no **Simulador de Cashback Barter 2026**.

---

## 1. Parâmetros da Operação (Formulário Principal)

| ID | Campo / Rótulo | Texto de Ajuda (Tooltip) |
|---|---|---|
| `sim-campanha-select` | **Campanha de Referência** | **Simulador:** Seleção manual de opções mockadas ou adicionadas em Ajustar Taxas.<br>**Versão Final:** Integração com base de campanhas de Barter registradas no SAP/Salesforce. |
| `sim-commodity` | **Commodity** | **Simulador:** Seleção manual (Soja em sc ou Algodão em lp).<br>**Versão Final:** Cadastro de produtos e commodities de originação da Syngenta/Nutrade. |
| `sim-estado` | **Estado** | **Simulador:** Seleção do Estado correspondente.<br>**Versão Final:** Preenchido de forma automática com base no domicílio fiscal (CNPJ) do cliente integrado no SAP MDM. |
| `sim-regiao` | **Praça (Dados do WSys)** | **Simulador:** Filtro local de praças (carregando dados de localStorage).<br>**Versão Final:** Chamada de API direta ao sistema corporativo de logística e originação (WSys).<br>**Fórmula:** Retorna as tarifas logísticas e impostos vigentes do município. |
| `currency-group` | **Moeda da Operação** | **Simulador:** Escolha entre Real (R$) e Dólar ($).<br>**Versão Final:** Puxado das regras da linha de faturamento e financiamento do pedido de venda (SAP/Salesforce). |
| `sim-credito` | **Valor da Operação** | **Simulador:** Valor digitado pelo usuário.<br>**Versão Final:** Valor bruto do pedido de faturamento de insumos associado (Salesforce/SAP FSCM). |
| `sim-descontos` | **Deduções Fiscais** | **Simulador:** Botão liga/desliga para fins comparativos.<br>**Versão Final:** Determinação fiscal automatizada (SAP Tax Engine) segundo o enquadramento fiscal e tributação estadual do produtor. |
| `sim-dist-chao` | **Estrada de Chão (KM)** | **Simulador:** Carrega do WSys (editável).<br>**Versão Final:** Calculado via roteirizador do frete com a geolocalização da fazenda cadastrada.<br>**Fórmula:** Distância Chão * Custo KM Terra do WSys. |
| `sim-dist-asfalto` | **Estrada de Asfalto (KM)** | **Simulador:** Carrega do WSys (editável).<br>**Versão Final:** Calculado via roteirizador do frete com a geolocalização da fazenda cadastrada.<br>**Fórmula:** Distância Asfalto * Custo KM Asfalto do WSys. |

---

## 2. Resumo da Operação e Cartão de Referência

| ID | Campo / Rótulo | Texto de Ajuda (Tooltip) |
|---|---|---|
| `summary-card` | **Resumo da Operação** | **Simulador:** Consolidação de juros, prazos e economia com base na opção selecionada.<br>**Versão Final:** Espelho e resumo executivo da CPR/proposta de faturamento do cliente. |
| `ref-preco` | **Preço do Grão** | Preço bruto FOB obtido via API / WSys. |
| `ref-cambio` | **Taxa Cambial** | Dólar futuro / spot atual obtido via AwesomeAPI. |
| `ref-juros` | **Taxa Juros (a.a.)** | Taxa de juros anualizada cadastrada para o Barter nesta campanha. |
| `ref-prazo` | **Prazo Calculado** | Prazo calculado (Data de carência a Vencimento da campanha). |
| `ref-val-nutrade` | **Valoriz. Nutrade** | Retorno de valorização comercial (Cashback) da Nutrade. |
| `ref-val-outras` | **Valoriz. Outras** | Dedução de valorização das tradings concorrentes. |
| `ref-frete-chao` | **Frete Chão (WSys)** | Custo por KM de terra recuperado do WSys para a praça. |
| `ref-frete-asfalto` | **Frete Asfalto (WSys)** | Custo por KM de asfalto recuperado do WSys para a praça. |
| `modality-cards-list` | **Modalidades Ordenadas** | Apresentado da mais vantajosa (melhor benefício) para a menos vantajosa. Clique para ver o detalhamento completo dos custos. |

---

## 3. Detalhamento da Tabela Barter

| ID | Campo / Rótulo | Texto de Ajuda (Tooltip) |
|---|---|---|
| `tbl-barter-fob` | **Valor do Crédito (FOB a Prazo)** | **Simulador:** Resgatado do input Valor da Operação.<br>**Versão Final:** Valor do faturamento do pedido de insumos integrado via Salesforce/SAP.<br>**Fórmula:** Valor do Crédito. |
| `tbl-barter-desc-estadual` | **(-) Descontos Estaduais** | **Simulador:** Parcela fixa de imposto cadastrada na Praça logística local (WSys).<br>**Versão Final:** Puxado do motor fiscal (SAP Tax Engine) conforme enquadramento fiscal do produtor.<br>**Fórmula:** Desconto Fixo = Volume Físico Inicial * Alíquota por Saca da Praça (ex: Fethab/Fundems). |
| `tbl-barter-desc-demais` | **(-) Demais Descontos (SENAR)** | **Simulador:** Alíquota percentual cadastrada na Praça logística local (WSys).<br>**Versão Final:** Motor fiscal de impostos federais retidos na fonte (SENAR/Funrural) no SAP.<br>**Fórmula:** Desconto SENAR/Funrural = Preço Commodity Bruto * Alíquota Percentual da Praça. |
| `tbl-barter-livre` | **Preço Commodity Livre** | **Simulador:** Subtração dos descontos fiscais sobre o Preço Bruto.<br>**Versão Final:** Calculado pelo Motor de Netback da mesa de originação (Nutrade).<br>**Fórmula:** Preço Bruto FOB - Descontos Estaduais - Demais Descontos. |
| `tbl-barter-vol-troca` | **Volume de Troca Físico Inicial** | **Simulador:** Razão entre Crédito e Preço Livre, arredondada para cima.<br>**Versão Final:** CPR Física gerada e registrada no cartório de títulos (SAP FSCM).<br>**Fórmula:** Volume Inicial = Teto(Valor do Crédito / Preço Commodity Livre). |
| `tbl-barter-valcamp` | **Taxa de Valorização (Cashback)** | **Simulador:** Taxa associada à campanha selecionada (Nutrade vs Outras).<br>**Versão Final:** Campanha comercial aprovada pela originação cadastrada no Salesforce/SAP. |
| `tbl-barter-cashback-usd` | **Cash Back da Campanha** | **Simulador:** Multiplicação do crédito pela taxa de cashback.<br>**Versão Final:** Abatimento comercial bonificado no pedido de insumos (SAP).<br>**Fórmula:** Valor do Crédito * Taxa de Valorização da Campanha. |
| `tbl-barter-incbarter-pct` | **Incentivo Barter (%)** | **Simulador:** Juros regressivos da campanha calculados conforme o prazo.<br>**Versão Final:** Política de desconto financeiro por faturamento físico parametrizada no SAP.<br>**Fórmula:** Retornado da tabela de juros comerciais associada à campanha. |
| `tbl-barter-incbarter-usd` | **Incentivo Barter ganho** | **Simulador:** Multiplicação do crédito pela taxa de juros regressivos.<br>**Versão Final:** Abatimento de juros lançado no faturamento de barter (SAP).<br>**Fórmula:** Valor do Crédito * Incentivo Barter (%). |
| `tbl-barter-totalret` | **Total de Retorno Recebido** | **Simulador:** Somatório de cashback e juros regressivos concedidos.<br>**Versão Final:** Desconto de originação consolidado na proposta comercial do Salesforce.<br>**Fórmula:** Cash Back da Campanha + Incentivo Barter ganho. |
| `tbl-barter-finalpreco` | **Preço Equivalente Final** | **Simulador:** Preço livre acrescido dos benefícios comerciais convertidos por unidade.<br>**Versão Final:** Indicador de preço neto real para faturamento logístico corporativo.<br>**Fórmula:** Preço Commodity Livre + (Total Retorno / Volume Inicial). |
| `tbl-barter-finalvol` | **Volume Equivalente Final** | **Simulador:** Volume físico inicial menos o volume deduzido pelos retornos comerciais.<br>**Versão Final:** CPR Física consolidada final com o volume líquido final faturado (SAP FSCM).<br>**Fórmula:** Volume Inicial - (Total Retorno / Preço Equivalente Final). |
| `tbl-barter-valreal` | **Valorização Real sobre Livre** | **Simulador:** Percentual de ganho efetivo sobre o Preço Livre (Porteira).<br>**Versão Final:** Indicador comercial interno de margem do produtor no Salesforce.<br>**Fórmula:** (Preço Equivalente Final / Preço Commodity Livre) - 1. |

---

## 4. Detalhamento da Tabela de Modalidades Financeiras

| ID | Campo / Rótulo | Texto de Ajuda (Tooltip) |
|---|---|---|
| `tbl-fin-juros` | **Taxa Juros Anual Efetiva** | **Simulador:** Taxa de juros anual configurada para a campanha (com reduções promocionais para FIDC e FISO).<br>**Versão Final:** Taxa contratual parametrizada no SAP e negociada com as instituições financeiras. |
| `tbl-fin-custo` | **Custo Financeiro Líquido** | **Simulador:** Custo líquido de captação de juros, ponderado pelo prazo e deduzido dos retornos de originação (para Barter).<br>**Versão Final:** Lançamento de despesas financeiras integradas no módulo SAP FI-CO.<br>**Fórmula:** Crédito * (Prazo/360) * Juros Anual. Para Barter: Custo de Juros - Retorno Total + Frete. |
| `tbl-fin-total` | **Valor Total a Pagar** | **Simulador:** Soma do crédito e custo financeiro líquido da modalidade correspondente.<br>**Versão Final:** Valor total de liquidação e encerramento de contrato integrado no SAP FSCM.<br>**Fórmula:** Valor do Crédito + Custo Financeiro Líquido. |
| `tbl-fin-inc` | **Incentivo / Retorno Comercial** | **Simulador:** Detalhe da redução promocional de taxa de captação (-4% para FIDC, -3% para FISO) ou bonificação/cashback de originação (Barter).<br>**Versão Final:** Parâmetros comerciais integrados de desconto financeiro da campanha comercial. |
| `tbl-fin-garantias` | **Garantias Exigidas** | **Simulador:** Texto fixo descritivo das garantias exigidas.<br>**Versão Final:** Estrutura de colaterais e garantias exigidas pela mesa de crédito integradas no fluxo do dossiê digital de crédito (Salesforce). |
| `tbl-fin-elegibilidade` | **Critérios de Elegibilidade** | **Simulador:** Texto descritivo das condições de aceitação.<br>**Versão Final:** Políticas automatizadas de score de crédito e compliance integradas na esteira de concessão de limite. |
| `tbl-fin-fluxo` | **Fluxo de Pagamento** | **Simulador:** Tipo de entrega física ou financeira da modalidade.<br>**Versão Final:** Parametrização do fluxo de liquidação contratual no SAP FSCM (físico ou financeiro). |
| `pracas-wsys` | **Cadastro de Praças (WSys)** | Esta tela simula o cadastro de praças e custos logísticos do sistema WSys, conforme solicitado para demonstração. |
