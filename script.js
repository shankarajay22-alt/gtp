const API_URL = "https://api.frankfurter.dev/v1/latest";
const currencies = ["USD", "CNY", "INR", "EUR", "GBP", "JPY"];
const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
const moneyFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const amountInput = document.querySelector("#amount");
const fromSelect = document.querySelector("#fromCurrency");
const toSelect = document.querySelector("#toCurrency");
const swapButton = document.querySelector("#swapButton");
const convertedAmount = document.querySelector("#convertedAmount");
const statusText = document.querySelector("#status");
const mainRate = document.querySelector("#mainRate");
const baseAmount = document.querySelector("#baseAmount");
const rateDate = document.querySelector("#rateDate");

let cache = new Map();

async function getRate(from, to) {
  if (from === to) {
    return { rate: 1, date: new Date().toISOString().slice(0, 10) };
  }

  const key = `${from}-${to}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  const response = await fetch(`${API_URL}?base=${from}&symbols=${to}`);
  if (!response.ok) {
    throw new Error("Could not load exchange rate");
  }

  const data = await response.json();
  const result = { rate: data.rates[to], date: data.date };
  cache.set(key, result);
  return result;
}

function formatCurrency(value, currency) {
  return `${moneyFormatter.format(value)} ${currency}`;
}

async function updateConverter() {
  const amount = Number(amountInput.value || 0);
  const from = fromSelect.value;
  const to = toSelect.value;

  statusText.textContent = "Updating";

  try {
    const { rate, date } = await getRate(from, to);
    const converted = amount * rate;

    convertedAmount.value = formatCurrency(converted, to);
    mainRate.textContent = formatter.format(rate);
    baseAmount.textContent = `1 ${from}`;
    rateDate.textContent = `Rate date: ${date}`;
    statusText.textContent = "Live rate";
  } catch (error) {
    convertedAmount.value = "Rate unavailable";
    statusText.textContent = "Offline";
  }
}

async function updatePopularRates() {
  const pairs = [
    ["CNY", "INR", "cnyInr"],
    ["INR", "CNY", "inrCny"],
    ["USD", "INR", "usdInr"],
    ["CNY", "USD", "cnyUsd"],
  ];

  await Promise.all(
    pairs.map(async ([from, to, elementId]) => {
      const element = document.querySelector(`#${elementId}`);
      try {
        const { rate } = await getRate(from, to);
        element.textContent = formatter.format(rate);
      } catch (error) {
        element.textContent = "--";
      }
    })
  );
}

function ensureDifferentCurrency() {
  if (fromSelect.value !== toSelect.value) {
    return;
  }

  toSelect.value = fromSelect.value === "CNY" ? "USD" : "CNY";
}

amountInput.addEventListener("input", updateConverter);
fromSelect.addEventListener("change", () => {
  ensureDifferentCurrency();
  updateConverter();
});
toSelect.addEventListener("change", () => {
  ensureDifferentCurrency();
  updateConverter();
});
swapButton.addEventListener("click", () => {
  const currentFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = currentFrom;
  updateConverter();
});

updateConverter();
updatePopularRates();
