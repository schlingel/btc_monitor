(function() {
  "use strict";

  // taken from https://bitcointalk.org/index.php?topic=813324.0
  // found here: https://bitcoin.stackexchange.com/questions/31974/what-is-the-average-size-of-a-bitcoin-transaction
  var AVG_TX_SIZE_BYTE = 250;
  var SATOSHI_IN_BTC = 100000000;
  var DEFAULT_TARGET = "#btc-monitor-area";

  setup();

  function setup() {
    numeral.locale('de');
    prepareData().then(displayCurrentFees).fail(displayError);
  }

  function prepareData() {
    var $deferred = $.Deferred();

    var $curPriceDeferred = $.ajax({
      method: 'GET',
      dataType: 'json',
      url: 'https://bitcoinfees.21.co/api/v1/fees/recommended'
    });
    var $curEuroPriceDeferred = $.ajax({
      method: 'GET',
      dataType: 'json',
      url: 'https://api.coindesk.com/v1/bpi/currentprice.json'
    });

    $.when($curPriceDeferred, $curEuroPriceDeferred).done(function(curPrice, curEuroPrice) {
      curPrice = curPrice[0];
      curEuroPrice = curEuroPrice[0];

      var hasEuro = !!curPrice && !!curEuroPrice.bpi && !!curEuroPrice.bpi.EUR;

      console.log(curEuroPrice);

      if(!hasEuro) {
        console.log('no euro available');

        $deferred.reject();
        return;
      }

      var currencies = Object.keys(curEuroPrice.bpi);
      var feeEntries = Object.keys(curPrice);
      var result = [];

      console.log(currencies);

      for(var i = 0; i < currencies.length; i++) {
        var currencyData = curEuroPrice.bpi[currencies[i]];
        var exchange = currencyData.rate_float;
        var resultObject = { exchange: exchange, currency: currencyData.code, currencySymbol: currencyData.symbol };

        feeEntries.forEach(function(feeEntryKey) {
          resultObject[feeEntryKey] = curPrice[feeEntryKey];
          resultObject[feeEntryKey + 'Fiat'] = curPrice[feeEntryKey] * exchange * AVG_TX_SIZE_BYTE / SATOSHI_IN_BTC;
        });

        result.push(resultObject);
      }

      $deferred.resolve(result);
    }).fail(function() {
      $deferred.reject();
    });

    return $deferred.promise();
  }

  function displayError() {
    console.log('failed');
  }

  function displayCurrentFees(currencyArr) {
    console.log('Result: ', currencyArr);

    $(document).ready(function() {
      currencyArr.forEach(function(currencyData) {
        $(DEFAULT_TARGET).append(createFeeBox(currencyData.currency + ' Kosten für Transaktion <br/> innerhalb einer Stunde', currencyData['hourFeeFiat'], currencyData.currency, currencyData.currencySymbol))
      });
    });
  }

  function createFeeBox(label, fee, currency, currencySymbol) {
    var $box = $('<div>').addClass('btc-fee-box');
    var $label = $('<label>').html(label).addClass('btc-fee-label');
    var $price = $('<span>').addClass('btc-price-display').html(currencySymbol + ' ' + formatPrice(fee));

    $box.append($price).append($label);
    return $box;
  }

  function formatPrice(price) {
    return numeral(price).format('0,0.00');
  }
})();
