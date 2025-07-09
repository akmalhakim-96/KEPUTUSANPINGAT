// URL Google Sheet yang diterbitkan sebagai CSV
// PENTING: Gantikan URL ini dengan URL CSV Google Sheet anda sendiri!
// Contoh: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCErIhiW1OUr_-mT7eABDXgbOXUmi6k_XDWtqDMijY_dJx0Be7piq33F537zHh6pwKmztHJrX7j2Ti/pub?gid=668461573&single=true&output=csv'
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCErIhiW1OUr_-mT7eABDXgbOXUmi6k_XDWtqDMijY_dJx0Be7piq33F537zHh6pwKmztHJrX7j2Ti/pub?gid=668461573&single=true&output=csv'; // GANTI INI!

// Elemen DOM
const lastUpdatedElement = document.getElementById('last-updated');
const refreshButton = document.getElementById('refresh-button');
const refreshButtonText = refreshButton.querySelector('.button-text');
const loadingSpinner = refreshButton.querySelector('.loading-spinner');
const refreshIcon = refreshButton.querySelector('.refresh-icon');
const errorMessageElement = document.getElementById('error-message');
const errorTextElement = document.getElementById('error-text');
const initialLoadingSpinner = document.getElementById('loading-spinner-initial');
const medalTableContent = document.getElementById('medal-table-content');
const noDataMessage = document.getElementById('no-data-message');
const overallSummaryContainer = document.getElementById('overall-medals-summary-container');
const totalGoldElement = document.getElementById('total-gold');
const totalSilverElement = document.getElementById('total-silver');
const totalBronzeElement = document.getElementById('total-bronze');
const totalOverallElement = document.getElementById('total-overall');
const currentYearElement = document.getElementById('current-year');

// Fungsi untuk mendapatkan kelas warna baris berdasarkan nama 'Rumah Sukan'
function getRowClass(houseName) {
    switch (houseName.toUpperCase()) { // Tukar kepada huruf besar untuk perbandingan tidak sensitif huruf
        case 'CYBORG':
            return 'row-cyborg';
        case 'MECHA':
            return 'row-mecha';
        case 'TECHNO':
            return 'row-techno';
        case 'VOLTRA':
            return 'row-voltra';
        default:
            return 'row-default'; // Gaya lalai untuk rumah lain
    }
}

// Fungsi untuk parse CSV
// Mengendalikan koma dalam petikan dengan lebih baik
function parseCSV(text) {
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== ''); // Pecahkan baris, buang baris kosong
    return rows.map(row => {
        // Regex untuk memisahkan nilai yang dipisahkan koma, termasuk yang dalam petikan
        const values = row.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]*))/g);
        return values.map(value => {
            if (value && value.startsWith('"') && value.endsWith('"')) {
                // Buang petikan dan ganti petikan berganda dengan satu petikan
                return value.substring(1, value.length - 1).replace(/\"\"/g, '"');
            }
            return value ? value.trim() : ''; // Pastikan tiada ruang kosong
        });
    });
}

// Fungsi untuk memaparkan jadual pingat
function displayMedalTable(medalStandings) {
    let tableHTML = `
        <table class="medal-table">
            <thead>
                <tr>
                    <th class="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Rumah Sukan</th>
                    <th class="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Emas</th>
                    <th class="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Perak</th>
                    <th class="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider">Gangsa</th>
                    <th class="py-3 px-4 text-center text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Jumlah</th>
                </tr>
            </thead>
            <tbody>
    `;

    medalStandings.forEach(house => {
        const rowClass = getRowClass(house['Rumah Sukan']);
        tableHTML += `
            <tr class="${rowClass}">
                <td class="py-3 px-4 font-medium whitespace-nowrap">${house['Rumah Sukan']}</td>
                <td class="py-3 px-4 text-center">${house.Emas}</td>
                <td class="py-3 px-4 text-center">${house.Perak}</td>
                <td class="py-3 px-4 text-center">${house.Gangsa}</td>
                <td class="py-3 px-4 text-center font-bold">${house.Jumlah}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    medalTableContent.innerHTML = tableHTML;
}

// Fungsi untuk memaparkan ringkasan jumlah pingat keseluruhan
function displayOverallSummary(totalMedals) {
    totalGoldElement.textContent = totalMedals.Emas;
    totalSilverElement.textContent = totalMedals.Perak;
    totalBronzeElement.textContent = totalMedals.Gangsa;
    totalOverallElement.textContent = totalMedals.Jumlah;
    overallSummaryContainer.classList.remove('hidden');
}

// Fungsi untuk mengambil data dari Google Sheet
async function fetchMedalStandings() {
    // Tunjukkan spinner dan nyahaktifkan butang
    refreshButton.disabled = true;
    refreshButtonText.textContent = 'Memuatkan...';
    loadingSpinner.classList.remove('hidden');
    refreshIcon.classList.add('hidden');
    errorMessageElement.classList.add('hidden'); // Sembunyikan mesej ralat sedia ada
    noDataMessage.classList.add('hidden'); // Sembunyikan mesej tiada data
    initialLoadingSpinner.classList.remove('hidden'); // Tunjukkan spinner awal

    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error(`Ralat HTTP! Status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);

        let medalStandings = [];
        if (parsedData.length > 1) {
            const headers = parsedData[0];
            const dataRows = parsedData.slice(1);

            medalStandings = dataRows.map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header.trim()] = row[index] ? row[index].trim() : '';
                });
                return {
                    'Rumah Sukan': rowData['Rumah Sukan'],
                    'Emas': parseInt(rowData['Emas'] || '0', 10),
                    'Perak': parseInt(rowData['Perak'] || '0', 10),
                    'Gangsa': parseInt(rowData['Gangsa'] || '0', 10),
                    'Jumlah': parseInt(rowData['Jumlah'] || '0', 10),
                };
            });

            // Susun data mengikut Emas (menurun), kemudian Perak, kemudian Gangsa
            medalStandings.sort((a, b) => {
                if (b.Emas !== a.Emas) return b.Emas - a.Emas;
                if (b.Perak !== a.Perak) return b.Perak - a.Perak;
                return b.Gangsa - a.Gangsa;
            });

            displayMedalTable(medalStandings); // Paparkan jadual
            initialLoadingSpinner.classList.add('hidden'); // Sembunyikan spinner awal
            medalTableContent.classList.remove('hidden'); // Tunjukkan kandungan jadual

            // Kira dan paparkan jumlah keseluruhan pingat
            const totalOverallMedals = medalStandings.reduce((acc, house) => {
                acc.Emas += house.Emas;
                acc.Perak += house.Perak;
                acc.Gangsa += house.Gangsa;
                acc.Jumlah += house.Jumlah;
                return acc;
            }, { Emas: 0, Perak: 0, Gangsa: 0, Jumlah: 0 });
            displayOverallSummary(totalOverallMedals);

            lastUpdatedElement.textContent = `Kemas Kini Terakhir: ${new Date().toLocaleTimeString('ms-MY')}`;
        } else {
            // Tiada data atau hanya header
            initialLoadingSpinner.classList.add('hidden');
            medalTableContent.innerHTML = ''; // Kosongkan jadual
            noDataMessage.classList.remove('hidden'); // Tunjukkan mesej tiada data
            overallSummaryContainer.classList.add('hidden'); // Sembunyikan ringkasan
            lastUpdatedElement.textContent = `Kemas Kini Terakhir: Tiada data`;
        }
    } catch (err) {
        console.error("Gagal mengambil data:", err);
        errorTextElement.textContent = `Gagal memuatkan data. Sila pastikan URL betul dan helaian diterbitkan. Ralat: ${err.message}`;
        errorMessageElement.classList.remove('hidden'); // Tunjukkan mesej ralat
        initialLoadingSpinner.classList.add('hidden'); // Sembunyikan spinner awal
        medalTableContent.innerHTML = ''; // Kosongkan jadual
        noDataMessage.classList.add('hidden'); // Pastikan mesej tiada data tersembunyi jika ada ralat
        overallSummaryContainer.classList.add('hidden'); // Sembunyikan ringkasan
        lastUpdatedElement.textContent = `Kemas Kini Terakhir: Ralat`;
    } finally {
        // Pulihkan butang dan sembunyikan spinner
        refreshButton.disabled = false;
        refreshButtonText.textContent = 'Segarkan Sekarang';
        loadingSpinner.classList.add('hidden');
        refreshIcon.classList.remove('hidden');
    }
}

// Event Listener untuk butang refresh
refreshButton.addEventListener('click', fetchMedalStandings);

// Muatkan data apabila halaman dimuatkan sepenuhnya
window.onload = function() {
    currentYearElement.textContent = new Date().getFullYear();
    fetchMedalStandings(); // Muatkan data pada permulaan

    // Tetapkan auto-refresh setiap 30 saat
    setInterval(fetchMedalStandings, 30000); // 30000 ms = 30 saat
};
