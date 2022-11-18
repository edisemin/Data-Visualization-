function colorLegend({ selection, resetSelection, data }) {
  let selected = new Set();

  resetSelection.attr("hidden", "hidden").on("click", toggle);

  const item = selection
    .append("div")
    .attr("class", "color-legend")
    .selectAll(".item")
    .data(data)
    .join("div")
    .attr("class", "item")
    .on("click", toggle);

  item
    .append("div")
    .attr("class", "item__swatch")
    .style("background-color", (d) => d.fill)
    .style("border-color", (d) => d.stroke);

  item
    .append("div")
    .attr("class", "item__label")
    .text((d) => d.name);

  function toggle(event, d) {
    if (d) {
      if (selected.has(d.name)) {
        selected.delete(d.name);
      } else {
        selected.add(d.name);
      }
    } else {
      selected = new Set();
    }

    resetSelection.attr("hidden", selected.size ? null : "hidden");

    item.classed("muted", (d) => selected.size && !selected.has(d.name));

    selection.dispatch("updatehighlight", {
      detail: [...selected],
      bubble: true,
    });
  }
}
