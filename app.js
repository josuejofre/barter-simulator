// app.js - Barter Fees Simulator Logic & Interactions (Generic Barter Hub version)

// Global state
let selectedCurrency = 'BRL'; // Default currency is Real (R$)
let tvWidget = null;
let currentQuotes = {
    soybeans: 20.00, // USD per saca (default starting price from sheet)
    cotton: 0.85     // USD per lb (default starting price from sheet)
};

// Formatting helpers
const formatUSD = (val) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

const formatUSDExtended = (val) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    }).format(val);
};

const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

const formatBRLExtended = (val) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    }).format(val);
};

const formatNumber = (val, decimals = 2) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(val);
};

// Format raw number to dynamic currency mask
function formatCurrencyValue(num, currency) {
    if (currency === 'BRL') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    } else {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }
}

// Convert formatted currency string back to raw float number
function getRawCurrencyValue(str) {
    let digits = str.replace(/[^0-9]/g, '');
    return digits ? (parseFloat(digits) / 100) : 0;
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    setupMasks();
    initTradingViewWidget('Soja');
    fetchLiveQuotes();
    calculateSimulation();
});

// Configure mask events
function setupMasks() {
    const creditInput = document.getElementById('sim-credito');
    if (creditInput) {
        creditInput.addEventListener('input', (e) => {
            let digits = e.target.value.replace(/[^0-9]/g, '');
            if (digits === '') {
                e.target.value = '';
                calculateSimulation();
                return;
            }
            let rawNum = parseFloat(digits) / 100;
            e.target.value = formatCurrencyValue(rawNum, selectedCurrency);
            calculateSimulation();
        });
    }
}

// Single-page navigation controller
function showPage(pageId) {
    const simPage = document.getElementById('page-simulador');
    const rulesPage = document.getElementById('page-regras');
    const simLink = document.getElementById('nav-link-simulador');
    const rulesLink = document.getElementById('nav-link-regras');
    
    if (pageId === 'simulador') {
        simPage.style.display = 'grid';
        rulesPage.style.display = 'none';
        simLink.classList.add('active');
        rulesLink.classList.remove('active');
        
        // Redraw TradingView widget when returning to simulation page
        const commodity = document.getElementById('sim-commodity').value;
        initTradingViewWidget(commodity);
    } else if (pageId === 'regras') {
        simPage.style.display = 'none';
        rulesPage.style.display = 'block';
        rulesLink.classList.add('active');
        simLink.classList.remove('active');
    }
}

// Set Active Currency Toggle
function setCurrency(currency) {
    if (selectedCurrency === currency) return;
    
    const btnBrl = document.getElementById('btn-currency-brl');
    const btnUsd = document.getElementById('btn-currency-usd');
    const creditInput = document.getElementById('sim-credito');
    const priceInput = document.getElementById('sim-preco-bruto');
    const freteKmInput = document.getElementById('sim-frete-km');
    
    const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
    
    // Save current raw values
    const currentCreditRaw = getRawCurrencyValue(creditInput.value);
    const currentPriceRaw = parseFloat(priceInput.value) || 0;
    const currentFreteRaw = parseFloat(freteKmInput.value) || 0;
    
    let newCredit, newPrice, newFrete;
    
    if (currency === 'BRL') {
        // Converting from USD to BRL
        newCredit = currentCreditRaw * cambio;
        newPrice = currentPriceRaw * cambio;
        newFrete = currentFreteRaw * cambio;
        
        btnBrl.classList.add('active');
        btnUsd.classList.remove('active');
    } else {
        // Converting from BRL to USD
        newCredit = currentCreditRaw / cambio;
        newPrice = currentPriceRaw / cambio;
        newFrete = currentFreteRaw / cambio;
        
        btnUsd.classList.add('active');
        btnBrl.classList.remove('active');
    }
    
    // Update global selection
    selectedCurrency = currency;
    
    // Update labels and suffixes
    const isSoy = document.getElementById('sim-commodity').value === 'Soja';
    document.getElementById('sim-preco-bruto-suffix').textContent = currency === 'BRL' ? 'R$/' + (isSoy ? 'sc' : 'lp') : 'USD/' + (isSoy ? 'sc' : 'lp');
    document.getElementById('sim-frete-km-suffix').textContent = currency === 'BRL' ? 'R$/KM' : 'USD/KM';
    
    // Write back converted values formatted correctly
    creditInput.value = formatCurrencyValue(newCredit, currency);
    priceInput.value = newPrice.toFixed(2);
    freteKmInput.value = newFrete.toFixed(2);
    
    // Recalculate
    calculateSimulation();
}

// Fetch Quotes from backend server API (will fail gracefully on GitHub Pages static mode)
async function fetchLiveQuotes() {
    const statusEl = document.getElementById('sim-quote-status');
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando cotações...';
    
    try {
        const response = await fetch('/api/quotes');
        const data = await response.json();
        
        if (data.success) {
            currentQuotes.soybeans = data.soybeans.usd_per_saca;
            currentQuotes.cotton = data.cotton.usd_per_lb;
            
            const commodity = document.getElementById('sim-commodity').value;
            const livePriceUSD = currentQuotes[commodity === 'Soja' ? 'soybeans' : 'cotton'];
            
            const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
            const priceInput = document.getElementById('sim-preco-bruto');
            
            if (selectedCurrency === 'BRL') {
                priceInput.value = (livePriceUSD * cambio).toFixed(2);
            } else {
                priceInput.value = livePriceUSD.toFixed(2);
            }
            
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            if (statusEl) statusEl.innerHTML = `<span class="text-green"><i class="fa-solid fa-circle-check"></i> Cotações reais obtidas às ${timeStr} (Yahoo Finance)</span>`;
            
            // Re-run simulation
            calculateSimulation();
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
    } catch (e) {
        console.error("Failed to fetch live quotes:", e);
        if (statusEl) statusEl.innerHTML = `<span class="text-secondary"><i class="fa-solid fa-triangle-exclamation"></i> Usando valores de referência padrão para simulação offline</span>`;
    }
}

// When commodity changes in unified mode
function onCulturaChange(value) {
    const isSoy = value === 'Soja';
    const currencySign = selectedCurrency === 'BRL' ? 'R$' : 'USD';
    const unitSymbol = isSoy ? 'sc' : 'lp';
    
    // Update labels and suffixes
    document.getElementById('sim-preco-bruto-label').textContent = `Preço Commodity Bruto (FOB) (${currencySign}/${unitSymbol})`;
    document.getElementById('sim-preco-bruto-suffix').textContent = `${currencySign}/${unitSymbol}`;
    document.getElementById('sim-descontos-label').textContent = isSoy ? 'Ativo (Senar + Fethab)' : 'Ativo (Senar + Fial)';
    
    const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
    const basePriceUSD = isSoy ? currentQuotes.soybeans : currentQuotes.cotton;
    
    // Fill commodity price input
    const priceInput = document.getElementById('sim-preco-bruto');
    if (selectedCurrency === 'BRL') {
        priceInput.value = (basePriceUSD * cambio).toFixed(2);
    } else {
        priceInput.value = basePriceUSD.toFixed(2);
    }
    
    // Set typical default days
    document.getElementById('sim-prazo').value = isSoy ? 216 : 249;
    
    // Set typical campaign rates:
    document.getElementById('sim-campanha-val').value = isSoy ? 4.50 : 4.50;
    
    // Update TradingView widget symbol
    initTradingViewWidget(value);
    
    // Recalculate
    calculateSimulation();
}

// Helper to calculate regional tax deduction
function getRegionalTaxRate(regionName, brutoPrice) {
    switch (regionName) {
        case 'Campo Novo do Parecis (MT)':
            return (brutoPrice * 0.002) + 0.60;
        case 'Sorriso (MT)':
            return (brutoPrice * 0.0025) + 0.65;
        case 'Querência (MT)':
            return (brutoPrice * 0.0022) + 0.70;
        case 'Rio Verde (GO)':
            return (brutoPrice * 0.0015) + 0.40;
        case 'Dourados (MS)':
            return (brutoPrice * 0.0010) + 0.30;
        case 'Cascavel (PR)':
        default:
            return 0.0;
    }
}

// Core Barter Calculations (Credit-line based)
function calculateSimulation() {
    const commodity = document.getElementById('sim-commodity').value;
    const regiao = document.getElementById('sim-regiao').value;
    const creditRaw = getRawCurrencyValue(document.getElementById('sim-credito').value);
    const commBrutoRaw = parseFloat(document.getElementById('sim-preco-bruto').value) || 0;
    const descontoAtivo = document.getElementById('sim-descontos').checked;
    const prazo = parseFloat(document.getElementById('sim-prazo').value) || 0;
    const jurosAnual = parseFloat(document.getElementById('sim-juros-anual').value) || 0;
    const valPctProposta = parseFloat(document.getElementById('sim-campanha-val').value) || 0;
    
    const distNutrade = parseFloat(document.getElementById('sim-dist-nutrade').value) || 0;
    const distMarket = parseFloat(document.getElementById('sim-dist-concorr').value) || 0;
    const freteKmRaw = parseFloat(document.getElementById('sim-frete-km').value) || 0;
    const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
    
    const isSoy = commodity === 'Soja';
    const unitSymbol = isSoy ? 'sc' : 'lp';
    
    // Format helper based on currency selection
    const formatSelectedCurrency = (val) => {
        return selectedCurrency === 'BRL' ? formatBRL(val) : formatUSD(val);
    };
    
    const formatSelectedCurrencyExtended = (val) => {
        return selectedCurrency === 'BRL' ? formatBRLExtended(val) : formatUSDExtended(val);
    };

    // Standardize all input data to USD for calculation
    let credLimitUSD, commBrutoUSD, freteKmUSD;
    if (selectedCurrency === 'BRL') {
        credLimitUSD = creditRaw / cambio;
        commBrutoUSD = commBrutoRaw / cambio;
        freteKmUSD = freteKmRaw / cambio;
    } else {
        credLimitUSD = creditRaw;
        commBrutoUSD = commBrutoRaw;
        freteKmUSD = freteKmRaw;
    }

    // Competitor campaign cashback rate is typically 3.0% (from spreadsheet E16)
    const valPctMarket = 3.00;
    
    // Competitor commodity price is typically lower by 1.0% in market (from spreadsheet E11 vs B11)
    const commBrutoUSDMarket = commBrutoUSD * 0.99;
    
    // Annual interest rate converted to period rate: Juros Período = (Prazo / 360) * Juros Anual
    const jurosPeriodo = (prazo / 360.0) * (jurosAnual / 100.0);
    
    // Preço Pedido TP (Valor Presente) in USD
    const precoTpUSDProposta = credLimitUSD / (1.0 + jurosPeriodo);
    const precoTpUSDMarket = precoTpUSDProposta;
    
    // Preço Pedido Vista (Desconto 4% over TP) in USD
    const precoVistaUSDProposta = precoTpUSDProposta * (1.0 - 0.04);
    const precoVistaUSDMarket = precoVistaUSDProposta;
    
    // Custo Financeiro da Operação ($) in USD = Credit Limit - Preço Pedido TP
    const custoFinUSDProposta = credLimitUSD - precoTpUSDProposta;
    const custoFinUSDMarket = custoFinUSDProposta;
    
    // Incentivo Barter % = (Prazo / 30) * 0.5%
    const incentivoBarterPct = (prazo / 30.0) * 0.005;
    
    // Incentivo Barter $ in USD = Preço TP * Incentivo Barter %
    const incentivoBarterUsd = precoTpUSDProposta * incentivoBarterPct;
    
    // Cashback $ in USD = Credit Limit * Cashback %
    const cashbackUsdProposta = credLimitUSD * (valPctProposta / 100.0);
    const cashbackUsdMarket = credLimitUSD * (valPctMarket / 100.0);
    
    // Total Retorno $ in USD = Cashback $ + Incentivo $
    const totalRetornoUSDProposta = cashbackUsdProposta + incentivoBarterUsd;
    const totalRetornoUSDMarket = cashbackUsdMarket + incentivoBarterUsd;
    
    // Preço Pedido Barter Cashback equivalente in USD = Credit Limit - Total Retorno
    const precoBarterEquivUSDProposta = credLimitUSD - totalRetornoUSDProposta;
    const precoBarterEquivUSDMarket = credLimitUSD - totalRetornoUSDMarket;
    
    // Preço Commodity Livre in USD = Bruto - Impostos
    // Note: getRegionalTaxRate uses raw values, since we convert inputs to USD, we do it in USD
    const taxDeductionUSDProposta = descontoAtivo ? getRegionalTaxRate(regiao, commBrutoUSD) : 0.0;
    const taxDeductionUSDMarket = descontoAtivo ? getRegionalTaxRate(regiao, commBrutoUSDMarket) : 0.0;
    
    const commLivreUSDProposta = commBrutoUSD - taxDeductionUSDProposta;
    const commLivreUSDMarket = commBrutoUSDMarket - taxDeductionUSDMarket;
    
    // Volume de Troca Físico Inicial = Credit Limit (USD) / Livre Price (USD)
    // Grãos volumes do not depend on selected display currency
    const volTrocaProposta = commLivreUSDProposta > 0 ? (credLimitUSD / commLivreUSDProposta) : 0;
    const volTrocaMarket = commLivreUSDMarket > 0 ? (credLimitUSD / commLivreUSDMarket) : 0;
    
    // Custo de Transporte (Frete) in USD
    const freteTotalUSDProposta = distNutrade * freteKmUSD;
    const freteTotalUSDMarket = distMarket * freteKmUSD;
    
    // Freight unit cost derived from swap volume in USD
    const freteUnitUSDProposta = volTrocaProposta > 0 ? (freteTotalUSDProposta / volTrocaProposta) : 0;
    const freteUnitUSDMarket = volTrocaMarket > 0 ? (freteTotalUSDMarket / volTrocaMarket) : 0;
    
    // Cashback equivalência em sacas/libras
    const cashbackScProposta = commLivreUSDProposta > 0 ? (cashbackUsdProposta / commLivreUSDProposta) : 0;
    const cashbackScMarket = commLivreUSDMarket > 0 ? (cashbackUsdMarket / commLivreUSDMarket) : 0;
    
    // Ganho de Valorização Unitária (Cashback) in USD
    const valUnitCashbackUSDProposta = volTrocaProposta > 0 ? (cashbackUsdProposta / volTrocaProposta) : 0;
    const valUnitCashbackUSDMarket = volTrocaMarket > 0 ? (cashbackUsdMarket / volTrocaMarket) : 0;
    
    // Cessão de Crédito Parcial = Volume Inicial - Cashback sc
    const cessaoProposta = volTrocaProposta - cashbackScProposta;
    const cessaoMarket = volTrocaMarket - cashbackScMarket;
    
    // Incentivo equivalência em sacas/libras
    const incentivoScProposta = commLivreUSDProposta > 0 ? (incentivoBarterUsd / commLivreUSDProposta) : 0;
    const incentivoScMarket = commLivreUSDMarket > 0 ? (incentivoBarterUsd / commLivreUSDMarket) : 0;
    
    // Ganho de Valorização Unitária (Incentivo) in USD
    const valUnitIncentivoUSDProposta = volTrocaProposta > 0 ? (incentivoBarterUsd / volTrocaProposta) : 0;
    const valUnitIncentivoUSDMarket = volTrocaMarket > 0 ? (incentivoBarterUsd / volTrocaMarket) : 0;
    
    // Preço Equivalente Final (Valorizado) in USD
    const precoFinalUSDProposta = commLivreUSDProposta + valUnitCashbackUSDProposta + valUnitIncentivoUSDProposta - freteUnitUSDProposta;
    const precoFinalUSDMarket = commLivreUSDMarket + valUnitCashbackUSDMarket + valUnitIncentivoUSDMarket - freteUnitUSDMarket;
    
    // Volume de Troca Equivalente Final (Sacas/Libras)
    const volFinalProposta = volTrocaProposta - (cashbackScProposta + incentivoScProposta);
    const volFinalMarket = volTrocaMarket - (cashbackScMarket + incentivoScMarket);
    
    // Valorização Real sobre Commodity Livre (%)
    const valRealProposta = commLivreUSDProposta > 0 ? (precoFinalUSDProposta / commLivreUSDProposta - 1.0) : 0;
    const valRealMarket = commLivreUSDMarket > 0 ? (precoFinalUSDMarket / commLivreUSDMarket - 1.0) : 0;
    
    // CONVERSIONS FOR DISPLAY based on BRL/USD selected currency
    const factor = selectedCurrency === 'BRL' ? cambio : 1.0;
    
    // Update labels inside the table according to selected currency
    document.getElementById('td-lbl-fob').textContent = `Valor do Crédito (FOB a Prazo) (${selectedCurrency})`;
    document.getElementById('td-lbl-bruto').textContent = `Preço Commodity Bruto (FOB) (${selectedCurrency}/${unitSymbol})`;
    document.getElementById('td-lbl-desc').textContent = `(-) Descontos Tributários Estaduais (${selectedCurrency}/${unitSymbol})`;
    document.getElementById('td-lbl-livre').textContent = `Preço Commodity Livre (Porteira) (${selectedCurrency}/${unitSymbol})`;
    document.getElementById('td-lbl-vp').textContent = `Preço Pedido TP (Valor Presente) (${selectedCurrency})`;
    document.getElementById('td-lbl-custofin').textContent = `Custo Financeiro da Operação (${selectedCurrency})`;
    document.getElementById('td-lbl-frete').textContent = `(-) Custo de Transporte (Frete) (${selectedCurrency}/${unitSymbol})`;
    document.getElementById('td-lbl-cashback-usd').textContent = `Cash Back (${selectedCurrency}) da Campanha`;
    document.getElementById('td-lbl-incbarter-usd').textContent = `Incentivo Barter (${selectedCurrency}) ganho`;
    document.getElementById('td-lbl-totalret').textContent = `Total de Retorno Recebido pelo Produtor (${selectedCurrency})`;
    document.getElementById('td-lbl-finalpreco').textContent = `Preço Equivalente Final (Valorizado com Frete) (${selectedCurrency}/${unitSymbol})`;

    // Render Table Values:
    document.getElementById('td-fob-nutrade').textContent = formatSelectedCurrency(credLimitUSD * factor);
    document.getElementById('td-fob-market').textContent = formatSelectedCurrency(credLimitUSD * factor);
    document.getElementById('td-fob-diff').textContent = '0,00%';
    
    document.getElementById('td-bruto-nutrade').textContent = formatSelectedCurrency(commBrutoUSD * factor);
    document.getElementById('td-bruto-market').textContent = formatSelectedCurrency(commBrutoUSDMarket * factor);
    const brutoDiff = ((commBrutoUSD / commBrutoUSDMarket - 1.0) * 100);
    document.getElementById('td-bruto-diff').textContent = `+${brutoDiff.toFixed(2)}%`;
    
    document.getElementById('td-desc-nutrade').textContent = `- ${formatSelectedCurrency(taxDeductionUSDProposta * factor)}`;
    document.getElementById('td-desc-market').textContent = `- ${formatSelectedCurrency(taxDeductionUSDMarket * factor)}`;
    document.getElementById('td-desc-diff').textContent = '-';
    
    document.getElementById('td-livre-nutrade').textContent = formatSelectedCurrency(commLivreUSDProposta * factor);
    document.getElementById('td-livre-market').textContent = formatSelectedCurrency(commLivreUSDMarket * factor);
    const commLivreDiff = commLivreUSDMarket > 0 ? ((commLivreUSDProposta / commLivreUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-livre-diff').textContent = `+${commLivreDiff.toFixed(2)}%`;
    
    document.getElementById('td-frete-nutrade').textContent = `- ${formatSelectedCurrencyExtended(freteUnitUSDProposta * factor)}`;
    document.getElementById('td-frete-market').textContent = `- ${formatSelectedCurrencyExtended(freteUnitUSDMarket * factor)}`;
    const freteDiff = freteUnitUSDMarket > 0 ? ((freteUnitUSDProposta / freteUnitUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-frete-diff').textContent = `${freteDiff.toFixed(2)}%`;
    document.getElementById('td-frete-diff').className = freteDiff < 0 ? 'text-green font-bold' : 'text-danger font-bold';
    
    document.getElementById('td-vol-troca-nutrade').textContent = `${formatNumber(volTrocaProposta)} ${unitSymbol}`;
    document.getElementById('td-vol-troca-market').textContent = `${formatNumber(volTrocaMarket)} ${unitSymbol}`;
    const volTrocaDiff = volTrocaMarket > 0 ? ((volTrocaProposta / volTrocaMarket - 1.0) * 100) : 0;
    document.getElementById('td-vol-troca-diff').textContent = `${volTrocaDiff.toFixed(2)}%`;
    document.getElementById('td-vol-troca-diff').className = volTrocaDiff < 0 ? 'text-green font-bold' : 'text-danger font-bold';
    
    document.getElementById('td-vp-nutrade').textContent = formatSelectedCurrency(precoTpUSDProposta * factor);
    document.getElementById('td-vp-market').textContent = formatSelectedCurrency(precoTpUSDMarket * factor);
    document.getElementById('td-vp-diff').textContent = '0,00%';
    
    document.getElementById('td-custofin-nutrade').textContent = formatSelectedCurrency(custoFinUSDProposta * factor);
    document.getElementById('td-custofin-market').textContent = formatSelectedCurrency(custoFinUSDMarket * factor);
    document.getElementById('td-custofin-diff').textContent = '0,00%';
    
    document.getElementById('td-valcamp-nutrade').textContent = `${valPctProposta.toFixed(2)}%`;
    document.getElementById('td-valcamp-market').textContent = `${valPctMarket.toFixed(2)}%`;
    const valPctDiff = ((valPctProposta / valPctMarket - 1.0) * 100);
    document.getElementById('td-valcamp-diff').textContent = `+${valPctDiff.toFixed(2)}%`;
    
    document.getElementById('td-cashback-usd-nutrade').textContent = formatSelectedCurrency(cashbackUsdProposta * factor);
    document.getElementById('td-cashback-usd-market').textContent = formatSelectedCurrency(cashbackUsdMarket * factor);
    const cbUsdDiff = cashbackUsdMarket > 0 ? ((cashbackUsdProposta / cashbackUsdMarket - 1.0) * 100) : 0;
    document.getElementById('td-cashback-usd-diff').textContent = `+${cbUsdDiff.toFixed(2)}%`;
    
    document.getElementById('td-incbarter-pct-nutrade').textContent = `${(incentivoBarterPct * 100).toFixed(2)}%`;
    document.getElementById('td-incbarter-pct-market').textContent = `${(incentivoBarterPct * 100).toFixed(2)}%`;
    document.getElementById('td-incbarter-pct-diff').textContent = '0,00%';
    
    document.getElementById('td-incbarter-usd-nutrade').textContent = formatSelectedCurrency(incentivoBarterUsd * factor);
    document.getElementById('td-incbarter-usd-market').textContent = formatSelectedCurrency(incentivoBarterUsd * factor);
    document.getElementById('td-incbarter-usd-diff').textContent = '0,00%';
    
    document.getElementById('td-totalret-nutrade').textContent = formatSelectedCurrency(totalRetornoUSDProposta * factor);
    document.getElementById('td-totalret-market').textContent = formatSelectedCurrency(totalRetornoUSDMarket * factor);
    const totRetDiff = totalRetornoUSDMarket > 0 ? ((totalRetornoUSDProposta / totalRetornoUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-totalret-diff').textContent = `+${totRetDiff.toFixed(2)}%`;
    
    document.getElementById('td-finalpreco-nutrade').textContent = formatSelectedCurrencyExtended(precoFinalUSDProposta * factor);
    document.getElementById('td-finalpreco-market').textContent = formatSelectedCurrencyExtended(precoFinalUSDMarket * factor);
    const pFinalDiff = precoFinalUSDMarket > 0 ? ((precoFinalUSDProposta / precoFinalUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-finalpreco-diff').textContent = `+${pFinalDiff.toFixed(2)}%`;
    
    document.getElementById('td-finalvol-nutrade').textContent = `${formatNumber(volFinalProposta)} ${unitSymbol}`;
    document.getElementById('td-finalvol-market').textContent = `${formatNumber(volFinalMarket)} ${unitSymbol}`;
    const volFinalDiff = volFinalMarket > 0 ? ((volFinalProposta / volFinalMarket - 1.0) * 100) : 0;
    document.getElementById('td-finalvol-diff').textContent = `${volFinalDiff.toFixed(2)}%`;
    document.getElementById('td-finalvol-diff').className = volFinalDiff < 0 ? 'text-green font-bold' : 'text-danger font-bold';
    
    document.getElementById('td-valreal-nutrade').textContent = `+${(valRealProposta * 100).toFixed(2)}%`;
    document.getElementById('td-valreal-market').textContent = `+${(valRealMarket * 100).toFixed(2)}%`;
    const valRealDiff = valRealMarket > 0 ? (((valRealProposta / valRealMarket) - 1.0) * 100) : 0;
    document.getElementById('td-valreal-diff').textContent = `+${valRealDiff.toFixed(2)}%`;
    
    // Update summary Cards:
    // Card 1: Incentivo Barter
    document.getElementById('card-incentivo').textContent = formatSelectedCurrency(incentivoBarterUsd * factor);
    
    // Card 2: Valorização da Campanha (Cashback)
    document.getElementById('card-valorizacao').textContent = formatSelectedCurrency(cashbackUsdProposta * factor);
    
    // Card 3: Benefício Total da Estrutura (Volume saved)
    const economiaSacas = volFinalMarket - volFinalProposta;
    document.getElementById('card-total').textContent = `${formatNumber(economiaSacas)} ${unitSymbol}`;
    document.getElementById('card-total-sub').textContent = `${isSoy ? 'Sacas' : 'Libras'} economizadas vs. mercado`;
}

// Initialize and redraw TradingView chart widget (CFDs for free widgets)
function initTradingViewWidget(commodity) {
    // Soybeans CFD: OANDA:SOYBNUSD
    // Cotton CFD: PEPPERSTONE:COTTON
    const symbol = commodity === 'Soja' ? 'OANDA:SOYBNUSD' : 'PEPPERSTONE:COTTON';
    const containerId = 'tradingview_widget';
    
    document.getElementById('chart-subtitle').textContent = `Gráfico CFD em tempo real de Chicago para ${commodity === 'Soja' ? 'Soja (OANDA:SOYBNUSD)' : 'Algodão (PEPPERSTONE:COTTON)'}`;
    
    // Clear container
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
    
    // Construct widget
    if (typeof TradingView !== 'undefined') {
        tvWidget = new TradingView.widget({
            "width": "100%",
            "height": 350,
            "symbol": symbol,
            "interval": "D",
            "timezone": "America/Sao_Paulo",
            "theme": "light", // Matches the light theme!
            "style": "1",
            "locale": "br",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_sideimpl": true,
            "container_id": containerId
        });
    }
}
