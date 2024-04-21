const express = require('express');

const app = express();
const port = 3010;

app.set('view engine', 'pug');
app.set('views', 'views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/trending', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending'
    );
    const trendingCoin = await response.json();

    const renderTrendingCoin = (itemOrder) => {
      const coin = trendingCoin.coins[itemOrder].item;
      const price = coin.data.price.toFixed(10);
      const priceChangePercentage24h =
        coin.data.price_change_percentage_24h.usd.toFixed(2);
      const priceChangePercentage24hSymbol =
        priceChangePercentage24h < 0 ? '▼' : '▲';
      const priceChangePercentage24hFormatted =
        priceChangePercentage24h < 0 ? 'text-red-500' : 'text-green-500';
      const priceChangePercentage24hRoot = Math.abs(priceChangePercentage24h);

      return `
        <div class="flex justify-between mt-2 font-medium">
          <div class="flex space-x-2">
            <img src="${coin.small}" width="25px" class="rounded-full"/>
            <span>${coin.name}</span>
          </div>
          <div>$${price} <span class="${priceChangePercentage24hFormatted}">${priceChangePercentage24hSymbol} ${priceChangePercentage24hRoot}%</span></div>
        </div>
      `;
    };

    let html = '';
    for (let itemOrder = 0; itemOrder < 3; itemOrder++) {
      html += renderTrendingCoin(itemOrder);
    }

    res.send(html);
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    res.status(500).send('Error fetching trending coins');
  }
});

app.get('/usd_coin', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd'
    );
    const usdCoins = await response.json();
    const usdCoinSearch = usdCoins.filter(
      (coin) => coin.id === 'usd-coin' || coin.id === 'tether'
    );

    const renderUsdCoin = (usdCoin) => {
      return `
        <div class="flex justify-between mt-2 font-medium">
          <div class="flex space-x-2">
            <img src="${usdCoin.image}" width="25px" class="rounded-full"/>
            <span>${usdCoin.name}</span>
          </div>
          <div>$${usdCoin.current_price}</div>
        </div>
      `;
    };

    const html = usdCoinSearch.map(renderUsdCoin).join('');

    res.send(html);
  } catch (error) {
    console.error('Error fetching USD coins:', error);
    res.status(500).send('Error fetching USD coins');
  }
});

app.get('/total_market_cap', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    const globalData = await response.json();

    const totalMarketCap = globalData.data.total_market_cap.usd.toLocaleString(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
      }
    );

    const marketCapChange24 =
      globalData.data.market_cap_change_percentage_24h_usd.toFixed(2);
    const marketCapChange24Symbol = marketCapChange24 < 0 ? '▼' : '▲';
    const marketCapChange24Format =
      marketCapChange24 < 0 ? 'text-red-500' : 'text-green-500';

    res.send(
      `
    <h2 class="text-2xl font-bold">${totalMarketCap}</h2>
    <p class="text-gray-500 font-semibold">  Market Cap <span class="${marketCapChange24Format}">${marketCapChange24Symbol} ${marketCapChange24}%</span></p>
    `
    );
  } catch (error) {
    console.error('Error fetching total market cap:', error);
    res.status(500).send('Error fetching total market cap');
  }
});

app.get('/total_coins', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    const globalData = await response.json();

    const total_coins = globalData.data.active_cryptocurrencies;

    res.send(
      `
    <h2 class="text-2xl font-bold">🪙 ${total_coins}</h2>
    `
    );
  } catch (error) {
    console.error('Error fetching total coins:', error);
    res.status(500).send('Error fetching total coins');
  }
});

app.get('/table', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd');
    const usdCoins = await response.json();

    const renderCoinRow = (coin) => {
      const pricePercent = coin.price_change_percentage_24h.toFixed(1);
      const pricePercentSymbol = pricePercent < 0 ? '▼' : '▲';
      const pricePercentFormat = pricePercent < 0 ? 'text-red-500' : 'text-green-500';
      const pricePercentAbs = Math.abs(pricePercent)

      // Market Cap
      const marketPercent = coin.market_cap_change_percentage_24h.toFixed(1);
      const marketPercentSymbol = marketPercent < 0 ? '▼' : '▲';
      const marketPercentFormat = marketPercent < 0 ? 'text-red-500' : 'text-green-500';
      const marketPercentAbs = Math.abs(marketPercent)
      return `
        <tr class="text-gray-600 font-semibold text-[14px] border-b-[1px] border-t-[1px] border-gray-100">
          <td class="text-center">${coin.market_cap_rank}</td>
          <td class="flex flex-row items-center space-x-4 pl-8 py-4">
            <img src="${coin.image}" alt="symbol-image" class="w-6 h-6"/>
            <div class="flex flex-row items-center space-x-2">
              <h3 class="font-medium text-black">${coin.name}</h3>
              <h4 class="text-gray-400">${coin.symbol.toUpperCase()}</h4>
            </div>
          </td>
          <td>${coin.current_price.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })}</td>
          <td class="${pricePercentFormat}">${pricePercentSymbol} ${pricePercentAbs}%</td>
          <td>${coin.market_cap.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })}</td>
          <td class="${marketPercentFormat}">${marketPercentSymbol} ${marketPercentAbs}%</td>
        </tr>
      `;
    };

    const tableHTML = usdCoins.map(renderCoinRow).join('');

    res.send(tableHTML);
  } catch (error) {
    console.error('Error fetching USD coins:', error);
    res.status(500).send('Error fetching USD coins');
  }
});

// Test

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
