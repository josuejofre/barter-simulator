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

### 5. Bônus 2: Ganho de Cashback da Campanha (R$)
> **Valor do Crédito × % de Cashback da Nutrade = Ganho de Cashback (R$)**
* **O que faz:** Devolve parte do valor financiado na forma de abatimento direto em grãos.
* **Exemplo:** Com campanha de $4{,}5\%$: 
  $$\text{R\$\ } 1.000.000{,}00 \times 4{,}5\% = \mathbf{\text{R\$\ } 45.000{,}00}$$

---

### 6. Sacas Economizadas (Desconto em Grãos)
> **(Ganho de Incentivo + Ganho de Cashback) ÷ Preço Líquido da Saca = Sacas Economizadas**
* **O que faz:** Converte o total de bonificações financeiras (em R$) diretamente em sacas de grãos a menos que o produtor precisa entregar.
* **Exemplo:** 
  $$(\text{R\$\ } 31.500{,}00 + \text{R\$\ } 45.000{,}00) \div \text{R\$\ } 118{,}00 = \mathbf{648\text{ sacas economizadas}}$$

---

### 7. Volume Final a Entregar
> **Sacas Iniciais − Sacas Economizadas = Sacas Finais a Entregar**
* **O que faz:** Representa o volume físico real que o produtor entrega na liquidação da operação.
* **Exemplo:** 
  $$8.475 - 648 = \mathbf{7.827\text{ sacas}}$$

---

### 8. Valor Total e Custo da Operação
> **(Sacas Finais × Preço Bruto da Soja) + Frete Total = Valor Final a Prazo**
* **O que faz:** Calcula o valor financeiro total que a produção entregue representa, incluindo a logística.
* **Exemplo:** 
  $$(7.827 \times \text{R\$\ } 120{,}00) + \text{R\$\ } 940{,}00 = \mathbf{\text{R\$\ } 940.180{,}00}$$

---

## 🎯 Fórmula Geral em Uma Linha

$$\text{Volume Final a Entregar (sc)} = \frac{\text{Crédito}}{\text{Preço Líquido}} - \left( \frac{\text{Incentivo de Prazo (R\$) + Cashback (R\$)}}{\text{Preço Líquido}} \right)$$

---

## ⚖️ Diferença Comercial: Nutrade vs. Outras Tradings

| Indicador | Nutrade (Nossa Estrutura) | Outras Tradings (Mercado) |
| :--- | :--- | :--- |
| **Cashback de Campanha** | **4,0% a 5,0%** | **2,0% a 3,0%** |
| **Incentivo de Prazo** | **+0,5% a cada 30 dias** | **0,0% (Não aplicado)** |
| **Distância de Frete** | **Distância Real** | **Distância Real + 30 km de asfalto** (armazém mais distante) |
| **Preço Base do Grão** | **Preço Cheio FOB** | **Deságio médio de ~1,0%** |
