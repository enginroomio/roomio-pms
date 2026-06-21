import assert from 'node:assert/strict';

function tcmbUrlForDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`;
}

function tcmbCandidateUrls(preferredDate, mode = 'latest') {
  const urls = [];
  if (mode === 'latest') urls.push('https://www.tcmb.gov.tr/kurlar/today.xml');
  for (let i = 0; i < 10; i += 1) {
    const day = new Date(`${preferredDate}T12:00:00+03:00`);
    day.setDate(day.getDate() - i);
    const iso = day.toISOString().slice(0, 10);
    const archive = tcmbUrlForDate(iso);
    if (!urls.includes(archive)) urls.push(archive);
  }
  return urls;
}

function tcmbPublishedBuy(row) {
  return row.tryPerUnitBuy * row.unit;
}

assert.equal(
  tcmbUrlForDate('2026-06-18'),
  'https://www.tcmb.gov.tr/kurlar/202606/18062026.xml',
);

const latest = tcmbCandidateUrls('2026-06-20', 'latest');
assert.equal(latest[0], 'https://www.tcmb.gov.tr/kurlar/today.xml');
assert.ok(latest.includes('https://www.tcmb.gov.tr/kurlar/202606/18062026.xml'));

const jpy = { unit: 100, tryPerUnitBuy: 0.286215 };
assert.equal(Math.round(tcmbPublishedBuy(jpy) * 100) / 100, 28.62);

console.log('tcmb checks OK');
