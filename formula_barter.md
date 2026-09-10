# 🌾 Fórmula Completa da Simulação de Barter

Este documento apresenta a fórmula matemática da simulação de Barter do **Simulador Barter 2026** explicada de forma simples, direta e com exemplos práticos numéricos passo a passo.

---

## ⚡ Resumo em 7 Passos Simples

### 1. Preço Líquido da Saca
> **Preço Bruto da Soja (WSys) − Impostos da Região (WSys) = Preço Líquido da Saca**
* **O que faz:** Deduz do preço de balcão os impostos estaduais incidentes sobre o grão (ex: Fethab e Senar no MT, Fundeagro em GO).
* **Exemplo:** 
  $$\text{R\$\ } 120{,}00 - \text{R\$\ } 2{,}00 = \mathbf{\text{R\$\ } 118{,}00\text{ por saca}}$$

---

### 2. Custo do Frete Logístico
> **(Km Asfalto × Custo/Km) + (Km Chão × Custo/Km) = Frete Total**
* **O que faz:** Calcula o valor gasto para transportar os grãos da fazenda até o armazém/porto.
* **Exemplo:** 
  $$(80\text{ km} \times \text{R\$\ } 8{,}00) + (20\text{ km} \times \text{R\$\ } 15{,}00) = \mathbf{\text{R\$\ } 940{,}00}$$

---

### 3. Preço Pedido TP (Valor Presente) e Incentivo de Prazo Barter
> **Preço Pedido TP (Valor Presente) = Valor da Operação ÷ (1 + Juros do Período)**  
> **Incentivo Barter (R$) = Preço Pedido TP (Valor Presente) × (Dias de Prazo ÷ 30 × 0,5%)**
* **O que faz:** Desconta os juros do prazo do valor a prazo da operação para encontrar o **Preço Pedido TP (Valor Presente)** à vista, e em seguida aplica o **desconto comercial** de incentivo de $0{,}5\%$ ao mês sobre esse valor presente.
* **Exemplo de Cálculo:**
  - Operação a prazo: $\text{R\$\ } 1.000.000{,}00$, $216\text{ dias}$ a $14{,}40\%\text{ a.a.}$ ($\text{Juros Período} = 8{,}64\%$):
  - $\text{Preço Pedido TP (Valor Presente)} = \frac{\text{R\$\ } 1.000.000{,}00}{1 + 0{,}0864} = \mathbf{\text{R\$\ } 920.471{,}28}$
  - $\text{Incentivo Barter} = \text{R\$\ } 920.471{,}28 \times (216 / 30 \times 0{,}5\%) = \text{R\$\ } 920.471{,}28 \times 3{,}60\% = \mathbf{\text{R\$\ } 33.136{,}97\text{ de desconto comercial}}$
* **Impacto:** Esse desconto reduz o saldo financeiro a ser quitado em grãos e **diminui a quantidade de sacas a entregar na CPR**.

---

### 4. Volume Contratual de Sacas a Entregar na CPR
> **(Valor do Crédito − Incentivo Barter) ÷ Preço Líquido da Saca = Sacas a Entregar na CPR**
* **O que faz:** Representa o volume físico contratual fixado na CPR para liquidação da compra de insumos, já usufruindo do desconto de incentivo.
* **Exemplo:** 
  $$(\text{R\$\ } 1.000.000{,}00 - \text{R\$\ } 31.500{,}00) \div \text{R\$\ } 118{,}00 = \frac{\text{R\$\ } 968.500{,}00}{\text{R\$\ } 118{,}00} = \mathbf{8.208\text{ sacas a entregar}}$$

---

### 5. Cashback de Campanha (Devolução Financeira em Dinheiro R$ / USD)
> **Valor do Crédito × % de Cashback da Campanha = Devolução Financeira (R$)**
* **O que faz:** Diferente do incentivo de prazo, o cashback não reduz sacas da CPR; ele é uma **devolução financeira monetária em dinheiro** creditada na conta do produtor.
* **Exemplo:** Com campanha de $4{,}5\%$: 
  $$\text{R\$\ } 1.000.000{,}00 \times 4{,}5\% = \mathbf{\text{R\$\ } 45.000{,}00\text{ devolvidos em dinheiro}}$$

---

### 6. Valor Total e Custo da Operação
> **(Sacas a Entregar × Preço Bruto da Soja) + Frete Total − Devolução de Cashback = Valor Final Efetivo**
* **O que faz:** Calcula o valor financeiro total da produção física contratada, incluindo frete e abatendo o retorno de cashback devolvido em dinheiro.
* **Exemplo:** 
  $$(8.208 \times \text{R\$\ } 120{,}00) + \text{R\$\ } 940{,}00 - \text{R\$\ } 45.000{,}00 = \mathbf{\text{R\$\ } 940.900{,}00}$$

---

## 🎯 Sacas Equivalentes nas Modalidades Financeiras (Syde, Fiso, Syngenta)

Para comparar com a modalidade Barter, calculamos a quantidade de sacas que o produtor precisaria vender para quitar cada meio de pagamento:
$$\text{Sacas Equivalentes} = \frac{\text{Valor Total a Pagar da Modalidade (R\$)}}{\text{Preço da Saca (R\$/sc)}}$$
