function processData(tsv) {
  const clades = [
    {
      name: "20H (Beta, V2)",
      color: { fill: "rgb(99, 34, 184)", stroke: "rgb(87, 30, 162)" },
    },
    {
      name: "20I (Alpha, V1)",
      color: { fill: "rgb(76, 59, 216)", stroke: "rgb(67, 52, 191)" },
    },
    {
      name: "20J (Gamma, V3)",
      color: { fill: "rgb(71, 96, 233)", stroke: "rgb(63, 85, 206)" },
    },
    {
      name: "21A (Delta)",
      color: { fill: "rgb(76, 134, 232)", stroke: "rgb(67, 118, 205)" },
    },
    {
      name: "21I (Delta)",
      color: { fill: "rgb(86, 164, 218)", stroke: "rgb(76, 145, 192)" },
    },
    {
      name: "21J (Delta)",
      color: { fill: "rgb(101, 186, 191)", stroke: "rgb(89, 164, 169)" },
    },
    {
      name: "21B (Kappa)",
      color: { fill: "rgb(120, 201, 162)", stroke: "rgb(106, 177, 143)" },
    },
    {
      name: "21C (Epsilon)",
      color: { fill: "rgb(144, 210, 133)", stroke: "rgb(127, 185, 117)" },
    },
    {
      name: "21D (Eta)",
      color: { fill: "rgb(171, 214, 108)", stroke: "rgb(151, 189, 95)" },
    },
    {
      name: "21F (Iota)",
      color: { fill: "rgb(225, 210, 77)", stroke: "rgb(199, 185, 68)" },
    },
    {
      name: "21G (Lambda)",
      color: { fill: "rgb(246, 196, 69)", stroke: "rgb(217, 173, 61)" },
    },
    {
      name: "21M (Omicron)",
      color: { fill: "rgb(248, 45, 40)", stroke: "rgb(219, 40, 35)" },
    },
    {
      name: "19A",
      color: { fill: "rgb(214, 221, 224)", stroke: "rgb(189, 195, 198)" },
    },
    {
      name: "19B",
      color: { fill: "rgb(206, 213, 218)", stroke: "rgb(182, 188, 192)" },
    },
    {
      name: "20A",
      color: { fill: "rgb(199, 206, 211)", stroke: "rgb(176, 182, 186)" },
    },
    {
      name: "20C",
      color: { fill: "rgb(191, 198, 204)", stroke: "rgb(169, 175, 180)" },
    },
    {
      name: "20G",
      color: { fill: "rgb(185, 191, 198)", stroke: "rgb(163, 169, 175)" },
    },
    {
      name: "20E (EU1)",
      color: { fill: "rgb(178, 185, 191)", stroke: "rgb(157, 163, 169)" },
    },
    {
      name: "20B",
      color: { fill: "rgb(171, 177, 185)", stroke: "rgb(151, 156, 163)" },
    },
    {
      name: "20D",
      color: { fill: "rgb(164, 170, 178)", stroke: "rgb(145, 150, 157)" },
    },
    {
      name: "20F",
      color: { fill: "rgb(159, 162, 172)", stroke: "rgb(140, 143, 152)" },
    },
  ];

  const accessor = {
    month: (d) => d.date.slice(0, 7),
    clade: (d) => d.clade_membership,
    mutations: (d) => +d.S1_mutations,
    fitness: (d) => +d.mutational_fitness,
  };

  const uniqueMonths = [...new Set(tsv.map(accessor.month))].sort(d3.ascending);
  const parseMonths = d3.utcParse("%Y-%m");
  const dates = uniqueMonths.map(parseMonths);

  const monthlyTotal = d3.rollup(tsv, (v) => v.length, accessor.month);

  const aggregated = d3.rollup(
    tsv,
    (v) => {
      const mutations = d3.mean(v, accessor.mutations);
      const fitness = d3.mean(v, accessor.fitness);
      const count = v.length;
      const frequency = count / monthlyTotal.get(accessor.month(v[0]));
      return {
        mutations,
        fitness,
        count,
        frequency,
      };
    },
    accessor.month,
    accessor.clade
  );

  clades.forEach((d) => {
    d.values = uniqueMonths.map((month) => {
      if (aggregated.has(month) && aggregated.get(month).has(d.name)) {
        return aggregated.get(month).get(d.name);
      } else {
        return {
          mutations: null,
          fitness: null,
          count: 0,
          frequency: 0,
        };
      }
    });
  });

  return {
    clades,
    dates,
  };
}
