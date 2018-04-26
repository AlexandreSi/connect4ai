const savedNetwork = require('./savedNetworkWeightsCNNv3_4x4_pad2_32filter_200k_SGD_HVD_NOK_ga_05_lr1e-5-6_eps015_discount07+100k_NOK_ga04_eps015-03+100k_NOK_ga05_eps01_lr2e-5-6+100k_NOK_ga05_eps02_lr2e-5-7+200k_NOK_ga05_eps02-06_lr1e-5-7+100k_NOK_ga03_eps015_lr5e-5-7.json');
const filters = savedNetwork.layers[1].filters;

for (let i = 0; i < 32; i++) {
  console.log(i);
  let filter = filters[i].w;
  for (let j = 0; j < 4; j++) {
    let line = [];
    for (let k = 0; k < 4; k++) {
      line.push(filter[4*j+k]);
    }
    console.log(line.join(' '));
    line = [];
    for (let k = 0; k < 4; k++) {
      line.push(filter[4*j+k+16]);
    }
    console.log(line.join(' '));
  }
  console.log('\n');
}