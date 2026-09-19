(() => {
  const affected = {
    none: [],
    'main.c': ['main.c', 'main.o', 'demo'],
    'value.c': ['value.c', 'value.o', 'demo'],
    'value.h': ['value.h', 'main.o', 'value.o', 'demo']
  };
  const descriptions = {
    none: '変更がないので、コンパイルもリンクも不要。',
    'main.c': 'main.oを作り直し、value.oを再利用してdemoを再リンクする。',
    'value.c': 'value.oを作り直し、main.oを再利用してdemoを再リンクする。',
    'value.h': '両方の.cがvalue.hを使うので、main.oとvalue.oを作り直し、demoを再リンクする。'
  };
  document.querySelectorAll('[data-change]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.change;
      const targets = affected[key];
      document.querySelectorAll('[data-change]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      document.querySelectorAll('[data-build]').forEach(node => node.classList.toggle('rebuild-active', targets.includes(node.dataset.build)));
      document.getElementById('rebuild-description').textContent = descriptions[key];
      const commands = [];
      for (const name of ['main', 'value']) {
        if (targets.includes(name + '.o')) commands.push('cc -std=c11 -Wall -Wextra -g -c ' + name + '.c -o ' + name + '.o');
      }
      if (targets.includes('demo')) commands.push('cc -o demo main.o value.o');
      document.getElementById('rebuild-commands').textContent = commands.join('\n') || '実行するコマンドなし';
    });
  });
})();
