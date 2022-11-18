const DATA_URL = "nextstrain_ncov_open_global_metadata.tsv";
d3.tsv(DATA_URL)
  .then(processData)
  .then((data) => {
    console.log(data);

    // Clade legend
    const cladeLegendSelection = d3
      .select("#cladeLegend .card__body")
      .on("updatehighlight", updateHighlight);

    const cladeLegend = colorLegend({
      selection: cladeLegendSelection,
      resetSelection: d3.select("#resetCladeLegend"),
      data: data.clades.map((d) => ({
        name: d.name,
        fill: d.color.fill,
        stroke: d.color.stroke,
      })),
    });

    // Mutations chart
    const mutationsChartSelection = d3
      .select("#cladeMutations .card__body")
      .on("updatefocus", updateFocus);

    const mutationsChart = multilineChart({
      selection: mutationsChartSelection,
      data,
      valueAccessor: (d) => d.mutations,
      valueName: "S1 Mutations",
      valueFormat: d3.format(".1f"),
    });

    // Fitness chart
    const fitnessChartSelection = d3
      .select("#cladeFitness .card__body")
      .on("updatefocus", updateFocus);

    const fitnessChart = multilineChart({
      selection: fitnessChartSelection,
      data,
      valueAccessor: (d) => d.fitness,
      valueName: "Mutational Fitness",
      valueFormat: d3.format(".2f"),
    });

    // Frequency chart
    const frequencyChartSelection = d3
      .select("#cladeFrequencies .card__body")
      .on("updatefocus", updateFocus);

    const frequencyChart = stackedArea({
      selection: frequencyChartSelection,
      data,
      valueAccessor: (d) => d.frequency,
      valueName: "Frequency",
      valueFormat: d3.format(".0%"),
    });

    // Highlight
    function updateHighlight(event) {
      const highlightedClades = event.detail;
      mutationsChart.updateHighlight(highlightedClades);
      fitnessChart.updateHighlight(highlightedClades);
      frequencyChart.updateHighlight(highlightedClades);
    }

    // Focus
    function updateFocus(event) {
      const focusPoint = event.detail;
      mutationsChart.updateFocus(focusPoint);
      fitnessChart.updateFocus(focusPoint);
      frequencyChart.updateFocus(focusPoint);
    }
  });
