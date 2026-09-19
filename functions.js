(() => {
  const initial = {
    rsp: 0x1000, rbp: 0x1040, rax: null, memory: {},
    instruction: null,
    description: '引数を用意済み。まだaddのためのフレームは作っていない。'
  };
  const commands = [
    ['call add', s => { s.rsp -= 8; s.memory[s.rsp] = 'after_callのアドレス'; },
      'callが戻り先を８バイトに保存し、addへ移る。RBPはまだ呼び出し元の値。'],
    ['push rbp', s => { s.rsp -= 8; s.memory[s.rsp] = s.rbp; },
      '呼び出し元のRBP（0x1040）を保存する。これで後から元の基準位置へ戻せる。'],
    ['mov rbp, rsp', s => { s.rbp = s.rsp; },
      '現在のRSPをRBPへコピーする。addの基準は0x0FF0になった。メモリの値は変わらない。'],
    ['sub rsp, 32', s => { s.rsp -= 32; },
      '３変数の24バイトと整列用の８バイトを確保。値はまだ書いていない。RBPは固定のまま。'],
    ['mov [rbp - 8], rdi', s => { s.memory[s.rbp - 8] = 8; },
      'RDIの８を、aの置き場0x0FE8に保存する。命令自体ではなく、値８がメモリに入る。'],
    ['mov [rbp - 16], rsi', s => { s.memory[s.rbp - 16] = 5; },
      'RSIの５を、bの置き場0x0FE0に保存する。totalはまだ初期化されていない。'],
    ['mov rax, [rbp - 8]', s => { s.rax = s.memory[s.rbp - 8]; },
      'aの中身８をRAXへコピーする。aの値も８のまま残る。'],
    ['add rax, [rbp - 16]', s => { s.rax += s.memory[s.rbp - 16]; },
      'RAXにbの中身５を足して13にする。totalの置き場には、まだ保存していない。'],
    ['mov [rbp - 24], rax', s => { s.memory[s.rbp - 24] = s.rax; },
      'RAXの13をtotalの置き場0x0FD8へ保存する。RSP・RBPは動かない。'],
    ['mov rax, [rbp - 24]', s => { s.rax = s.memory[s.rbp - 24]; },
      'return totalに向け、totalの中身を返り値のRAXへ読む。この例ではRAXはすでに13なので、数値は変わらない。'],
    ['mov rsp, rbp', s => { s.rsp = s.rbp; },
      'ローカル領域32バイトを使用範囲から外す。値の消去はしない。RSPは保存したRBPの枠を指す。'],
    ['pop rbp', s => { s.rbp = s.memory[s.rsp]; s.rsp += 8; },
      '呼び出し元のRBPを復元する。RSPが８増え、戻り先の枠を指す。'],
    ['ret', s => { s.rsp += 8; },
      '戻り先after_callへ戻り、RSPは0x1000に復元。RAXの13が呼び出し元へ渡る。']
  ];
  const states = [initial];
  for (const [instruction, execute, description] of commands) {
    const previous = states[states.length - 1];
    const state = { ...previous, memory: { ...previous.memory }, instruction, description };
    execute(state);
    states.push(state);
  }
  const names = {
    [0xfd0]: '整列用の余白', [0xfd8]: 'total（RBP − 24）',
    [0xfe0]: 'b（RBP − 16）', [0xfe8]: 'a（RBP − 8）',
    [0xff0]: '保存した呼び出し元のRBP', [0xff8]: '戻り先',
    [0x1000]: '以前からのデータ'
  };
  const hex = value => '0x' + value.toString(16).toUpperCase().padStart(4, '0');
  const get = id => document.getElementById(id);
  let step = 0;
  function render() {
    const s = states[step];
    get('frame-rsp').textContent = hex(s.rsp);
    get('frame-rbp').textContent = hex(s.rbp);
    get('frame-rax').textContent = s.rax ?? '未指定';
    get('frame-count').textContent = `${step} / ${commands.length}`;
    get('frame-command').textContent = step ? `実行した命令：${s.instruction}` : '次に実行：call add';
    get('frame-description').textContent = s.description;
    for (let addr = 0xfd0; addr <= 0x1000; addr += 8) {
      const slot = get('slot-' + addr.toString(16));
      const used = addr >= s.rsp;
      slot.querySelector('rect').setAttribute('class', (used ? 'slot-used' : 'slot-unused') + (addr === s.rsp ? ' slot-current' : ''));
      slot.querySelector('.slot-name').textContent = used ? names[addr] : '使用範囲の外';
      let value = s.memory[addr];
      if (addr === 0xff0 && value !== undefined) value = hex(value);
      slot.querySelector('.slot-value').textContent = value !== undefined
        ? (used ? String(value) : `残っている値：${value}`)
        : (addr === 0x1000 ? '内容は省略' : used ? '値は未指定' : '—');
    }
    const y = 72 + (s.rsp - 0xfd0) / 8 * 53;
    get('rsp-pointer').setAttribute('d', `M742 ${y}H716`);
    get('frame-back').disabled = step === 0;
    get('frame-reset').disabled = step === 0;
    get('frame-next').disabled = step === commands.length;
    get('frame-next').textContent = step === commands.length ? '呼び出し元へ戻った' : '１命令進める →';
  }
  get('frame-next').addEventListener('click', () => { if (step < commands.length) step++; render(); });
  get('frame-back').addEventListener('click', () => { if (step > 0) step--; render(); });
  get('frame-reset').addEventListener('click', () => { step = 0; render(); });
  render();
})();
