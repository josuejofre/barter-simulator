# 🌾 Fórmula Completa da Simulação de Barter

Este documento apresenta a fórmula matemática da simulação de Barter do **Simulador Barter 2026** explicada de forma simples, direta e com exemplos práticos numéricos passo a passo.

---

## ⚡ Resumo em 8 Passos Simples

### 1. Preço Líquido da Saca
> **Preço Bruto da Soja − Impostos da Região = Preço Líquido da Saca**
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

### 3. Quantidade Inicial de Sacas (Volume de Troca Base)
> **Valor do Crédito dos Insumos ÷ Preço Líquido da Saca = Sacas Iniciais**
* **O que faz:** Descobre quantas sacas de soja seriam necessárias para quitar a compra sem nenhum desconto ou benefício comercial.
* **Exemplo:** 
  $$\text{R\$\ } 1.000.000{,}00 \div \text{R\$\ } 118{,}00 = \mathbf{8.475\text{ sacas}}$$

---

### 4. Bônus 1: Ganho de Incentivo de Prazo (R$)
> **Valor à Vista da Operação × (Dias de Prazo ÷ 30 × 0,5%) = Ganho de Incentivo (R$)**
* **O que faz:** Concede um desconto financeiro para o produtor rural proporcional ao tempo até a liquidação da safra ($0{,}5\%$ ao mês sobre o Valor Presente TP).
* **Exemplo:** Em 210 dias (7 meses a $0{,}5\% = 3{,}5\%$): 
  $$\text{R\$\ } 900.000{,}00 \times 3{,}5\% = \mathbf{\text{R\$\ } 31.500{,}00}$$

---

### 5. Bônus 2: Ganho de Cashback da Campanha (Devolução Financeira R$ / USD)
> **Valor do Crédito × % de Cashback da Nutrade = Devolução Financeira de Cashback (R$)**
* **O que faz:** Devolve o valor financeiro do cashback diretamente ao produtor (em R$ ou USD).
* **Exemplo:** Com campanha de $4{,}5\%$: 
  $$\text{R\$\ } 1.000.000{,}00 \times 4{,}5\% = \mathbf{\text{R\$\ } 45.000{,}00\text{ devolvidos}}$$

---

### 6. Sacas Equivalentes à Devolução e Retorno Total
> **(Ganho de Incentivo + Devolução de Cashback) ÷ Preço Líquido da Saca = Sacas Equivalentes Economizadas**
* **O que faz:** Converte o total de bonificações financeiras devolvidas ao produtor em sacas de grãos equivalentes para medir o ganho de eficiência.
* **Exemplo:** 
  $$(\text{R\$\ } 31.500{,}00 + \text{R\$\ } 45.000{,}00) \div \text{R\$\ } 118{,}00 = \mathbf{648\text{ sacas equivalentes economizadas}}$$

---

### 7. Volume Contratual de Sacas a Entregar
> **Valor do Crédito ÷ Preço Líquido da Saca = Volume Contratual a Entregar**
* **O que faz:** Representa o volume físico contratual fixado na CPR/operação para liquidação dos insumos.
* **Exemplo:** 
  $$\text{R\$\ } 1.000.000{,}00 \div \text{R\$\ } 118{,}00 = \mathbf{8.475\text{ sacas}}$$

---

### 8. Valor Total e Custo da Operação
> **(Sacas a Entregar × Preço Bruto da Soja) + Frete Total = Valor Final a Prazo**
* **O que faz:** Calcula o valor financeiro total da produção física contratada, incluindo logística.
* **Exemplo:** 
  $$(8.475 \times \text{R\$\ } 120{,}00) + \text{R\$\ } 940{,}00 = \mathbf{\text{R\$\ } 1.017.940{,}00}$$

---

## 🎯 Sacas Equivalentes nas Modalidades Financeiras (Syde, Fiso, Syngenta)

Para comparar com a modalidade Barter, calculamos a quantidade de sacas que o produtor precisaria vender para quitar cada meio de pagamento:
$$\text{Sacas Equivalentes} = \frac{\text{Valor Total a Pagar da Modalidade (R\$)}}{\text{Preço da Saca (R\$/sc)}}$$
