const token = (text, id='') => ({text,id});
const step = (focus, message, title, subtitle, symbol) => ({focus,message,node:title?{title,subtitle,symbol}:null});
export const examples = [
  {id:'pointer-array', name:'items', tokens:[token('int ','base'),token('*','pointer'),token('items','name'),token('[3]','array'),token(';')],
   meaning:'itemsは３要素の配列。各要素はintへのポインタ。', expected:'typedef int *Expected[3];',
   steps:[step('name','itemsという名前自身の型を、ここから読む。'),step('array','同じ範囲の右側に[3]がある。itemsは３要素の配列。次は、その要素の型を読む。','配列：３要素','items自身','[3]'),step('pointer','左の*を読む。配列の各要素はポインタ。次は、そのポインタが指す型。','ポインタ','配列の各要素','*'),step('base','最後にintをつなぐ。指す先はint。配列 → ポインタ → intの順になった。','int','指す先','int')]},
  {id:'array-pointer',name:'row',tokens:[token('int ','base'),token('('),token('*','pointer'),token('row','name'),token(')'),token('[3]','array'),token(';')],
   meaning:'rowはポインタ。指す先は３要素のint配列。', expected:'typedef int (*Expected)[3];',
   steps:[step('name','rowを見つける。今は(*row)のカッコの内側にいる。'),step('pointer','内側には右の[]がないので、左の*を読む。rowはポインタ。外側の[3]へ先に飛ばない。','ポインタ','row自身','*'),step('array','内側を読み終えたのでカッコの外へ。[3]を読み、指す先が３要素の配列だとわかる。','配列：３要素','ポインタの指す先','[3]'),step('base','配列の各要素はint。ポインタ → 配列 → intの順に完成する。','int','配列の各要素','int')]},
  {id:'matrix',name:'grid',tokens:[token('int ','base'),token('grid','name'),token('[2]','outer'),token('[3]','inner'),token(';')],
   meaning:'gridは２要素の配列。各要素は３要素のint配列。',expected:'typedef int Expected[2][3];',
   steps:[step('name','grid自身の型から読む。'),step('outer','名前に近い右側の[2]を先に読む。gridは２要素の配列。','配列：２要素','grid自身','[2]'),step('inner','続く[3]を読む。外側の各要素が、３要素の配列になっている。','配列：３要素','外側の各要素','[3]'),step('base','内側の配列の各要素はint。全部で２×３個のintが並ぶ。','int','内側の各要素','int')]},
  {id:'return-pointer',name:'make',tokens:[token('int ','base'),token('*','pointer'),token('make','name'),token('(void)','function'),token(';')],
   meaning:'makeは引数なしの関数。返り値はintへのポインタ。',expected:'typedef int *Expected(void);',
   steps:[step('name','make自身が何なのか、名前から確認する。'),step('function','右側の(void)が先。makeは引数なしの関数。これ以降は返り値の型を読む。','関数','引数なし','func(void)'),step('pointer','左の*を読む。関数が返すものはポインタ。','ポインタ','関数の返り値','*'),step('base','返すポインタが指すのはint。make自身がポインタ変数なのではない。','int','返すポインタの指す先','int')]},
  {id:'function-pointer',name:'apply',tokens:[token('int ','base'),token('('),token('*','pointer'),token('apply','name'),token(')'),token('(int)','function'),token(';')],
   meaning:'applyはポインタ。intを１つ受け取り、intを返す関数を指す。',expected:'typedef int (*Expected)(int);',
   steps:[step('name','applyを見つける。(*apply)というグループの内側から読む。'),step('pointer','内側で*を読む。apply自身はポインタ。','ポインタ','apply自身','*'),step('function','グループの外に出て(int)を読む。指す先は、intを１つ受け取る関数。','関数','引数はint１つ','func(int)'),step('base','最後のintは、その関数の返り値の型。ポインタ → 関数 → intで完成。','int','関数の返り値','int')]},
  {id:'callbacks',name:'handlers',tokens:[token('void ','base'),token('('),token('*','pointer'),token('handlers','name'),token('[2]','array'),token(')'),token('(int)','function'),token(';')],
   meaning:'handlersは２要素の配列。各要素は、intを受け取り値を返さない関数へのポインタ。',expected:'typedef void (*Expected[2])(int);',
   steps:[step('name','handlersを見つける。グループの内側の記号から読む。'),step('array','右側の[2]を先に読む。handlersは２要素の配列。','配列：２要素','handlers自身','[2]'),step('pointer','同じグループの左側の*を読む。各要素はポインタ。','ポインタ','配列の各要素','*'),step('function','カッコの外へ出て(int)を読む。ポインタの指す先は関数。','関数','引数はint１つ','func(int)'),step('base','ベースのvoidをつなぐ。指す関数は値を返さない。','void','値を返さない','void')]},
  {id:'signal',name:'signal',tokens:[token('void ','base'),token('('),token('*','pointer'),token('signal','name'),token('(int, void (*)(int))','parameters'),token(')'),token('(int)','function'),token(';')],
   meaning:'signalはintと関数ポインタを受け取る関数。返り値も、intを受け取り値を返さない関数へのポインタ。',expected:'typedef void (*Handler)(int); typedef Handler Expected(int, Handler);',
   steps:[step('name','signal自身の型を読む。第２引数の中にも*や()があるので、カッコの対応を区別する。'),step('parameters','signalの直後のカッコを読むので、signalは関数。引数はintと、void (*)(int)という関数ポインタ。以降はsignalの返り値の型を読む。','関数','intと関数ポインタ','func(int, * func(int) void)'),step('pointer','signalを囲むグループの左側の*を読む。signalの返り値はポインタ。第２引数の中の*とは別。','ポインタ','signalの返り値','*'),step('function','外側の(int)へ進む。返すポインタが指す関数は、intを１つ受け取る。','関数','引数はint１つ','func(int)'),step('base','ベースのvoidをつなぐ。返すポインタが指す関数は、値を返さない。signal自身の返り値はvoidではなくポインタ。','void','指す関数は値を返さない','void')]}
];
export function readingState(id, stage) {
 const example=examples.find(x=>x.id===id);
 if(!example)throw new RangeError('用意した宣言を選んでください');
 if(!Number.isInteger(stage)||stage<0||stage>example.steps.length)throw new RangeError('読み取りの段階が範囲外です');
 const current=stage?example.steps[stage-1]:null;
 return {example, stage, last:example.steps.length, focus:current?.focus||null,
  message:current?.message||'まだ読んでいない。まず宣言している名前を見つけよう。',
  nodes:example.steps.slice(0,stage).filter(x=>x.node).map(x=>({...x.node})),
  complete:stage===example.steps.length};
}
