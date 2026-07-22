// app.js - Barter Fees Simulator Logic & Interactions (Generic version with Button Activation and Live Currency Feed)

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
    showPage('assistente'); // Active by default matching the screenshot
    startNewChat(); // Initialize default chat welcome state
    updateCampaignSelectOptions(); // Populate campaigns select in simulator form
});

// Configure mask events
function setupMasks() {
    const creditInput = document.getElementById('sim-credito');
    if (creditInput) {
        creditInput.addEventListener('input', (e) => {
            let digits = e.target.value.replace(/[^0-9]/g, '');
            if (digits === '') {
                e.target.value = '';
                return;
            }
            let rawNum = parseFloat(digits) / 100;
            e.target.value = formatCurrencyValue(rawNum, selectedCurrency);
        });
    }
}

// Single-page navigation controller
function showPage(pageId) {
    const assistPage = document.getElementById('page-assistente');
    const simPage = document.getElementById('page-simulador');
    const rulesPage = document.getElementById('page-regras');
    const campaignsPage = document.getElementById('page-campanhas');
    
    const assistLink = document.getElementById('nav-link-assistente');
    const simLink = document.getElementById('nav-link-simulador');
    const rulesLink = document.getElementById('nav-link-regras');
    const campaignsLink = document.getElementById('nav-link-campanhas');
    
    // Hide all pages
    if (assistPage) assistPage.style.display = 'none';
    if (simPage) simPage.style.display = 'none';
    if (rulesPage) rulesPage.style.display = 'none';
    if (campaignsPage) campaignsPage.style.display = 'none';
    
    // Remove active class from links
    if (assistLink) assistLink.classList.remove('active');
    if (simLink) simLink.classList.remove('active');
    if (rulesLink) rulesLink.classList.remove('active');
    if (campaignsLink) campaignsLink.classList.remove('active');
    
    if (pageId === 'assistente') {
        if (assistPage) assistPage.style.display = 'grid';
        if (assistLink) assistLink.classList.add('active');
    } else if (pageId === 'simulador') {
        if (simPage) simPage.style.display = 'grid';
        if (simLink) simLink.classList.add('active');
        
        // Redraw TradingView widget when returning to simulation page
        const commodity = document.getElementById('sim-commodity').value;
        initTradingViewWidget(commodity);
    } else if (pageId === 'regras') {
        if (rulesPage) rulesPage.style.display = 'block';
        if (rulesLink) rulesLink.classList.add('active');
    } else if (pageId === 'campanhas') {
        if (campaignsPage) campaignsPage.style.display = 'block';
        if (campaignsLink) campaignsLink.classList.add('active');
        renderCampaignsTable();
    }
}

// Set Active Currency Toggle (recalculates immediately for ease of conversion viewing)
function setCurrency(currency) {
    if (selectedCurrency === currency) return;
    
    const btnBrl = document.getElementById('btn-currency-brl');
    const btnUsd = document.getElementById('btn-currency-usd');
    const creditInput = document.getElementById('sim-credito');
    const priceInput = document.getElementById('sim-preco-bruto');
    const freteChaoInput = document.getElementById('sim-frete-chao');
    const freteAsfaltoInput = document.getElementById('sim-frete-asfalto');
    
    const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
    
    // Save current raw values
    const currentCreditRaw = getRawCurrencyValue(creditInput.value);
    const currentPriceRaw = parseFloat(priceInput.value) || 0;
    const currentFreteChaoRaw = parseFloat(freteChaoInput.value) || 0;
    const currentFreteAsfaltoRaw = parseFloat(freteAsfaltoInput.value) || 0;
    
    let newCredit, newPrice, newFreteChao, newFreteAsfalto;
    
    if (currency === 'BRL') {
        // Converting from USD to BRL
        newCredit = currentCreditRaw * cambio;
        newPrice = currentPriceRaw * cambio;
        newFreteChao = currentFreteChaoRaw * cambio;
        newFreteAsfalto = currentFreteAsfaltoRaw * cambio;
        
        btnBrl.classList.add('active');
        btnUsd.classList.remove('active');
    } else {
        // Converting from BRL to USD
        newCredit = currentCreditRaw / cambio;
        newPrice = currentPriceRaw / cambio;
        newFreteChao = currentFreteChaoRaw / cambio;
        newFreteAsfalto = currentFreteAsfaltoRaw / cambio;
        
        btnUsd.classList.add('active');
        btnBrl.classList.remove('active');
    }
    
    // Update global selection
    selectedCurrency = currency;
    
    // Update labels and suffixes
    const isSoy = document.getElementById('sim-commodity').value === 'Soja';
    document.getElementById('sim-preco-bruto-suffix').textContent = currency === 'BRL' ? 'R$/' + (isSoy ? 'sc' : 'lp') : 'USD/' + (isSoy ? 'sc' : 'lp');
    document.getElementById('sim-frete-chao-suffix').textContent = currency === 'BRL' ? 'R$/KM' : 'USD/KM';
    document.getElementById('sim-frete-asfalto-suffix').textContent = currency === 'BRL' ? 'R$/KM' : 'USD/KM';
    
    // Write back converted values formatted correctly
    creditInput.value = formatCurrencyValue(newCredit, currency);
    priceInput.value = newPrice.toFixed(2);
    freteChaoInput.value = newFreteChao.toFixed(2);
    freteAsfaltoInput.value = newFreteAsfalto.toFixed(2);
    
    // Recalculate immediately when converting currencies
    calculateSimulation();
}

// Fetch Quotes from APIs (Commodity via proxy, currency exchange rate directly from AwesomeAPI)
async function fetchLiveQuotes() {
    const statusEl = document.getElementById('sim-quote-status');
    const cambioEl = document.getElementById('sim-cambio');
    const cambioStatusEl = document.getElementById('sim-cambio-status');
    
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando cotações...';
    
    // 1. Fetch live currency exchange rate from public AwesomeAPI (CORS-friendly, client-side safe)
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        const data = await response.json();
        if (data && data.USDBRL) {
            const usdBrlBid = parseFloat(data.USDBRL.bid);
            if (cambioEl) {
                cambioEl.value = usdBrlBid.toFixed(4);
            }
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            if (cambioStatusEl) {
                cambioStatusEl.innerHTML = `<span class="text-green"><i class="fa-solid fa-circle-check"></i> Câmbio obtido: R$ ${formatNumber(usdBrlBid, 4)} às ${timeStr} (AwesomeAPI)</span>`;
            }
        }
    } catch (e) {
        console.error("Failed to fetch exchange rate:", e);
        if (cambioStatusEl) {
            cambioStatusEl.innerHTML = `<span class="text-secondary"><i class="fa-solid fa-triangle-exclamation"></i> Usando câmbio padrão (R$ 5,1500)</span>`;
        }
    }
    
    // 2. Fetch commodity prices via local proxy (fails gracefully on GitHub Pages static mode)
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
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
    } catch (e) {
        console.error("Failed to fetch live quotes:", e);
        if (statusEl) statusEl.innerHTML = `<span class="text-secondary"><i class="fa-solid fa-triangle-exclamation"></i> Usando valores de referência padrão para simulação offline</span>`;
    }
    
    // Perform initial calculation on load
    calculateSimulation();
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
    
    // Recalculate commodity price and reset values
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
// Standalone pure math calculator for barter simulation
function runSimulationMath(inputs) {
    const commodity = inputs.commodity;
    const regiao = inputs.regiao;
    const creditRaw = inputs.creditRaw;
    const commBrutoRaw = inputs.commBrutoRaw;
    const descontoAtivo = inputs.descontoAtivo;
    const prazo = inputs.prazo;
    const jurosAnual = inputs.jurosAnual;
    const valPctProposta = inputs.valPctProposta;
    const distChao = inputs.distChao;
    const distAsfalto = inputs.distAsfalto;
    const freteChaoRaw = inputs.freteChaoRaw;
    const freteAsfaltoRaw = inputs.freteAsfaltoRaw;
    const cambio = inputs.cambio;
    const currency = inputs.currency;
    const isSoy = commodity === 'Soja';
    const unitSymbol = isSoy ? 'sc' : 'lp';

    // Standardize all input data to USD for calculation
    let credLimitUSD, commBrutoUSD, freteChaoUSD, freteAsfaltoUSD;
    if (currency === 'BRL') {
        credLimitUSD = creditRaw / cambio;
        commBrutoUSD = commBrutoRaw / cambio;
        freteChaoUSD = freteChaoRaw / cambio;
        freteAsfaltoUSD = freteAsfaltoRaw / cambio;
    } else {
        credLimitUSD = creditRaw;
        commBrutoUSD = commBrutoRaw;
        freteChaoUSD = freteChaoRaw;
        freteAsfaltoUSD = freteAsfaltoRaw;
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
    const taxDeductionUSDProposta = descontoAtivo ? getRegionalTaxRate(regiao, commBrutoUSD) : 0.0;
    const taxDeductionUSDMarket = descontoAtivo ? getRegionalTaxRate(regiao, commBrutoUSDMarket) : 0.0;
    
    const commLivreUSDProposta = commBrutoUSD - taxDeductionUSDProposta;
    const commLivreUSDMarket = commBrutoUSDMarket - taxDeductionUSDMarket;
    
    // Volume de Troca Físico Inicial = Credit Limit (USD) / Livre Price (USD)
    const volTrocaProposta = commLivreUSDProposta > 0 ? (credLimitUSD / commLivreUSDProposta) : 0;
    const volTrocaMarket = commLivreUSDMarket > 0 ? (credLimitUSD / commLivreUSDMarket) : 0;
    
    // Custo de Transporte (Frete) in USD
    // Nossa Estrutura: Estrada de Chão + Estrada de Asfalto
    // Outras Tradings (Competidor): Estrada de Chão + Estrada de Asfalto (+30km adicionais de asfalto)
    const freteTotalUSDProposta = (distChao * freteChaoUSD) + (distAsfalto * freteAsfaltoUSD);
    const freteTotalUSDMarket = (distChao * freteChaoUSD) + ((distAsfalto + 30) * freteAsfaltoUSD);
    
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

    return {
        credLimitUSD, commBrutoUSD, freteChaoUSD, freteAsfaltoUSD,
        valPctMarket, commBrutoUSDMarket, jurosPeriodo,
        precoTpUSDProposta, precoTpUSDMarket, precoVistaUSDProposta, precoVistaUSDMarket,
        custoFinUSDProposta, custoFinUSDMarket, incentivoBarterPct, incentivoBarterUsd,
        cashbackUsdProposta, cashbackUsdMarket, totalRetornoUSDProposta, totalRetornoUSDMarket,
        precoBarterEquivUSDProposta, precoBarterEquivUSDMarket,
        taxDeductionUSDProposta, taxDeductionUSDMarket,
        commLivreUSDProposta, commLivreUSDMarket,
        volTrocaProposta, volTrocaMarket,
        freteTotalUSDProposta, freteTotalUSDMarket,
        freteUnitUSDProposta, freteUnitUSDMarket,
        cashbackScProposta, cashbackScMarket,
        valUnitCashbackUSDProposta, valUnitCashbackUSDMarket,
        cessaoProposta, cessaoMarket,
        incentivoScProposta, incentivoScMarket,
        valUnitIncentivoUSDProposta, valUnitIncentivoUSDMarket,
        precoFinalUSDProposta, precoFinalUSDMarket,
        volFinalProposta, volFinalMarket,
        valRealProposta, valRealMarket,
        unitSymbol
    };
}

// Core Barter Calculations (reads inputs, runs math, updates page layout table)
function calculateSimulation() {
    const commodity = document.getElementById('sim-commodity').value;
    const regiao = document.getElementById('sim-regiao').value;
    const creditRaw = getRawCurrencyValue(document.getElementById('sim-credito').value);
    const commBrutoRaw = parseFloat(document.getElementById('sim-preco-bruto').value) || 0;
    const descontoAtivo = document.getElementById('sim-descontos').checked;
    const prazo = parseFloat(document.getElementById('sim-prazo').value) || 0;
    const jurosAnual = parseFloat(document.getElementById('sim-juros-anual').value) || 0;
    const valPctProposta = parseFloat(document.getElementById('sim-campanha-val').value) || 0;
    
    const distChao = parseFloat(document.getElementById('sim-dist-chao').value) || 0;
    const distAsfalto = parseFloat(document.getElementById('sim-dist-asfalto').value) || 0;
    const freteChaoRaw = parseFloat(document.getElementById('sim-frete-chao').value) || 0;
    const freteAsfaltoRaw = parseFloat(document.getElementById('sim-frete-asfalto').value) || 0;
    const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
    
    const isSoy = commodity === 'Soja';
    const unitSymbol = isSoy ? 'sc' : 'lp';
    
    // Call standalone math calculator
    const res = runSimulationMath({
        commodity, regiao, creditRaw, commBrutoRaw, descontoAtivo,
        prazo, jurosAnual, valPctProposta, distChao, distAsfalto,
        freteChaoRaw, freteAsfaltoRaw, cambio, currency: selectedCurrency
    });

    // Format helper based on currency selection
    const formatSelectedCurrency = (val) => {
        return selectedCurrency === 'BRL' ? formatBRL(val) : formatUSD(val);
    };
    
    const formatSelectedCurrencyExtended = (val) => {
        return selectedCurrency === 'BRL' ? formatBRLExtended(val) : formatUSDExtended(val);
    };

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
    document.getElementById('td-fob-nutrade').textContent = formatSelectedCurrency(res.credLimitUSD * factor);
    document.getElementById('td-fob-market').textContent = formatSelectedCurrency(res.credLimitUSD * factor);
    document.getElementById('td-fob-diff').textContent = '0,00%';
    
    document.getElementById('td-bruto-nutrade').textContent = formatSelectedCurrency(res.commBrutoUSD * factor);
    document.getElementById('td-bruto-market').textContent = formatSelectedCurrency(res.commBrutoUSDMarket * factor);
    const brutoDiff = ((res.commBrutoUSD / res.commBrutoUSDMarket - 1.0) * 100);
    document.getElementById('td-bruto-diff').textContent = `+${brutoDiff.toFixed(2)}%`;
    
    document.getElementById('td-desc-nutrade').textContent = `- ${formatSelectedCurrency(res.taxDeductionUSDProposta * factor)}`;
    document.getElementById('td-desc-market').textContent = `- ${formatSelectedCurrency(res.taxDeductionUSDMarket * factor)}`;
    document.getElementById('td-desc-diff').textContent = '-';
    
    document.getElementById('td-livre-nutrade').textContent = formatSelectedCurrency(res.commLivreUSDProposta * factor);
    document.getElementById('td-livre-market').textContent = formatSelectedCurrency(res.commLivreUSDMarket * factor);
    const commLivreDiff = res.commLivreUSDMarket > 0 ? ((res.commLivreUSDProposta / res.commLivreUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-livre-diff').textContent = `+${commLivreDiff.toFixed(2)}%`;
    
    document.getElementById('td-frete-nutrade').textContent = `- ${formatSelectedCurrencyExtended(res.freteUnitUSDProposta * factor)}`;
    document.getElementById('td-frete-market').textContent = `- ${formatSelectedCurrencyExtended(res.freteUnitUSDMarket * factor)}`;
    const freteDiff = res.freteUnitUSDMarket > 0 ? ((res.freteUnitUSDProposta / res.freteUnitUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-frete-diff').textContent = `${freteDiff.toFixed(2)}%`;
    document.getElementById('td-frete-diff').className = freteDiff < 0 ? 'text-green font-bold' : 'text-danger font-bold';
    
    document.getElementById('td-vol-troca-nutrade').textContent = `${formatNumber(res.volTrocaProposta)} ${unitSymbol}`;
    document.getElementById('td-vol-troca-market').textContent = `${formatNumber(res.volTrocaMarket)} ${unitSymbol}`;
    const volTrocaDiff = res.volTrocaMarket > 0 ? ((res.volTrocaProposta / res.volTrocaMarket - 1.0) * 100) : 0;
    document.getElementById('td-vol-troca-diff').textContent = `${volTrocaDiff.toFixed(2)}%`;
    document.getElementById('td-vol-troca-diff').className = volTrocaDiff < 0 ? 'text-green font-bold' : 'text-danger font-bold';
    
    document.getElementById('td-vp-nutrade').textContent = formatSelectedCurrency(res.precoTpUSDProposta * factor);
    document.getElementById('td-vp-market').textContent = formatSelectedCurrency(res.precoTpUSDMarket * factor);
    document.getElementById('td-vp-diff').textContent = '0,00%';
    
    document.getElementById('td-custofin-nutrade').textContent = formatSelectedCurrency(res.custoFinUSDProposta * factor);
    document.getElementById('td-custofin-market').textContent = formatSelectedCurrency(res.custoFinUSDMarket * factor);
    document.getElementById('td-custofin-diff').textContent = '0,00%';
    
    document.getElementById('td-valcamp-nutrade').textContent = `${valPctProposta.toFixed(2)}%`;
    document.getElementById('td-valcamp-market').textContent = `${res.valPctMarket.toFixed(2)}%`;
    const valPctDiff = ((valPctProposta / res.valPctMarket - 1.0) * 100);
    document.getElementById('td-valcamp-diff').textContent = `+${valPctDiff.toFixed(2)}%`;
    
    document.getElementById('td-cashback-usd-nutrade').textContent = formatSelectedCurrency(res.cashbackUsdProposta * factor);
    document.getElementById('td-cashback-usd-market').textContent = formatSelectedCurrency(res.cashbackUsdMarket * factor);
    const cbUsdDiff = res.cashbackUsdMarket > 0 ? ((res.cashbackUsdProposta / res.cashbackUsdMarket - 1.0) * 100) : 0;
    document.getElementById('td-cashback-usd-diff').textContent = `+${cbUsdDiff.toFixed(2)}%`;
    
    document.getElementById('td-incbarter-pct-nutrade').textContent = `${(res.incentivoBarterPct * 100).toFixed(2)}%`;
    document.getElementById('td-incbarter-pct-market').textContent = `${(res.incentivoBarterPct * 100).toFixed(2)}%`;
    document.getElementById('td-incbarter-pct-diff').textContent = '0,00%';
    
    document.getElementById('td-incbarter-usd-nutrade').textContent = formatSelectedCurrency(res.incentivoBarterUsd * factor);
    document.getElementById('td-incbarter-usd-market').textContent = formatSelectedCurrency(res.incentivoBarterUsd * factor);
    document.getElementById('td-incbarter-usd-diff').textContent = '0,00%';
    
    document.getElementById('td-totalret-nutrade').textContent = formatSelectedCurrency(res.totalRetornoUSDProposta * factor);
    document.getElementById('td-totalret-market').textContent = formatSelectedCurrency(res.totalRetornoUSDMarket * factor);
    const totRetDiff = res.totalRetornoUSDMarket > 0 ? ((res.totalRetornoUSDProposta / res.totalRetornoUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-totalret-diff').textContent = `+${totRetDiff.toFixed(2)}%`;
    
    document.getElementById('td-finalpreco-nutrade').textContent = formatSelectedCurrencyExtended(res.precoFinalUSDProposta * factor);
    document.getElementById('td-finalpreco-market').textContent = formatSelectedCurrencyExtended(res.precoFinalUSDMarket * factor);
    const pFinalDiff = res.precoFinalUSDMarket > 0 ? ((res.precoFinalUSDProposta / res.precoFinalUSDMarket - 1.0) * 100) : 0;
    document.getElementById('td-finalpreco-diff').textContent = `+${pFinalDiff.toFixed(2)}%`;
    
    document.getElementById('td-finalvol-nutrade').textContent = `${formatNumber(res.volFinalProposta)} ${unitSymbol}`;
    document.getElementById('td-finalvol-market').textContent = `${formatNumber(res.volFinalMarket)} ${unitSymbol}`;
    const volFinalDiff = res.volFinalMarket > 0 ? ((res.volFinalProposta / res.volFinalMarket - 1.0) * 100) : 0;
    document.getElementById('td-finalvol-diff').textContent = `${volFinalDiff.toFixed(2)}%`;
    document.getElementById('td-finalvol-diff').className = volFinalDiff < 0 ? 'text-green font-bold' : 'text-danger font-bold';
    
    document.getElementById('td-valreal-nutrade').textContent = `+${(res.valRealProposta * 100).toFixed(2)}%`;
    document.getElementById('td-valreal-market').textContent = `+${(res.valRealMarket * 100).toFixed(2)}%`;
    const valRealDiff = res.valRealMarket > 0 ? (((res.valRealProposta / res.valRealMarket) - 1.0) * 100) : 0;
    document.getElementById('td-valreal-diff').textContent = `+${valRealDiff.toFixed(2)}%`;
    
    // Update summary Cards:
    document.getElementById('card-incentivo').textContent = formatSelectedCurrency(res.incentivoBarterUsd * factor);
    document.getElementById('card-valorizacao').textContent = formatSelectedCurrency(res.cashbackUsdProposta * factor);
    const economiaSacas = res.volFinalMarket - res.volFinalProposta;
    const valorEconomia = economiaSacas * commBrutoRaw;
    document.getElementById('card-total').textContent = `${formatNumber(economiaSacas)} ${unitSymbol} (${formatSelectedCurrency(valorEconomia)})`;
    document.getElementById('card-total-sub').textContent = `${isSoy ? 'Sacas' : 'Libras'} economizadas vs. mercado`;
    
    // Update disclaimer timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    const disclaimerEl = document.getElementById('sim-disclaimer');
    if (disclaimerEl) {
        disclaimerEl.textContent = `Simulação gerada em ${dateStr} às ${timeStr}`;
    }
    
    // Modalidades Tab calculations and DOM updates
    const campSelect = document.getElementById('sim-campanha-select');
    const campId = campSelect ? campSelect.value : 'custom';
    
    let jurosAnualFidc, jurosAnualFiso, jurosAnualPrazo;
    
    if (campId !== 'custom') {
        const camp = campaigns.find(c => c.id == campId);
        if (camp) {
            const fidcTax = camp.taxas.find(t => t.produtoFinanceiro === 'FIDC');
            const fisoTax = camp.taxas.find(t => t.produtoFinanceiro === 'FISO');
            const prazoTax = camp.taxas.find(t => t.produtoFinanceiro === 'Prazo');
            
            jurosAnualFidc = fidcTax ? (fidcTax.jurosMensais * 12) : Math.max(0, jurosAnual - 4.0);
            jurosAnualFiso = fisoTax ? (fisoTax.jurosMensais * 12) : Math.max(0, jurosAnual - 3.0);
            jurosAnualPrazo = prazoTax ? (prazoTax.jurosMensais * 12) : jurosAnual;
        } else {
            jurosAnualFidc = Math.max(0, jurosAnual - 4.0);
            jurosAnualFiso = Math.max(0, jurosAnual - 3.0);
            jurosAnualPrazo = jurosAnual;
        }
    } else {
        jurosAnualFidc = Math.max(0, jurosAnual - 4.0);
        jurosAnualFiso = Math.max(0, jurosAnual - 3.0);
        jurosAnualPrazo = jurosAnual;
    }
    
    const jurosPeriodoBarter = (prazo / 360) * (jurosAnual / 100);
    const jurosPeriodoFidc = (prazo / 360) * (jurosAnualFidc / 100);
    const jurosPeriodoFiso = (prazo / 360) * (jurosAnualFiso / 100);
    const jurosPeriodoPrazo = (prazo / 360) * (jurosAnualPrazo / 100);
    
    const custoFidc = creditRaw * jurosPeriodoFidc;
    const custoFiso = creditRaw * jurosPeriodoFiso;
    const custoPrazo = creditRaw * jurosPeriodoPrazo;
    
    // Barter net financial cost = Gross interest cost - Total returns + Freight cost
    const custoBrutoBarter = creditRaw * jurosPeriodoBarter;
    const totalRetornosBarter = res.totalRetornoUSDProposta * factor;
    const freteTotalBarter = res.freteTotalUSDProposta * factor;
    const netCustoBarter = custoBrutoBarter - totalRetornosBarter + freteTotalBarter;
    
    // Update DOM fields for other modalities comparison
    const modJurosBarter = document.getElementById('mod-juros-barter');
    const modJurosFidc = document.getElementById('mod-juros-fidc');
    const modJurosFiso = document.getElementById('mod-juros-fiso');
    const modJurosPrazo = document.getElementById('mod-juros-prazo');
    
    if (modJurosBarter) modJurosBarter.textContent = `${jurosAnual.toFixed(2)}% a.a. (c/ Retorno)`;
    if (modJurosFidc) modJurosFidc.textContent = `${jurosAnualFidc.toFixed(2)}% a.a. ${campId !== 'custom' ? '(FIDC)' : '(-4% inc.)'}`;
    if (modJurosFiso) modJurosFiso.textContent = `${jurosAnualFiso.toFixed(2)}% a.a. ${campId !== 'custom' ? '(FISO)' : '(-3% inc.)'}`;
    if (modJurosPrazo) modJurosPrazo.textContent = `${jurosAnualPrazo.toFixed(2)}% a.a. ${campId !== 'custom' ? '(Prazo)' : '(tabela)'}`;
    
    const modCustoBarter = document.getElementById('mod-custo-barter');
    const modCustoFidc = document.getElementById('mod-custo-fidc');
    const modCustoFiso = document.getElementById('mod-custo-fiso');
    const modCustoPrazo = document.getElementById('mod-custo-prazo');
    
    if (modCustoBarter) modCustoBarter.textContent = formatSelectedCurrency(netCustoBarter);
    if (modCustoFidc) modCustoFidc.textContent = formatSelectedCurrency(custoFidc);
    if (modCustoFiso) modCustoFiso.textContent = formatSelectedCurrency(custoFiso);
    if (modCustoPrazo) modCustoPrazo.textContent = formatSelectedCurrency(custoPrazo);

    const totalBarter = (res.volFinalProposta * commBrutoRaw) + freteTotalBarter;
    const totalFidc = creditRaw + custoFidc;
    const totalFiso = creditRaw + custoFiso;
    const totalPrazo = creditRaw + custoPrazo;

    const modTotalBarter = document.getElementById('mod-total-barter');
    const modTotalFidc = document.getElementById('mod-total-fidc');
    const modTotalFiso = document.getElementById('mod-total-fiso');
    const modTotalPrazo = document.getElementById('mod-total-prazo');

    if (modTotalBarter) modTotalBarter.textContent = formatSelectedCurrency(totalBarter);
    if (modTotalFidc) modTotalFidc.textContent = formatSelectedCurrency(totalFidc);
    if (modTotalFiso) modTotalFiso.textContent = formatSelectedCurrency(totalFiso);
    if (modTotalPrazo) modTotalPrazo.textContent = formatSelectedCurrency(totalPrazo);
    
    const modIncBarter = document.getElementById('mod-inc-barter');
    if (modIncBarter) {
        const totalIncPct = valPctProposta + (res.incentivoBarterPct * 100);
        modIncBarter.textContent = `+${totalIncPct.toFixed(2)}% (Cashback + Inc.)`;
    }
    
    const modDisclaimer = document.getElementById('mod-disclaimer');
    if (modDisclaimer) {
        modDisclaimer.textContent = `Simulação gerada em ${dateStr} às ${timeStr}`;
    }
}

// Tab switcher for comparison dashboard
function switchResultsTab(tabName) {
    const btnBarter = document.getElementById('tab-btn-barter');
    const btnModalidades = document.getElementById('tab-btn-modalidades');
    const contentBarter = document.getElementById('tab-content-barter');
    const contentModalidades = document.getElementById('tab-content-modalidades');
    
    if (tabName === 'barter') {
        if (btnBarter) btnBarter.classList.add('active');
        if (btnModalidades) btnModalidades.classList.remove('active');
        if (contentBarter) contentBarter.style.display = 'block';
        if (contentModalidades) contentModalidades.style.display = 'none';
    } else {
        if (btnModalidades) btnModalidades.classList.add('active');
        if (btnBarter) btnBarter.classList.remove('active');
        if (contentBarter) contentBarter.style.display = 'none';
        if (contentModalidades) contentModalidades.style.display = 'block';
    }
}

// ==================== ASSISTENTE VIRTUAL (CHAT BOT) LOGIC ====================

// Global chat state
let chatState = {
    step: null, // null, waiting_currency, waiting_commodity, waiting_region, waiting_credit, waiting_confirmation, waiting_custom_prazo, waiting_custom_juros
    data: {
        currency: 'BRL',
        commodity: 'Soja',
        region: 'Sorriso (MT)',
        credit: 1000000,
        prazo: 216,
        jurosAnual: 14.40,
        precoCommodity: 103.00,
        cashback: 4.50,
        freteKm: 10.30
    }
};

let chatHistorySessions = []; // Stores completed simulation data objects

// Add a text or HTML bubble to the chat message container
function addMessageToChat(text, sender, type = 'text', payload = null) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    // Hide the welcome box if there are active messages
    const welcomeBox = document.getElementById('chat-welcome-box');
    if (welcomeBox && welcomeBox.style.display !== 'none') {
        welcomeBox.style.display = 'none';
    }
    
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${sender}-row`;
    
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = sender === 'bot' ? 'bubble-wrapper' : '';
    
    if (sender === 'bot') {
        const botAvatar = document.createElement('div');
        botAvatar.className = 'bot-avatar-bubble';
        botAvatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
        bubbleWrapper.appendChild(botAvatar);
    }
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}-bubble`;
    
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    if (type === 'text') {
        const messageText = document.createElement('span');
        messageText.innerHTML = text.replace(/\n/g, '<br>');
        bubble.appendChild(messageText);
    } else if (type === 'choices') {
        const messageText = document.createElement('span');
        messageText.innerHTML = text.replace(/\n/g, '<br>');
        bubble.appendChild(messageText);
        
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'chat-choices';
        
        payload.forEach(choice => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chat-choice-btn';
            btn.textContent = choice.text;
            btn.onclick = () => handleChoiceClick(choice.value, choice.text);
            choicesDiv.appendChild(btn);
        });
        
        bubble.appendChild(choicesDiv);
    } else if (type === 'result') {
        const messageText = document.createElement('span');
        messageText.innerHTML = text.replace(/\n/g, '<br>');
        bubble.appendChild(messageText);
        
        const card = document.createElement('div');
        card.className = 'chat-result-card';
        
        const isBRL = payload.inputs.currency === 'BRL';
        const formattedCredit = isBRL ? formatBRL(payload.inputs.creditRaw) : formatUSD(payload.inputs.creditRaw);
        const formattedTotalReturn = isBRL ? formatBRL(payload.totalRetorno) : formatUSD(payload.totalRetorno);
        const formattedFinalPrice = isBRL ? formatBRLExtended(payload.precoFinal) : formatUSDExtended(payload.precoFinal);
        const formattedMarketPrice = isBRL ? formatBRLExtended(payload.precoMarket) : formatUSDExtended(payload.precoMarket);
        const formattedEconomia = formatNumber(payload.economia) + ' ' + payload.unitSymbol;
        
        card.innerHTML = `
            <div class="result-card-header">
                <h4>Simulação Concluída</h4>
                <span class="result-badge">Campanha 2026</span>
            </div>
            <div class="result-card-body">
                <div class="result-item">
                    <span class="result-label">Crédito Amortizado</span>
                    <span class="result-val">${formattedCredit}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Commodity</span>
                    <span class="result-val">${payload.inputs.commodity} (${payload.inputs.region})</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Total de Retorno (Produtor)</span>
                    <span class="result-val highlight-val">${formattedTotalReturn}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Preço Equiv. Final</span>
                    <span class="result-val highlight-val">${formattedFinalPrice}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Preço Equiv. Outras Tradings</span>
                    <span class="result-val">${formattedMarketPrice}</span>
                </div>
                <div class="result-item" style="border-bottom:none; padding-bottom:0;">
                    <span class="result-label">Vantagem Física (Volume Salvo)</span>
                    <span class="result-val highlight-val">+${formattedEconomia}</span>
                </div>
                <div class="result-disclaimer" style="font-size: 11px; color: var(--text-secondary); margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px; text-align: center; font-style: italic; width: 100%;">
                    Simulação gerada em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                </div>
            </div>
            <div class="result-card-actions">
                <button type="button" class="result-action-btn primary-action" onclick="openSimulationInForm(${chatHistorySessions.length - 1})">
                    Ver no Simulador
                </button>
                <button type="button" class="result-action-btn" onclick="downloadSimulationPDFFromIndex(${chatHistorySessions.length - 1})">
                    <i class="fa-solid fa-file-pdf"></i> PDF
                </button>
                <button type="button" class="result-action-btn" onclick="startBarterSimulationFlow()">
                    Nova
                </button>
            </div>
        `;
        bubble.appendChild(card);
    }
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = timeStr;
    bubble.appendChild(timeSpan);
    
    if (sender === 'bot') {
        bubbleWrapper.appendChild(bubble);
        messageRow.appendChild(bubbleWrapper);
    } else {
        messageRow.appendChild(bubble);
    }
    
    messagesContainer.appendChild(messageRow);
    
    // Auto-scroll chat body
    const chatBody = document.getElementById('chat-window-body');
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Reset chat window and return to welcome options
function startNewChat() {
    chatState.step = null;
    chatState.data = {};
    
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <!-- Welcome screen centered -->
            <div class="chat-welcome-box" id="chat-welcome-box" style="display: flex;">
                <div class="welcome-robot-icon">
                    <i class="fa-solid fa-robot text-teal"></i>
                </div>
                <h2>Olá! Sou seu assistente de IA.</h2>
                <p>Posso ajudar você a consultar informações sobre solicitações de crédito, contas, usuários e muito mais. Escolha uma sugestão abaixo ou digite sua pergunta.</p>
                
                <div class="suggestion-chips-grid">
                    <button type="button" class="chip-btn highlight-chip" onclick="startBarterSimulationFlow()">Quero simular uma oferta de barter</button>
                    <button type="button" class="chip-btn" onclick="handleSuggestion('Comparar Barter com FIDC e FISO')">Comparar modalidades de crédito</button>
                    <button type="button" class="chip-btn" onclick="handleSuggestion('Quais são as garantias do FIDC e FISO?')">Garantias exigidas</button>
                    <button type="button" class="chip-btn" onclick="handleSuggestion('Quais os critérios de elegibilidade?')">Critérios de elegibilidade</button>
                </div>
            </div>
        `;
    }
    
    // Set first sidebar history item active if exists
    const histItems = document.querySelectorAll('.chat-history-item');
    histItems.forEach(item => item.classList.remove('active'));
    const defaultHistItem = document.getElementById('hist-item-default');
    if (defaultHistItem) defaultHistItem.classList.add('active');
}

// Start Barter Simulation Flow guided questions
function startBarterSimulationFlow() {
    chatState.step = 'waiting_currency';
    chatState.data = {};
    
    // Fetch live currency if available, as a default
    const cambioInput = document.getElementById('sim-cambio');
    const cambio = cambioInput ? parseFloat(cambioInput.value) : 5.15;
    chatState.data.cambio = cambio;
    
    // Add bot greeting and first choices
    addMessageToChat(
        "Muito bem! Vamos iniciar o fluxo de simulação de barter.\nPrimeiro, qual é a **moeda** que você gostaria de utilizar para a operação?",
        "bot",
        "choices",
        [
            { text: "Real (R$)", value: "BRL" },
            { text: "Dólar (USD)", value: "USD" }
        ]
    );
}

// Handles clicked suggestion buttons
function handleSuggestion(text) {
    addMessageToChat(text, "user");
    
    setTimeout(() => {
        const query = text.toLowerCase();
        
        if (query.includes('modalidade') || query.includes('comparar') || query.includes('comparativo') || query.includes('fidc') || query.includes('fiso') || query.includes('prazo')) {
            addMessageToChat(
                "### Comparativo de Modalidades de Crédito\n\n" +
                "1. **Barter (Físico)**:\n" +
                "   - **Descrição:** Amortização via entrega de grãos. Risco cambial travado fisicamente.\n" +
                "   - **Garantias:** CPR Física (Cédula de Produto Rural) e Seguro Agrícola.\n" +
                "   - **Incentivos:** Cashback comercial de 4,5% + Incentivo de 0,5% a cada 30 dias.\n\n" +
                "2. **FIDC (Syde)**:\n" +
                "   - **Descrição:** Antecipação de recebíveis via fundo. Foco em agilidade.\n" +
                "   - **Garantias:** CPR Financeira (CPR-F), Nota Promissória (NP) e cessão de recebíveis.\n" +
                "   - **Incentivos:** Maior desconto comercial de juros (redução de até **-4,0% a.a.** na taxa).\n" +
                "   - **Elegibilidade:** Exige relacionamento &ge; 2 anos e exclui clientes classificados como High Risk (HR/VHR).\n\n" +
                "3. **FISO (Bancos)**:\n" +
                "   - **Descrição:** Financiamento via parceiros bancários (Santander/Flex, Itaú/Nice) com incentivos de fabricante.\n" +
                "   - **Garantias:** Penhor Agrícola, CPR Financeira e Seguro de Crédito. Pode haver colateral de retenção de AR (ex: 30% no Santander).\n" +
                "   - **Incentivos:** Redução intermediária de juros (redução de até **-3,0% a.a.** na taxa).\n" +
                "   - **Elegibilidade:** Restrito para clientes com menos de 2 anos (exceto Santander/Flex).\n\n" +
                "4. **Prazo (Convencional)**:\n" +
                "   - **Descrição:** Crédito direto no balanço da Syngenta (On-Balance) sob preço de tabela a prazo.\n" +
                "   - **Garantias:** Nota Promissória (NP) e análise padrão de limite FSCM.",
                "bot"
            );
        } else if (query.includes('garantia') || query.includes('garantias') || query.includes('elegibilidade')) {
            addMessageToChat(
                "### Garantias e Critérios das Modalidades:\n\n" +
                "- **Barter:** A principal garantia é a **CPR Física** vinculada diretamente à produção do grão. Elegibilidade livre focada na capacidade de produção.\n" +
                "- **FIDC (Syde):** Formalizado via **CPR-F** ou **NP** com assinatura digital integrada. Elegível para relacionamento &ge; 2 anos e rating de risco aceitável (exclui HR/VHR).\n" +
                "- **FISO:** Exige garantias bancárias tradicionais como **Penhor Agrícola** e **Seguro de Crédito**, além de potencial retenção colateral de recebíveis (ex: 30% no Santander). Restrito para novos clientes sem relacionamento prévio (exceto FLEX).\n" +
                "- **Prazo (Convencional):** Garantido por **Nota Promissória (NP)** e sujeito à análise rígida de limites de crédito (SAP FSCM).",
                "bot"
            );
        } else if (query.includes('simular') || query.includes('barter') || query.includes('crédito')) {
            startBarterSimulationFlow();
        } else if (query.includes('cotação do dólar') || query.includes('câmbio')) {
            const cambioVal = parseFloat(document.getElementById('sim-cambio').value) || 5.15;
            addMessageToChat(
                `A taxa cambial futura do Dólar (BRL/USD) cadastrada agora é de **R$ ${formatNumber(cambioVal, 4)}**.\n\nEssa taxa é obtida via AwesomeAPI e é usada nas conversões das sacas físicas da simulação.`,
                "bot"
            );
        } else if (query.includes('soja') || query.includes('preço da soja')) {
            const cambio = parseFloat(document.getElementById('sim-cambio').value) || 5.15;
            const soyUSD = currentQuotes.soybeans;
            const soyBRL = soyUSD * cambio;
            addMessageToChat(
                `A cotação internacional da **Soja** na bolsa de Chicago (CBOT) é de **USD ${formatNumber(soyUSD, 2)}** por saca (Aprox. **R$ ${formatNumber(soyBRL, 2)}** no câmbio atual).\n\nVocê gostaria de simular uma oferta de barter para amortização de crédito com soja?`,
                "bot",
                "choices",
                [
                    { text: "Sim, simular Soja", value: "simular_soja" },
                    { text: "Não, obrigado", value: "cancel" }
                ]
            );
        } else if (query.includes('solicitações de crédito') || query.includes('propostas') || query.includes('usuários') || query.includes('operadores')) {
            addMessageToChat(
                "Essa funcionalidade de listagem e gerenciamento faz parte do Painel de Crédito corporativo e está simulada no protótipo.\n\nComo produtor ou parceiro de negócios, você pode utilizar o **Simulador de taxas** clássico no menu lateral ou usar o **Assistente Virtual** para calcular propostas rapidamente.",
                "bot"
            );
        } else {
            addMessageToChat(
                "Olá! Sou o assistente de IA. Posso ajudar você com simulações de barter rápidas, cotações e regras tributárias regionais.\n\nSelecione 'Quero simular uma oferta de barter' abaixo para iniciar uma nova simulação!",
                "bot",
                "choices",
                [
                    { text: "Quero simular uma oferta de barter", value: "start_simulation" }
                ]
            );
        }
    }, 400);
}

// Handle clicking option buttons in conversation
function handleChoiceClick(value, label) {
    addMessageToChat(label, "user");
    
    // Process input after a short delay for conversational flow
    setTimeout(() => {
        processChatStep(value);
    }, 450);
}

// Process typing message
function handleSendButton() {
    const inputField = document.getElementById('chat-input-field');
    if (!inputField) return;
    
    const text = inputField.value.trim();
    if (text === '') return;
    
    inputField.value = '';
    addMessageToChat(text, "user");
    
    setTimeout(() => {
        if (chatState.step) {
            processChatStep(text);
        } else {
            handleSuggestion(text);
        }
    }, 450);
}

// Main conversation state transition flow
function processChatStep(input) {
    const currency = chatState.data.currency || 'BRL';
    const cambio = chatState.data.cambio || 5.15;
    
    if (chatState.step === 'waiting_currency') {
        chatState.data.currency = input;
        chatState.step = 'waiting_commodity';
        
        addMessageToChat(
            `Moeda selecionada: **${input === 'BRL' ? 'Real (BRL)' : 'Dólar (USD)'}**.\n\nQual é a **commodity** da sua safra que será utilizada para o barter?`,
            "bot",
            "choices",
            [
                { text: "Soja (sc)", value: "Soja" },
                { text: "Algodão (lp)", value: "Algodão" }
            ]
        );
    } 
    else if (chatState.step === 'waiting_commodity') {
        // Handle custom flow buttons
        if (input === 'simular_soja') {
            chatState.data.currency = 'BRL';
            input = 'Soja';
        }
        
        if (input === 'cancel') {
            startNewChat();
            return;
        }
        
        chatState.data.commodity = input;
        
        // Define default values based on commodity
        if (input === 'Soja') {
            chatState.data.prazo = 216;
            chatState.data.jurosAnual = 14.40;
            chatState.data.precoCommodity = currentQuotes.soybeans * (chatState.data.currency === 'BRL' ? cambio : 1.0);
            chatState.data.freteKm = 10.30 * (chatState.data.currency === 'BRL' ? cambio : 1.0);
        } else {
            chatState.data.prazo = 249;
            chatState.data.jurosAnual = 14.40;
            chatState.data.precoCommodity = currentQuotes.cotton * (chatState.data.currency === 'BRL' ? cambio : 1.0);
            chatState.data.freteKm = 10.30 * (chatState.data.currency === 'BRL' ? cambio : 1.0);
        }
        
        chatState.step = 'waiting_region';
        
        addMessageToChat(
            `Entendido! Commodity: **${input}**.\n\nQual é a sua **praça / região** de entrega de grãos? (Isso é crucial para calcularmos o benefício dos impostos estaduais no Barter):`,
            "bot",
            "choices",
            [
                { text: "Campo Novo do Parecis (MT)", value: "Campo Novo do Parecis (MT)" },
                { text: "Sorriso (MT)", value: "Sorriso (MT)" },
                { text: "Querência (MT)", value: "Querência (MT)" },
                { text: "Rio Verde (GO)", value: "Rio Verde (GO)" },
                { text: "Dourados (MS)", value: "Dourados (MS)" },
                { text: "Cascavel (PR) [Isento]", value: "Cascavel (PR)" }
            ]
        );
    } 
    else if (chatState.step === 'waiting_region') {
        chatState.data.region = input;
        chatState.step = 'waiting_credit';
        
        addMessageToChat(
            `Região configurada: **${input}**.\n\nAgora, por favor, me informe qual o **valor de crédito contratado a prazo** que deseja simular. Digite apenas o valor em números.\n*(Exemplo: 1.000.000 ou 500000)*`,
            "bot"
        );
    } 
    else if (chatState.step === 'waiting_credit') {
        // Clean and parse credit input using robust Portuguese/English currency parser
        let clean = input.replace(/R\$\s*|USD\s*|\$/g, '').trim();
        if (clean.includes(',')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            const parts = clean.split('.');
            if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
                clean = clean.replace(/\./g, '');
            }
        }
        let valCredit = parseFloat(clean);
        
        if (valCredit <= 0 || isNaN(valCredit)) {
            addMessageToChat(
                "Desculpe, não consegui identificar um valor numérico válido. Por favor, digite o valor da operação novamente. Ex: 1.000.000 ou 1000000",
                "bot"
            );
            return;
        }
        
        chatState.data.credit = valCredit;
        chatState.step = 'waiting_confirmation';
        
        // Ensure default distances are set
        if (chatState.data.distChao === undefined) chatState.data.distChao = 15;
        if (chatState.data.distAsfalto === undefined) chatState.data.distAsfalto = 35;
        if (chatState.data.freteChao === undefined) chatState.data.freteChao = currency === 'BRL' ? 15.00 * cambio : 15.00;
        if (chatState.data.freteAsfalto === undefined) chatState.data.freteAsfalto = currency === 'BRL' ? 8.00 * cambio : 8.00;
        
        const formattedCredit = currency === 'BRL' ? formatBRL(valCredit) : formatUSD(valCredit);
        const formattedPrice = currency === 'BRL' ? formatBRL(chatState.data.precoCommodity) : formatUSD(chatState.data.precoCommodity);
        
        addMessageToChat(
            `Perfeito! Registrei o crédito de **${formattedCredit}**.\n\nPara o cálculo, usaremos os parâmetros padrão abaixo (safra 2026):\n` +
            `- **Moeda da Operação:** ${currency}\n` +
            `- **Commodity:** ${chatState.data.commodity}\n` +
            `- **Praça:** ${chatState.data.region}\n` +
            `- **Prazo:** ${chatState.data.prazo} dias\n` +
            `- **Taxa de Juros:** ${chatState.data.jurosAnual}% a.a.\n` +
            `- **Preço Bruto FOB Ref:** ${formattedPrice} / ${(chatState.data.commodity === 'Soja' ? 'sc' : 'lp')}\n` +
            `- **Estrada de Chão:** ${chatState.data.distChao} KM\n` +
            `- **Estrada de Asfalto:** ${chatState.data.distAsfalto} KM\n\n` +
            `Podemos rodar o cálculo da simulação ou você gostaria de customizar as distâncias, prazo ou juros?`,
            "bot",
            "choices",
            [
                { text: "Calcular Simulação", value: "calculate" },
                { text: "Alterar Distâncias", value: "alterar_distancias" },
                { text: "Alterar Prazo (Dias)", value: "alterar_prazo" },
                { text: "Alterar Juros (% a.a.)", value: "alterar_juros" },
                { text: "Cancelar", value: "cancel" }
            ]
        );
    }
    else if (chatState.step === 'waiting_confirmation') {
        if (input === 'calculate') {
            runBarterSimulationCalculation();
        } else if (input === 'alterar_distancias') {
            chatState.step = 'waiting_custom_dist_chao';
            addMessageToChat("Por favor, digite a distância de estrada de chão (em KM) da fazenda até a rodovia. Ex: 10", "bot");
        } else if (input === 'alterar_prazo') {
            chatState.step = 'waiting_custom_prazo';
            addMessageToChat("Por favor, digite o novo prazo da operação em dias. Ex: 180", "bot");
        } else if (input === 'alterar_juros') {
            chatState.step = 'waiting_custom_juros';
            addMessageToChat("Por favor, digite a nova taxa de juros anual (% a.a.). Ex: 12.5", "bot");
        } else if (input === 'show_params') {
            const formattedCredit = currency === 'BRL' ? formatBRL(chatState.data.credit) : formatUSD(chatState.data.credit);
            const formattedPrice = currency === 'BRL' ? formatBRL(chatState.data.precoCommodity) : formatUSD(chatState.data.precoCommodity);
            addMessageToChat(
                `Perfeito! Parâmetros atualizados da simulação:\n` +
                `- **Moeda da Operação:** ${currency}\n` +
                `- **Commodity:** ${chatState.data.commodity}\n` +
                `- **Praça:** ${chatState.data.region}\n` +
                `- **Prazo:** ${chatState.data.prazo} dias\n` +
                `- **Taxa de Juros:** ${chatState.data.jurosAnual}% a.a.\n` +
                `- **Preço Bruto FOB Ref:** ${formattedPrice} / ${(chatState.data.commodity === 'Soja' ? 'sc' : 'lp')}\n` +
                `- **Estrada de Chão:** ${chatState.data.distChao} KM\n` +
                `- **Estrada de Asfalto:** ${chatState.data.distAsfalto} KM\n\n` +
                `Podemos rodar o cálculo da simulação agora?`,
                "bot",
                "choices",
                [
                    { text: "Calcular Simulação", value: "calculate" },
                    { text: "Alterar Distâncias", value: "alterar_distancias" },
                    { text: "Alterar Prazo (Dias)", value: "alterar_prazo" },
                    { text: "Alterar Juros (% a.a.)", value: "alterar_juros" },
                    { text: "Cancelar", value: "cancel" }
                ]
            );
        } else {
            addMessageToChat("Simulação cancelada. Como posso ajudar você agora?", "bot");
            startNewChat();
        }
    }
    else if (chatState.step === 'waiting_custom_dist_chao') {
        const val = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val) || val < 0) {
            addMessageToChat("Por favor, insira um número inteiro de KM válido. Ex: 10", "bot");
            return;
        }
        chatState.data.distChao = val;
        chatState.step = 'waiting_custom_dist_asfalto';
        addMessageToChat("Agora, digite a distância de estrada de asfalto (em KM) até a nossa base. Ex: 40", "bot");
    }
    else if (chatState.step === 'waiting_custom_dist_asfalto') {
        const val = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val) || val < 0) {
            addMessageToChat("Por favor, insira um número inteiro de KM válido. Ex: 40", "bot");
            return;
        }
        chatState.data.distAsfalto = val;
        chatState.step = 'waiting_confirmation';
        processChatStep('show_params');
    }
    else if (chatState.step === 'waiting_custom_prazo') {
        const val = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val) || val <= 0) {
            addMessageToChat("Por favor, insira um número válido de dias. Ex: 180", "bot");
            return;
        }
        chatState.data.prazo = val;
        chatState.step = 'waiting_confirmation';
        processChatStep('show_params');
    }
    else if (chatState.step === 'waiting_custom_juros') {
        const val = parseFloat(input.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (isNaN(val) || val <= 0) {
            addMessageToChat("Por favor, insira um número válido de taxa (%). Ex: 13.75", "bot");
            return;
        }
        chatState.data.jurosAnual = val;
        chatState.step = 'waiting_confirmation';
        processChatStep('show_params');
    }
    else if (input === 'show_params') {
        const formattedCredit = currency === 'BRL' ? formatBRL(chatState.data.credit) : formatUSD(chatState.data.credit);
        const formattedPrice = currency === 'BRL' ? formatBRL(chatState.data.precoCommodity) : formatUSD(chatState.data.precoCommodity);
        
        addMessageToChat(
            `Ajustes aplicados! Parâmetros atuais da simulação:\n` +
            `- **Moeda da Operação:** ${currency}\n` +
            `- **Commodity:** ${chatState.data.commodity}\n` +
            `- **Praça:** ${chatState.data.region}\n` +
            `- **Prazo:** ${chatState.data.prazo} dias\n` +
            `- **Taxa de Juros:** ${chatState.data.jurosAnual}% a.a.\n` +
            `- **Preço Bruto FOB Ref:** ${formattedPrice} / ${(chatState.data.commodity === 'Soja' ? 'sc' : 'lp')}\n\n` +
            `Deseja calcular a simulação agora?`,
            "bot",
            "choices",
            [
                { text: "Calcular Simulação", value: "calculate" },
                { text: "Alterar Prazo (Dias)", value: "alterar_prazo" },
                { text: "Alterar Juros (% a.a.)", value: "alterar_juros" },
                { text: "Cancelar", value: "cancel" }
            ]
        );
    }
}

// Executes the simulation engine math and renders the rich result card bubble in chat
function runBarterSimulationCalculation() {
    const d = chatState.data;
    
    // Ensure default distances are set if not customized
    if (d.distChao === undefined) d.distChao = 15;
    if (d.distAsfalto === undefined) d.distAsfalto = 35;
    if (d.freteChao === undefined) d.freteChao = d.currency === 'BRL' ? 15.00 * d.cambio : 15.00;
    if (d.freteAsfalto === undefined) d.freteAsfalto = d.currency === 'BRL' ? 8.00 * d.cambio : 8.00;

    const results = runSimulationMath({
        commodity: d.commodity,
        regiao: d.region,
        creditRaw: d.credit,
        commBrutoRaw: d.precoCommodity,
        descontoAtivo: true,
        prazo: d.prazo,
        jurosAnual: d.jurosAnual,
        valPctProposta: 4.50,
        distChao: d.distChao,
        distAsfalto: d.distAsfalto,
        freteChaoRaw: d.freteChao,
        freteAsfaltoRaw: d.freteAsfalto,
        cambio: d.cambio,
        currency: d.currency
    });
    
    const factor = d.currency === 'BRL' ? d.cambio : 1.0;
    
    const simSummary = {
        inputs: {
            currency: d.currency,
            commodity: d.commodity,
            region: d.region,
            creditRaw: d.credit
        },
        totalRetorno: results.totalRetornoUSDProposta * factor,
        precoFinal: results.precoFinalUSDProposta * factor,
        precoMarket: results.precoFinalUSDMarket * factor,
        economia: results.volFinalMarket - results.volFinalProposta,
        unitSymbol: results.unitSymbol,
        fullInputs: Object.assign({}, d)
    };
    
    chatHistorySessions.push(simSummary);
    const sessionIndex = chatHistorySessions.length - 1;
    
    addMessageToChat(
        "**Simulação finalizada com sucesso!** Veja a comparação de vantagens com a Nossa Estrutura versus Concorrência:",
        "bot",
        "result",
        simSummary
    );
    
    updateHistorySidebar(sessionIndex, d.commodity, d.region);
    
    chatState.step = null;
}

// Dynamically updates the left sidebar history items
function updateHistorySidebar(index, commodity, region) {
    const list = document.getElementById('chat-history-list');
    if (!list) return;
    
    const currentActive = list.querySelector('.chat-history-item.active');
    if (currentActive) currentActive.classList.remove('active');
    
    const newItem = document.createElement('div');
    newItem.className = 'chat-history-item active animate-fade-in';
    newItem.onclick = () => loadChatHistory(index + 1);
    
    newItem.innerHTML = `
        <i class="fa-solid fa-wheat-awn"></i>
        <div class="history-details">
            <span class="history-title">Simulação ${commodity} - ${region.split(' ')[0]}</span>
            <span class="history-time">agora</span>
        </div>
    `;
    
    const defaultItem = document.getElementById('hist-item-default');
    if (defaultItem) {
        defaultItem.classList.remove('active');
        defaultItem.after(newItem);
    } else {
        list.appendChild(newItem);
    }
}

// Reloads a completed chat session results bubble
function loadChatHistory(sessionIndex) {
    if (sessionIndex === 0) {
        startNewChat();
        return;
    }
    
    const session = chatHistorySessions[sessionIndex - 1];
    if (!session) return;
    
    const histItems = document.querySelectorAll('.chat-history-item');
    histItems.forEach((item, idx) => {
        if (idx === (chatHistorySessions.length - sessionIndex + 1)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        const welcomeBox = document.getElementById('chat-welcome-box');
        if (welcomeBox) welcomeBox.style.display = 'none';
        
        addMessageToChat(
            `Você está visualizando o histórico da simulação realizada em **${session.inputs.commodity}** para a praça de **${session.inputs.region}**.\n` +
            `Moeda da operação: **${session.inputs.currency}**`,
            "bot"
        );
        
        addMessageToChat(
            "Resumo dos valores salvos no histórico:",
            "bot",
            "result",
            session
        );
    }
}

// Redirects user to the simulator form and auto-populates it with the parameters from the chat
function openSimulationInForm(index) {
    const session = chatHistorySessions[index];
    if (!session) return;
    
    const d = session.fullInputs;
    
    selectedCurrency = d.currency;
    const btnBrl = document.getElementById('btn-currency-brl');
    const btnUsd = document.getElementById('btn-currency-usd');
    if (d.currency === 'BRL') {
        if (btnBrl) btnBrl.classList.add('active');
        if (btnUsd) btnUsd.classList.remove('active');
    } else {
        if (btnUsd) btnUsd.classList.add('active');
        if (btnBrl) btnBrl.classList.remove('active');
    }
    
    const inputComm = document.getElementById('sim-commodity');
    const inputRegion = document.getElementById('sim-regiao');
    const inputCredit = document.getElementById('sim-credito');
    const inputPrice = document.getElementById('sim-preco-bruto');
    const inputPrazo = document.getElementById('sim-prazo');
    const inputJuros = document.getElementById('sim-juros-anual');
    const inputDistChao = document.getElementById('sim-dist-chao');
    const inputDistAsfalto = document.getElementById('sim-dist-asfalto');
    const inputFreteChao = document.getElementById('sim-frete-chao');
    const inputFreteAsfalto = document.getElementById('sim-frete-asfalto');
    const inputCambio = document.getElementById('sim-cambio');
    
    if (inputComm) inputComm.value = d.commodity;
    if (inputRegion) inputRegion.value = d.region;
    if (inputCredit) inputCredit.value = formatCurrencyValue(d.credit, d.currency);
    if (inputPrice) inputPrice.value = d.precoCommodity.toFixed(2);
    if (inputPrazo) inputPrazo.value = d.prazo;
    if (inputJuros) inputJuros.value = d.jurosAnual.toFixed(2);
    if (inputDistChao) inputDistChao.value = d.distChao !== undefined ? d.distChao : 15;
    if (inputDistAsfalto) inputDistAsfalto.value = d.distAsfalto !== undefined ? d.distAsfalto : 35;
    if (inputFreteChao) inputFreteChao.value = (d.freteChao !== undefined ? d.freteChao : 15).toFixed(2);
    if (inputFreteAsfalto) inputFreteAsfalto.value = (d.freteAsfalto !== undefined ? d.freteAsfalto : 8).toFixed(2);
    if (inputCambio) inputCambio.value = d.cambio.toFixed(4);
    
    const isSoy = d.commodity === 'Soja';
    const unitSymbol = isSoy ? 'sc' : 'lp';
    const currencySign = d.currency === 'BRL' ? 'R$' : 'USD';
    const suffixEl = document.getElementById('sim-preco-bruto-suffix');
    if (suffixEl) suffixEl.textContent = d.currency === 'BRL' ? 'R$/' + unitSymbol : 'USD/' + unitSymbol;
    
    const chaoSuffixEl = document.getElementById('sim-frete-chao-suffix');
    if (chaoSuffixEl) chaoSuffixEl.textContent = d.currency === 'BRL' ? 'R$/KM' : 'USD/KM';
    const asfaltoSuffixEl = document.getElementById('sim-frete-asfalto-suffix');
    if (asfaltoSuffixEl) asfaltoSuffixEl.textContent = d.currency === 'BRL' ? 'R$/KM' : 'USD/KM';
    
    showPage('simulador');
    calculateSimulation();
}

// Initialize and redraw TradingView chart widget (CFDs for free widgets)
function initTradingViewWidget(commodity) {
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

// Generate print-ready simulation PDF in a new window
function downloadSimulationPDF(dataInput = null) {
    let d;
    if (dataInput) {
        d = dataInput;
    } else {
        const commodity = document.getElementById('sim-commodity').value;
        const regiao = document.getElementById('sim-regiao').value;
        const creditRaw = getRawCurrencyValue(document.getElementById('sim-credito').value);
        const commBrutoRaw = parseFloat(document.getElementById('sim-preco-bruto').value) || 0;
        const descontoAtivo = document.getElementById('sim-descontos').checked;
        const prazo = parseFloat(document.getElementById('sim-prazo').value) || 0;
        const jurosAnual = parseFloat(document.getElementById('sim-juros-anual').value) || 0;
        const valPctProposta = parseFloat(document.getElementById('sim-campanha-val').value) || 0;
        
        const distChao = parseFloat(document.getElementById('sim-dist-chao').value) || 0;
        const distAsfalto = parseFloat(document.getElementById('sim-dist-asfalto').value) || 0;
        const freteChaoRaw = parseFloat(document.getElementById('sim-frete-chao').value) || 0;
        const freteAsfaltoRaw = parseFloat(document.getElementById('sim-frete-asfalto').value) || 0;
        const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;
        
        d = {
            commodity, region: regiao, credit: creditRaw, precoCommodity: commBrutoRaw,
            descontoAtivo, prazo, jurosAnual, valPctProposta, distChao, distAsfalto,
            freteChao: freteChaoRaw, freteAsfalto: freteAsfaltoRaw, cambio, currency: selectedCurrency
        };
    }
    
    const res = runSimulationMath({
        commodity: d.commodity,
        regiao: d.region,
        creditRaw: d.credit,
        commBrutoRaw: d.precoCommodity,
        descontoAtivo: d.descontoAtivo,
        prazo: d.prazo,
        jurosAnual: d.jurosAnual,
        valPctProposta: d.valPctProposta !== undefined ? d.valPctProposta : 4.50,
        distChao: d.distChao !== undefined ? d.distChao : 15,
        distAsfalto: d.distAsfalto !== undefined ? d.distAsfalto : 35,
        freteChaoRaw: d.freteChao !== undefined ? d.freteChao : 15.00,
        freteAsfaltoRaw: d.freteAsfalto !== undefined ? d.freteAsfalto : 8.00,
        cambio: d.cambio,
        currency: d.currency
    });
    
    const factor = d.currency === 'BRL' ? d.cambio : 1.0;
    const formatVal = (val) => d.currency === 'BRL' ? formatBRL(val) : formatUSD(val);
    const formatValExtended = (val) => d.currency === 'BRL' ? formatBRLExtended(val) : formatUSDExtended(val);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    // Modalidades Calculations for PDF
    const jurosAnualFidc = Math.max(0, d.jurosAnual - 4.0);
    const jurosAnualFiso = Math.max(0, d.jurosAnual - 3.0);
    
    const jurosPeriodoBarter = (d.prazo / 360) * (d.jurosAnual / 100);
    const jurosPeriodoFidc = (d.prazo / 360) * (jurosAnualFidc / 100);
    const jurosPeriodoFiso = (d.prazo / 360) * (jurosAnualFiso / 100);
    const jurosPeriodoPrazo = (d.prazo / 360) * (d.jurosAnual / 100);
    
    const custoFidc = d.credit * jurosPeriodoFidc;
    const custoFiso = d.credit * jurosPeriodoFiso;
    const custoPrazo = d.credit * jurosPeriodoPrazo;
    
    const custoBrutoBarter = d.credit * jurosPeriodoBarter;
    const totalRetornosBarter = res.totalRetornoUSDProposta * factor;
    const freteTotalBarter = res.freteTotalUSDProposta * factor;
    const netCustoBarter = custoBrutoBarter - totalRetornosBarter + freteTotalBarter;
    
    const totalBarter = (res.volFinalProposta * d.precoCommodity) + freteTotalBarter;
    const totalFidc = d.credit + custoFidc;
    const totalFiso = d.credit + custoFiso;
    const totalPrazo = d.credit + custoPrazo;
    
    // Create print template in a new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Relatório de Simulação - Barter Hub</title>
            <style>
                body { font-family: 'Inter', sans-serif; color: #111827; padding: 40px; line-height: 1.5; background-color: #ffffff; }
                .header { border-bottom: 2px solid #088395; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                .logo { font-size: 28px; font-weight: 800; color: #088395; letter-spacing: -1.5px; }
                .title { font-size: 20px; font-weight: 700; color: #374151; }
                .metadata { margin-bottom: 30px; background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
                .meta-item { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #e5e7eb; }
                .meta-label { font-weight: 600; color: #4b5563; }
                .meta-val { color: #111827; }
                .section-title { font-size: 16px; font-weight: 700; color: #088395; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
                th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background-color: #f3f4f6; font-weight: 700; color: #374151; }
                tr.highlight { background-color: #e2f2f5; font-weight: 600; }
                tr.heavy { font-weight: 700; border-top: 2px solid #088395; }
                .text-green { color: #0d9488; }
                .text-danger { color: #dc2626; }
                .disclaimer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
                @media print {
                    body { padding: 0; }
                    .btn-print { display: none; }
                }
                .btn-print { background-color: #088395; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; float: right; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
            <div class="header">
                <div class="logo">barter hub</div>
                <div class="title">Relatório de Simulação Barter</div>
            </div>
            
            <div class="metadata">
                <div class="meta-item"><span class="meta-label">Commodity:</span><span class="meta-val">${d.commodity}</span></div>
                <div class="meta-item"><span class="meta-label">Região / Praça:</span><span class="meta-val">${d.region}</span></div>
                <div class="meta-item"><span class="meta-label">Valor do Crédito:</span><span class="meta-val">${formatVal(d.credit)}</span></div>
                <div class="meta-item"><span class="meta-label">Preço Bruto Ref:</span><span class="meta-val">${formatVal(d.precoCommodity)} / ${res.unitSymbol}</span></div>
                <div class="meta-item"><span class="meta-label">Prazo da Operação:</span><span class="meta-val">${d.prazo} dias</span></div>
                <div class="meta-item"><span class="meta-label">Taxa de Juros:</span><span class="meta-val">${d.jurosAnual.toFixed(2)}% a.a.</span></div>
                <div class="meta-item"><span class="meta-label">Distância Estrada de Chão:</span><span class="meta-val">${d.distChao} KM</span></div>
                <div class="meta-item"><span class="meta-label">Distância Estrada de Asfalto:</span><span class="meta-val">${d.distAsfalto} KM</span></div>
                <div class="meta-item"><span class="meta-label">Câmbio de Referência:</span><span class="meta-val">R$ ${formatNumber(d.cambio, 4)}</span></div>
                <div class="meta-item"><span class="meta-label">Impostos Estaduais:</span><span class="meta-val">${d.descontoAtivo ? 'Ativo' : 'Inativo'}</span></div>
            </div>
            
            <div class="section-title">Comparação de Resultados (Barter)</div>
            <table>
                <thead>
                    <tr>
                        <th>Variável da Operação</th>
                        <th>Nossa Estrutura</th>
                        <th>Outras Tradings</th>
                        <th>Vantagem (%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Preço Commodity Livre (Porteira)</td>
                        <td>${formatVal(res.commLivreUSDProposta * factor)}</td>
                        <td>${formatVal(res.commLivreUSDMarket * factor)}</td>
                        <td class="text-green">+${((res.commLivreUSDProposta / res.commLivreUSDMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td>(-) Custo de Transporte (Frete)</td>
                        <td class="text-danger">- ${formatValExtended(res.freteUnitUSDProposta * factor)}</td>
                        <td class="text-danger">- ${formatValExtended(res.freteUnitUSDMarket * factor)}</td>
                        <td>${((res.freteUnitUSDProposta / res.freteUnitUSDMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td>Volume de Troca Físico Inicial</td>
                        <td>${formatNumber(res.volTrocaProposta)} ${res.unitSymbol}</td>
                        <td>${formatNumber(res.volTrocaMarket)} ${res.unitSymbol}</td>
                        <td>${((res.volTrocaProposta / res.volTrocaMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td>Cash Back da Campanha</td>
                        <td>${formatVal(res.cashbackUsdProposta * factor)} (${d.valPctProposta.toFixed(1)}%)</td>
                        <td>${formatVal(res.cashbackUsdMarket * factor)} (${res.valPctMarket.toFixed(1)}%)</td>
                        <td class="text-green">+${((res.cashbackUsdProposta / res.cashbackUsdMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td>Incentivo Barter ganho</td>
                        <td>${formatVal(res.incentivoBarterUsd * factor)}</td>
                        <td>${formatVal(res.incentivoBarterUsd * factor)}</td>
                        <td>0.00%</td>
                    </tr>
                    <tr class="highlight">
                        <td>Total de Retorno Recebido</td>
                        <td class="text-green">${formatVal(res.totalRetornoUSDProposta * factor)}</td>
                        <td>${formatVal(res.totalRetornoUSDMarket * factor)}</td>
                        <td class="text-green">+${((res.totalRetornoUSDProposta / res.totalRetornoUSDMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr class="heavy">
                        <td>Preço Equivalente Final</td>
                        <td>${formatValExtended(res.precoFinalUSDProposta * factor)} / ${res.unitSymbol}</td>
                        <td>${formatValExtended(res.precoFinalUSDMarket * factor)} / ${res.unitSymbol}</td>
                        <td class="text-green">+${((res.precoFinalUSDProposta / res.precoFinalUSDMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr class="heavy highlight">
                        <td>Volume de Troca Equivalente Final</td>
                        <td>${formatNumber(res.volFinalProposta)} ${res.unitSymbol}</td>
                        <td>${formatNumber(res.volFinalMarket)} ${res.unitSymbol}</td>
                        <td class="text-green">${((res.volFinalProposta / res.volFinalMarket - 1.0) * 100).toFixed(2)}%</td>
                    </tr>
                    <tr class="highlight">
                        <td>Economia de Commodity Obtida</td>
                        <td colspan="3" class="text-green" style="text-align: center; font-size: 16px; padding: 16px;">
                            Economia de <strong>${formatNumber(res.volFinalMarket - res.volFinalProposta)} ${res.unitSymbol} (${formatVal((res.volFinalMarket - res.volFinalProposta) * d.precoCommodity)})</strong> em relação ao mercado!
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="section-title" style="page-break-before: always;">Comparação Geral de Modalidades de Crédito</div>
            <table>
                <thead>
                    <tr>
                        <th>Variável / Regra</th>
                        <th>Barter (Físico)</th>
                        <th>FIDC (Syde)</th>
                        <th>FISO (Bancário)</th>
                        <th>Prazo (On-Balance)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Taxa Juros Anual Efetiva</strong></td>
                        <td class="text-green">${d.jurosAnual.toFixed(2)}% a.a.</td>
                        <td>${jurosAnualFidc.toFixed(2)}% a.a. (-4% inc.)</td>
                        <td>${jurosAnualFiso.toFixed(2)}% a.a. (-3% inc.)</td>
                        <td>${d.jurosAnual.toFixed(2)}% a.a. (tabela)</td>
                    </tr>
                    <tr>
                        <td><strong>Custo Financeiro Líquido</strong></td>
                        <td class="text-green font-bold">${formatVal(netCustoBarter)}</td>
                        <td>${formatVal(custoFidc)}</td>
                        <td>${formatVal(custoFiso)}</td>
                        <td>${formatVal(custoPrazo)}</td>
                    </tr>
                    <tr class="highlight">
                        <td><strong>Valor Total a Pagar (Equivalente)</strong></td>
                        <td class="text-green font-bold">${formatVal(totalBarter)}</td>
                        <td>${formatVal(totalFidc)}</td>
                        <td>${formatVal(totalFiso)}</td>
                        <td>${formatVal(totalPrazo)}</td>
                    </tr>
                    <tr>
                        <td><strong>Incentivo Comercial</strong></td>
                        <td class="text-green">+${(d.valPctProposta + res.incentivoBarterPct * 100).toFixed(2)}% (Cashback+Inc.)</td>
                        <td>Taxa Reduzida (-4,0% a.a.)</td>
                        <td>Taxa Reduzida (-3,0% a.a.)</td>
                        <td>Sem incentivo</td>
                    </tr>
                    <tr>
                        <td><strong>Garantias Atreladas</strong></td>
                        <td>CPR Física e Seguro Agrícola</td>
                        <td>CPR Financeira, NP e cessão de recebíveis</td>
                        <td>Penhor Agrícola, CPR Financeira e Seguro Crédito</td>
                        <td>Nota Promissória (NP) e FSCM</td>
                    </tr>
                    <tr>
                        <td><strong>Critérios de Elegibilidade</strong></td>
                        <td class="text-green">Livre (grão colhido)</td>
                        <td>Relacionamento &ge; 2 anos, sem riscos altos (HR/VHR)</td>
                        <td>Restrições para &lt; 2 anos (exceto FLEX)</td>
                        <td>Limite padrão SAP FSCM</td>
                    </tr>
                    <tr>
                        <td><strong>Fluxo de Liquidação</strong></td>
                        <td>Físico (sacas entregues)</td>
                        <td>Financeiro (recebíveis)</td>
                        <td>Financeiro (bancos parceiros)</td>
                        <td>Financeiro direto (boleto)</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="disclaimer">
                Relatório de simulação comercial emitido para simples referência e comparação.<br>
                Simulação realizada em <strong>${dateStr}</strong> às <strong>${timeStr}</strong>.
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function downloadSimulationPDFFromIndex(index) {
    const session = chatHistorySessions[index];
    if (!session) return;
    
    const d = session.fullInputs;
    
    // Ensure default values are populated in the parameters object
    const formattedInputs = {
        commodity: d.commodity,
        region: d.region,
        credit: d.credit,
        precoCommodity: d.precoCommodity,
        descontoAtivo: true,
        prazo: d.prazo,
        jurosAnual: d.jurosAnual,
        valPctProposta: 4.50, // default propuesta campaign rate
        distChao: d.distChao !== undefined ? d.distChao : 15,
        distAsfalto: d.distAsfalto !== undefined ? d.distAsfalto : 35,
        freteChao: d.freteChao !== undefined ? d.freteChao : 15.00,
        freteAsfalto: d.freteAsfalto !== undefined ? d.freteAsfalto : 8.00,
        cambio: d.cambio || 5.15,
        currency: d.currency || 'BRL'
    };
    
    downloadSimulationPDF(formattedInputs);
}

// ==================== CAMPAIGN MANAGER MODULE ====================

// Default Campaigns Array populated to match the provided screens
let campaigns = [
    {
        id: 1,
        nome: "Verão",
        titulo: "Verão",
        status: "Ativa",
        desembolso: "2026-10-05",
        vencimento: "2026-12-01",
        visivelRTV: true,
        taxas: [
            {
                produtoFinanceiro: "Barter",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.20, // 14.4% a.a.
                tipoJuros: "Simples",
                contagemDias: "Dias úteis",
                incentivo: 4.50,
                desconto: 0.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "FIDC",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 0.87, // 10.4% a.a.
                tipoJuros: "Simples",
                contagemDias: "Dias úteis",
                incentivo: 0.00,
                desconto: 4.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "FISO",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 0.95, // 11.4% a.a.
                tipoJuros: "Simples",
                contagemDias: "Dias úteis",
                incentivo: 0.00,
                desconto: 3.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "Prazo",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.20, // 14.4% a.a.
                tipoJuros: "Simples",
                contagemDias: "Dias úteis",
                incentivo: 0.00,
                desconto: 0.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            }
        ]
    },
    { id: 2, nome: "Campanha Teste", titulo: "Campanha Teste", status: "Ativa", desembolso: "2026-08-01", vencimento: "2026-08-02", visivelRTV: false, taxas: [] },
    { id: 3, nome: "Campanha Fertilizante", titulo: "Campanha Fertilizante", status: "Ativa", desembolso: "2026-11-11", vencimento: "2026-11-11", visivelRTV: true, taxas: [] },
    { id: 4, nome: "Atualizando excluindo taxas", titulo: "Teste Taxas 2", status: "Ativa", desembolso: "", vencimento: "", visivelRTV: true, taxas: [] },
    { id: 5, nome: "Safra Inverno", titulo: "Safra Inverno", status: "Ativa", desembolso: "2025-12-01", vencimento: "2026-09-01", visivelRTV: true, taxas: [] },
    { id: 6, nome: "campanha teste", titulo: "campanha teste", status: "Ativa", desembolso: "2026-08-19", vencimento: "2026-12-20", visivelRTV: false, taxas: [] },
    { id: 7, nome: "Nova campanha [3]", titulo: "Nova campanha [3]", status: "Ativa", desembolso: "2026-07-01", vencimento: "2028-05-30", visivelRTV: true, taxas: [] },
    { id: 8, nome: "Nova campanha [2]", titulo: "Nova campanha [2]", status: "Ativa", desembolso: "2026-07-30", vencimento: "2026-07-31", visivelRTV: true, taxas: [] },
    { id: 9, nome: "teste", titulo: "teste", status: "Ativa", desembolso: "2026-10-05", vencimento: "2027-05-05", visivelRTV: true, taxas: [] },
    { id: 10, nome: "Fessa teste 002", titulo: "Vascampanha 001", status: "Ativa", desembolso: "2026-12-26", vencimento: "2027-10-10", visivelRTV: true, taxas: [] },
    { id: 11, nome: "Fessa Test 003", titulo: "VasCampanha", status: "Ativa", desembolso: "2026-06-28", vencimento: "2027-05-20", visivelRTV: true, taxas: [] }
];

let tempTaxes = [];
let editingTaxIndex = null;

// Toggle advanced filters dropdown
function toggleAdvancedFilters() {
    const filtersDiv = document.getElementById('advanced-filters');
    const chevron = document.getElementById('filters-chevron');
    if (filtersDiv) {
        if (filtersDiv.style.display === 'none') {
            filtersDiv.style.display = 'grid';
            if (chevron) chevron.className = 'fa-solid fa-chevron-up';
        } else {
            filtersDiv.style.display = 'none';
            if (chevron) chevron.className = 'fa-solid fa-chevron-down';
        }
    }
}

// Search filter in campaigns table
function filterCampaignsTable(query) {
    const term = query.toLowerCase();
    const rows = document.querySelectorAll('#campaigns-table-body tr');
    rows.forEach(row => {
        const nameText = row.cells[0]?.textContent.toLowerCase() || '';
        const titleText = row.cells[1]?.textContent.toLowerCase() || '';
        if (nameText.includes(term) || titleText.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Status filter in campaigns table
function filterCampaignsByStatus(status) {
    const rows = document.querySelectorAll('#campaigns-table-body tr');
    rows.forEach(row => {
        const statusText = row.cells[2]?.textContent.trim() || '';
        if (status === '' || statusText === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Switches campaigns view from list to create form
function showCreateCampaignForm() {
    document.getElementById('campanhas-list-view').style.display = 'none';
    document.getElementById('campanhas-create-view').style.display = 'block';
    
    // Clear form inputs
    document.getElementById('create-campaign-form').reset();
    tempTaxes = [];
    renderTempTaxesTable();
}

// Cancels campaign creation and returns to list view
function cancelCreateCampaign() {
    document.getElementById('campanhas-create-view').style.display = 'none';
    document.getElementById('campanhas-list-view').style.display = 'block';
}

// Opens the Tax addition modal overlay
function openTaxModal(index = null) {
    const modal = document.getElementById('tax-modal');
    const form = document.getElementById('tax-modal-form');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    if (form) form.reset();
    
    // Set default start date to today in calendar (2026-07-21)
    document.getElementById('tax-modal-inicio').value = "2026-07-21";
    
    if (index !== null) {
        editingTaxIndex = index;
        const tax = tempTaxes[index];
        document.getElementById('tax-modal-financeiro').value = tax.produtoFinanceiro;
        document.getElementById('tax-modal-agricola').value = tax.produtoAgricola;
        document.getElementById('tax-modal-juros').value = tax.jurosMensais.toFixed(2);
        document.getElementById('tax-modal-tipojuros').value = tax.tipoJuros;
        document.getElementById('tax-modal-contagem').value = tax.contagemDias;
        document.getElementById('tax-modal-moeda').value = tax.moeda;
        document.getElementById('tax-modal-incentivo').value = tax.incentivo ? tax.incentivo.toFixed(2) : '';
        document.getElementById('tax-modal-desconto').value = tax.desconto ? tax.desconto.toFixed(2) : '';
        document.getElementById('tax-modal-inicio').value = tax.inicio;
        document.getElementById('tax-modal-fim').value = tax.fim;
        document.getElementById('tax-modal-desembolso').value = tax.desembolso || '';
        document.getElementById('tax-modal-vencimento').value = tax.vencimento || '';
    } else {
        editingTaxIndex = null;
    }
}

// Closes the Tax modal
function closeTaxModal() {
    const modal = document.getElementById('tax-modal');
    if (modal) modal.style.display = 'none';
}

// Helper to parse percent or currency text box fields to clean floats
function parsePercentInput(val) {
    let clean = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

// Save tax inside modal
function handleSaveTax(e) {
    e.preventDefault();
    
    const produtoFinanceiro = document.getElementById('tax-modal-financeiro').value;
    const produtoAgricola = document.getElementById('tax-modal-agricola').value || 'Soja';
    const jurosMensais = parsePercentInput(document.getElementById('tax-modal-juros').value);
    const tipoJuros = document.getElementById('tax-modal-tipojuros').value;
    const contagemDias = document.getElementById('tax-modal-contagem').value;
    const moeda = document.getElementById('tax-modal-moeda').value;
    const incentivo = parsePercentInput(document.getElementById('tax-modal-incentivo').value);
    const desconto = parsePercentInput(document.getElementById('tax-modal-desconto').value);
    const inicio = document.getElementById('tax-modal-inicio').value;
    const fim = document.getElementById('tax-modal-fim').value;
    const desembolso = document.getElementById('tax-modal-desembolso').value;
    const vencimento = document.getElementById('tax-modal-vencimento').value;
    
    const taxObj = {
        produtoFinanceiro, produtoAgricola, jurosMensais, tipoJuros, contagemDias,
        moeda, incentivo, desconto, inicio, fim, desembolso, vencimento
    };
    
    if (editingTaxIndex !== null) {
        tempTaxes[editingTaxIndex] = taxObj;
    } else {
        tempTaxes.push(taxObj);
    }
    
    closeTaxModal();
    renderTempTaxesTable();
}

// Draw the temporary taxes list inside the creation form
function renderTempTaxesTable() {
    const tbody = document.getElementById('camp-taxas-table-body');
    if (!tbody) return;
    
    if (tempTaxes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 20px;">Sem resultados</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    tempTaxes.forEach((tax, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="font-bold">${tax.produtoFinanceiro}</td>
            <td>${tax.produtoAgricola}</td>
            <td>${tax.moeda}</td>
            <td>${tax.contagemDias}</td>
            <td>${tax.tipoJuros}</td>
            <td class="font-mono">${tax.jurosMensais.toFixed(2)}%</td>
            <td class="font-mono">${tax.incentivo ? tax.incentivo.toFixed(2) + '%' : '-'}</td>
            <td class="font-mono">${tax.desconto ? tax.desconto.toFixed(2) + '%' : '-'}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button type="button" class="btn-new-chat" onclick="openTaxModal(${index})" title="Editar taxa" style="background-color: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); padding: 5px 8px;">
                        <i class="fa-regular fa-edit"></i>
                    </button>
                    <button type="button" class="btn-new-chat" onclick="deleteTempTax(${index})" title="Excluir taxa" style="background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 5px 8px;">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteTempTax(index) {
    tempTaxes.splice(index, 1);
    renderTempTaxesTable();
}

// Saves the entire Campaign object into the global array and returns to main list
function handleSaveCampaign(e) {
    e.preventDefault();
    
    const nome = document.getElementById('camp-nome').value;
    const titulo = document.getElementById('camp-titulo').value;
    const status = document.getElementById('camp-status').value;
    const desembolso = document.getElementById('camp-desembolso').value;
    const vencimento = document.getElementById('camp-vencimento').value;
    const visivelRTV = document.getElementById('camp-rtv').checked;
    
    const nextId = campaigns.length > 0 ? (Math.max(...campaigns.map(c => c.id)) + 1) : 1;
    
    const newCamp = {
        id: nextId, nome, titulo, status, desembolso, vencimento, visivelRTV,
        taxas: [...tempTaxes]
    };
    
    campaigns.unshift(newCamp); // Insert at beginning of list to see immediately
    
    cancelCreateCampaign();
    renderCampaignsTable();
    updateCampaignSelectOptions();
}

// Formats dates from YYYY-MM-DD to DD/MM/YYYY
function formatDateBR(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Redraws the main Campaigns list table
function renderCampaignsTable() {
    const tbody = document.getElementById('campaigns-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    campaigns.forEach(camp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="font-bold">${camp.nome}</td>
            <td>${camp.titulo}</td>
            <td>
                <span class="${camp.status === 'Ativa' ? 'status-badge-active' : 'status-badge-inactive'}">
                    ${camp.status}
                </span>
            </td>
            <td class="font-mono">${formatDateBR(camp.desembolso)}</td>
            <td class="font-mono">${formatDateBR(camp.vencimento)}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button type="button" class="btn-new-chat" title="Ver taxas vinculadas" onclick="alert('Campanha contém ${camp.taxas.length} taxa(s).')" style="background-color: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); padding: 5px 8px;">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                    <button type="button" class="btn-new-chat" title="Excluir campanha" onclick="deleteCampaign(${camp.id})" style="background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 5px 8px;">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Deletes a campaign from list
function deleteCampaign(id) {
    if (confirm("Tem certeza que deseja excluir esta campanha?")) {
        campaigns = campaigns.filter(c => c.id !== id);
        renderCampaignsTable();
        updateCampaignSelectOptions();
    }
}

// Updates selector dropdown inside classic simulator page
function updateCampaignSelectOptions() {
    const select = document.getElementById('sim-campanha-select');
    if (!select) return;
    
    // Save current selection value
    const curVal = select.value;
    
    // Re-fill with options
    select.innerHTML = '<option value="custom">Campanha Customizada (Manual)</option>';
    
    campaigns.forEach(camp => {
        if (camp.status === 'Ativa') {
            const opt = document.createElement('option');
            opt.value = camp.id;
            opt.textContent = `${camp.nome} (${formatDateBR(camp.desembolso)} - ${formatDateBR(camp.vencimento)})`;
            select.appendChild(opt);
        }
    });
    
    // Re-apply value if exists
    select.value = curVal;
}

// Refactored onCampanhaSelectChange to handle autofilling of parameters
function onCampanhaSelectChange(val) {
    const commoditySelect = document.getElementById('sim-commodity');
    const jurosInput = document.getElementById('sim-juros-anual');
    const campanhaValInput = document.getElementById('sim-campanha-val');
    const prazoInput = document.getElementById('sim-prazo');
    
    if (val === 'custom') {
        // Unlock inputs
        if (commoditySelect) commoditySelect.disabled = false;
        if (jurosInput) jurosInput.disabled = false;
        if (campanhaValInput) campanhaValInput.disabled = false;
        return;
    }
    
    const camp = campaigns.find(c => c.id == val);
    if (!camp) return;
    
    // Find Barter tax parameters
    const barterTax = camp.taxas.find(t => t.produtoFinanceiro === 'Barter');
    
    if (barterTax) {
        if (commoditySelect) {
            commoditySelect.value = barterTax.produtoAgricola;
            commoditySelect.disabled = true;
            onCulturaChange(barterTax.produtoAgricola);
        }
        if (jurosInput) {
            // Annual interest rate = monthly rate * 12
            jurosInput.value = (barterTax.jurosMensais * 12).toFixed(2);
            jurosInput.disabled = true;
        }
        if (campanhaValInput) {
            campanhaValInput.value = barterTax.incentivo.toFixed(2);
            campanhaValInput.disabled = true;
        }
    } else {
        // No barter tax found, unlock
        if (commoditySelect) commoditySelect.disabled = false;
        if (jurosInput) jurosInput.disabled = false;
        if (campanhaValInput) campanhaValInput.disabled = false;
    }
    
    // Calculate term in days if dates are present
    if (camp.desembolso && camp.vencimento && prazoInput) {
        const desembolsoDate = new Date(camp.desembolso);
        const vencimentoDate = new Date(camp.vencimento);
        if (!isNaN(desembolsoDate) && !isNaN(vencimentoDate)) {
            const diffTime = vencimentoDate - desembolsoDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                prazoInput.value = diffDays;
            }
        }
    }
}


