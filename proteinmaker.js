/* ════════════════════════════════════════
   PROTEINMAKER — JavaScript
   mRNA → Codon → AA · RCSB PDB · Audio
   ════════════════════════════════════════ */

   'use strict';

   /* ─────────────────────────────────────────
      1. CODON TABLE  (standard genetic code)
   ───────────────────────────────────────── */
   const CODON_TABLE = {
     UUU:'F', UUC:'F', UUA:'L', UUG:'L',
     CUU:'L', CUC:'L', CUA:'L', CUG:'L',
     AUU:'I', AUC:'I', AUA:'I', AUG:'M',
     GUU:'V', GUC:'V', GUA:'V', GUG:'V',
     UCU:'S', UCC:'S', UCA:'S', UCG:'S',
     CCU:'P', CCC:'P', CCA:'P', CCG:'P',
     ACU:'T', ACC:'T', ACA:'T', ACG:'T',
     GCU:'A', GCC:'A', GCA:'A', GCG:'A',
     UAU:'Y', UAC:'Y', UAA:'*', UAG:'*',
     CAU:'H', CAC:'H', CAA:'Q', CAG:'Q',
     AAU:'N', AAC:'N', AAA:'K', AAG:'K',
     GAU:'D', GAC:'D', GAA:'E', GAG:'E',
     UGU:'C', UGC:'C', UGA:'*', UGG:'W',
     CGU:'R', CGC:'R', CGA:'R', CGG:'R',
     AGU:'S', AGC:'S', AGA:'R', AGG:'R',
     GGU:'G', GGC:'G', GGA:'G', GGG:'G'
   };
   
   /* ─────────────────────────────────────────
      2. AMINO ACID PROPERTIES
   ───────────────────────────────────────── */
   const AA_PROPS = {
     A:{cat:'hydrophobic', freq:220, wave:'sine',     dur:0.32, name:'Alanine'},
     V:{cat:'hydrophobic', freq:196, wave:'sine',     dur:0.30, name:'Valine'},
     I:{cat:'hydrophobic', freq:174, wave:'sine',     dur:0.34, name:'Isoleucine'},
     L:{cat:'hydrophobic', freq:165, wave:'sine',     dur:0.36, name:'Leucine'},
     M:{cat:'hydrophobic', freq:185, wave:'sine',     dur:0.33, name:'Methionine'},
     F:{cat:'hydrophobic', freq:146, wave:'sine',     dur:0.38, name:'Phenylalanine'},
     W:{cat:'hydrophobic', freq:138, wave:'sine',     dur:0.40, name:'Tryptophan'},
     P:{cat:'hydrophobic', freq:207, wave:'sine',     dur:0.28, name:'Proline'},
     S:{cat:'polar',       freq:330, wave:'triangle', dur:0.30, name:'Serine'},
     T:{cat:'polar',       freq:349, wave:'triangle', dur:0.32, name:'Threonine'},
     C:{cat:'polar',       freq:370, wave:'triangle', dur:0.30, name:'Cysteine'},
     Y:{cat:'polar',       freq:311, wave:'triangle', dur:0.36, name:'Tyrosine'},
     N:{cat:'polar',       freq:294, wave:'triangle', dur:0.30, name:'Asparagine'},
     Q:{cat:'polar',       freq:277, wave:'triangle', dur:0.32, name:'Glutamine'},
     K:{cat:'positive',   freq:523, wave:'square',   dur:0.28, name:'Lysine'},
     R:{cat:'positive',   freq:587, wave:'square',   dur:0.30, name:'Arginine'},
     H:{cat:'positive',   freq:494, wave:'square',   dur:0.28, name:'Histidine'},
     D:{cat:'negative',   freq:82,  wave:'sawtooth', dur:0.34, name:'Aspartate'},
     E:{cat:'negative',   freq:73,  wave:'sawtooth', dur:0.36, name:'Glutamate'},
     G:{cat:'special',    freq:0,   wave:'sine',     dur:0.15, name:'Glycine (rest)'},
   };
   
   /* ─────────────────────────────────────────
      3. PROTEIN PRESETS  (name, PDB, sequence)
   ───────────────────────────────────────── */
   const PROTEINS = [
     { name:'인슐린',      en:'Insulin',       pdb:'1MSO', seq:'GIVEQCCTSICSLYQLENYCN' },
     { name:'헤모글로빈',  en:'Hemoglobin α',  pdb:'1HHO', seq:'VLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVA' },
     { name:'리소자임',    en:'Lysozyme',      pdb:'2LYZ', seq:'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL' },
     { name:'옥시토신',    en:'Oxytocin',      pdb:'1NPO', seq:'CYIQNCPLG' },
     { name:'GFP',         en:'Green Fluor.',  pdb:'1EMA', seq:'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK' },
     { name:'콜라겐',      en:'Collagen',      pdb:'1CGD', seq:'GPPGPPGPPGPPGPPGPPGPPGPPGPP' },
   ];
   
   /* PDB 빠른 접근 프리셋 */
   const PDB_PRESETS = [
     { id:'1HHO', label:'헤모글로빈' },
     { id:'2LYZ', label:'리소자임' },
     { id:'1EMA', label:'GFP' },
     { id:'1MSO', label:'인슐린' },
     { id:'4HHB', label:'디옥시Hb' },
     { id:'1CGD', label:'콜라겐' },
     { id:'1CRN', label:'크라민' },
   ];
   
   /* ─────────────────────────────────────────
      4. DOM REFS
   ───────────────────────────────────────── */
   const $ = id => document.getElementById(id);
   const pgrid      = $('pgrid');
   const seqDisp    = $('seqDisp');
   const seqSt      = $('seqSt');
   const playSt     = $('playSt');
   const pfill      = $('pfill');
   const noteBadge  = $('noteBadge');
   const spdSlider  = $('spd');
   const spdV       = $('spdV');
   const tip        = $('tip');
   
   // mRNA
   const mrnaInput  = $('mrnaInput');
   const mrnaMeta   = $('mrnaMeta');
   const btnTranslate = $('btnTranslate');
   const codonStrip = $('codonStrip');
   
   // PDB
   const pdbIdInput = $('pdbId');
   const btnPdb     = $('btnPdb');
   const pdbPresets = $('pdbPresets');
   const pdbInfo    = $('pdbInfo');
   const pdbPlaceholder = $('pdbPlaceholder');
   const pdbFrame   = $('pdbFrame');
   const pdbAtoms   = $('pdbAtoms');
   
   /* ─────────────────────────────────────────
      5. STATE
   ───────────────────────────────────────── */
   let currentSeq   = '';
   let isPlaying    = false;
   let isLooping    = false;
   let stopFlag     = false;
   let audioCtx     = null;
   let pianoNotes   = [];        // [{aa, freq, t}] for piano roll
   let pdbData      = null;      // parsed PDB Cα atoms
   let currentPdbId = '';
   
   /* ─────────────────────────────────────────
      6. mRNA → CODON → AA TRANSLATION
   ───────────────────────────────────────── */
   /* Strict: ONLY U, A, C, G accepted — T and all other chars are invalid */
   function normaliseMrna(raw) {
     return raw.toUpperCase().replace(/[\s\r\n]/g, '').replace(/[^AUGC]/g, '');
   }

   /* Returns array of unique invalid characters (non-UACG, excluding whitespace) */
   function findInvalidMrnaChars(raw) {
     const cleaned = raw.toUpperCase().replace(/[\s\r\n]/g, '');
     return [...new Set(cleaned.split('').filter(c => !/[AUGC]/.test(c)))];
   }
   
   function translateMrna(mrna) {
     // Find AUG start
     const startIdx = mrna.indexOf('AUG');
     if (startIdx === -1) return { codons: [], aas: '', warning: 'AUG 개시코돈 없음' };
   
     const codons = [];
     let aas = '';
     for (let i = startIdx; i + 2 < mrna.length; i += 3) {
       const codon = mrna.slice(i, i + 3);
       const aa = CODON_TABLE[codon] || '?';
       codons.push({ codon, aa });
       if (aa === '*') break; // stop codon
       if (aa !== '?') aas += aa;
     }
     return { codons, aas, warning: null };
   }
   
   function renderCodonStrip(codons) {
     codonStrip.innerHTML = '';
     codons.forEach(({ codon, aa }) => {
       const chip = document.createElement('div');
       chip.className = 'codon-chip' + (aa === '*' ? ' stop' : '');
       const prop = AA_PROPS[aa];
       const cat  = prop ? prop.cat : (aa === '*' ? 'stop' : '');
       chip.innerHTML = `<span class="cc-codon">${codon}</span><span class="cc-aa aa ${cat}">${aa === '*' ? '⏹' : aa}</span>`;
       if (prop) {
         chip.title = `${codon} → ${aa} (${prop.name})`;
       }
       codonStrip.appendChild(chip);
     });
   }
   
   btnTranslate.addEventListener('click', () => {
     const raw = mrnaInput.value.trim();
     if (!raw) { mrnaMeta.textContent = '서열을 입력하세요'; return; }

     // ── Strict UACG gate ──────────────────────────────
     const invalid = findInvalidMrnaChars(raw);
     if (invalid.length > 0) {
       const shown = invalid.map(c => c === 'T' ? `T (U로 직접 교체하세요)` : `'${c}'`).join(', ');
       mrnaMeta.textContent = `✗ 변환 불가 — 유효하지 않은 문자: ${shown}`;
       mrnaInput.classList.add('mrna-invalid');
       mrnaInput.focus();
       return;
     }
     mrnaInput.classList.remove('mrna-invalid');
     // ─────────────────────────────────────────────────

     const mrna = normaliseMrna(raw);
     const { codons, aas, warning } = translateMrna(mrna);

     if (warning) {
       mrnaMeta.textContent = `⚠ ${warning} — 정규화된 mRNA: ${mrna.length}nt`;
       codonStrip.innerHTML = '';
       return;
     }

     const stopCodon = codons.find(c => c.aa === '*');
     mrnaMeta.textContent = `정규화 ${mrna.length}nt · 코돈 ${codons.length}개 · 아미노산 ${aas.length}개${stopCodon ? ' · 종결코돈 ✓' : ' · 종결코돈 없음'}`;

     renderCodonStrip(codons);
     if (aas.length > 0) {
       setSequence(aas, `mRNA 번역 결과 (${aas.length} aa)`);
       // ── Auto PDB search by translated sequence ────
       searchAndLoadPdb(aas);
     }
   });
   
   // Live meta update while typing — STRICT: only U A C G
   mrnaInput.addEventListener('input', () => {
     const raw = mrnaInput.value;
     if (!raw.trim()) {
       mrnaMeta.textContent = '—';
       mrnaInput.classList.remove('mrna-invalid');
       return;
     }
     const invalid = findInvalidMrnaChars(raw);
     if (invalid.length > 0) {
       const shown = invalid.map(c => c === 'T' ? 'T (→U로 변환 불가, 직접 U로 입력)' : `'${c}'`).join(', ');
       mrnaMeta.textContent = `⚠ 유효하지 않은 문자: ${shown} — U · A · C · G 만 허용됩니다`;
       mrnaInput.classList.add('mrna-invalid');
       return;
     }
     mrnaInput.classList.remove('mrna-invalid');
     const mrna = normaliseMrna(raw);
     const startIdx = mrna.indexOf('AUG');
     mrnaMeta.textContent = `${mrna.length}nt · ${Math.floor(mrna.length/3)}코돈 가능 · AUG ${startIdx >= 0 ? `위치 ${startIdx}` : '없음'}`;
   });
   
   /* ─────────────────────────────────────────
      6b. mRNA 번역 후 → RCSB 서열 검색 → PDB 자동 로딩
   ───────────────────────────────────────── */
   async function searchAndLoadPdb(aaSeq) {
     // Use RCSB sequence search API (POST) to find best PDB match
     showPdbInfo('⟳ mRNA 번역 서열로 PDB 검색 중…', '');
     pdbIdInput.value = '';

     const query = {
       query: {
         type: 'terminal',
         service: 'sequence',
         parameters: {
           evalue_cutoff: 1,
           identity_cutoff: 0.5,
           sequence_type: 'protein',
           value: aaSeq
         }
       },
       return_type: 'entry',
       request_options: {
         paginate: { start: 0, rows: 3 },
         sort: [{ sort_by: 'score', direction: 'desc' }]
       }
     };

     try {
       const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(query)
       });
       if (!res.ok) throw new Error(`검색 오류 HTTP ${res.status}`);
       const data = await res.json();

       const hits = data.result_set;
       if (!hits || hits.length === 0) {
         showPdbInfo('PDB에서 유사 구조를 찾지 못했습니다 (직접 PDB ID를 입력하세요)', 'error');
         return;
       }

       // Best hit
       const bestId = hits[0].identifier.toUpperCase();
       const score  = (hits[0].score * 100).toFixed(1);
       pdbIdInput.value = bestId;

       // Show runner-up suggestions as preset chips
       const extras = hits.slice(1).map(h => h.identifier.toUpperCase());
       if (extras.length > 0) {
         showPdbInfo(`✓ 가장 유사한 PDB: ${bestId} (유사도 점수 ${score}) · 후보: ${extras.join(', ')}`, 'loaded');
       } else {
         showPdbInfo(`✓ 가장 유사한 PDB: ${bestId} (유사도 점수 ${score})`, 'loaded');
       }

       loadPdb(bestId);
     } catch (err) {
       showPdbInfo(`✗ PDB 서열 검색 실패: ${err.message}`, 'error');
     }
   }


   PROTEINS.forEach((p, i) => {
     const btn = document.createElement('button');
     btn.className = 'pbtn';
     btn.innerHTML = `<span class="pn">${p.name}</span><span class="pd">${p.en} · ${p.pdb}</span>`;
     btn.addEventListener('click', () => {
       document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('active'));
       btn.classList.add('active');
       setSequence(p.seq, `${p.name} (${p.en})`);
       loadPdb(p.pdb);
       pdbIdInput.value = p.pdb;
     });
     pgrid.appendChild(btn);
   });
   
   // Direct sequence input
   $('cseq').addEventListener('input', e => {
     const v = e.target.value.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, '');
     e.target.value = v;
     if (v.length > 0) {
       document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('active'));
       setSequence(v, '직접 입력 서열');
     }
   });
   
   /* ─────────────────────────────────────────
      8. PDB PRESETS UI
   ───────────────────────────────────────── */
   PDB_PRESETS.forEach(p => {
     const btn = document.createElement('button');
     btn.className = 'pdb-preset-btn';
     btn.textContent = `${p.id} ${p.label}`;
     btn.dataset.id = p.id;
     btn.addEventListener('click', () => {
       document.querySelectorAll('.pdb-preset-btn').forEach(b => b.classList.remove('active'));
       btn.classList.add('active');
       pdbIdInput.value = p.id;
       loadPdb(p.id);
     });
     pdbPresets.appendChild(btn);
   });
   
   btnPdb.addEventListener('click', () => {
     const id = pdbIdInput.value.trim().toUpperCase();
     if (id.length !== 4) { showPdbInfo('PDB ID는 4자리입니다 (예: 1HHO)', 'error'); return; }
     loadPdb(id);
   });
   pdbIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnPdb.click(); });
   
   /* ─────────────────────────────────────────
      9. RCSB PDB FETCH + VIEWER
   ───────────────────────────────────────── */
   async function loadPdb(pdbId) {
     pdbId = pdbId.toUpperCase();
     if (pdbId === currentPdbId) return;
     currentPdbId = pdbId;
   
     showPdbInfo(`⟳ ${pdbId} 로딩 중…`, '');
     pdbAtoms.innerHTML = '';
   
     // ① RCSB 공식 3D 뷰어 (iFrame embed)
     pdbPlaceholder.style.display = 'none';
     pdbFrame.style.display = 'block';
     pdbFrame.src = `https://www.rcsb.org/3d-view/${pdbId}`;
   
     // ② Metadata via RCSB REST API
     try {
       const res = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
       if (!res.ok) throw new Error(`HTTP ${res.status}`);
       const data = await res.json();
   
       const title   = data.struct?.title ?? '—';
       const method  = data.exptl?.[0]?.method ?? '—';
       const res_A   = data.refine?.[0]?.ls_d_res_high?.toFixed(2) ?? '—';
       const chains  = data.rcsb_entry_info?.polymer_entity_count ?? '—';
       const residues = data.rcsb_entry_info?.deposited_polymer_monomer_count ?? '—';
       const atoms   = data.rcsb_entry_info?.deposited_atom_count ?? '—';
       const year    = data.rcsb_accession_info?.initial_release_date?.slice(0,4) ?? '—';
       const org     = data.rcsb_entry_info?.selected_polymer_entity_types ?? '—';
   
       showPdbInfo(
         `✓ ${pdbId}  ${title}\n실험법: ${method}  해상도: ${res_A}Å  연도: ${year}\n체인: ${chains}  잔기: ${residues}  원자: ${atoms}  분자유형: ${org}`,
         'loaded'
       );
   
       // stat chips
       pdbAtoms.innerHTML = `
         <span class="pdb-stat-chip">체인 ${chains}</span>
         <span class="pdb-stat-chip">잔기 ${residues}</span>
         <span class="pdb-stat-chip">원자 ${atoms}</span>
         <span class="pdb-stat-chip">${method}</span>
         <span class="pdb-stat-chip">${res_A !== '—' ? res_A+'Å' : 'NMR'}</span>
       `;
   
       // ③ Fetch actual PDB file for Cα backbone canvas
       fetchAndRenderBackbone(pdbId);
   
     } catch (err) {
       showPdbInfo(`✗ ${pdbId} 조회 실패: ${err.message}\nPDB ID를 확인하세요`, 'error');
     }
   }
   
   async function fetchAndRenderBackbone(pdbId) {
     try {
       const res = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
       if (!res.ok) throw new Error('PDB file not found');
       const text = await res.text();
       const atoms = parseCalphas(text);
       pdbData = atoms;
       draw3D(atoms);
     } catch {
       // fallback: draw procedural from current sequence
       pdbData = null;
       draw3DFromSeq(currentSeq);
     }
   }
   
   function parseCalphas(pdbText) {
     const atoms = [];
     const lines = pdbText.split('\n');
     for (const line of lines) {
       if (!line.startsWith('ATOM  ') && !line.startsWith('ATOM ')) continue;
       const atomName  = line.slice(12, 16).trim();
       if (atomName !== 'CA') continue;
       const chain  = line[21];
       const resSeq = parseInt(line.slice(22, 26).trim());
       const x      = parseFloat(line.slice(30, 38));
       const y      = parseFloat(line.slice(38, 46));
       const z      = parseFloat(line.slice(46, 54));
       const resName = line.slice(17, 20).trim();
       if (!isNaN(x)) atoms.push({ chain, resSeq, resName, x, y, z });
     }
     return atoms;
   }
   
   function showPdbInfo(msg, cls) {
     pdbInfo.textContent = msg;
     pdbInfo.className   = 'pdb-info' + (cls ? ` ${cls}` : '');
   }
   
   /* ─────────────────────────────────────────
      10. 3D CANVAS — Cα backbone  (real PDB)
   ───────────────────────────────────────── */
   const c3d = $('c3d');
   const ctx3 = c3d.getContext('2d');
   
   // 3-letter → 1-letter
   const THREE_TO_ONE = {
     ALA:'A',ARG:'R',ASN:'N',ASP:'D',CYS:'C',GLN:'Q',GLU:'E',
     GLY:'G',HIS:'H',ILE:'I',LEU:'L',LYS:'K',MET:'M',PHE:'F',
     PRO:'P',SER:'S',THR:'T',TRP:'W',TYR:'Y',VAL:'V'
   };
   
   // N-to-C rainbow color
   // N→C 무지개 색 (파스텔 라이트 테마)
   function ncColor(t) {
     const stops = [
       [0,    [31,95,230]],
       [0.25, [0,170,220]],
       [0.5,  [10,160,100]],
       [0.7,  [200,160,0]],
       [0.85, [210,100,20]],
       [1.0,  [200,40,40]]
     ];
     for (let i = 0; i < stops.length - 1; i++) {
       if (t >= stops[i][0] && t <= stops[i+1][0]) {
         const frac = (t - stops[i][0]) / (stops[i+1][0] - stops[i][0]);
         const a = stops[i][1], b = stops[i+1][1];
         return `rgb(${Math.round(a[0]+frac*(b[0]-a[0]))},${Math.round(a[1]+frac*(b[1]-a[1]))},${Math.round(a[2]+frac*(b[2]-a[2]))})`;
       }
     }
     return '#888';
   }

   // 원근 투영 (z 깊이 활용)
   function project(x, y, z, cx, cy, scale, rx, ry) {
     let x1 = x * Math.cos(ry) - z * Math.sin(ry);
     let z1 = x * Math.sin(ry) + z * Math.cos(ry);
     let y1 = y * Math.cos(rx) - z1 * Math.sin(rx);
     let z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
     const fov = 320;
     const persp = fov / (fov + z2 * scale * 0.5);
     return { sx: cx + x1 * scale * persp, sy: cy + y1 * scale * persp, depth: z2, persp };
   }

   // 구형 하이라이트 그리기
   function drawSphere(ctx, x, y, r, color, alpha) {
     ctx.globalAlpha = alpha;
     const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.35, r*0.05, x, y, r);
     grad.addColorStop(0, lightenColor(color, 0.7));
     grad.addColorStop(0.5, color);
     grad.addColorStop(1, darkenColor(color, 0.5));
     ctx.beginPath();
     ctx.arc(x, y, r, 0, Math.PI * 2);
     ctx.fillStyle = grad;
     ctx.fill();
     ctx.globalAlpha = 1;
   }

   function lightenColor(rgb, amt) {
     const m = rgb.match(/\d+/g).map(Number);
     return `rgb(${Math.min(255,Math.round(m[0]+amt*(255-m[0])))},${Math.min(255,Math.round(m[1]+amt*(255-m[1])))},${Math.min(255,Math.round(m[2]+amt*(255-m[2])))})`;
   }
   function darkenColor(rgb, amt) {
     const m = rgb.match(/\d+/g).map(Number);
     return `rgb(${Math.round(m[0]*(1-amt))},${Math.round(m[1]*(1-amt))},${Math.round(m[2]*(1-amt))})`;
   }

   let rot3X = 0.3, rot3Y = 0.5;
   let dragging3 = false, drag3Last = null;
   // 자동 회전
   let autoRot = true;
   let animFrame3 = null;
   function startAutoRot() {
     if (animFrame3) cancelAnimationFrame(animFrame3);
     function tick() {
       if (!autoRot || dragging3) { animFrame3 = requestAnimationFrame(tick); return; }
       rot3Y += 0.008;
       if (pdbData && pdbData.length > 0) draw3D(pdbData);
       else if (currentSeq) draw3DFromSeq(currentSeq);
       animFrame3 = requestAnimationFrame(tick);
     }
     animFrame3 = requestAnimationFrame(tick);
   }

   c3d.addEventListener('mousedown', e => { dragging3 = true; drag3Last = {x: e.clientX, y: e.clientY}; autoRot = false; });
   window.addEventListener('mousemove', e => {
     if (!dragging3 || !drag3Last) return;
     rot3Y += (e.clientX - drag3Last.x) * 0.012;
     rot3X += (e.clientY - drag3Last.y) * 0.012;
     drag3Last = {x: e.clientX, y: e.clientY};
     if (pdbData && pdbData.length > 0) draw3D(pdbData);
     else draw3DFromSeq(currentSeq);
   });
   window.addEventListener('mouseup', () => {
     dragging3 = false; drag3Last = null;
     setTimeout(() => { autoRot = true; }, 2000);
   });

   function renderScene(pts3d, label, W, H) {
     ctx3.clearRect(0, 0, W, H);
     // 배경: 부드러운 크림 그라디언트
     const bg = ctx3.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
     bg.addColorStop(0, '#ede8f8');
     bg.addColorStop(0.5, '#e8f2f8');
     bg.addColorStop(1, '#e8f5ee');
     ctx3.fillStyle = bg;
     ctx3.fillRect(0, 0, W, H);

     const cx3 = pts3d.reduce((s,p)=>s+p.x,0)/pts3d.length;
     const cy3 = pts3d.reduce((s,p)=>s+p.y,0)/pts3d.length;
     const cz3 = pts3d.reduce((s,p)=>s+p.z,0)/pts3d.length;
     let md = 0;
     pts3d.forEach(p => {
       const d = Math.sqrt((p.x-cx3)**2+(p.y-cy3)**2+(p.z-cz3)**2);
       if (d > md) md = d;
     });
     const scale = Math.min(W,H) / 2.8 / (md || 1);

     const prj = pts3d.map((p,i) => ({
       ...project(p.x-cx3, p.y-cy3, p.z-cz3, W/2, H/2, scale, rot3X, rot3Y),
       t: p.t, i
     }));

     // 깊이순 정렬 (뒤→앞)
     const sorted = [...prj].sort((a,b) => a.depth - b.depth);

     // 굵은 본드 (뒤쪽부터)
     for (let i = 0; i < prj.length - 1; i++) {
       const a = prj[i], b = prj[i+1];
       const t = (a.t + b.t) / 2;
       const col = ncColor(t);
       const depthAlpha = 0.35 + 0.55 * ((a.depth + b.depth) / 2 / (md * scale * 0.5 + 0.001) * 0.5 + 0.5);
       const lw = (1.8 + 1.2 * a.persp) * devicePixelRatio;
       ctx3.strokeStyle = col;
       ctx3.lineWidth = Math.max(0.8, lw);
       ctx3.globalAlpha = Math.min(0.9, Math.max(0.2, depthAlpha));
       ctx3.lineCap = 'round';
       ctx3.beginPath();
       ctx3.moveTo(a.sx, a.sy);
       ctx3.lineTo(b.sx, b.sy);
       ctx3.stroke();
     }

     // 구체 아톰 (앞→뒤 정렬된 것 중 앞쪽부터)
     sorted.reverse().forEach(p => {
       const col = ncColor(p.t);
       const r = Math.max(1.5, (2.5 + 1.5 * p.persp) * devicePixelRatio);
       const alpha = 0.5 + 0.5 * (p.persp || 1);
       drawSphere(ctx3, p.sx, p.sy, r, col, Math.min(1, alpha));
     });

     // 라벨
     ctx3.globalAlpha = 0.55;
     ctx3.fillStyle = '#7a6e64';
     ctx3.font = `${9.5 * devicePixelRatio}px 'Space Mono', monospace`;
     ctx3.fillText(label, 8 * devicePixelRatio, 15 * devicePixelRatio);
     ctx3.globalAlpha = 1;
   }

   function draw3D(atoms) {
     const W = c3d.offsetWidth * devicePixelRatio;
     const H = c3d.offsetHeight * devicePixelRatio;
     c3d.width = W; c3d.height = H;
     if (!atoms || atoms.length === 0) return;
     const chain = atoms[0].chain;
     const pts = atoms.filter(a => a.chain === chain).slice(0, 500);
     const pts3d = pts.map((a,i) => ({ x:a.x, y:a.y, z:a.z, t:i/(pts.length-1) }));
     renderScene(pts3d, `${pts.length} Cα residues · drag to rotate`, W, H);
   }

   function draw3DFromSeq(seq) {
     const W = c3d.offsetWidth * devicePixelRatio;
     const H = c3d.offsetHeight * devicePixelRatio;
     c3d.width = W; c3d.height = H;

     if (!seq || seq.length === 0) {
       const bg = ctx3.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
       bg.addColorStop(0,'#ede8f8'); bg.addColorStop(0.5,'#e8f2f8'); bg.addColorStop(1,'#e8f5ee');
       ctx3.fillStyle = bg; ctx3.fillRect(0,0,W,H);
       return;
     }
     const pts3d = [];
     const n = Math.min(seq.length, 300);
     for (let i = 0; i < n; i++) {
       const t = i / n;
       const aa = seq[i];
       const prop = AA_PROPS[aa];
       const cat = prop ? prop.cat : 'special';
       const phi = i * 1.745;
       const rise = i * 1.5;
       const r = 5 + (cat === 'hydrophobic' ? 0 : 3);
       pts3d.push({
         x: r * Math.cos(phi) + (Math.random()-0.5)*1.5,
         y: rise * 0.18 + (Math.random()-0.5)*1,
         z: r * Math.sin(phi) + (Math.random()-0.5)*1.5,
         t
       });
     }
     renderScene(pts3d, `${n} residues · PDB 조회 시 실제 구조 표시 · drag to rotate`, W, H);
   }


   /* ─────────────────────────────────────────
      11. SEQUENCE SET + DISPLAY
   ───────────────────────────────────────── */
   function setSequence(seq, label) {
     currentSeq = seq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,'');
     seqSt.textContent = label + ` · ${currentSeq.length} 잔기`;
     renderSeqDisp(currentSeq);
     drawPianoRoll([]);
     pdbData = null;          // autoRot 루프가 PDB로 덮어쓰지 않도록
     draw3DFromSeq(currentSeq);
   }
   
   function renderSeqDisp(seq) {
     seqDisp.innerHTML = '';
     seq.split('').forEach((ch, i) => {
       const prop = AA_PROPS[ch];
       const cat  = prop ? prop.cat : 'special';
       const span = document.createElement('span');
       span.className = `aa ${cat}`;
       span.textContent = ch;
       span.title = prop ? `${ch} — ${prop.name}` : ch;
       span.addEventListener('mouseenter', e => {
         tip.textContent = prop ? `${ch} · ${prop.name} · ${prop.cat} · ${prop.freq ? prop.freq+'Hz' : 'rest'}` : ch;
         tip.classList.add('show');
         tip.style.left = e.clientX + 14 + 'px';
         tip.style.top  = e.clientY - 28 + 'px';
       });
       span.addEventListener('mouseleave', () => tip.classList.remove('show'));
       seqDisp.appendChild(span);
     });
   }
   
   /* ─────────────────────────────────────────
      12. AUDIO SYNTHESIS
   ───────────────────────────────────────── */
   function ensureAudio() {
     if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
     if (audioCtx.state === 'suspended') audioCtx.resume();
   }
   
   function playNote(aa, startTime, speed) {
     const prop = AA_PROPS[aa];
     if (!prop || prop.freq === 0) return prop ? prop.dur / speed : 0.1;
     const dur = prop.dur / speed;
   
     const osc  = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     const filt = audioCtx.createBiquadFilter();
   
     osc.type = prop.wave;
     osc.frequency.setValueAtTime(prop.freq, startTime);
     // slight pitch glide for expressiveness
     osc.frequency.linearRampToValueAtTime(prop.freq * 1.003, startTime + dur * 0.4);
   
     filt.type = 'lowpass';
     filt.frequency.setValueAtTime(1800, startTime);
     filt.Q.value = 1.5;
   
     gain.gain.setValueAtTime(0, startTime);
     gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
     gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
   
     osc.connect(filt);
     filt.connect(gain);
     gain.connect(audioCtx.destination);
     osc.start(startTime);
     osc.stop(startTime + dur + 0.02);
   
     return dur;
   }
   
   async function playSequence(seq) {
     if (isPlaying) return;
     if (!seq || seq.length === 0) { playSt.textContent = '서열 없음'; return; }
   
     ensureAudio();
     isPlaying = true;
     stopFlag  = false;
     pianoNotes = [];
   
     const aas   = [...seq];
     const speed = parseFloat(spdSlider.value);
     const spans = [...seqDisp.querySelectorAll('.aa')];
   
     let t   = audioCtx.currentTime + 0.05;
     let acc = 0; // accumulated time for piano roll
   
     for (let i = 0; i < aas.length; i++) {
       if (stopFlag) break;
       const aa   = aas[i];
       const prop = AA_PROPS[aa];
       if (!prop) continue;
   
       const dur = playNote(aa, t, speed);
       if (prop.freq > 0) {
         pianoNotes.push({ aa, freq: prop.freq, t: acc, dur: dur, cat: prop.cat });
       }
   
       // Animate
       const idx = i;
       const delay = (t - audioCtx.currentTime) * 1000;
       setTimeout(() => {
         if (stopFlag) return;
         spans[idx]?.classList.add('lit');
         setTimeout(() => spans[idx]?.classList.remove('lit'), dur * 900);
         noteBadge.textContent = `${aa} · ${prop ? prop.name : '?'} · ${prop.freq ? prop.freq+'Hz' : 'rest'}`;
         pfill.style.width = ((idx+1)/aas.length*100) + '%';
         playSt.textContent = `재생 중 · ${idx+1}/${aas.length}`;
         drawWave(aa);
         drawPianoRoll(pianoNotes, acc);
       }, delay);
   
       t   += dur;
       acc += dur;
     }
   
     // Wait for last note
     await new Promise(r => setTimeout(r, Math.max(0, (t - audioCtx.currentTime) * 1000)));
   
     isPlaying = false;
     if (!stopFlag) {
       playSt.textContent = '재생 완료';
       pfill.style.width = '100%';
       noteBadge.textContent = '완료';
       if (isLooping && !stopFlag) playSequence(seq);
     }
   }
   
   /* ─────────────────────────────────────────
      13. WAVEFORM CANVAS
   ───────────────────────────────────────── */
   const cWave = $('cWave');
   const ctxW  = cWave.getContext('2d');
   
   function drawWave(aa) {
     const prop = AA_PROPS[aa] || { wave:'sine', freq:220, cat:'special' };
     const W = cWave.offsetWidth * devicePixelRatio;
     const H = cWave.offsetHeight * devicePixelRatio;
     cWave.width = W; cWave.height = H;
   
     ctxW.fillStyle = '#ebe4da';
     ctxW.fillRect(0, 0, W, H);
   
     const COLOR_MAP = { hydrophobic:'#1a5fb8', polar:'#167a50', positive:'#b02840', negative:'#a86010', special:'#5858a0' };
     const color = COLOR_MAP[prop.cat] || '#fff';
   
     ctxW.strokeStyle = color;
     ctxW.lineWidth = 1.5 * devicePixelRatio;
     ctxW.shadowColor = color;
     ctxW.shadowBlur  = 8;
     ctxW.beginPath();
   
     const cycles = 3;
     for (let xi = 0; xi <= W; xi++) {
       const x  = xi / W;
       const ph = x * cycles * Math.PI * 2;
       let  y   = 0;
       if (prop.wave === 'sine')     y = Math.sin(ph);
       if (prop.wave === 'triangle') y = 2/Math.PI * Math.asin(Math.sin(ph));
       if (prop.wave === 'square')   y = Math.sign(Math.sin(ph));
       if (prop.wave === 'sawtooth') y = 2*(ph/(2*Math.PI) - Math.floor(0.5 + ph/(2*Math.PI)));
       const sy = H/2 - y * H * 0.38;
       xi === 0 ? ctxW.moveTo(xi, sy) : ctxW.lineTo(xi, sy);
     }
     ctxW.stroke();
     ctxW.shadowBlur = 0;
   }
   
   /* ─────────────────────────────────────────
      14. PIANO ROLL
   ───────────────────────────────────────── */
   const cPiano = $('cPiano');
   const ctxP   = cPiano.getContext('2d');
   
   function drawPianoRoll(notes, currentT = 0) {
     const W = cPiano.offsetWidth * devicePixelRatio;
     const H = cPiano.offsetHeight * devicePixelRatio;
     cPiano.width = W; cPiano.height = H;
   
     ctxP.fillStyle = '#ebe4da';
     ctxP.fillRect(0, 0, W, H);
   
     // grid lines
     [73,110,165,220,330,440,587].forEach(f => {
       const y = freqToY(f, H);
       ctxP.strokeStyle = 'rgba(60,40,20,.1)';
       ctxP.lineWidth = 1;
       ctxP.beginPath(); ctxP.moveTo(0, y); ctxP.lineTo(W, y); ctxP.stroke();
     });
   
     if (notes.length === 0) return;
   
     const COLOR_MAP = { hydrophobic:'#1a5fb8', polar:'#167a50', positive:'#b02840', negative:'#a86010', special:'#5858a0' };
     const totalT = notes[notes.length-1].t + notes[notes.length-1].dur + 0.1;
     const tScale = W / (totalT || 1);
   
     notes.forEach(n => {
       const x = n.t * tScale;
       const y = freqToY(n.freq, H);
       const w = Math.max(2, n.dur * tScale - 1);
       const h = 6 * devicePixelRatio;
       const color = COLOR_MAP[n.cat] || '#fff';
       const isActive = currentT >= n.t && currentT < n.t + n.dur;
   
       ctxP.fillStyle = color;
       ctxP.globalAlpha = isActive ? 1 : 0.5;
       ctxP.shadowColor = isActive ? color : 'transparent';
       ctxP.shadowBlur  = isActive ? 10 : 0;
       ctxP.fillRect(x, y - h/2, w, h);
     });
     ctxP.globalAlpha = 1;
     ctxP.shadowBlur  = 0;
   
     // playhead
     if (currentT > 0) {
       const px = currentT * tScale;
       ctxP.strokeStyle = 'rgba(59,170,214,.7)';
       ctxP.lineWidth = 1.5;
       ctxP.beginPath(); ctxP.moveTo(px, 0); ctxP.lineTo(px, H); ctxP.stroke();
     }
   }
   
   function freqToY(freq, H) {
     const minF = 60, maxF = 650;
     return H - ((Math.log(freq/minF) / Math.log(maxF/minF)) * H * 0.85 + H * 0.07);
   }
   
   /* ─────────────────────────────────────────
      15. CONTROLS
   ───────────────────────────────────────── */
   $('btnPlay').addEventListener('click', () => { if (currentSeq) playSequence(currentSeq); });
   $('btnStop').addEventListener('click', () => {
     stopFlag = true; isPlaying = false;
     playSt.textContent = '정지됨';
     pfill.style.width = '0';
     noteBadge.textContent = '\u00a0';
   });
   $('btnLoop').addEventListener('click', () => {
     isLooping = !isLooping;
     $('btnLoop').style.color = isLooping ? 'var(--cyan)' : '';
     $('btnLoop').style.borderColor = isLooping ? 'var(--cyan)' : '';
   });
   $('btnCopy').addEventListener('click', () => {
     if (currentSeq) {
       navigator.clipboard.writeText(currentSeq).then(() => {
         playSt.textContent = '서열이 클립보드에 복사되었습니다';
       });
     }
   });
   
   spdSlider.addEventListener('input', () => {
     spdV.textContent = parseFloat(spdSlider.value).toFixed(1) + '×';
   });
   
   /* ─────────────────────────────────────────
      16. NAME → MUSIC
   ───────────────────────────────────────── */
   const NAME_MAP = {
     B:'N', J:'L', O:'Q', U:'S', X:'G', Z:'E'
   };
   
   /* 입력 자체 차단: 유효한 아미노산 알파벳만 허용 (B J O U X Z + 숫자/특수문자 불가) */
   const VALID_AA_KEYS = new Set('ACDEFGHIKLMNPQRSTVWY');
   $('ninput').addEventListener('keydown', e => {
     if (e.metaKey || e.ctrlKey) return;
     if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) return;
     const ch = e.key.toUpperCase();
     if (ch.length === 1 && !VALID_AA_KEYS.has(ch)) e.preventDefault();
   });
   $('ninput').addEventListener('paste', e => {
     e.preventDefault();
     const text = (e.clipboardData || window.clipboardData).getData('text');
     const filtered = text.toUpperCase().split('').filter(c => VALID_AA_KEYS.has(c)).join('');
     document.execCommand('insertText', false, filtered);
   });

   $('ninput').addEventListener('input', e => {
     const raw = e.target.value.toUpperCase();
     const mapped = raw.split('').map(c => {
       if (NAME_MAP[c]) return NAME_MAP[c];
       if (AA_PROPS[c])  return c;
       return null;
     }).filter(Boolean);
     const result = mapped.join('');
     $('nresult').innerHTML = result
       ? `<span style="letter-spacing:.18em;font-size:.85rem;">${result.split('').map(c => {
           const prop = AA_PROPS[c];
           const cat  = prop ? prop.cat : 'special';
           return `<span class="aa ${cat}">${c}</span>`;
         }).join('')}</span><br><small style="font-size:.52rem;color:var(--dim);">${result.length}개 아미노산</small>`
       : '이름을 입력하세요';
     // 입력하는 즉시 3D 구조 업데이트 (pdbData 해제해야 autoRot 루프가 덮어쓰지 않음)
     if (result.length > 0) {
       pdbData = null;
       currentSeq = result;
       draw3DFromSeq(result);
     }
   });
   
   $('btnNPlay').addEventListener('click', () => {
     const raw = $('ninput').value.toUpperCase();
     const seq = raw.split('').map(c => NAME_MAP[c] || c).filter(c => AA_PROPS[c]).join('');
     if (seq.length === 0) { playSt.textContent = '유효한 아미노산이 없습니다'; return; }
     setSequence(seq, '이름 음악');
     setTimeout(() => playSequence(seq), 100);
   });
   
   /* ─────────────────────────────────────────
      17. TOOLTIP FOLLOW
   ───────────────────────────────────────── */
   document.addEventListener('mousemove', e => {
     tip.style.left = e.clientX + 14 + 'px';
     tip.style.top  = e.clientY - 28 + 'px';
   });
   
   /* ─────────────────────────────────────────
      18. INIT
   ───────────────────────────────────────── */
   // Default 3D canvas placeholder draw
   draw3DFromSeq('');
   startAutoRot();
   
   // Sample mRNA — strictly UACG only (human insulin preregion fragment)
   mrnaInput.value = 'AUGGGCAGCCCCCGCCCUCUGUGGGCUUCUGUGGCUCUCAGUGCCCCGUCC';
   mrnaInput.dispatchEvent(new Event('input'));
