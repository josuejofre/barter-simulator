# Ata de Pedidos de Alterações - 21/08/2026

**Projeto:** Barter Hub - Simulador de Taxas e Modalidades de Crédito  
**Data da Reunião / Alinhamento:** 21 de Agosto de 2026  
**Status:** Aprovado e em Execução  

---

## 📌 Contexto e Objetivos

Nesta sessão de alinhamento com stakeholders de Crédito e Barter, foram definidas atualizações cruciais no modelo de negócio, na interface do usuário (UI/UX) e na forma de apresentação dos custos e benefícios para o produtor rural.

---

## 📝 Deliberações e Decisões Aprovadas

### 1. Remoção da Simulação de Outras Tradings (Mercado)
- **Decisão:** Retirar a coluna/card de "Barter (Outras Tradings)" da simulação ativa.
- **Justificativa:** Atualmente não dispomos de um feed público ou cotação em tempo real das tradings concorrentes. Fazer uma estimativa fixa (-1,0% no preço ou valorização arbitrária) pode distorcer a realidade comercial.
- **Destino / Backlog:** A funcionalidade foi transferida para o `backlog.md`. No futuro, será incluído um campo opcional para que o usuário informe manualmente a taxa e o preço ofertado pela outra trading caso deseje comparar.

---

### 2. Cadastro de Praças com Matriz de Impostos Fiscais (`Impostos 1.xlsx`)
- **Decisão:** Integrar a estrutura tributária por estado e município no Cadastro de Praças do WSys, conforme mapeado na planilha de referência `Impostos 1.xlsx`.
- **Regras Fiscais Cadastradas:**
  - **Funrural:** Alíquota padrão de **1,63%** sobre a produção comercializada (ou 0,2% se desconto em folha).
  - **Mato Grosso (MT):** Funrural (1,63%) + FETHAB (10% UPF/MT) + FETHAB Adicional (10% UPF/MT) + IAGRO (1,15% UPF/MT). Base UPF MT = R$ 243,49/ton $\rightarrow$ R$ 51,50/ton (~R$ 3,09/saca).
  - **Mato Grosso do Sul (MS):** Funrural (1,63%) + FUNDEMS (2,8% UFERMS) + FUNDERSUL (49,20% UFERMS). Base UFERMS = R$ 52,98/ton $\rightarrow$ R$ 27,55/ton (~R$ 1,65/saca).
  - **Goiás (GO):** Funrural (1,63%) + FUNDEINFRA (**1,65%** sobre o valor da NF).
  - **Piauí (PI):** Funrural (1,63%) + FDI (**1,20%** sobre o valor da NF).
  - **Demais Estados (PR, RO, MA, TO, BA, SP, MG, RS):** Funrural (1,63%) e isenções de fundos estaduais onde aplicável.

---

### 3. Ajuste do Formulário de Simulação (Campanha e Subcategoria)
- **Decisão:** Ajustar a seção superior do formulário de simulação para refletir o padrão corporativo:
  - **Campanha da Operação:**
    - Seletor de **Campanha** (ex: *Milho*, *Soja*, *Safra 2026/27 - Cerrado*, etc.).
    - Seletor de **Subcategoria** (ex: *Venda direta | Crop*, *Venda indireta | Distribuição*, *Barter Grãos | Nutrade*).
  - **Informações Financeiras:**
    - Botões de seleção de moeda: **Real (R$)** e **Dólar (USD)**.
    - Campo de **Valor da Operação (TP + Impostos)** formatado em moeda.
  - **Ações:** Botões de retorno (*Voltar*) e execução (*Simular*), com botões adicionais de exportação em PDF e Compartilhamento.

---

### 4. Modelo de Cashback Barter como Devolução Financeira
- **Decisão:** Não abater o valor do cashback diretamente da quantidade física de sacas no contrato de entrega.
- **Justificativa Operacional:** No Barter, a CPR física e o faturamento cobram a quantidade de sacas correspondente ao saldo total do crédito dos defensivos/insumos ($\text{Crédito} \div \text{Preço Líquido}$). O Cashback de Campanha (ex: 4,5%) é um valor **financeiro devolvido/creditado** na conta do produtor ou compensado em títulos.
- **Nova Apresentação:**
  - **Volume Físico a Entregar:** $N$ sacas.
  - **Devolução Financeira (Cashback R$ ou USD):** R$ $X$ devolvidos.
  - **Equivalência da Devolução:** Exibir quantas sacas esse retorno financeiro representa para facilitar a percepção de ganho.

---

### 5. Revisão e Didática dos Conceitos de Custo Real
- **Decisão:** Padronizar as fórmulas e explicações de Custo Real para garantir total clareza aos consultores e clientes:
  - **Custo Real Total (%):**
    $$\text{Custo Real Total (\%)} = \left(\frac{\text{Valor Total Final da Modalidade} - \text{Crédito Demandado}}{\text{Crédito Demandado}}\right) \times 100$$
    *Significado:* Variação percentual total acumulada que a operação custará em relação ao valor financiado no período completo.
  - **Custo Real da Operação (% a.m.):**
    $$\text{Custo Real da Operação (\% a.m.)} = \frac{\text{Custo Real Total (\%)}}{\text{Prazo da Operação em Meses (dias / 30)}}$$
    *Significado:* Taxa mensal efetiva média da operação ao longo da carência da safra.

---

### 6. Sacas Equivalentes nas Modalidades Financeiras (Syde, Fiso, Syngenta)
- **Decisão:** Incluir em todas as opções financeiras a conversão do valor total da dívida para sacas de commodity:
  $$\text{Sacas Equivalentes} = \frac{\text{Valor Total da Modalidade}}{\text{Preço de Referência da Saca}}$$
- **Objetivo:** Permitir ao produtor e consultor comparar diretamente a carga de grãos necessária para quitar a operação em cada modalidade, validando a competitividade do Barter frente aos meios de pagamento bancários e a prazo.

---

## 📅 Próximos Passos
1. Atualização do código-fonte em `index.html`, `app.js` e `style.css`.
2. Atualização dos arquivos `regras_de_negocio.md` e `backlog.md`.
3. Validação dos cenários de teste para MT, MS, GO e PR em BRL e USD.
