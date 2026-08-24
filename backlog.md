# Backlog do Simulador de Barter

Este documento centraliza as funcionalidades, melhorias comerciais e integrações futuras mapeadas para evolução do **Simulador de Barter 2026**.

---

## 📌 Itens em Backlog

### 1. 📥 Importação Automática de Propostas e Planilhas do Salesforce
- **Descrição**: Permitir a importação direta de propostas/arquivos exportados do Salesforce (ou integração via API REST) para preencher automaticamente os parâmetros de simulação:
  - Crédito demandado e linha de defensivos/sementes contratada.
  - Informações do cliente (CNPJ, Domicílio Fiscal, Estado/Praça).
  - Condições comerciais da campanha e prazos negociados.
- **Objetivo**: Evitar digitação manual de propostas corporativas e agilizar o atendimento dos RTVs e Consultores de Vendas.

---

### 2. 🌾 Bônus Comercial por Portfólio Premium (+1,0% Cashback Barter)
- **Origem**: Planilha `SIMULADOR CAMPANHA VD RETA FINAL 15.06.2026.xlsx`.
- **Descrição**: Adicionar um seletor de "Portfólio Premium" no formulário de simulação.
  - Ao selecionar produtos estratégicos da Syngenta (como **Verdavis**, **Invencis** ou **Fungicidas Premium: Mitrion, Alade, Miravis Duo**), concede-se um bônus adicional de **+1,0%** sobre a taxa de Cashback do Barter.
  - Eleva o Cashback Barter Nutrade de **4,0%** para **5,0%** e na Trade ABC de **2,0%** para **3,0%**.

---

### 3. 🏢 Comparativo com Outras Tradings (Entrada Manual de Preço pelo Usuário)
- **Origem / Decisão 21/08**: Removido da simulação ativa e mantido em backlog.
- **Motivação**: Como não dispomos da cotação e taxas praticadas em tempo real pelas outras tradings concorrentes, estimar valores arbitrários pode distorcer a realidade comercial.
- **Solução Futura**: Criar um toggle ou aba "Comparar com Outra Trading", permitindo que o usuário informe manualmente:
  - Nome da trading concorrente;
  - Preço da saca ofertado pela trading concorrente (R$ ou USD);
  - Taxa de juros / desconto de prazo praticado pela concorrente;
  - Percentual de valorização / cashback ofertado.

---

### 4. 🌽 Inclusão da Cultura "Milho Safrinha" e Cotações em Arrobas (@) para Algodão
- **Origem**: Planilha `SIMULADOR CAMPANHA VD RETA FINAL 15.06.2026.xlsx`.
- **Descrição**:
  - **Milho Safrinha (sacas - sc)**: Adicionar a cultura no dropdown com janela padrão de vencimento em Setembro (188 dias), fator tributário de ICMS `0.9708` e cotação base.
  - **Algodão em Arrobas (@)**: Exibir nos cards e PDF a equivalência física em **Libras-peso (lp)** e em **Arrobas (@)** utilizando a taxa de conversão $\text{Preço/@} = \text{Preço/lp} \times 33,069$.

---

### 5. 🏷️ Nomenclatura Padronizada Corporativa (TP, VPAN e FGP)
- **Origem**: Planilha `SIMULADOR CAMPANHA VD RETA FINAL 15.06.2026.xlsx`.
- **Descrição**: Incorporar no simulador a nomenclatura comercial oficial utilizada no SAP/Salesforce da Syngenta:
  - **TP**: Tabela de Preço À Vista Bruta.
  - **VPAN**: Valor Presente À Vista com desconto.
  - **FGP**: Fatura Garantida de Prazo no Barter.

---

### 6. 🏛️ Ajustes Fiscais de PIS/COFINS e PTAX Dolarizado de Campanha
- **Origem**: Planilha `SIMULADOR CAMPANHA VD RETA FINAL 15.06.2026.xlsx`.
- **Descrição**:
  - Incorporar a dedução fiscal de PIS/COFINS (fator `0.9907`).
  - Permitir simular o PTAX Dolarizado de Campanha (ex: R$ 5,40 a R$ 5,70) no modal de "Ajustar Taxas / Campanhas".
