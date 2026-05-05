
let pemain = [];
let historyData = [];
let round = 0;
let chart;

const warnaList = [
"#ff7675","#74b9ff","#55efc4","#ffeaa7",
"#a29bfe","#fd79a8","#81ecec","#fab1a0"
];

const daftarPemain = {
    "ARI": "images/ari.png",
    "ANDRI": "images/andri.png",
    "SAID": "images/said.png",
    "RIAN": "images/rian.png",
    "USER": "images/user.png",
};

// LOAD
window.onload = function() {
    let data = localStorage.getItem('remiBox');
    if (data) {
        let d = JSON.parse(data);
        pemain = d.pemain;
        historyData = d.historyData || [];
        round = d.round;

        setupUI();
        recalcScore();
        renderHistory();
        nextRound(false);

        setTimeout(renderChart, 200);
    }
}

function setupUI(){
    document.getElementById('setupArea').style.display='none';
    document.getElementById('scoreSection').style.display='block';
    document.getElementById('historySection').style.display='block';
    document.getElementById('judulGame').style.display='block';
}

// SAVE
function saveData(){
    localStorage.setItem('remiBox', JSON.stringify({ pemain, historyData, round }));
}

// INPUT NAMA
function buatNama(){
    let j = document.getElementById('jumlah').value;
    let c = document.getElementById('namaContainer');
    c.innerHTML='';

    let options = `<option value="">-- pilih pemain --</option>`;
    Object.keys(daftarPemain).forEach(nama=>{
        options += `<option value="${nama}">${nama}</option>`;
    });

    for(let i=0;i<j;i++){
        c.innerHTML += `
            <select id="nama${i}" onchange="cekNamaLengkap()">
                ${options}
            </select>
        `;
    }
}

function cekNamaLengkap(){
    let j = document.getElementById('jumlah').value;
    let selected = [];

    for(let i=0;i<j;i++){
        let val = document.getElementById('nama'+i).value;

        if(!val){
            document.getElementById('btnMulai').disabled = true;
            return;
        }

        if(selected.includes(val)){
            alert("Pemain tidak boleh sama!");
            document.getElementById('btnMulai').disabled = true;
            return;
        }

        selected.push(val);
    }

    document.getElementById('btnMulai').disabled = false;
}

// RESET
function resetGame(){
    if(confirm('Reset?')){
        localStorage.removeItem('remiBox');
        location.reload();
    }
}

// MULAI
function mulaiGame(){
    let j = document.getElementById('jumlah').value;
    pemain = [];

    for(let i=0;i<j;i++){
        let nama = document.getElementById('nama'+i).value;

        if(!nama){
            alert("Pilih semua pemain!");
            return;
        }

        pemain.push({
            nama: nama,
            skor: 0,
            warna: warnaList[i % warnaList.length],
            foto: daftarPemain[nama] || "images/user.png"
        });
    }

    console.log("PEMAIN:", pemain); // 🔥 debug

    round = 0;
    historyData = [];

    setupUI();
    updateScoreboard();
    nextRound();
    saveData();
}

// NEXT
function nextRound(tambah=true){
    if(tambah) round++;

    document.getElementById('roundInfo').innerText = "Round: "+round;

    let html = `<table><tr>`;
    pemain.forEach(p=> html += `<th style="color:${p.warna}">${p.nama}</th>`);
    html += `</tr><tr>`;

    pemain.forEach((p,i)=>{
        html += `<td>
            <input 
                type="tel" 
                id="nilai${i}" 
                inputmode="numeric"
                oninput="this.value=this.value.replace(/[^0-9]/g,'')"
            >
        </td>`;
    });

    html += `</tr></table>
    <button onclick="hitung()">Hitung</button>`;

    document.getElementById('gameArea').innerHTML = html;
}

// HITUNG
function hitung(){
    let nilai=[];

    for(let i=0;i<pemain.length;i++){
        nilai.push(document.getElementById('nilai'+i).value);
    }

    historyData.push({round, nilai});

    recalcScore();
    renderHistory(); // 🔥 ini wajib
    saveData();
    nextRound();
    renderChart(); // 🔥 WAJIB
}

// HISTORY
function renderHistory(){
    let tb = document.querySelector('#historyTable tbody');

    // 🔥 kalau tidak ketemu, stop (biar gak crash)
    if(!tb){
        console.log("tbody tidak ketemu");
        return;
    }

    tb.innerHTML='';

    // 🔥 kalau belum ada data
    if(historyData.length === 0){
        tb.innerHTML = `<tr><td colspan="3">Belum ada data</td></tr>`;
        return;
    }

    historyData.forEach((h,i)=>{
        let detail='';

        h.nilai.forEach((n,idx)=>{
            if(!pemain[idx]) return;

            detail += `<span style="color:${pemain[idx].warna}">
                ${pemain[idx].nama}:${n}
            </span> | `;
        });

        tb.innerHTML += `
        <tr>
            <td>${h.round}</td>
            <td>${detail}</td>
            <td>
                <button onclick="editRound(${i})">✏️</button>
            </td>
        </tr>`;
    });
}

//EDIT ROUND
function editRound(index){
    let h = historyData[index];

    let html = `<h3>Edit Round ${h.round}</h3><table><tr>`;
    pemain.forEach(p => html += `<th>${p.nama}</th>`);
    html += `</tr><tr>`;

    h.nilai.forEach((n,i)=>{
        html += `<td>
            <input 
                type="tel"
                id="edit${i}"
                value="${n}"
                oninput="this.value=this.value.replace(/[^0-9]/g,'')"
            >
        </td>`;
    });

    html += `</tr></table>
    <button onclick="saveEdit(${index})">Simpan</button>`;

    document.getElementById('gameArea').innerHTML = html;
}

function saveEdit(index){
    let arr=[];

    for(let i=0;i<pemain.length;i++){
        let v = document.getElementById('edit'+i).value.trim();
        if(v==='') return alert('Isi semua!');
        arr.push(v);
    }

    historyData[index].nilai = arr;

    recalcScore();
    renderHistory();
    saveData();
    nextRound(false);
    renderChart();
}

// SCORE
function recalcScore(){
    pemain.forEach(p => p.skor = 0);

    historyData.forEach(h => {

        // 1. Bentuk array semua pemain
        let semua = h.nilai.map((v,i)=>({
            raw: v,
            nilai: /^0+$/.test(v) ? -9999 : parseInt(v), // joker jadi paling kecil
            index: i
        }));

        // 2. Urutkan (ascending = terbaik dulu)
        semua.sort((a,b)=>a.nilai - b.nilai);

        // 3. Kasih penalti berdasarkan ranking penuh
        semua.forEach((p,i)=>{
            // skip penalti kalau joker / 0
            if(!/^0+$/.test(p.raw)){
                pemain[p.index].skor -= (i+1);
            }
        });

        // 4. Tambahin bonus joker
        semua.forEach(p=>{
            if(/^0+$/.test(p.raw)){
                let bonus = pemain.length + (p.raw.length - 1);
                pemain[p.index].skor += bonus;
            }
        });

    });

    updateScoreboard();
}

function updateScoreboard(){
    let tb = document.querySelector('#scoreTable tbody');
    tb.innerHTML='';

    [...pemain].sort((a,b)=>b.skor-a.skor).forEach((p,i)=>{

        let medal = '';
        if(i === 0) medal = '🥇';
        else if(i === 1) medal = '🥈';
        else if(i === 2) medal = '🥉';

        tb.innerHTML += `<tr>
            <td>${medal} ${i+1}</td>
            <td style="color:${p.warna}">${p.nama}</td>
            <td>${p.skor}</td>
        </tr>`;
    });

    updateImages(); // 🔥 penting
}

// CHART
function renderChart(){
    if(historyData.length === 0) return;

    const ctx = document.getElementById('chartScore').getContext('2d');
    if(chart) chart.destroy();

    let labels = historyData.map(h => "Ronde" + h.round);

    let datasets = pemain.map((p, idx) => {
        let skorTemp = 0;
        let data = [];

        historyData.forEach(h => {
            let lainnya = [];

            h.nilai.forEach((v,i)=>{
                if(/^0+$/.test(v)){
                    if(i === idx){
                        skorTemp += pemain.length + (v.length-1);
                    }
                } else {
                    lainnya.push({nilai:parseInt(v), index:i});
                }
            });

            lainnya.sort((a,b)=>a.nilai-b.nilai);

            let adaNol = h.nilai.some(v=>/^0+$/.test(v));
            let start = adaNol ? 2 : 1;

            lainnya.forEach((p2,i)=>{
                if(p2.index === idx){
                    skorTemp -= (i+start);
                }
            });

            data.push(skorTemp);
        });

        return {
            label: p.nama,
            data: data,
            borderColor: p.warna,
            fill: false,
            tension: 0.3
        };
    });

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


function updateImages(){

    let win = document.getElementById('imgWinner');
    let lose = document.getElementById('imgLoser');

    if(!win || !lose) return;

    // 🔥 BELUM ADA DATA → pakai default
    if(historyData.length === 0){
        win.src = "images/user.png";
        lose.src = "images/user.png";
        return;
    }

    let rank = [...pemain].sort((a,b)=>b.skor-a.skor);

    win.src = rank[0].foto;
    lose.src = rank[rank.length-1].foto;

    // fallback kalau gambar error
    win.onerror = () => win.src = "images/user.png";
    lose.onerror = () => lose.src = "images/user.png";
}