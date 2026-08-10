// app.js - Barter Fees Simulator Logic & Interactions (Generic version with Button Activation and Live Currency Feed)

// Global state
let selectedCurrency = 'BRL'; // Default currency is Real (R$)
let tvWidget = null;
let hasSimulated = false; // Tracks if user clicked "Simular" button
let currentQuotes = {
    soybeans: 20.00, // USD per saca (default starting price from sheet)
    cotton: 0.85     // USD per lb (default starting price from sheet)
};

// WSys Praças Data Store
let wsysPlazas = [
    { estado: 'MT', nome: 'Campo Novo do Parecis', freteChao: 15.00, freteAsfalto: 8.00, impPct: 0.20, impFixo: 0.60 },
    { estado: 'MT', nome: 'Sorriso', freteChao: 15.00, freteAsfalto: 8.00, impPct: 0.25, impFixo: 0.65 },
    { estado: 'MT', nome: 'Querência', freteChao: 15.00, freteAsfalto: 8.00, impPct: 0.22, impFixo: 0.70 },
    { estado: 'GO', nome: 'Rio Verde', freteChao: 15.00, freteAsfalto: 8.00, impPct: 0.15, impFixo: 0.40 },
    { estado: 'MS', nome: 'Dourados', freteChao: 15.00, freteAsfalto: 8.00, impPct: 0.10, impFixo: 0.30 },
    { estado: 'PR', nome: 'Cascavel', freteChao: 15.00, freteAsfalto: 8.00, impPct: 0.0, impFixo: 0.0 }
];

let activeCampanhaValorizacaoOutras = 3.00;

// Lista de Feriados Nacionais (baseada na aba Feriados da planilha Simulador_outras_Modalidades.xlsx)
const FERIADOS_NACIONAIS = [
    "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21", "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15", "2025-12-25",
    "2026-01-01", "2026-02-16", "2026-02-17", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04", "2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15", "2026-12-25",
    "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-26", "2027-04-21", "2027-05-01", "2027-05-27", "2027-09-07", "2027-10-12", "2027-11-02", "2027-11-15", "2027-12-25"
];

// Cálculo de Dias Úteis (equivalente ao NETWORKDAYS(inicio, fim, feriados) - 1 da planilha Excel)
function calculateBusinessDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    let count = 0;
    let cur = new Date(start.getTime());
    while (cur <= end) {
        const dayOfWeek = cur.getDay(); // 0 = Domingo, 6 = Sábado
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !FERIADOS_NACIONAIS.includes(dateStr)) {
            count++;
        }
        cur.setDate(cur.getDate() + 1);
    }
    return Math.max(0, count - 1);
}


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
    initWsysPlazas(); // Initialize WSys database
    initEstadoSelect(); // Initialize Estado and Praça selects
    updateCampaignSelectOptions(); // Populate campaigns select in simulator form
    initTooltipsStore(); // Initialize tooltips database
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
    const simV2Page = document.getElementById('page-simulador-v2');
    const simCreativePage = document.getElementById('page-simulador-criativo');
    const rulesPage = document.getElementById('page-regras');
    const campaignsPage = document.getElementById('page-campanhas');
    const pracasPage = document.getElementById('page-pracas');
    const tooltipsPage = document.getElementById('page-tooltips');

    const assistLink = document.getElementById('nav-link-assistente');
    const simLink = document.getElementById('nav-link-simulador');
    const simV2Link = document.getElementById('nav-link-simulador-v2');
    const simCreativeLink = document.getElementById('nav-link-simulador-criativo');
    const rulesLink = document.getElementById('nav-link-regras');
    const campaignsLink = document.getElementById('nav-link-campanhas');
    const pracasLink = document.getElementById('nav-link-pracas');
    const tooltipsLink = document.getElementById('nav-link-tooltips');

    // Hide all pages
    if (assistPage) assistPage.style.display = 'none';
    if (simPage) simPage.style.display = 'none';
    if (simV2Page) simV2Page.style.display = 'none';
    if (simCreativePage) simCreativePage.style.display = 'none';
    if (rulesPage) rulesPage.style.display = 'none';
    if (campaignsPage) campaignsPage.style.display = 'none';
    if (pracasPage) pracasPage.style.display = 'none';
    if (tooltipsPage) tooltipsPage.style.display = 'none';

    // Remove active class from links
    if (assistLink) assistLink.classList.remove('active');
    if (simLink) simLink.classList.remove('active');
    if (simV2Link) simV2Link.classList.remove('active');
    if (simCreativeLink) simCreativeLink.classList.remove('active');
    if (rulesLink) rulesLink.classList.remove('active');
    if (campaignsLink) campaignsLink.classList.remove('active');
    if (pracasLink) pracasLink.classList.remove('active');
    if (tooltipsLink) tooltipsLink.classList.remove('active');

    if (pageId === 'assistente') {
        if (assistPage) assistPage.style.display = 'grid';
        if (assistLink) assistLink.classList.add('active');
    } else if (pageId === 'simulador') {
        if (simPage) simPage.style.display = 'grid';
        if (simLink) simLink.classList.add('active');
        const commodity = document.getElementById('sim-commodity').value;
        initTradingViewWidget(commodity);
    } else if (pageId === 'simulador-v2') {
        if (simV2Page) simV2Page.style.display = 'flex';
        if (simV2Link) simV2Link.classList.add('active');
        if (window.hasSimulated) calculateSimulation();
    } else if (pageId === 'simulador-criativo') {
        if (simCreativePage) simCreativePage.style.display = 'flex';
        if (simCreativeLink) simCreativeLink.classList.add('active');
        calculateSimulation();
    } else if (pageId === 'regras') {
        if (rulesPage) rulesPage.style.display = 'block';
        if (rulesLink) rulesLink.classList.add('active');
    } else if (pageId === 'campanhas') {
        if (campaignsPage) campaignsPage.style.display = 'block';
        if (campaignsLink) campaignsLink.classList.add('active');
        renderCampaignsTable();
    } else if (pageId === 'pracas') {
        if (pracasPage) pracasPage.style.display = 'block';
        if (pracasLink) pracasLink.classList.add('active');
        renderPracasTable();
    } else if (pageId === 'tooltips') {
        if (tooltipsPage) tooltipsPage.style.display = 'block';
        if (tooltipsLink) tooltipsLink.classList.add('active');
        renderTooltipsTable();
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
    // Toggle chart card visibility based on commodity selection
    ['chart-card-cfd', 'v2-chart-card-cfd'].forEach(id => {
        const card = document.getElementById(id);
        if (card) {
            card.style.display = value ? 'block' : 'none';
        }
    });


    if (!value) {
        // No commodity selected — clear barter-specific labels and recalculate
        calculateSimulation();
        return;
    }

    const isSoy = value === 'Soja';
    const currencySign = selectedCurrency === 'BRL' ? 'R$' : 'USD';
    const unitSymbol = isSoy ? 'sc' : 'lp';

    // Update labels and suffixes
    const labelEl = document.getElementById('sim-preco-bruto-label');
    if (labelEl) labelEl.textContent = `Preço Commodity Bruto (FOB) (${currencySign}/${unitSymbol})`;
    const suffixEl = document.getElementById('sim-preco-bruto-suffix');
    if (suffixEl) suffixEl.textContent = `${currencySign}/${unitSymbol}`;
    const descLabelEl = document.getElementById('sim-descontos-label');
    if (descLabelEl) descLabelEl.textContent = isSoy ? 'Ativo (Senar + Fethab)' : 'Ativo (Senar + Fial)';

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

    // Competitor campaign cashback rate is from the campaign or fallback to activeCampanhaValorizacaoOutras
    const valPctMarket = inputs.valPctOutras !== undefined ? inputs.valPctOutras : activeCampanhaValorizacaoOutras;

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

    // Regional tax split
    const plaza = wsysPlazas.find(p => p.nome === regiao || `${p.nome} (${p.estado})` === regiao);
    let fixedTaxUSDProposta = 0;
    let pctTaxUSDProposta = 0;
    let fixedTaxUSDMarket = 0;
    let pctTaxUSDMarket = 0;

    if (descontoAtivo) {
        if (plaza) {
            fixedTaxUSDProposta = plaza.impFixo / (currency === 'BRL' ? cambio : 1.0);
            pctTaxUSDProposta = commBrutoUSD * (plaza.impPct / 100);
            fixedTaxUSDMarket = plaza.impFixo / (currency === 'BRL' ? cambio : 1.0);
            pctTaxUSDMarket = commBrutoUSDMarket * (plaza.impPct / 100);
        } else {
            // Fallback
            let impFixo = 0.60;
            let impPct = 0.20;
            if (regiao === 'Campo Novo do Parecis (MT)') { impFixo = 0.60; impPct = 0.20; }
            else if (regiao === 'Sorriso (MT)') { impFixo = 0.65; impPct = 0.25; }
            else if (regiao === 'Querência (MT)') { impFixo = 0.70; impPct = 0.22; }
            else if (regiao === 'Rio Verde (GO)') { impFixo = 0.40; impPct = 0.15; }
            else if (regiao === 'Dourados (MS)') { impFixo = 0.30; impPct = 0.10; }
            else if (regiao === 'Cascavel (PR)') { impFixo = 0.0; impPct = 0.0; }

            fixedTaxUSDProposta = impFixo / (currency === 'BRL' ? cambio : 1.0);
            pctTaxUSDProposta = commBrutoUSD * (impPct / 100);
            fixedTaxUSDMarket = impFixo / (currency === 'BRL' ? cambio : 1.0);
            pctTaxUSDMarket = commBrutoUSDMarket * (impPct / 100);
        }
    }
    const taxDeductionUSDProposta = fixedTaxUSDProposta + pctTaxUSDProposta;
    const taxDeductionUSDMarket = fixedTaxUSDMarket + pctTaxUSDMarket;

    const commLivreUSDProposta = commBrutoUSD - taxDeductionUSDProposta;
    const commLivreUSDMarket = commBrutoUSDMarket - taxDeductionUSDMarket;

    // Volume de Troca Físico Inicial rounded UP
    const volTrocaProposta = commLivreUSDProposta > 0 ? Math.ceil(credLimitUSD / commLivreUSDProposta) : 0;
    const volTrocaMarket = commLivreUSDMarket > 0 ? Math.ceil(credLimitUSD / commLivreUSDMarket) : 0;

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
        fixedTaxUSDProposta, fixedTaxUSDMarket,
        pctTaxUSDProposta, pctTaxUSDMarket,
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

// Global selected modality id
let selectedModalityId = null;
let lastSimulationResult = null; // store to redraw when selected modality changes

window.hasSimulated = false;

function handleFormSimulate(e) {
    if (e) e.preventDefault();
    window.hasSimulated = true;
    hasSimulated = true;
    calculateSimulation();

    // Scroll to the results of whichever layout is currently active
    const isV2Active = document.getElementById('page-simulador-v2') &&
        document.getElementById('page-simulador-v2').style.display !== 'none';
    const targetId = isV2Active ? 'v2-sim-results-wrapper' : 'sim-results-wrapper';
    const target = document.getElementById(targetId);
    if (target && window.innerWidth < 1024) {
        target.scrollIntoView({ behavior: 'smooth' });
    }
}
window.handleFormSimulate = handleFormSimulate;

function calculateSimulation() {
    const placeholder = document.getElementById('sim-placeholder-card');
    const resultsWrapper = document.getElementById('sim-results-wrapper');
    const v2ResultsWrapper = document.getElementById('v2-sim-results-wrapper');

    // Determine which layout is visible
    const v2Page = document.getElementById('page-simulador-v2');
    const isV2Active = v2Page && v2Page.style.display !== 'none';

    if (!window.hasSimulated && !hasSimulated) {
        if (placeholder) placeholder.style.display = 'block';
        if (resultsWrapper) resultsWrapper.style.display = 'none';
        if (v2ResultsWrapper) v2ResultsWrapper.style.display = 'none';
        return;
    }

    if (placeholder) placeholder.style.display = 'none';
    // Show results in the active layout's container
    if (isV2Active) {
        if (v2ResultsWrapper) v2ResultsWrapper.style.display = 'flex';
        // Keep layout 1 results hidden while on layout 2
        if (resultsWrapper) resultsWrapper.style.display = 'none';
    } else {
        if (resultsWrapper) resultsWrapper.style.display = 'block';
        if (v2ResultsWrapper) v2ResultsWrapper.style.display = 'none';
    }

    const commoditySelect = document.getElementById('sim-commodity');
    if (!commoditySelect) return;
    const commodity = commoditySelect.value; // may be empty string

    const regiaoEl = document.getElementById('sim-regiao');
    const regiao = regiaoEl ? regiaoEl.value : '';

    const creditRaw = getRawCurrencyValue(document.getElementById('sim-credito').value);
    const commBrutoRaw = parseFloat(document.getElementById('sim-preco-bruto').value) || 0;
    const descontoAtivo = document.getElementById('sim-descontos').checked;
    const prazo = parseFloat(document.getElementById('sim-prazo').value) || 0;
    const jurosAnual = parseFloat(document.getElementById('sim-juros-anual').value) || 0;
    const valPctProposta = parseFloat(document.getElementById('sim-campanha-val').value) || 0;

    // Distances: treat empty as "not provided"
    const distChaoRaw = document.getElementById('sim-dist-chao').value;
    const distAsfaltoRaw = document.getElementById('sim-dist-asfalto').value;
    const distChao = distChaoRaw !== '' ? parseFloat(distChaoRaw) : NaN;
    const distAsfalto = distAsfaltoRaw !== '' ? parseFloat(distAsfaltoRaw) : NaN;

    const freteChaoRaw = parseFloat(document.getElementById('sim-frete-chao').value) || 0;
    const freteAsfaltoRaw = parseFloat(document.getElementById('sim-frete-asfalto').value) || 0;
    const cambio = parseFloat(document.getElementById('sim-cambio').value) || 1.0;

    // Determine if Barter can be calculated
    const canBarter = !!(commodity && regiao && !isNaN(distChao) && !isNaN(distAsfalto));

    // Store canBarter for PDF
    window.lastCanBarter = canBarter;
    window.lastSimCommodity = commodity;

    // Call standalone math calculator (only fully runs barter when canBarter)
    const res = canBarter ? runSimulationMath({
        commodity, regiao, creditRaw, commBrutoRaw, descontoAtivo,
        prazo, jurosAnual, valPctProposta,
        distChao, distAsfalto,
        freteChaoRaw, freteAsfaltoRaw, cambio, currency: selectedCurrency,
        valPctOutras: activeCampanhaValorizacaoOutras
    }) : null;

    lastSimulationResult = res;

    // Format helper based on currency selection
    const formatSelectedCurrency = (val) => {
        return selectedCurrency === 'BRL' ? formatBRL(val) : formatUSD(val);
    };

    const formatSelectedCurrencyExtended = (val) => {
        return selectedCurrency === 'BRL' ? formatBRLExtended(val) : formatUSDExtended(val);
    };

    const factor = selectedCurrency === 'BRL' ? cambio : 1.0;

    // 1. Update Resumo da Operação Banner across all layouts
    const today = new Date();
    const validityDate = new Date();
    validityDate.setDate(today.getDate() + 30);
    ['summary-value', 'v2-summary-value'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatSelectedCurrency(creditRaw);
    });
    ['summary-date', 'v2-summary-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = today.toLocaleDateString('pt-BR');
    });
    ['summary-validity', 'v2-summary-validity'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = validityDate.toLocaleDateString('pt-BR');
    });

    // 2. Update Summary metrics (safely handling missing ref card)
    if (document.getElementById('ref-preco')) document.getElementById('ref-preco').textContent = formatSelectedCurrency(commBrutoRaw);
    if (document.getElementById('ref-cambio')) document.getElementById('ref-cambio').textContent = formatUSD(cambio);
    if (document.getElementById('ref-juros')) document.getElementById('ref-juros').textContent = `${jurosAnual.toFixed(2)}% a.a.`;
    if (document.getElementById('ref-prazo')) document.getElementById('ref-prazo').textContent = `${prazo} dias`;
    if (document.getElementById('ref-val-nutrade')) document.getElementById('ref-val-nutrade').textContent = `${valPctProposta.toFixed(2)}%`;
    if (document.getElementById('ref-val-outras')) document.getElementById('ref-val-outras').textContent = `${activeCampanhaValorizacaoOutras.toFixed(2)}%`;
    if (document.getElementById('ref-frete-chao')) document.getElementById('ref-frete-chao').textContent = `R$ ${freteChaoRaw.toFixed(2)}/KM`;
    if (document.getElementById('ref-frete-asfalto')) document.getElementById('ref-frete-asfalto').textContent = `R$ ${freteAsfaltoRaw.toFixed(2)}/KM`;

    // 3. Modalidades Tab calculations and structures (incorporating Simulador_outras_Modalidades.xlsx formulas)
    const campSelect = document.getElementById('sim-campanha-select');
    const campId = campSelect ? campSelect.value : 'custom';

    let campObj = (campId !== 'custom') ? campaigns.find(c => c.id == campId) : null;

    // Helper to calculate a financial product using Simulador_outras_Modalidades.xlsx formulas
    function computeFinancialProduct(productKey, defaultRateAM, defaultDiscountVPAN, defaultIncentive, defaultTipoJuros, defaultContagemDias) {
        let tax = null;
        if (campObj && campObj.taxas) {
            tax = campObj.taxas.find(t => {
                const name = (t.produtoFinanceiro || '').toLowerCase();
                const key = productKey.toLowerCase();
                return name.includes(key) || (key === 'syde' && name.includes('fidc')) || (key === 'fiso' && name.includes('fiso')) || (key === 'syngenta' && name.includes('prazo'));
            });
        }

        const taxaMensal = tax ? tax.jurosMensais : defaultRateAM;
        const descontoVPAN = tax ? (tax.desconto || 0) : defaultDiscountVPAN;
        const incentivo = tax ? (tax.incentivo || 0) : defaultIncentive;
        const tipoJuros = tax ? tax.tipoJuros : defaultTipoJuros;
        const contagemDias = tax ? tax.contagemDias : defaultContagemDias;

        const nMesesCorridos = prazo / 30.0;
        let nMesesCalculo;

        if (contagemDias === 'Uteis' || contagemDias === 'Dias úteis') {
            let diasUteis = 0;
            if (campObj && campObj.desembolso && campObj.vencimento) {
                diasUteis = calculateBusinessDays(campObj.desembolso, campObj.vencimento);
            } else {
                diasUteis = Math.round((prazo / 30.0) * 22);
            }
            nMesesCalculo = diasUteis / 22.0;
        } else {
            nMesesCalculo = nMesesCorridos;
        }

        const vfIntermed = creditRaw * (1.0 - (descontoVPAN / 100.0));
        let vfComJuros;
        if (tipoJuros === 'Composto') {
            vfComJuros = vfIntermed * Math.pow(1.0 + (taxaMensal / 100.0), nMesesCalculo);
        } else {
            vfComJuros = vfIntermed * (1.0 + (taxaMensal / 100.0) * nMesesCalculo);
        }

        const valorTotal = vfComJuros * (1.0 - (incentivo / 100.0));
        const custoTotal = valorTotal - creditRaw;
        const custoTotalPct = (valorTotal / creditRaw - 1.0) * 100.0;
        const custoAmPct = (nMesesCorridos > 0) ? (custoTotalPct / nMesesCorridos) : 0;

        return {
            taxaMensal,
            descontoVPAN,
            incentivo,
            tipoJuros,
            contagemDias,
            valorTotal,
            custoTotal,
            custoTotalPct,
            custoAmPct,
            jurosAnual: taxaMensal * 12
        };
    }

    // 1. Syde (FIDC) - Formula: VPAN (4%), Composto, Dias Úteis (/22)
    const calcSyde = computeFinancialProduct('Syde', 1.85, 4.0, 0.0, 'Composto', 'Dias úteis');

    // 2. Fiso (Bancário) - Formula: Simples, Dias Corridos (/30), Incentivo (3%)
    const calcFiso = computeFinancialProduct('Fiso', 1.85, 0.0, 3.0, 'Simples', 'Dias corridos');

    // 3. Syngenta (Prazo / On-Balance) - Formula: Simples, Dias Corridos (/30)
    const calcSyngenta = computeFinancialProduct('Syngenta', 1.85, 0.0, 0.0, 'Simples', 'Dias corridos');

    // 4. Barter Nutrade & Barter Outras Tradings (only when canBarter)
    const nMesesCorridos = prazo / 30.0;
    const nMesesStr = nMesesCorridos.toFixed(1).replace('.', ',');

    const jurosPeriodoBarter = (prazo / 360) * (jurosAnual / 100);
    const freteTotalBarter = res ? (res.freteTotalUSDProposta * factor) : 0;
    const freteTotalMarket = res ? (res.freteTotalUSDMarket * factor) : 0;

    const totalBarter = res ? ((res.volFinalProposta * commBrutoRaw) + freteTotalBarter) : 0;
    const totalMarket = res ? ((res.volFinalMarket * (res.commBrutoUSDMarket * factor)) + freteTotalMarket) : 0;

    const custoTotalBarter = totalBarter - creditRaw;
    const custoTotalMarket = totalMarket - creditRaw;
    const custoTotalPctBarter = (custoTotalBarter / creditRaw) * 100.0;
    const custoTotalPctMarket = (custoTotalMarket / creditRaw) * 100.0;
    const custoAmPctBarter = (nMesesCorridos > 0) ? (custoTotalPctBarter / nMesesCorridos) : 0;
    const custoAmPctMarket = (nMesesCorridos > 0) ? (custoTotalPctMarket / nMesesCorridos) : 0;

    let diasUteisSyde = 0;
    if (campObj && campObj.desembolso && campObj.vencimento) {
        diasUteisSyde = calculateBusinessDays(campObj.desembolso, campObj.vencimento);
    } else {
        diasUteisSyde = Math.round((prazo / 30.0) * 22);
    }

    // Date formatting helper for campaign dates
    function formatDateBR(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

    let carenciaStr = campObj && campObj.desembolso ? formatDateBR(campObj.desembolso) : '31/12/2026';
    let vencimentoStr = campObj && campObj.vencimento ? formatDateBR(campObj.vencimento) : '01/01/2027';

    // List all 5 modalities to show and sort (Barter Nutrade, Barter Outras Tradings, FISO, Syngenta, Syde)
    const modalities = [
        {
            id: 'barter_nutrade',
            name: 'Barter (Nutrade)',
            type: 'barter',
            jurosAnual: jurosAnual,
            jurosPeriodo: jurosPeriodoBarter,
            jurosMensal: jurosAnual / 12,
            prazoDisplay: `${prazo} dias (${nMesesStr} meses)`,
            prazoExplicacao: `Prazo calculado de ${prazo} dias decorrido entre o desembolso e o vencimento da safra 2026.`,
            vpanDisplay: '0,00%',
            vpanExplicacao: 'Desconto à vista (VPAN) não é aplicável na modalidade Barter, pois o benefício comercial ocorre via Cashback de campanha e Incentivo de prazo.',
            incentivoLabel: 'Incentivo Barter',
            incentivoDisplay: res ? `+${(res.incentivoBarterPct * 100).toFixed(2)}%` : '0,00%',
            incentivoExplicacao: res ? `Incentivo de prazo de +${(res.incentivoBarterPct * 100).toFixed(2)}% calculado sobre o Preço TP (Valor Presente) com base na carência.` : 'Sem incentivo.',
            cashbackDisplay: `+${valPctProposta.toFixed(2)}%`,
            cashbackExplicacao: `Cashback de campanha comercial Nutrade de +${valPctProposta.toFixed(2)}% aplicado sobre o valor bruto da operação.`,
            garantia: 'CPR Física e Seguro Agrícola',
            garantiaExplicacao: 'Garantia vinculada à CPR Física da produção e seguro agrícola com a Nutrade.',
            volInicial: res ? res.volTrocaProposta : 0,
            volFinal: res ? res.volFinalProposta : 0,
            volEconomia: res ? (res.volTrocaProposta - res.volFinalProposta) : 0,
            unitAbbr: res ? res.unitSymbol : 'sc',
            custoTotal: custoTotalBarter,
            custoTotalPct: custoTotalPctBarter,
            custoAmPct: custoAmPctBarter,
            valorTotal: totalBarter
        },
        {
            id: 'barter_market',
            name: 'Barter (Outras Tradings)',
            type: 'barter',
            jurosAnual: jurosAnual,
            jurosPeriodo: jurosPeriodoBarter,
            jurosMensal: jurosAnual / 12,
            prazoDisplay: `${prazo} dias (${nMesesStr} meses)`,
            prazoExplicacao: `Prazo calculado de ${prazo} dias corridos praticado pelas tradings de mercado.`,
            vpanDisplay: '0,00%',
            vpanExplicacao: 'Desconto à vista (VPAN) não aplicável nesta modalidade de entrega física.',
            incentivoLabel: 'Incentivo Barter',
            incentivoDisplay: '0,00%',
            incentivoExplicacao: 'Sem incentivo de prazo adicional oferecido pelas tradings concorrentes.',
            cashbackDisplay: `+${activeCampanhaValorizacaoOutras.toFixed(2)}%`,
            cashbackExplicacao: `Valorização comercial padrão oferecida pelas tradings concorrentes de mercado (+${activeCampanhaValorizacaoOutras.toFixed(2)}%).`,
            garantia: 'CPR Física e Seguro Agrícola',
            garantiaExplicacao: 'Garantia padrão de mercado vinculada à CPR Física e seguro.',
            volInicial: res ? res.volTrocaMarket : 0,
            volFinal: res ? res.volFinalMarket : 0,
            volEconomia: res ? (res.volTrocaMarket - res.volFinalMarket) : 0,
            unitAbbr: res ? res.unitSymbol : 'sc',
            custoTotal: custoTotalMarket,
            custoTotalPct: custoTotalPctMarket,
            custoAmPct: custoAmPctMarket,
            valorTotal: totalMarket
        },
        {
            id: 'fiso',
            name: 'FISO',
            type: 'financial',
            jurosAnual: calcFiso.jurosAnual,
            jurosPeriodo: calcFiso.custoTotalPct / 100,
            jurosMensal: calcFiso.taxaMensal,
            prazoDisplay: `${prazo} dias (${nMesesStr} meses)`,
            prazoExplicacao: `Prazo financeiro calculado de ${prazo} dias corridos (base /30).`,
            vpanDisplay: '0,00%',
            vpanExplicacao: 'A modalidade FISO não concede desconto à vista VPAN.',
            incentivoLabel: 'Incentivo',
            incentivoDisplay: calcFiso.incentivo > 0 ? `-${calcFiso.incentivo.toFixed(2)}%` : '0,00%',
            incentivoExplicacao: calcFiso.incentivo > 0 ? `Rebate de incentivo comercial de campanha de -${calcFiso.incentivo.toFixed(2)}% aplicado à taxa/operação FISO.` : 'Sem rebate de incentivo aplicável.',
            cashbackDisplay: '0,00%',
            cashbackExplicacao: 'Sem programa de cashback em grãos.',
            garantia: 'Sem garantia (venda a prazo cedida a um parceiro)',
            garantiaExplicacao: 'FISO não possui garantia patrimonial exigida. É uma cessão de crédito em que a venda a prazo é cedida a um parceiro.',
            custoTotal: calcFiso.custoTotal,
            custoTotalPct: calcFiso.custoTotalPct,
            custoAmPct: calcFiso.custoAmPct,
            valorTotal: calcFiso.valorTotal
        },
        {
            id: 'syngenta',
            name: 'Syngenta',
            type: 'financial',
            jurosAnual: calcSyngenta.jurosAnual,
            jurosPeriodo: calcSyngenta.custoTotalPct / 100,
            jurosMensal: calcSyngenta.taxaMensal,
            prazoDisplay: `${prazo} dias (${nMesesStr} meses)`,
            prazoExplicacao: `Prazo financeiro calculado de ${prazo} dias corridos (On-Balance).`,
            vpanDisplay: '0,00%',
            vpanExplicacao: 'Faturamento a prazo direto On-Balance Syngenta sem concessão de desconto à vista (VPAN).',
            incentivoLabel: 'Incentivo',
            incentivoDisplay: '0,00%',
            incentivoExplicacao: 'Sem incentivo de campanha aplicável.',
            cashbackDisplay: '0,00%',
            cashbackExplicacao: 'Sem programa de cashback em grãos.',
            garantia: 'Garantia alinhada diretamente com o time de crédito',
            garantiaExplicacao: 'Estrutura de garantias alinhada diretamente com a mesa de crédito corporativa Syngenta.',
            custoTotal: calcSyngenta.custoTotal,
            custoTotalPct: calcSyngenta.custoTotalPct,
            custoAmPct: calcSyngenta.custoAmPct,
            valorTotal: calcSyngenta.valorTotal
        },
        {
            id: 'syde',
            name: 'Syde',
            type: 'financial',
            jurosAnual: calcSyde.jurosAnual,
            jurosPeriodo: calcSyde.custoTotalPct / 100,
            jurosMensal: calcSyde.taxaMensal,
            prazoDisplay: `${prazo} dias (${diasUteisSyde} úteis)`,
            prazoExplicacao: `Prazo financeiro de ${prazo} dias corridos, correspondendo a ${diasUteisSyde} dias úteis no cálculo de juros FIDC.`,
            vpanDisplay: calcSyde.descontoVPAN > 0 ? `-${calcSyde.descontoVPAN.toFixed(2)}% à vista` : '0,00%',
            vpanExplicacao: calcSyde.descontoVPAN > 0 ? `Desconto VPAN (Valor Presente À Vista) de -${calcSyde.descontoVPAN.toFixed(2)}% aplicado à vista sobre o valor base da operação antes dos juros.` : 'Sem desconto VPAN à vista.',
            incentivoLabel: 'Incentivo',
            incentivoDisplay: '0,00%',
            incentivoExplicacao: 'Sem incentivo adicional aplicável.',
            cashbackDisplay: '0,00%',
            cashbackExplicacao: 'Sem programa de cashback em grãos.',
            garantia: 'Nota promissória ou CPR financeira sem penhor',
            garantiaExplicacao: 'Formalizado via Nota Promissória (NP) ou CPR Financeira (CPR-F) sem exigência de penhor agrícola.',
            custoTotal: calcSyde.custoTotal,
            custoTotalPct: calcSyde.custoTotalPct,
            custoAmPct: calcSyde.custoAmPct,
            valorTotal: calcSyde.valorTotal
        }
    ];

    // Filter out Barter modalities if inputs for Barter calculation are incomplete
    const availableModalities = canBarter ? modalities : modalities.filter(m => m.type !== 'barter');

    // Sort modalities from best to worst (lowest total payment)
    availableModalities.sort((a, b) => a.custoTotal - b.custoTotal);

    // Save modalities list globally
    window.modalitiesData = availableModalities;

    // Render sorted modality cards in all active layout containers
    const containers = [
        document.getElementById('modality-cards-list'),
        document.getElementById('v2-modality-cards-list'),
        document.getElementById('creative-modality-cards-list')
    ].filter(Boolean);

    if (!window.pdfSelectedModalities) window.pdfSelectedModalities = {};

    containers.forEach(cardsContainer => {
        cardsContainer.innerHTML = '';
        availableModalities.forEach((m, idx) => {
            const isBest = idx === 0;
            const isSelected = selectedModalityId === m.id || (selectedModalityId === null && isBest);
            if (selectedModalityId === null && isBest) {
                selectedModalityId = m.id;
            }

            if (window.pdfSelectedModalities[m.id] === undefined) {
                window.pdfSelectedModalities[m.id] = true;
            }
            const isPdfChecked = window.pdfSelectedModalities[m.id] !== false;

            const card = document.createElement('div');
            card.className = `modality-card ${isBest ? 'best-option' : ''} ${isSelected ? 'selected' : ''}`;
            card.setAttribute('data-modality-id', m.id);
            card.onclick = (e) => {
                if (e.target.closest('.tooltip-container') || e.target.closest('.modality-card-checkbox-wrapper')) return;
                selectModality(m.id);
            };

            card.innerHTML = `
                <div class="modality-card-header">
                    <div class="modality-card-title-row" style="padding-right: 80px;">
                        <span class="modality-card-title">${m.name}</span>
                    </div>
                    <div class="modality-card-checkbox-wrapper" onclick="event.stopPropagation();">
                        <label class="modality-card-checkbox-label" title="Marcar para incluir no PDF compartilhado">
                            <input type="checkbox" class="modality-pdf-checkbox" data-modality-id="${m.id}" ${isPdfChecked ? 'checked' : ''} onchange="toggleModalityPdfSelection('${m.id}', this.checked)">
                            <span><i class="fa-solid fa-file-pdf"></i> PDF</span>
                        </label>
                    </div>
                    <div class="modality-card-dates">Data de carência <strong>${carenciaStr}</strong> &nbsp;|&nbsp; Vencimento <strong>${vencimentoStr}</strong></div>
                </div>
                <div class="modality-card-body">
                    <ul class="modality-bullet-list">
                        <li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Taxa Juros Anual
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>Fórmula:</strong> Taxa de juros anualizada contratual da modalidade (${m.jurosAnual.toFixed(2)}% a.a.).</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val">${m.jurosAnual.toFixed(2)}% a.a.</strong>
                        </li>
                        <li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Taxa Efetiva a.m.
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>Fórmula:</strong> Taxa de juros efetiva mensal da operação (${m.jurosMensal.toFixed(2)}% a.m.).</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val">${m.jurosMensal.toFixed(2)}% a.m.</strong>
                        </li>
                        <li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Prazo Calculado
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>Prazo Calculado:</strong> ${m.prazoExplicacao}</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val">${m.prazoDisplay}</strong>
                        </li>
                        ${m.type !== 'barter' ? `<li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Desconto VPAN
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>Desconto VPAN:</strong> ${m.vpanExplicacao}</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val ${m.vpanDisplay.includes('-') ? 'text-teal' : ''}">${m.vpanDisplay}</strong>
                        </li>` : ''}
                        <li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                ${m.incentivoLabel}
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>${m.incentivoLabel}:</strong> ${m.incentivoExplicacao}</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val ${m.incentivoDisplay.includes('+') || m.incentivoDisplay.includes('-') ? 'text-teal' : ''}">${m.incentivoDisplay}</strong>
                        </li>
                        <li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Cashback
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>Cashback:</strong> ${m.cashbackExplicacao}</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val ${m.cashbackDisplay.includes('+') ? 'text-teal' : ''}">${m.cashbackDisplay}</strong>
                        </li>
                        ${m.type === 'barter' ? `<li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Volume Final Equivalente
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text">Volume de troca físico final líquido de grãos a ser entregue na liquidação da safra.</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val text-teal">${formatNumber(m.volFinal, 0)} ${m.unitAbbr}</strong>
                        </li>
                        <li class="modality-bullet-item">
                            <span class="modality-bullet-label">
                                Economia em Grãos
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text">Quantidade total de sacas/libras economizadas graças aos benefícios de Cashback e Incentivo de prazo.</span>
                                </span>
                            </span>
                            <strong class="modality-bullet-val text-teal">+${formatNumber(m.volEconomia, 0)} ${m.unitAbbr} economizados</strong>
                        </li>` : ''}
                        <li class="modality-bullet-item modality-guarantee-item">
                            <span class="modality-bullet-label">
                                Garantias Exigidas
                                <span class="tooltip-container">
                                    <i class="fa-regular fa-circle-question"></i>
                                    <span class="tooltip-text"><strong>Garantias Exigidas:</strong> ${m.garantiaExplicacao}</span>
                                </span>
                            </span>
                            <strong class="modality-guarantee-text">${m.garantia}</strong>
                        </li>
                    </ul>
                    <div class="modality-card-total-box">
                        <div class="modality-card-total-header">
                            <span class="modality-card-total-label">Valor Total Equivalente</span>
                            <span class="tooltip-container">
                                <i class="fa-regular fa-circle-question"></i>
                                <span class="tooltip-text"><strong>Fórmula:</strong> ${m.type === 'barter' ? '(Volume Final × Preço Grão FOB) + Frete Total' : 'Crédito × (1 - Desc. VPAN) × (1 + Taxa × Meses) × (1 - Incentivo)'}. Total de ${formatSelectedCurrency(m.valorTotal)}</span>
                            </span>
                        </div>
                        <span class="modality-card-total-value">
                            ${formatSelectedCurrency(m.valorTotal)}
                            ${m.type === 'barter' ? `
                            <span style="display:flex; align-items:center; gap:6px; margin-top:8px; padding:8px 12px; background:rgba(14,165,118,0.12); border:1px solid rgba(14,165,118,0.3); border-radius:8px;">
                                <i class="fa-solid fa-wheat-awn" style="font-size:15px; color:var(--primary-medium);"></i>
                                <span style="display:flex; flex-direction:column; line-height:1.3;">
                                    <strong style="font-size:16px; font-weight:800; color:var(--primary-deep); letter-spacing:-0.3px;">${formatNumber(m.volFinal, 0)} ${m.unitAbbr}</strong>
                                    <span style="font-size:11.5px; color:#0d9488; font-weight:600;">+${formatNumber(m.volEconomia, 0)} ${m.unitAbbr} de economia</span>
                                </span>
                                <span class="tooltip-container" style="margin-left:auto;">
                                    <i class="fa-regular fa-circle-question" style="font-size:14px; color:var(--text-secondary); cursor:help;"></i>
                                    <span class="tooltip-text" style="width:280px;">
                                        <strong>Sacas Equivalentes — Fórmula:</strong><br>
                                        1️⃣ <strong>Vol. Inicial:</strong> Crédito ÷ Preço Livre = ${formatNumber(m.volInicial, 0)} ${m.unitAbbr}<br>
                                        2️⃣ <strong>Cashback em ${m.unitAbbr}:</strong> Cashback USD ÷ Preço Livre<br>
                                        3️⃣ <strong>Incentivo em ${m.unitAbbr}:</strong> Incentivo USD ÷ Preço Livre<br>
                                        4️⃣ <strong>Vol. Final = Vol. Inicial − (Cashback sc + Incentivo sc)</strong><br>
                                        ✅ <em>Fórmula alinhada com a planilha Simulador_CashBack_Barter_2026</em><br><br>
                                        <strong>Valor Total Equivalente — Fórmula:</strong><br>
                                        (Vol. Final × Preço FOB Bruto) + Frete Total
                                    </span>
                                </span>
                            </span>` : ''}

                        </span>
                    </div>
                </div>
                <div class="modality-card-footer">
                    <div class="modality-cost-row modality-cost-total">
                        <span>
                            Custo Real Total
                            <span class="tooltip-container">
                                <i class="fa-regular fa-circle-question"></i>
                                <span class="tooltip-text">
                                    <strong>Fórmula do Custo Real Total:</strong><br>
                                    • Valor Total: ${formatSelectedCurrency(m.valorTotal)}<br>
                                    • Valor da Operação: ${formatSelectedCurrency(creditRaw)}<br>
                                    • Custo Acumulado: ((${formatSelectedCurrency(m.valorTotal)} / ${formatSelectedCurrency(creditRaw)}) - 1) × 100 = <strong>${m.custoTotalPct.toFixed(2)}%</strong>
                                </span>
                            </span>
                        </span>
                        <span>${m.custoTotalPct.toFixed(2)}%</span>
                    </div>
                    <div class="modality-cost-row modality-cost-operation">
                        <span>
                            Custo Real Operação
                            <span class="tooltip-container" style="color: #ffffff;">
                                <i class="fa-regular fa-circle-question" style="color: #ffffff;"></i>
                                <span class="tooltip-text">
                                    <strong>Fórmula do Custo Real da Operação:</strong><br>
                                    • Custo Real Total (%): <strong>${m.custoTotalPct.toFixed(2)}%</strong><br>
                                    • Prazo em Meses: ${prazo} dias / 30 = <strong>${nMesesCorridos.toFixed(2)} meses</strong><br>
                                    • Taxa Efetiva da Operação: ${m.custoTotalPct.toFixed(2)}% / ${nMesesCorridos.toFixed(2)} = <strong>${m.custoAmPct.toFixed(3)}% a.m.</strong><br><br>
                                    <em>Mede a taxa mensal efetiva ponderada real da operação.</em>
                                </span>
                            </span>
                        </span>
                        <span>${m.custoAmPct.toFixed(3)}% a.m.</span>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        // Elevate the hovered card so its tooltips always appear on top of neighbors
        bindCardTooltipElevation(cardsContainer);
    });
}

// Attach mouseover elevation logic to the cards grid after each render
function bindCardTooltipElevation(grid) {
    if (!grid) return;
    // Clone and replace to remove previous listeners
    const fresh = grid.cloneNode(true);
    fresh.id = grid.id; // Preserve the id (e.g. modality-cards-list)
    grid.parentNode.replaceChild(fresh, grid);

    fresh.addEventListener('mouseover', function (e) {
        const tooltipIcon = e.target.closest('.tooltip-container');
        if (!tooltipIcon) return;
        const card = tooltipIcon.closest('.modality-card');
        if (!card) return;
        fresh.querySelectorAll('.modality-card').forEach(c => { c.style.zIndex = '1'; });
        card.style.zIndex = '9999';
    });
    fresh.addEventListener('mouseleave', function () {
        fresh.querySelectorAll('.modality-card').forEach(c => { c.style.zIndex = '1'; });
    });

    // Re-attach click delegation since cloneNode stripped inline onclick
    fresh.addEventListener('click', function (e) {
        if (e.target.closest('.tooltip-container')) return;
        const card = e.target.closest('.modality-card');
        if (!card || !window.modalitiesData) return;
        const allCards = fresh.querySelectorAll('.modality-card');
        const idxArr = Array.from(allCards);
        const idx = idxArr.indexOf(card);
        if (idx >= 0 && window.modalitiesData[idx]) {
            selectModality(window.modalitiesData[idx].id);
        }
    });
}

function selectModality(modId) {
    selectedModalityId = modId;
    calculateSimulation(); // Re-trigger to redraw selected state
}


function hideDetailedBreakdown() {
    document.getElementById('detailed-breakdown-card').style.display = 'none';
}

function showDetailedBreakdown(modId) {
    const card = document.getElementById('detailed-breakdown-card');
    const tableBarter = document.getElementById('detailed-table-barter');
    const tableFinancial = document.getElementById('detailed-table-financial');

    if (!card) return;
    card.style.display = 'block';

    const res = lastSimulationResult;
    const factor = selectedCurrency === 'BRL' ? parseFloat(document.getElementById('sim-cambio').value) || 1.0 : 1.0;
    const isSoy = document.getElementById('sim-commodity').value === 'Soja';
    const unitSymbol = isSoy ? 'sc' : 'lp';
    const formatSelectedCurrency = (val) => selectedCurrency === 'BRL' ? formatBRL(val) : formatUSD(val);
    const formatSelectedCurrencyExtended = (val) => selectedCurrency === 'BRL' ? formatBRLExtended(val) : formatUSDExtended(val);

    const activeMod = window.modalitiesData.find(m => m.id === modId);
    document.getElementById('detailed-breakdown-title').innerHTML = `Detalhamento da Modalidade: <strong>${activeMod ? activeMod.name : ''}</strong>`;

    if (modId === 'barter_nutrade' || modId === 'barter_market') {
        if (tableBarter) tableBarter.style.display = 'block';
        if (tableFinancial) tableFinancial.style.display = 'none';

        // Load Barter detail fields
        document.getElementById('td-fob-nutrade').textContent = formatSelectedCurrency(res.credLimitUSD * factor);
        document.getElementById('td-fob-market').textContent = formatSelectedCurrency(res.credLimitUSD * factor);

        document.getElementById('td-bruto-nutrade').textContent = formatSelectedCurrency(res.commBrutoUSD * factor);
        document.getElementById('td-bruto-market').textContent = formatSelectedCurrency(res.commBrutoUSDMarket * factor);

        // Split region discounts
        document.getElementById('td-desc-nutrade-estadual').textContent = `- ${formatSelectedCurrency(res.fixedTaxUSDProposta * factor)}`;
        document.getElementById('td-desc-market-estadual').textContent = `- ${formatSelectedCurrency(res.fixedTaxUSDMarket * factor)}`;

        document.getElementById('td-desc-nutrade-demais').textContent = `- ${formatSelectedCurrency(res.pctTaxUSDProposta * factor)}`;
        document.getElementById('td-desc-market-demais').textContent = `- ${formatSelectedCurrency(res.pctTaxUSDMarket * factor)}`;

        document.getElementById('td-livre-nutrade').textContent = formatSelectedCurrency(res.commLivreUSDProposta * factor);
        document.getElementById('td-livre-market').textContent = formatSelectedCurrency(res.commLivreUSDMarket * factor);

        document.getElementById('td-vol-troca-nutrade').textContent = `${formatNumber(res.volTrocaProposta)} ${unitSymbol}`;
        document.getElementById('td-vol-troca-market').textContent = `${formatNumber(res.volTrocaMarket)} ${unitSymbol}`;

        const valPctProposta = parseFloat(document.getElementById('sim-campanha-val').value) || 0;
        document.getElementById('td-valcamp-nutrade').textContent = `${valPctProposta.toFixed(2)}%`;
        document.getElementById('td-valcamp-market').textContent = `${res.valPctMarket.toFixed(2)}%`;

        document.getElementById('td-cashback-usd-nutrade').textContent = formatSelectedCurrency(res.cashbackUsdProposta * factor);
        document.getElementById('td-cashback-usd-market').textContent = formatSelectedCurrency(res.cashbackUsdMarket * factor);

        document.getElementById('td-incbarter-pct-nutrade').textContent = `${(res.incentivoBarterPct * 100).toFixed(2)}%`;
        document.getElementById('td-incbarter-pct-market').textContent = `${(res.incentivoBarterPct * 100).toFixed(2)}%`;

        document.getElementById('td-incbarter-usd-nutrade').textContent = formatSelectedCurrency(res.incentivoBarterUsd * factor);
        document.getElementById('td-incbarter-usd-market').textContent = formatSelectedCurrency(res.incentivoBarterUsd * factor);

        document.getElementById('td-totalret-nutrade').textContent = formatSelectedCurrency(res.totalRetornoUSDProposta * factor);
        document.getElementById('td-totalret-market').textContent = formatSelectedCurrency(res.totalRetornoUSDMarket * factor);

        document.getElementById('td-finalpreco-nutrade').textContent = formatSelectedCurrencyExtended(res.precoFinalUSDProposta * factor);
        document.getElementById('td-finalpreco-market').textContent = formatSelectedCurrencyExtended(res.precoFinalUSDMarket * factor);

        document.getElementById('td-finalvol-nutrade').textContent = `${formatNumber(res.volFinalProposta)} ${unitSymbol}`;
        document.getElementById('td-finalvol-market').textContent = `${formatNumber(res.volFinalMarket)} ${unitSymbol}`;

        document.getElementById('td-valreal-nutrade').textContent = `+${(res.valRealProposta * 100).toFixed(2)}%`;
        document.getElementById('td-valreal-market').textContent = `+${(res.valRealMarket * 100).toFixed(2)}%`;

        // Highlight selected column
        const colNutrade = tableBarter.querySelectorAll('tbody td.val-nutrade');
        const colMarket = tableBarter.querySelectorAll('tbody td:nth-child(3)');

        if (modId === 'barter_nutrade') {
            colNutrade.forEach(el => el.style.backgroundColor = 'rgba(34, 197, 94, 0.08)');
            colMarket.forEach(el => el.style.backgroundColor = 'transparent');
        } else {
            colNutrade.forEach(el => el.style.backgroundColor = 'transparent');
            colMarket.forEach(el => el.style.backgroundColor = 'rgba(234, 179, 8, 0.08)');
        }
    } else {
        if (tableBarter) tableBarter.style.display = 'none';
        if (tableFinancial) tableFinancial.style.display = 'block';

        // Load Financial detail fields
        const jurosBarter = window.modalitiesData.find(m => m.id === 'barter_nutrade');
        const jurosFidc = window.modalitiesData.find(m => m.id === 'fidc');
        const jurosFiso = window.modalitiesData.find(m => m.id === 'fiso');
        const jurosPrazo = window.modalitiesData.find(m => m.id === 'prazo');

        document.getElementById('mod-juros-barter').textContent = `${jurosBarter.jurosAnual.toFixed(2)}% a.a.`;
        document.getElementById('mod-juros-fidc').textContent = `${jurosFidc.jurosAnual.toFixed(2)}% a.a.`;
        document.getElementById('mod-juros-fiso').textContent = `${jurosFiso.jurosAnual.toFixed(2)}% a.a.`;
        document.getElementById('mod-juros-prazo').textContent = `${jurosPrazo.jurosAnual.toFixed(2)}% a.a.`;

        document.getElementById('mod-custo-barter').textContent = formatSelectedCurrency(jurosBarter.custoTotal);
        document.getElementById('mod-custo-fidc').textContent = formatSelectedCurrency(jurosFidc.custoTotal);
        document.getElementById('mod-custo-fiso').textContent = formatSelectedCurrency(jurosFiso.custoTotal);
        document.getElementById('mod-custo-prazo').textContent = formatSelectedCurrency(jurosPrazo.custoTotal);

        document.getElementById('mod-total-barter').textContent = formatSelectedCurrency(jurosBarter.valorTotal);
        document.getElementById('mod-total-fidc').textContent = formatSelectedCurrency(jurosFidc.valorTotal);
        document.getElementById('mod-total-fiso').textContent = formatSelectedCurrency(jurosFiso.valorTotal);
        document.getElementById('mod-total-prazo').textContent = formatSelectedCurrency(jurosPrazo.valorTotal);

        // Highlight selected column in Financial table
        const rows = tableFinancial.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                // reset styles
                for (let i = 1; i <= 4; i++) {
                    cells[i].style.backgroundColor = 'transparent';
                    cells[i].style.fontWeight = 'normal';
                }

                // apply highlights
                let colIdx = 1;
                if (modId === 'fidc') colIdx = 2;
                else if (modId === 'fiso') colIdx = 3;
                else if (modId === 'prazo') colIdx = 4;

                cells[colIdx].style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
                cells[colIdx].style.fontWeight = 'bold';
            }
        });
    }

    // Scroll table into view
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Tab switcher for comparison dashboard (kept for compatibility if any other script calls it)
function switchResultsTab(tabName) {
    if (tabName === 'barter') {
        selectModality('barter_nutrade');
    } else {
        selectModality('fidc');
    }
}

// ==================== ASSISTENTE VIRTUAL (CHAT BOT) LOGIC ====================

// Global chat state
let chatState = {
    // Steps: null | waiting_campanha | waiting_credito | waiting_commodity | waiting_regiao | waiting_distancias | waiting_dist_asfalto | waiting_confirmacao | waiting_custom_prazo | waiting_custom_juros
    step: null,
    data: {}
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
                <p>Posso ajudar com simulações de crédito agrícola e barter. Escolha uma opção abaixo ou escreva sua dúvida.</p>
                
                <div class="suggestion-chips-grid">
                    <button type="button" class="chip-btn highlight-chip" onclick="startCreditSimulationFlow()">Simular Crédito</button>
                    <button type="button" class="chip-btn" onclick="handleSuggestion('Comparar modalidades de crédito')">Comparar modalidades</button>
                    <button type="button" class="chip-btn" onclick="handleSuggestion('Quais são as garantias exigidas?')">Garantias exigidas</button>
                    <button type="button" class="chip-btn" onclick="handleSuggestion('O que é desconto VPAN?')">O que é desconto VPAN?</button>
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

// Keep backward compat alias
function startBarterSimulationFlow() { startCreditSimulationFlow(); }

// Start Credit Simulation Flow
function startCreditSimulationFlow() {
    chatState.step = 'waiting_campanha';
    chatState.data = {};

    // Fetch live exchange rate as default
    const cambioInput = document.getElementById('sim-cambio');
    chatState.data.cambio = cambioInput ? (parseFloat(cambioInput.value) || 5.15) : 5.15;
    chatState.data.currency = 'BRL';

    // Build campaign choices from the global campaigns array
    const activeCamps = campaigns.filter(c => c.status === 'Ativa');
    const campChoices = activeCamps.map(c => ({ text: c.nome, value: String(c.id) }));

    if (campChoices.length === 0) {
        addMessageToChat(
            "Não há campanhas ativas cadastradas no momento. Acesse a aba **Campanhas** para cadastrar uma campanha antes de simular.",
            "bot"
        );
        return;
    }

    addMessageToChat(
        "Olá! Vamos simular o crédito.\n\nPrimeiro, selecione a **campanha** desejada:",
        "bot",
        "choices",
        campChoices
    );
}

// Handles clicked suggestion buttons
function handleSuggestion(text) {
    addMessageToChat(text, "user");

    setTimeout(() => {
        const query = text.toLowerCase();

        if (query.includes('vpan') || query.includes('desconto à vista') || query.includes('à vista')) {
            addMessageToChat(
                "### O que é o Desconto VPAN?\n\n" +
                "**VPAN** significa **Valor Presente À Vista** e representa o **desconto à vista** concedido na operação.\n\n" +
                "- No nosso simulador, o Desconto VPAN reduz o valor principal da operação antes da aplicação dos juros do período.\n" +
                "- Por exemplo, na modalidade **Syde**, é concedido um desconto VPAN à vista de **4,0%**, proporcionando maior economia ao produtor.",
                "bot"
            );
        } else if (query.includes('modalidade') || query.includes('comparar') || query.includes('comparativo') || query.includes('syde') || query.includes('fiso') || query.includes('syngenta') || query.includes('nutrade')) {
            addMessageToChat(
                "### Comparativo das 5 Modalidades de Crédito\n\n" +
                "1. **Barter (Nutrade)**:\n" +
                "   - **Garantia:** CPR Física e Seguro Agrícola.\n" +
                "   - **Benefício:** Cashback de campanha + Incentivo Barter regressivo de prazo.\n\n" +
                "2. **Barter (Outras Tradings)**:\n" +
                "   - **Garantia:** CPR Física e Seguro Agrícola.\n" +
                "   - **Benefício:** Valorização comercial padrão praticada no mercado concorrente.\n\n" +
                "3. **FISO**:\n" +
                "   - **Garantia:** Não há garantia (venda a prazo cedida a um parceiro).\n" +
                "   - **Benefício:** Venda a prazo dentro de uma campanha com rebate/incentivo comercial.\n\n" +
                "4. **Syngenta**:\n" +
                "   - **Garantia:** Garantia alinhada diretamente com o time de crédito.\n" +
                "   - **Benefício:** Financiamento direto em balanço Syngenta (On-Balance).\n\n" +
                "5. **Syde**:\n" +
                "   - **Garantia:** Nota promissória ou CPR financeira sem penhor.\n" +
                "   - **Benefício:** Desconto VPAN (desconto à vista de 4,0%) com alta agilidade.",
                "bot"
            );
        } else if (query.includes('garantia') || query.includes('garantias')) {
            addMessageToChat(
                "### Garantias Exigidas por Modalidade:\n\n" +
                "- **Barter (Nutrade)**: CPR Física e Seguro Agrícola.\n" +
                "- **Barter (Outras Tradings)**: CPR Física e Seguro Agrícola.\n" +
                "- **FISO**: Não há garantia (venda a prazo cedida a um parceiro).\n" +
                "- **Syngenta**: Garantia alinhada diretamente com o time de crédito.\n" +
                "- **Syde**: Nota promissória ou CPR financeira sem penhor.",
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
    const cambio = chatState.data.cambio || 5.15;

    // ── STEP 1: Campaign ──────────────────────────────────────────
    if (chatState.step === 'waiting_campanha') {
        const campId = parseInt(input, 10);
        const campObj = campaigns.find(c => c.id === campId);
        if (!campObj) {
            addMessageToChat("Campanha não encontrada. Por favor, selecione uma das opções.", "bot");
            return;
        }
        chatState.data.campId = campId;
        chatState.data.campObj = campObj;

        // Derive prazo from campaign dates if available
        if (campObj.desembolso && campObj.vencimento) {
            const d1 = new Date(campObj.desembolso);
            const d2 = new Date(campObj.vencimento);
            chatState.data.prazo = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
        } else {
            chatState.data.prazo = 216;
        }

        // Pull default juros from campaign taxes if available
        const anyTax = campObj.taxas && campObj.taxas.length > 0 ? campObj.taxas[0] : null;
        chatState.data.jurosAnual = anyTax ? (anyTax.jurosMensais * 12) : 14.40;

        chatState.step = 'waiting_credito';
        addMessageToChat(
            `Campanha **"${campObj.nome}"** selecionada.\nPrazo da campanha: **${chatState.data.prazo} dias**.\n\nQual o **valor do crédito** a simular? Digite apenas números.\n*(Ex: 1.000.000 ou 500000)*`,
            "bot"
        );
    }

    // ── STEP 2: Credit Value ─────────────────────────────────────
    else if (chatState.step === 'waiting_credito') {
        let clean = input.replace(/R\$\s*|USD\s*|\$/g, '').trim();
        if (clean.includes(',')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            const parts = clean.split('.');
            if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
                clean = clean.replace(/\./g, '');
            }
        }
        const valCredit = parseFloat(clean);
        if (!valCredit || valCredit <= 0) {
            addMessageToChat("Não identifiquei um valor válido. Por favor, tente novamente. Ex: 500000", "bot");
            return;
        }
        chatState.data.credit = valCredit;
        chatState.step = 'waiting_commodity';

        // Check if campaign has commodities defined
        const campObj = chatState.data.campObj;
        const hasCampComm = campObj && campObj.taxas && campObj.taxas.some(t => t.produtoFinanceiro);

        addMessageToChat(
            `Crédito de **${formatBRL(valCredit)}** registrado.\n\nQual a **commodity** da operação? *(Necessário para calcular a modalidade Barter)*\nSe não houver commodity ou não for aplicável, selecione **Pular**.`,
            "bot",
            "choices",
            [
                { text: "Soja (sc)", value: "Soja" },
                { text: "Algodão (lp)", value: "Algodão" },
                { text: "Pular (sem Barter)", value: "sem_commodity" }
            ]
        );
    }

    // ── STEP 3: Commodity (optional) ─────────────────────────────
    else if (chatState.step === 'waiting_commodity') {
        if (input === 'sem_commodity') {
            chatState.data.commodity = null;
            chatState.data.precoCommodity = null;
        } else {
            chatState.data.commodity = input;
            chatState.data.precoCommodity = input === 'Soja'
                ? currentQuotes.soybeans * cambio
                : currentQuotes.cotton * cambio;
        }

        chatState.step = 'waiting_regiao';

        // Build region choices from wsysPlazas
        const plazaChoices = wsysPlazas.map(p => ({ text: `${p.nome} (${p.estado})`, value: `${p.nome}|${p.estado}` }));
        plazaChoices.push({ text: "Pular (sem Barter)", value: "sem_regiao" });

        const commMsg = chatState.data.commodity
            ? `Commodity: **${chatState.data.commodity}**.\n\n`
            : `Sem commodity — modalidades Barter **não** serão calculadas.\n\n`;

        addMessageToChat(
            commMsg + `Qual a **praça de entrega**? *(Necessário para o Barter)*\nPule se não for calcular Barter:`,
            "bot",
            "choices",
            plazaChoices
        );
    }

    // ── STEP 4: Region/Praça (optional) ──────────────────────────
    else if (chatState.step === 'waiting_regiao') {
        if (input === 'sem_regiao') {
            chatState.data.region = null;
            chatState.data.plaza = null;
            chatState.step = 'waiting_confirmacao';
            processChatStep('show_params');
        } else {
            const [nome, estado] = input.split('|');
            chatState.data.region = `${nome} (${estado})`;
            chatState.data.plaza = wsysPlazas.find(p => p.nome === nome && p.estado === estado);
            chatState.step = 'waiting_distancias';
            addMessageToChat(
                `Praça: **${chatState.data.region}**.\n\nDigite a **distância de estrada de chão** (KM fazenda → rodovia). Pule digitando **0** se não houver chão:`,
                "bot"
            );
        }
    }

    // ── STEP 5: Estrada de Chão (optional) ───────────────────────
    else if (chatState.step === 'waiting_distancias') {
        const val = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val) || val < 0) {
            addMessageToChat("Por favor, insira um número inteiro. Ex: 15 ou 0", "bot");
            return;
        }
        chatState.data.distChao = val;
        chatState.step = 'waiting_dist_asfalto';
        addMessageToChat("Agora, a **distância de estrada de asfalto** (KM até a base/armazém). Ex: 40", "bot");
    }

    // ── STEP 6: Estrada de Asfalto (optional) ────────────────────
    else if (chatState.step === 'waiting_dist_asfalto') {
        const val = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val) || val < 0) {
            addMessageToChat("Por favor, insira um número inteiro. Ex: 40 ou 0", "bot");
            return;
        }
        chatState.data.distAsfalto = val;

        // Derive frete values from plaza or default
        const plaza = chatState.data.plaza;
        chatState.data.freteChao = plaza ? plaza.freteChao : 15.00;
        chatState.data.freteAsfalto = plaza ? plaza.freteAsfalto : 8.00;

        chatState.step = 'waiting_confirmacao';
        processChatStep('show_params');
    }

    // ── STEP 7: Confirmação / Ajustes ─────────────────────────────
    else if (chatState.step === 'waiting_confirmacao') {
        if (input === 'show_params') {
            const d = chatState.data;
            const canBarter = !!(d.commodity && d.region);
            let msg = `**Resumo dos parâmetros da simulação:**\n` +
                `- **Campanha:** ${d.campObj ? d.campObj.nome : '—'}\n` +
                `- **Crédito:** ${formatBRL(d.credit)}\n` +
                `- **Commodity:** ${d.commodity || '_(não informado — Barter não calculado)_'}\n` +
                `- **Praça:** ${d.region || '_(não informado — Barter não calculado)_'}\n` +
                (d.distChao !== undefined ? `- **Chão / Asfalto:** ${d.distChao} KM / ${d.distAsfalto} KM\n` : '') +
                `- **Prazo:** ${d.prazo} dias\n` +
                `- **Taxa de Juros:** ${d.jurosAnual.toFixed(2)}% a.a.\n\n` +
                (canBarter
                    ? `✅ **Todas as modalidades serão calculadas** (incluindo Barter).`
                    : `⚠️ **Barter não será calculado** — commodity e/ou praça não informados. Somente FISO, Syngenta e Syde serão mostrados.`) +
                `\n\nDeseja prosseguir ou ajustar algum parâmetro?`;

            addMessageToChat(msg, "bot", "choices", [
                { text: "✅ Calcular Simulação", value: "calculate" },
                { text: "Alterar Prazo", value: "alterar_prazo" },
                { text: "Alterar Juros", value: "alterar_juros" },
                { text: "Cancelar", value: "cancel" }
            ]);

        } else if (input === 'calculate') {
            runCreditSimulationCalculation();

        } else if (input === 'alterar_prazo') {
            chatState.step = 'waiting_custom_prazo';
            addMessageToChat("Digite o novo prazo em dias. Ex: 180", "bot");

        } else if (input === 'alterar_juros') {
            chatState.step = 'waiting_custom_juros';
            addMessageToChat("Digite a nova taxa de juros anual (% a.a.). Ex: 12.5", "bot");

        } else {
            addMessageToChat("Simulação cancelada. Como posso ajudar?", "bot");
            startNewChat();
        }
    }

    // ── STEP 8: Ajustes customizados ─────────────────────────────
    else if (chatState.step === 'waiting_custom_prazo') {
        const val = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(val) || val <= 0) {
            addMessageToChat("Por favor, insira um número válido de dias. Ex: 180", "bot");
            return;
        }
        chatState.data.prazo = val;
        chatState.step = 'waiting_confirmacao';
        processChatStep('show_params');
    }
    else if (chatState.step === 'waiting_custom_juros') {
        const val = parseFloat(input.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (isNaN(val) || val <= 0) {
            addMessageToChat("Por favor, insira um percentual válido. Ex: 13.75", "bot");
            return;
        }
        chatState.data.jurosAnual = val;
        chatState.step = 'waiting_confirmacao';
        processChatStep('show_params');
    }
}

// Keep backward compat
function runBarterSimulationCalculation() { runCreditSimulationCalculation(); }

// Executes the simulation and renders result card in chat (new rules)
function runCreditSimulationCalculation() {
    const d = chatState.data;
    const cambio = d.cambio || 5.15;

    const canBarter = !!(d.commodity && d.region && d.distChao !== undefined && d.distAsfalto !== undefined);

    // Set defaults for distances if not set
    const distChao = d.distChao !== undefined ? d.distChao : 0;
    const distAsfalto = d.distAsfalto !== undefined ? d.distAsfalto : 0;
    const freteChao = d.freteChao || 15.00;
    const freteAsfalto = d.freteAsfalto || 8.00;
    const precoCommodity = d.precoCommodity || (currentQuotes.soybeans * cambio);

    // Select campaign in the simulator dropdown so calculateSimulation uses it
    const campSelect = document.getElementById('sim-campanha-select');
    if (campSelect && d.campId) {
        campSelect.value = String(d.campId);
    }

    // Build the financial modalities using campaign tax data
    const campObj = d.campObj;
    function getFinancialResult(productKey, defaultRate, defaultDiscount, defaultIncentive, defaultTipoJuros, defaultContagem) {
        let tax = null;
        if (campObj && campObj.taxas) {
            tax = campObj.taxas.find(t => {
                const name = (t.produtoFinanceiro || '').toLowerCase();
                const key = productKey.toLowerCase();
                return name.includes(key) || (key === 'syde' && name.includes('fidc')) || (key === 'fiso' && name.includes('fiso')) || (key === 'syngenta' && name.includes('prazo'));
            });
        }
        const taxaMensal = tax ? tax.jurosMensais : defaultRate;
        const descontoVPAN = tax ? (tax.desconto || 0) : defaultDiscount;
        const incentivo = tax ? (tax.incentivo || 0) : defaultIncentive;
        const tipoJuros = tax ? tax.tipoJuros : defaultTipoJuros;
        const nMeses = d.prazo / 30.0;
        const vfIntermed = d.credit * (1.0 - descontoVPAN / 100.0);
        let vfComJuros;
        if (tipoJuros === 'Composto') {
            vfComJuros = vfIntermed * Math.pow(1 + taxaMensal / 100.0, nMeses);
        } else {
            vfComJuros = vfIntermed * (1 + (taxaMensal / 100.0) * nMeses);
        }
        const valorTotal = vfComJuros * (1 - incentivo / 100.0);
        const custoTotalPct = (valorTotal / d.credit - 1) * 100;
        const custoAmPct = nMeses > 0 ? custoTotalPct / nMeses : 0;
        return { taxaMensal, jurosAnual: taxaMensal * 12, descontoVPAN, incentivo, valorTotal, custoTotal: valorTotal - d.credit, custoTotalPct, custoAmPct };
    }

    const calcFiso = getFinancialResult('Fiso', 1.85, 0, 3.0, 'Simples', 'Dias corridos');
    const calcSyngenta = getFinancialResult('Syngenta', 1.85, 0, 0, 'Simples', 'Dias corridos');
    const calcSyde = getFinancialResult('Syde', 1.85, 4.0, 0, 'Composto', 'Dias úteis');

    // Build result modalities list
    const resultModalities = [
        { name: 'FISO', custoAmPct: calcFiso.custoAmPct, custoTotalPct: calcFiso.custoTotalPct, valorTotal: calcFiso.valorTotal, type: 'financial' },
        { name: 'Syngenta', custoAmPct: calcSyngenta.custoAmPct, custoTotalPct: calcSyngenta.custoTotalPct, valorTotal: calcSyngenta.valorTotal, type: 'financial' },
        { name: 'Syde (FIDC)', custoAmPct: calcSyde.custoAmPct, custoTotalPct: calcSyde.custoTotalPct, valorTotal: calcSyde.valorTotal, type: 'financial' }
    ];

    let totalRetorno = 0;
    let precoFinal = 0;
    let economia = 0;
    let unitSymbol = 'sc';

    if (canBarter) {
        const results = runSimulationMath({
            commodity: d.commodity,
            regiao: d.region,
            creditRaw: d.credit,
            commBrutoRaw: precoCommodity,
            descontoAtivo: true,
            prazo: d.prazo,
            jurosAnual: d.jurosAnual,
            valPctProposta: campObj && campObj.taxas && campObj.taxas.length > 0 ? (campObj.taxas[0].incentivo || 4.50) : 4.50,
            distChao,
            distAsfalto,
            freteChaoRaw: freteChao,
            freteAsfaltoRaw: freteAsfalto,
            cambio,
            currency: 'BRL'
        });
        totalRetorno = results.totalRetornoUSDProposta * cambio;
        precoFinal = results.precoFinalUSDProposta * cambio;
        economia = results.volFinalMarket - results.volFinalProposta;
        unitSymbol = results.unitSymbol;

        const barterCustoTotal = ((results.totalRetornoUSDProposta * cambio) - d.credit);
        const barterCustoPct = (barterCustoTotal / d.credit) * 100;
        const barterCustoAm = barterCustoPct / (d.prazo / 30);

        resultModalities.unshift(
            { name: 'Barter (Nutrade)', custoAmPct: barterCustoAm, custoTotalPct: barterCustoPct, valorTotal: results.totalRetornoUSDProposta * cambio, type: 'barter' }
        );
    }

    // Sort best first (lowest total cost)
    resultModalities.sort((a, b) => a.custoTotalPct - b.custoTotalPct);

    // Build result card HTML
    let modalitiesHTML = resultModalities.map((m, i) => {
        const typeColor = m.type === 'barter' ? '#0d9488' : '#1e40af';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:8px;background:rgba(0,0,0,0.03);margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:${typeColor}">${m.name}</span>
            <span style="font-size:12px;color:#374151;">${formatBRL(m.valorTotal)} &nbsp;|&nbsp; <strong>${m.custoAmPct.toFixed(2)}% a.m.</strong></span>
        </div>`;
    }).join('');

    const campNome = d.campObj ? d.campObj.nome : '—';
    const creditFormatted = formatBRL(d.credit);

    const simSummary = {
        inputs: { currency: 'BRL', commodity: d.commodity || '', region: d.region || '', creditRaw: d.credit },
        totalRetorno,
        precoFinal,
        precoMarket: 0,
        economia,
        unitSymbol,
        fullInputs: Object.assign({}, d)
    };
    chatHistorySessions.push(simSummary);
    const sessionIndex = chatHistorySessions.length - 1;

    // Build result bubble using raw HTML type
    const card = document.createElement('div');
    card.className = 'chat-result-card';
    card.innerHTML = `
        <div class="result-card-header">
            <h4>Simulação Concluída</h4>
            <span class="result-badge">${campNome}</span>
        </div>
        <div class="result-card-body">
            <div class="result-item">
                <span class="result-label">Crédito</span>
                <span class="result-val">${creditFormatted}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Modalidades Comparadas (Ordem de Benefício)</span>
                <span class="result-val"></span>
            </div>
            <div style="width:100%;margin-bottom:8px;">${modalitiesHTML}</div>
            ${canBarter ? `<div class="result-item"><span class="result-label">Total Retorno Barter</span><span class="result-val highlight-val">${formatBRL(totalRetorno)}</span></div>` : ''}
            <div class="result-disclaimer" style="font-size:11px;color:var(--text-secondary);margin-top:10px;border-top:1px dashed var(--border-color);padding-top:8px;text-align:center;font-style:italic;">
                ${!canBarter ? '⚠️ Commodity ou praça não informados — Barter não calculado.<br>' : ''}
                Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
        </div>
        <div class="result-card-actions">
            <button type="button" class="result-action-btn primary-action" onclick="openSimulationInForm(${sessionIndex})">Ver no Simulador</button>
            <button type="button" class="result-action-btn" onclick="startCreditSimulationFlow()">Nova Simulação</button>
        </div>
    `;

    // Append directly to chat
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        const welcomeBox = document.getElementById('chat-welcome-box');
        if (welcomeBox) welcomeBox.style.display = 'none';

        const messageRow = document.createElement('div');
        messageRow.className = 'message-row bot-row';
        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'bubble-wrapper';
        const botAvatar = document.createElement('div');
        botAvatar.className = 'bot-avatar-bubble';
        botAvatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble bot-bubble';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(card);
        bubble.appendChild(timeSpan);
        bubbleWrapper.appendChild(botAvatar);
        bubbleWrapper.appendChild(bubble);
        messageRow.appendChild(bubbleWrapper);
        messagesContainer.appendChild(messageRow);

        const chatBody = document.getElementById('chat-window-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }

    updateHistorySidebar(sessionIndex, d.commodity || 'Crédito', d.region || 'Diversas');
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
    hasSimulated = true;
    calculateSimulation();
}

// Initialize and redraw TradingView chart widget (CFDs for free widgets)
function initTradingViewWidget(commodity) {
    const symbol = commodity === 'Soja' ? 'OANDA:SOYBNUSD' : 'PEPPERSTONE:COTTON';
    const subtitleText = `Gráfico CFD em tempo real de Chicago para ${commodity === 'Soja' ? 'Soja (OANDA:SOYBNUSD)' : 'Algodão (PEPPERSTONE:COTTON)'}`;

    ['chart-subtitle', 'v2-chart-subtitle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = subtitleText;
    });

    ['tradingview_widget', 'v2_tradingview_widget'].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            if (typeof TradingView !== 'undefined') {
                new TradingView.widget({
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
    });
}


// Generate PDF by capturing simulation elements with off-screen rendering
function downloadSimulationPDF(dataInput = null) {
    if (!hasSimulated && !dataInput) {
        handleFormSimulate();
    }
    function ensureHtml2Canvas(cb) {
        if (window.html2canvas) { cb(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = cb;
        document.head.appendChild(s);
    }

    ensureHtml2Canvas(() => {
        const summaryCard = document.querySelector('#sim-results-wrapper .card:first-child, .results-card:first-child, #v2-summary-card');
        const cardsContainer = document.getElementById('modality-cards-list') || document.getElementById('v2-modality-cards-list') || document.getElementById('creative-modality-cards-list');

        // Off-screen container for crisp capture
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:950px;background:#ffffff;padding:30px;box-sizing:border-box;font-family:Inter,sans-serif;color:#111827;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #088395;padding-bottom:16px;margin-bottom:24px;';
        header.innerHTML = `
            <div>
                <div style="font-size:28px;font-weight:800;color:#053B43;letter-spacing:-1px;">barter hub</div>
                <div style="font-size:13px;color:#088395;font-weight:600;margin-top:2px;">Relatório Executivo de Simulação de Crédito & Barter</div>
            </div>
            <div style="text-align:right;font-size:13px;color:#4b5563;">
                <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:2px;">Validade: 30 dias</div>
            </div>
        `;
        wrapper.appendChild(header);

        // Summary Banner
        if (summaryCard) {
            const summaryClone = summaryCard.cloneNode(true);
            summaryClone.style.cssText = 'background-color:#053B43 !important;color:#ffffff !important;padding:20px;border-radius:12px;margin-bottom:24px;box-shadow:none;';
            wrapper.appendChild(summaryClone);
        }

        // Modality Cards Clone
        if (cardsContainer) {
            const cardsClone = cardsContainer.cloneNode(true);
            cardsClone.style.cssText = 'display:grid;grid-template-columns:repeat(2, 1fr);gap:16px;margin-bottom:24px;';

            // Filter modalities for PDF export based on checkbox selection
            const pdfSelected = window.pdfSelectedModalities || {};
            cardsClone.querySelectorAll('.modality-card').forEach(cardEl => {
                const modId = cardEl.getAttribute('data-modality-id');
                const chk = cardEl.querySelector('.modality-pdf-checkbox');
                const isChecked = chk ? chk.checked : true;
                if ((modId && pdfSelected[modId] === false) || !isChecked) {
                    cardEl.remove();
                }
            });

            // Ocultar botões, tooltips e checkboxes na imagem do PDF
            cardsClone.querySelectorAll('button, .tooltip-container, .modality-card-checkbox-wrapper').forEach(el => el.style.display = 'none');

            if (cardsClone.children.length === 0) {
                alert('Por favor, selecione ao menos uma modalidade (marcando o checkbox "PDF") para gerar o relatório.');
                return;
            }

            wrapper.appendChild(cardsClone);
        }

        // Disclaimer
        const disclaimerDiv = document.createElement('div');
        disclaimerDiv.style.cssText = 'font-size:11px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb;padding-top:14px;margin-bottom:20px;font-style:italic;line-height:1.6;';
        disclaimerDiv.innerHTML = `
            * Necessário consulta prévia de limite disponível com o time de crédito.<br>
            Simulação meramente informativa, sem efeito contratual. Valores sujeitos a validação final conforme política de originação e regras de campanha 2026.
        `;
        wrapper.appendChild(disclaimerDiv);

        document.body.appendChild(wrapper);

        setTimeout(() => {
            html2canvas(wrapper, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false }).then(canvas => {
                document.body.removeChild(wrapper);

                const imgData = canvas.toDataURL('image/png');
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Relatório de Simulação - Barter Hub</title>
                            <style>
                                body { margin: 0; padding: 20px; background: #f3f4f6; display: flex; flex-direction: column; align-items: center; font-family: Inter, sans-serif; }
                                .print-actions { margin-bottom: 20px; display: flex; gap: 12px; }
                                .btn-print { padding: 12px 28px; background: #088395; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 4px 12px rgba(8, 131, 149, 0.3); }
                                .btn-print:hover { background: #053B43; }
                                .img-container { background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-width: 950px; width: 100%; box-sizing: border-box; }
                                img { width: 100%; height: auto; display: block; }
                                @media print {
                                    body { padding: 0; background: #ffffff; }
                                    .print-actions { display: none; }
                                    .img-container { padding: 0; box-shadow: none; border-radius: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="print-actions">
                                <button class="btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir / Salvar PDF</button>
                            </div>
                            <div class="img-container">
                                <img src="${imgData}" alt="Relatório de Simulação Barter Hub" />
                            </div>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                } else {
                    alert("Permita popups no navegador para abrir o PDF.");
                }
            }).catch(err => {
                console.error('html2canvas error:', err);
                if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
                alert('Não foi possível gerar a imagem do PDF. Tente novamente.');
            });
        }, 250);
    });
}

function downloadSimulationPDFFromIndex(index) {
    const session = chatHistorySessions[index];
    if (!session) return;
    window.lastCanBarter = !!(session.inputs && session.inputs.commodity && session.inputs.region);
    window.lastSimCommodity = session.inputs ? session.inputs.commodity : '';
    downloadSimulationPDF(session.fullInputs);
}

// ==================== CAMPAIGN MANAGER MODULE ====================

// Default Campaigns Array populated to match the provided screens
let campaigns = [
    {
        id: 0,
        nome: "Planilha 2026 (216 dias)",
        titulo: "Planilha Barter 2026 (Carência 01/10/2025 - 05/05/2026)",
        status: "Ativa",
        desembolso: "2025-10-01",
        vencimento: "2026-05-05",
        visivelRTV: true,
        taxas: [
            {
                produtoFinanceiro: "Barter Nutrade",
                produtoAgricola: "Soja",
                moeda: "USD",
                jurosMensais: 1.20,
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 4.50,
                desconto: 0.00,
                inicio: "2025-10-01",
                fim: "2026-05-05"
            },
            {
                produtoFinanceiro: "Barter Outras Tradings",
                produtoAgricola: "Soja",
                moeda: "USD",
                jurosMensais: 1.20,
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 3.00,
                desconto: 0.00,
                inicio: "2025-10-01",
                fim: "2026-05-05"
            },
            {
                produtoFinanceiro: "Syde",
                produtoAgricola: "Soja",
                moeda: "USD",
                jurosMensais: 1.85,
                tipoJuros: "Composto",
                contagemDias: "Dias úteis",
                incentivo: 0.00,
                desconto: 4.00,
                inicio: "2025-10-01",
                fim: "2026-05-05"
            },
            {
                produtoFinanceiro: "Fiso",
                produtoAgricola: "Soja",
                moeda: "USD",
                jurosMensais: 1.85,
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 1.00,
                desconto: 0.00,
                inicio: "2025-10-01",
                fim: "2026-05-05"
            },
            {
                produtoFinanceiro: "Syngenta",
                produtoAgricola: "Soja",
                moeda: "USD",
                jurosMensais: 1.85,
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 0.00,
                desconto: 0.00,
                inicio: "2025-10-01",
                fim: "2026-05-05"
            }
        ]
    },
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
                produtoFinanceiro: "Barter Nutrade",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.20, // 14.4% a.a.
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 4.50,
                desconto: 0.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "Barter Outras Tradings",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.20, // 14.4% a.a.
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 3.00,
                desconto: 0.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "Syde",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.85,
                tipoJuros: "Composto",
                contagemDias: "Dias úteis",
                incentivo: 0.00,
                desconto: 4.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "Fiso",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.85,
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
                incentivo: 1.00,
                desconto: 0.00,
                inicio: "2026-07-21",
                fim: "2026-12-01"
            },
            {
                produtoFinanceiro: "Syngenta",
                produtoAgricola: "Soja",
                moeda: "BRL",
                jurosMensais: 1.85,
                tipoJuros: "Simples",
                contagemDias: "Dias corridos",
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

function toggleModalityPdfSelection(modalityId, isChecked) {
    if (!window.pdfSelectedModalities) window.pdfSelectedModalities = {};
    window.pdfSelectedModalities[modalityId] = isChecked;
    document.querySelectorAll(`.modality-pdf-checkbox[data-modality-id="${modalityId}"]`).forEach(chk => {
        chk.checked = isChecked;
    });
}
window.toggleModalityPdfSelection = toggleModalityPdfSelection;

function updateWsysMonthIndicator(vencimentoDateStr) {
    const containers = [
        document.getElementById('wsys-month-info'),
        document.getElementById('v2-wsys-month-info')
    ].filter(Boolean);

    if (!vencimentoDateStr) {
        containers.forEach(el => { el.style.display = 'none'; });
        return;
    }

    const parts = vencimentoDateStr.split('-');
    let dateObj;
    if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
        dateObj = new Date(vencimentoDateStr);
    }

    if (isNaN(dateObj.getTime())) {
        containers.forEach(el => { el.style.display = 'none'; });
        return;
    }

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthStr = monthNames[dateObj.getMonth()];
    const yearStr = dateObj.getFullYear();
    const formatted = `${monthStr}/${yearStr}`;

    containers.forEach(el => {
        el.style.display = 'inline-flex';
        el.innerHTML = `<i class="fa-solid fa-calendar-check" style="color:#2563eb;"></i> Preço Wsys (Data Pagamento): <strong>${formatted}</strong> &nbsp;•&nbsp; <span style="font-weight:normal;opacity:0.9;">(Cruzado com Vencimento da Campanha)</span>`;
    });
}
window.updateWsysMonthIndicator = updateWsysMonthIndicator;

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
        updateWsysMonthIndicator(null);
        return;
    }

    const camp = campaigns.find(c => c.id == val);
    if (!camp) return;

    // Update Wsys Month indicator crossing by campaign maturity date
    if (camp.vencimento) {
        updateWsysMonthIndicator(camp.vencimento);
    } else {
        updateWsysMonthIndicator(null);
    }

    // Find Barter tax parameters (Nutrade or generic Barter)
    const barterTax = camp.taxas.find(t => t.produtoFinanceiro === 'Barter Nutrade' || t.produtoFinanceiro === 'Barter');
    const barterMarketTax = camp.taxas.find(t => t.produtoFinanceiro === 'Barter Outras Tradings');

    if (barterMarketTax && barterMarketTax.incentivo !== undefined) {
        activeCampanhaValorizacaoOutras = barterMarketTax.incentivo;
    }

    if (barterTax) {
        if (commoditySelect) {
            commoditySelect.value = barterTax.produtoAgricola || 'Soja';
            commoditySelect.disabled = true;
            onCulturaChange(barterTax.produtoAgricola || 'Soja');
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
            } else {
                prazoInput.value = 216;
            }
        }
    } else if (prazoInput) {
        prazoInput.value = 216;
    }

    calculateSimulation();
}

// ==================== WSYS PRAÇAS DATABASE MANAGER ====================
function initWsysPlazas() {
    if (localStorage.getItem('wsysPlazas')) {
        wsysPlazas = JSON.parse(localStorage.getItem('wsysPlazas'));
    } else {
        localStorage.setItem('wsysPlazas', JSON.stringify(wsysPlazas));
    }
}

function initEstadoSelect() {
    const estadoSelect = document.getElementById('sim-estado');
    if (!estadoSelect) return;

    // Populate states
    const states = [...new Set(wsysPlazas.map(p => p.estado))].sort();
    estadoSelect.innerHTML = '';
    states.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st;
        estadoSelect.appendChild(opt);
    });

    // Trigger first state load
    if (states.length > 0) {
        estadoSelect.value = states[0];
        onEstadoChange(states[0]);
    }
}

function onEstadoChange(estado) {
    // Populate both Layout 1 and Layout 2 Praça selects
    const selIds = ['sim-regiao', 'v2-sim-regiao'];
    selIds.forEach(selId => {
        const pracaSelect = document.getElementById(selId);
        if (!pracaSelect) return;
        pracaSelect.innerHTML = '';
        const filtered = wsysPlazas.filter(p => p.estado === estado).sort((a, b) => a.nome.localeCompare(b.nome));
        filtered.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.nome;
            opt.textContent = p.nome;
            pracaSelect.appendChild(opt);
        });
        if (filtered.length > 0) {
            pracaSelect.value = filtered[0].nome;
        }
    });

    // Sync v2-sim-estado if needed
    const v2Estado = document.getElementById('v2-sim-estado');
    if (v2Estado && v2Estado.value !== estado) v2Estado.value = estado;

    const filtered = wsysPlazas.filter(p => p.estado === estado).sort((a, b) => a.nome.localeCompare(b.nome));
    if (filtered.length > 0) {
        onPracaChange(filtered[0].nome);
    } else {
        calculateSimulation();
    }
}

function onPracaChange(pracaNome) {
    const estado = document.getElementById('sim-estado').value;
    const plaza = wsysPlazas.find(p => p.estado === estado && p.nome === pracaNome);
    if (plaza) {
        document.getElementById('sim-frete-chao').value = plaza.freteChao;
        document.getElementById('sim-frete-asfalto').value = plaza.freteAsfalto;
    }
    // Sync v2-sim-regiao if needed
    const v2Regiao = document.getElementById('v2-sim-regiao');
    if (v2Regiao && v2Regiao.value !== pracaNome) v2Regiao.value = pracaNome;
    calculateSimulation();
}

function renderPracasTable() {
    const tbody = document.getElementById('pracas-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (wsysPlazas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma praça cadastrada.</td></tr>`;
        return;
    }

    wsysPlazas.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.estado}</strong></td>
            <td>${p.nome}</td>
            <td class="font-mono">R$ ${p.freteChao.toFixed(2)}</td>
            <td class="font-mono">R$ ${p.freteAsfalto.toFixed(2)}</td>
            <td class="font-mono">${p.impPct.toFixed(2)}%</td>
            <td class="font-mono">R$ ${p.impFixo.toFixed(2)}</td>
            <td style="text-align: center;">
                <button type="button" class="btn-action btn-edit" onclick="editPraca(${idx})" style="padding: 4px 8px; font-size: 11px; margin-right: 5px; background-color: var(--primary-light); color: var(--primary-deep);"><i class="fa-solid fa-pen"></i> Editar</button>
                <button type="button" class="btn-action btn-delete" onclick="deletePraca(${idx})" style="padding: 4px 8px; font-size: 11px; background-color: rgba(239, 68, 68, 0.1); color: #ef4444;"><i class="fa-solid fa-trash"></i> Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showCreatePracaForm() {
    document.getElementById('praca-edit-index').value = '';
    document.getElementById('praca-form-title').textContent = 'Cadastrar nova praça no WSys';
    document.getElementById('create-praca-form').reset();
    document.getElementById('pracas-list-view').style.display = 'none';
    document.getElementById('pracas-create-view').style.display = 'block';
}

function cancelCreatePraca() {
    document.getElementById('pracas-create-view').style.display = 'none';
    document.getElementById('pracas-list-view').style.display = 'block';
}

function handleSavePraca(e) {
    e.preventDefault();
    const idx = document.getElementById('praca-edit-index').value;
    const estado = document.getElementById('praca-estado').value;
    const nome = document.getElementById('praca-nome').value.trim();
    const freteChao = parseFloat(document.getElementById('praca-frete-chao').value) || 0;
    const freteAsfalto = parseFloat(document.getElementById('praca-frete-asfalto').value) || 0;
    const impPct = parseFloat(document.getElementById('praca-tax-pct').value) || 0;
    const impFixo = parseFloat(document.getElementById('praca-tax-fixo').value) || 0;

    if (!nome) {
        alert("Preencha o nome da praça");
        return;
    }

    const pracaData = { estado, nome, freteChao, freteAsfalto, impPct, impFixo };

    if (idx === '') {
        // Create new
        wsysPlazas.push(pracaData);
    } else {
        // Edit existing
        wsysPlazas[parseInt(idx)] = pracaData;
    }

    localStorage.setItem('wsysPlazas', JSON.stringify(wsysPlazas));
    cancelCreatePraca();
    renderPracasTable();
    initEstadoSelect(); // Refresh selects
}

function editPraca(index) {
    const p = wsysPlazas[index];
    document.getElementById('praca-edit-index').value = index;
    document.getElementById('praca-form-title').textContent = 'Editar praça no WSys';
    document.getElementById('praca-estado').value = p.estado;
    document.getElementById('praca-nome').value = p.nome;
    document.getElementById('praca-frete-chao').value = p.freteChao;
    document.getElementById('praca-frete-asfalto').value = p.freteAsfalto;
    document.getElementById('praca-tax-pct').value = p.impPct;
    document.getElementById('praca-tax-fixo').value = p.impFixo;

    document.getElementById('pracas-list-view').style.display = 'none';
    document.getElementById('pracas-create-view').style.display = 'block';
}

function deletePraca(index) {
    if (!confirm(`Deseja realmente excluir a praça "${wsysPlazas[index].nome}"?`)) return;
    wsysPlazas.splice(index, 1);
    localStorage.setItem('wsysPlazas', JSON.stringify(wsysPlazas));
    renderPracasTable();
    initEstadoSelect(); // Refresh selects
}

// ==================== SHARE POPUP ACTIONS ====================
function openSharePopup() {
    if (!hasSimulated) {
        handleFormSimulate();
    }
    shareNative();
}

function closeSharePopup() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.style.display = 'none';
}

function buildShareMessageText() {
    const credInput = document.getElementById('sim-credito') ? document.getElementById('sim-credito').value : '';
    const estado = document.getElementById('sim-estado') ? document.getElementById('sim-estado').value : '';
    const praca = document.getElementById('sim-regiao') ? document.getElementById('sim-regiao').value : '';
    const campSelect = document.getElementById('sim-campanha-select');
    const campNome = campSelect && campSelect.options[campSelect.selectedIndex] ? campSelect.options[campSelect.selectedIndex].text : '';

    let text = `*Simulação de Barter Hub 2026*\n\n`;
    text += `• *Campanha:* ${campNome}\n`;
    text += `• *Crédito:* ${credInput} (${selectedCurrency})\n`;
    text += `• *Local:* ${praca} (${estado})\n\n`;

    // Add best modality
    const cardEl = document.querySelector('.modality-card');
    if (cardEl) {
        const titleEl = cardEl.querySelector('.modality-card-title');
        const totalEl = cardEl.querySelector('.modality-card-total-value');
        if (titleEl && totalEl) {
            text += `*Modalidade Destacada:* ${titleEl.textContent}\n`;
            text += `• Valor Total Equivalente: ${totalEl.textContent}\n\n`;
        }
    }

    text += `_Gerado automaticamente pelo Barter Hub Simulator._`;
    return encodeURIComponent(text);
}

function shareToWhatsApp() {
    const text = buildShareMessageText();
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    closeSharePopup();
}

function shareNative() {
    const credInput = document.getElementById('sim-credito') ? document.getElementById('sim-credito').value : '';
    const praca = document.getElementById('sim-regiao') ? document.getElementById('sim-regiao').value : '';
    const rawText = decodeURIComponent(buildShareMessageText().replace(/\+/g, ' '));

    if (navigator.share) {
        navigator.share({
            title: 'Simulação Barter Hub 2026',
            text: rawText,
            url: window.location.href
        })
            .then(() => closeSharePopup())
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.log('Erro ao compartilhar via sistema:', err);
                }
            });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(rawText)
            .then(() => {
                alert("Resumo da simulação copiado para a área de transferência!");
                closeSharePopup();
            })
            .catch(() => {
                alert("Não foi possível acessar a área de transferência para compartilhamento.");
            });
    }
}

// ==================== TOOLTIPS MANAGER MODULE ====================

const defaultTooltips = [
    {
        id: "sim-campanha-select",
        label: "Campanha de Referência",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Seleção manual de opções mockadas ou adicionadas em Ajustar Taxas.<br><strong>Versão Final:</strong> Integração com base de campanhas de Barter registradas no SAP/Salesforce."
    },
    {
        id: "sim-commodity",
        label: "Commodity",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Seleção manual (Soja em sc ou Algodão em lp).<br><strong>Versão Final:</strong> Cadastro de produtos e commodities de originação da Syngenta/Nutrade."
    },
    {
        id: "sim-estado",
        label: "Estado",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Seleção do Estado correspondente.<br><strong>Versão Final:</strong> Preenchido de forma automática com base no domicílio fiscal (CNPJ) do cliente integrado no SAP MDM."
    },
    {
        id: "sim-regiao",
        label: "Praça (Dados do WSys)",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Filtro local de praças (carregando dados de localStorage).<br><strong>Versão Final:</strong> Chamada de API direta ao sistema corporativo de logística e originação (WSys).<br><strong>Fórmula:</strong> Retorna as tarifas logísticas e impostos vigentes do município."
    },
    {
        id: "currency-group",
        label: "Moeda da Operação",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Escolha entre Real (R$) e Dólar ($).<br><strong>Versão Final:</strong> Puxado das regras da linha de faturamento e financiamento do pedido de venda (SAP/Salesforce)."
    },
    {
        id: "sim-credito",
        label: "Valor da Operação",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Valor digitado pelo usuário.<br><strong>Versão Final:</strong> Valor bruto do pedido de faturamento de insumos associado (Salesforce/SAP FSCM)."
    },
    {
        id: "sim-descontos",
        label: "Deduções Fiscais de Barter",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Botão liga/desliga para fins comparativos.<br><strong>Versão Final:</strong> Determinação fiscal automatizada (SAP Tax Engine) segundo o enquadramento fiscal e tributação estadual do produtor."
    },
    {
        id: "sim-dist-chao",
        label: "Distância Estrada de Chão (KM)",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Carrega do WSys (editável).<br><strong>Versão Final:</strong> Calculado via roteirizador do frete com a geolocalização da fazenda cadastrada.<br><strong>Fórmula:</strong> Distância Chão * Custo KM Terra do WSys."
    },
    {
        id: "sim-dist-asfalto",
        label: "Distância Estrada de Asfalto (KM)",
        location: "Formulário de Operação",
        text: "<strong>Simulador:</strong> Carrega do WSys (editável).<br><strong>Versão Final:</strong> Calculado via roteirizador do frete com a geolocalização da fazenda cadastrada.<br><strong>Fórmula:</strong> Distância Asfalto * Custo KM Asfalto do WSys."
    },
    {
        id: "summary-card",
        label: "Resumo da Operação",
        location: "Cartão Resumo",
        text: "<strong>Simulador:</strong> Consolidação de juros, prazos e economia com base na opção selecionada.<br><strong>Versão Final:</strong> Espelho e resumo executivo da CPR/proposta de faturamento do cliente."
    },
    {
        id: "ref-preco",
        label: "Preço do Grão",
        location: "Dados de Referência",
        text: "Preço bruto FOB obtido via API / WSys."
    },
    {
        id: "ref-cambio",
        label: "Taxa Cambial",
        location: "Dados de Referência",
        text: "Dólar futuro / spot atual obtido via AwesomeAPI."
    },
    {
        id: "ref-juros",
        label: "Taxa Juros (a.a.)",
        location: "Dados de Referência",
        text: "Taxa de juros anualizada cadastrada para o Barter nesta campanha."
    },
    {
        id: "ref-prazo",
        label: "Prazo Calculado",
        location: "Dados de Referência",
        text: "Prazo calculated (Data de carência a Vencimento da campanha)."
    },
    {
        id: "ref-val-nutrade",
        label: "Valoriz. Nutrade",
        location: "Dados de Referência",
        text: "Retorno de valorização comercial (Cashback) da Nutrade."
    },
    {
        id: "ref-val-outras",
        label: "Valoriz. Outras",
        location: "Dados de Referência",
        text: "Dedução de valorização das tradings concorrentes."
    },
    {
        id: "ref-frete-chao",
        label: "Frete Chão (WSys)",
        location: "Dados de Referência",
        text: "Custo por KM de terra recuperado do WSys para a praça."
    },
    {
        id: "ref-frete-asfalto",
        label: "Frete Asfalto (WSys)",
        location: "Dados de Referência",
        text: "Custo por KM de asfalto recuperado do WSys para a praça."
    },
    {
        id: "modality-cards-list",
        label: "Modalidades de Crédito (Lista)",
        location: "Cards de Modalidades",
        text: "Apresentado da mais vantajosa (melhor benefício) para a menos vantajosa. Clique para ver o detalhamento completo dos custos."
    },
    {
        id: "tbl-barter-fob",
        label: "Valor do Crédito (FOB a Prazo)",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Resgatado do input Valor da Operação.<br><strong>Versão Final:</strong> Valor do faturamento do pedido de insumos integrado via Salesforce/SAP.<br><strong>Fórmula:</strong> Valor do Crédito."
    },
    {
        id: "tbl-barter-desc-estadual",
        label: "(-) Descontos Tributários Estaduais",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Parcela fixa de imposto cadastrada na Praça logística local (WSys).<br><strong>Versão Final:</strong> Puxado do motor fiscal (SAP Tax Engine) conforme enquadramento fiscal do produtor.<br><strong>Fórmula:</strong> Desconto Fixo = Volume Físico Inicial * Alíquota por Saca da Praça (ex: Fethab/Fundems)."
    },
    {
        id: "tbl-barter-desc-demais",
        label: "(-) Demais Descontos (SENAR / Funrural)",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Alíquota percentual cadastrada na Praça logística local (WSys).<br><strong>Versão Final:</strong> Motor fiscal de impostos federais retidos na fonte (SENAR/Funrural) no SAP.<br><strong>Fórmula:</strong> Desconto SENAR/Funrural = Preço Commodity Bruto * Alíquota Percentual da Praça."
    },
    {
        id: "tbl-barter-livre",
        label: "Preço Commodity Livre (Porteira)",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Subtração dos descontos fiscais sobre o Preço Bruto.<br><strong>Versão Final:</strong> Calculado pelo Motor de Netback da mesa de originação (Nutrade).<br><strong>Fórmula:</strong> Preço Bruto FOB - Descontos Estaduais - Demais Descontos."
    },
    {
        id: "tbl-barter-vol-troca",
        label: "Volume de Troca Físico Inicial",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Razão entre Crédito e Preço Livre, arredondada para cima.<br><strong>Versão Final:</strong> CPR Física gerada e registrada no cartório de títulos (SAP FSCM).<br><strong>Fórmula:</strong> Volume Inicial = Teto(Valor do Crédito / Preço Commodity Livre)."
    },
    {
        id: "tbl-barter-valcamp",
        label: "Taxa de Valorização (Cashback)",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Taxa associada à campanha selecionada (Nutrade vs Outras).<br><strong>Versão Final:</strong> Campanha comercial aprovada pela originação cadastrada no Salesforce/SAP."
    },
    {
        id: "tbl-barter-cashback-usd",
        label: "Cash Back da Campanha",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Multiplicação do crédito pela taxa de cashback.<br><strong>Versão Final:</strong> Abatimento comercial bonificado no pedido de insumos (SAP).<br><strong>Fórmula:</strong> Valor do Crédito * Taxa de Valorização da Campanha."
    },
    {
        id: "tbl-barter-incbarter-pct",
        label: "Incentivo Barter (%)",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Juros regressivos da campanha calculados conforme o prazo.<br><strong>Versão Final:</strong> Política de desconto financeiro por faturamento físico parametrizada no SAP.<br><strong>Fórmula:</strong> Retornado da tabela de juros comerciais associada à campanha."
    },
    {
        id: "tbl-barter-incbarter-usd",
        label: "Incentivo Barter ganho",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Multiplicação do crédito pela taxa de juros regressivos.<br><strong>Versão Final:</strong> Abatimento de juros lançado no faturamento de barter (SAP).<br><strong>Fórmula:</strong> Valor do Crédito * Incentivo Barter (%)."
    },
    {
        id: "tbl-barter-totalret",
        label: "Total de Retorno Recebido pelo Produtor",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Somatório de cashback e juros regressivos concedidos.<br><strong>Versão Final:</strong> Desconto de originação consolidado na proposta comercial do Salesforce.<br><strong>Fórmula:</strong> Cash Back da Campanha + Incentivo Barter ganho."
    },
    {
        id: "tbl-barter-finalpreco",
        label: "Preço Equivalente Final",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Preço livre acrescido dos benefícios comerciais convertidos por unidade.<br><strong>Versão Final:</strong> Indicador de preço neto real para faturamento logístico corporativo.<br><strong>Fórmula:</strong> Preço Commodity Livre + (Total Retorno / Volume Inicial)."
    },
    {
        id: "tbl-barter-finalvol",
        label: "Volume de Troca Equivalente Final",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Volume físico inicial menos o volume deduzido pelos retornos comerciais.<br><strong>Versão Final:</strong> CPR Física consolidada final com o volume líquido final faturado (SAP FSCM).<br><strong>Fórmula:</strong> Volume Inicial - (Total Retorno / Preço Equivalente Final)."
    },
    {
        id: "tbl-barter-valreal",
        label: "Valorização Real sobre Preço Livre",
        location: "Tabela Detalhada Barter",
        text: "<strong>Simulador:</strong> Percentual de ganho efetivo sobre o Preço Livre (Porteira).<br><strong>Versão Final:</strong> Indicador comercial interno de margem do produtor no Salesforce.<br><strong>Fórmula:</strong> (Preço Equivalente Final / Preço Commodity Livre) - 1."
    },
    {
        id: "mod-card-juros-anual",
        label: "Taxa Juros Anual",
        location: "Card de Modalidades",
        text: "<strong>Fórmula:</strong> Taxa de juros anualizada contratual da modalidade."
    },
    {
        id: "mod-card-juros-am",
        label: "Taxa Efetiva a.m.",
        location: "Card de Modalidades",
        text: "<strong>Fórmula:</strong> Taxa de juros efetiva mensal da operação em % a.m."
    },
    {
        id: "mod-card-vpan-inc",
        label: "Desconto VPAN / Incentivo",
        location: "Card de Modalidades",
        text: "<strong>Fórmula & Conceito VPAN:</strong> O Desconto VPAN é o desconto à vista (Valor Presente À Vista) concedido na liquidação, reduzindo o valor principal da operação antes dos juros."
    },
    {
        id: "mod-card-garantias",
        label: "Garantias Exigidas",
        location: "Card de Modalidades",
        text: "<strong>Garantias Exigidas:</strong> Estrutura de colaterais e garantias exigidas pela mesa de crédito para formalização do contrato."
    },
    {
        id: "mod-card-valor-total",
        label: "Valor Total Equivalente",
        location: "Card de Modalidades",
        text: "<strong>Fórmula:</strong> Para modalidades financeiras: <code>Crédito * (1 - Desc. VPAN) * (1 + Taxa * Meses) * (1 - Incentivo)</code>. Para Barter: <code>(Volume Final * Preço Grão FOB) + Frete</code>."
    },
    {
        id: "mod-card-custo-total",
        label: "Custo Real Total (%)",
        location: "Card de Modalidades",
        text: "<strong>Fórmula:</strong> <code>((Valor Total Equivalente / Valor da Operação) - 1) * 100</code>."
    },
    {
        id: "mod-card-custo-op",
        label: "Custo Real Operação (a.m.)",
        location: "Card de Modalidades",
        text: "<strong>Fórmula:</strong> <code>Custo Real Total (%) / (Prazo / 30)</code>. Mede a taxa efetiva mensal ponderada da operação."
    },
    {
        id: "pracas-wsys",
        label: "Cadastro de Praças (WSys)",
        location: "Tela WSys",
        text: "Esta tela simula o cadastro de praças e custos logísticos do sistema WSys, conforme solicitado para demonstração."
    }
];

let currentTooltips = [];

function initTooltipsStore() {
    const saved = localStorage.getItem('barter_tooltips_store');
    if (saved) {
        try {
            currentTooltips = JSON.parse(saved);
        } catch (e) {
            currentTooltips = JSON.parse(JSON.stringify(defaultTooltips));
        }
    } else {
        currentTooltips = JSON.parse(JSON.stringify(defaultTooltips));
    }
    applyTooltipsToDOM();
}

function applyTooltipsToDOM() {
    currentTooltips.forEach(item => {
        const elements = document.querySelectorAll(`[data-tooltip-id="${item.id}"] .tooltip-text`);
        elements.forEach(el => {
            el.innerHTML = item.text;
        });
    });
}

function renderTooltipsTable() {
    const tbody = document.getElementById('tooltips-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    currentTooltips.forEach((item) => {
        const tr = document.createElement('tr');
        tr.id = `tooltip-row-${item.id}`;
        tr.innerHTML = `
            <td>
                <strong>${item.label}</strong>
                <span style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                    <i class="fa-solid fa-location-dot" style="margin-right: 3px;"></i> ${item.location}
                </span>
                <code style="font-size: 10px; color: var(--primary-medium); background: rgba(8, 131, 149, 0.08); padding: 1px 4px; border-radius: 4px;">id: ${item.id}</code>
            </td>
            <td>
                <textarea id="textarea-tooltip-${item.id}" rows="3" style="width: 100%; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; font-family: var(--font-body); font-size: 12.5px; line-height: 1.4; color: var(--text-primary); background-color: var(--bg-card); resize: vertical;" onchange="updateTooltipText('${item.id}', this.value)">${item.text}</textarea>
            </td>
            <td style="text-align: center; vertical-align: middle;">
                <div style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
                    <button type="button" class="btn-submit" onclick="copyTooltipText('${item.id}')" title="Copiar texto do tooltip em 1 clique" style="width: 100%; padding: 6px 10px; font-size: 11px; margin-top: 0; background-color: var(--primary-medium); background-image: none; color: white;">
                        <i class="fa-solid fa-copy"></i> Copiar
                    </button>
                    <button type="button" class="btn-submit" onclick="saveTooltipTextFromRow('${item.id}')" title="Salvar alteração" style="width: 100%; padding: 6px 10px; font-size: 11px; margin-top: 0; background-color: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); box-shadow: none;">
                        <i class="fa-solid fa-check"></i> Salvar
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateTooltipText(id, newText) {
    const item = currentTooltips.find(t => t.id === id);
    if (item) {
        item.text = newText;
        localStorage.setItem('barter_tooltips_store', JSON.stringify(currentTooltips));
        applyTooltipsToDOM();
    }
}

function saveTooltipTextFromRow(id) {
    const textarea = document.getElementById(`textarea-tooltip-${id}`);
    if (textarea) {
        updateTooltipText(id, textarea.value);
        alert(`Texto do tooltip "${id}" salvo com sucesso!`);
    }
}

function copyTooltipText(id) {
    const item = currentTooltips.find(t => t.id === id);
    if (!item) return;

    // Clean html tags for clean copy text
    const tempEl = document.createElement('div');
    tempEl.innerHTML = item.text.replace(/<br\s*\/?>/gi, '\n');
    const plainText = tempEl.innerText || tempEl.textContent;

    navigator.clipboard.writeText(plainText).then(() => {
        alert(`Texto de "${item.label}" copiado para a área de transferência!`);
    }).catch(() => {
        alert("Não foi possível copiar automaticamente.");
    });
}

function resetTooltipsToDefault() {
    if (confirm("Deseja restaurar todos os textos de ajuda para a versão padrão?")) {
        currentTooltips = JSON.parse(JSON.stringify(defaultTooltips));
        localStorage.setItem('barter_tooltips_store', JSON.stringify(currentTooltips));
        applyTooltipsToDOM();
        renderTooltipsTable();
        alert("Textos de ajuda restaurados para o padrão original!");
    }
}

function filterTooltipsTable(query) {
    const term = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#tooltips-table-body tr');
    rows.forEach(row => {
        const textContent = row.textContent.toLowerCase();
        const textareaVal = (row.querySelector('textarea')?.value || '').toLowerCase();
        if (textContent.includes(term) || textareaVal.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function exportTooltipsJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTooltips, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "tooltips_backup.json");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
}

function downloadTooltipsMD() {
    let mdContent = `# Dicionário de Textos de Ajuda (Tooltips) - Simulador Barter Hub 2026\n\n`;
    mdContent += `Este arquivo lista todos os textos explicativos associados aos ícones de interrogação (\`?\`) presentes no **Simulador de Cashback Barter 2026**.\n\n---\n\n`;
    mdContent += `| ID | Campo / Rótulo | Localização | Texto de Ajuda (Tooltip) |\n`;
    mdContent += `|---|---|---|---|\n`;

    currentTooltips.forEach(t => {
        const cleanText = t.text.replace(/\n/g, ' ');
        mdContent += `| \`${t.id}\` | **${t.label}** | ${t.location} | ${cleanText} |\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "tooltips.md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== TOOLTIP Z-INDEX ELEVATION ====================
// Garante que o card cujo tooltip está ativo sempre fique acima dos vizinhos
(function setupCardTooltipElevation() {
    function elevate() {
        // Listen on the cards grid container using event delegation
        const grid = document.getElementById('modality-cards-list');
        if (!grid) return;

        grid.addEventListener('mouseover', function (e) {
            const tooltipIcon = e.target.closest('.tooltip-container');
            if (!tooltipIcon) return;

            const card = tooltipIcon.closest('.modality-card');
            if (!card) return;

            // Elevate the card
            document.querySelectorAll('#modality-cards-list .modality-card').forEach(c => {
                c.style.zIndex = '1';
            });
            card.style.zIndex = '9999';
        });

        grid.addEventListener('mouseleave', function () {
            document.querySelectorAll('#modality-cards-list .modality-card').forEach(c => {
                c.style.zIndex = '1';
            });
        });
    }

    // Run after DOM is ready and also after cards are re-rendered
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', elevate);
    } else {
        elevate();
    }

    // Also re-bind after any calculateSimulation() re-renders the grid
    const _origCalc = typeof calculateSimulation === 'function' ? calculateSimulation : null;
    if (_origCalc) {
        window._cardTooltipElevationReady = true;
    }
})();

// Helper functions for Creative Pro Simulator
function loadCreativePreset(presetKey) {
    window.hasSimulated = true;
    if (presetKey === 'soja_mt_1m') {
        document.getElementById('sim-credito').value = 'R$ 1.000.000,00';
        const range = document.getElementById('creative-credit-range');
        if (range) range.value = 1000000;
        const val = document.getElementById('creative-credit-val');
        if (val) val.textContent = 'R$ 1.000.000,00';
        document.getElementById('sim-commodity').value = 'Soja';
        document.getElementById('sim-estado').value = 'MT';
        onEstadoChange('MT');
        onCulturaChange('Soja');
    } else if (presetKey === 'soja_go_2m') {
        document.getElementById('sim-credito').value = 'R$ 2.500.000,00';
        const range = document.getElementById('creative-credit-range');
        if (range) range.value = 2500000;
        const val = document.getElementById('creative-credit-val');
        if (val) val.textContent = 'R$ 2.500.000,00';
        document.getElementById('sim-commodity').value = 'Soja';
        document.getElementById('sim-estado').value = 'GO';
        onEstadoChange('GO');
        onCulturaChange('Soja');
    } else if (presetKey === 'algodao_mt_15m') {
        document.getElementById('sim-credito').value = 'R$ 1.500.000,00';
        const range = document.getElementById('creative-credit-range');
        if (range) range.value = 1500000;
        const val = document.getElementById('creative-credit-val');
        if (val) val.textContent = 'R$ 1.500.000,00';
        document.getElementById('sim-commodity').value = 'Algodão';
        document.getElementById('sim-estado').value = 'MT';
        onEstadoChange('MT');
        onCulturaChange('Algodão');
    }
    calculateSimulation();
}

function onCreativeRangeInput(val) {
    window.hasSimulated = true;
    const numVal = parseFloat(val);
    const formatted = formatCurrencyValue(numVal, selectedCurrency);
    document.getElementById('sim-credito').value = formatted;
    const v2Cred = document.getElementById('v2-sim-credito');
    if (v2Cred) v2Cred.value = formatted;
    const label = document.getElementById('creative-credit-val');
    if (label) label.textContent = formatted;
    calculateSimulation();
}

function selectCreativeCommodity(comm) {
    window.hasSimulated = true;
    document.getElementById('sim-commodity').value = comm;
    const btnSoja = document.getElementById('creative-pill-soja');
    const btnAlg = document.getElementById('creative-pill-algodao');
    const btnNone = document.getElementById('creative-pill-none');
    if (btnSoja) btnSoja.classList.toggle('active', comm === 'Soja');
    if (btnAlg) btnAlg.classList.toggle('active', comm === 'Algodão');
    if (btnNone) btnNone.classList.toggle('active', comm === '');
    onCulturaChange(comm);
}

// ==================== EXPOSE ALL INLINE-ONCLICK FUNCTIONS TO GLOBAL SCOPE ====================
// Required because GitHub Pages may serve the script in a context where functions are not
// automatically available to inline HTML onclick="" attributes.
window.showPage = showPage;
window.handleFormSimulate = handleFormSimulate;
window.hasSimulated = hasSimulated;
window.setCurrency = setCurrency;
window.downloadSimulationPDF = downloadSimulationPDF;
window.openSharePopup = openSharePopup;
window.startNewChat = startNewChat;
window.loadChatHistory = loadChatHistory;
window.handleSendButton = handleSendButton;
window.handleSuggestion = handleSuggestion;
window.startBarterSimulationFlow = startBarterSimulationFlow;
window.showCreateCampaignForm = showCreateCampaignForm;
window.cancelCreateCampaign = cancelCreateCampaign;
window.openTaxModal = openTaxModal;
window.closeTaxModal = closeTaxModal;
window.showCreatePracaForm = showCreatePracaForm;
window.cancelCreatePraca = cancelCreatePraca;
window.toggleAdvancedFilters = toggleAdvancedFilters;
window.exportTooltipsJSON = exportTooltipsJSON;
window.downloadTooltipsMD = downloadTooltipsMD;
window.resetTooltipsToDefault = resetTooltipsToDefault;
window.loadCreativePreset = loadCreativePreset;
window.onCreativeRangeInput = onCreativeRangeInput;
window.selectCreativeCommodity = selectCreativeCommodity;
window.onEstadoChange = onEstadoChange;
window.onPracaChange = onPracaChange;
window.onCampanhaSelectChange = onCampanhaSelectChange;
window.onCulturaChange = onCulturaChange;
window.editPraca = typeof editPraca !== 'undefined' ? editPraca : () => { };
window.deletePraca = typeof deletePraca !== 'undefined' ? deletePraca : () => { };





