function chartTooltip(selection) {
  const tooltip = selection
    .classed("tooltip-bounds", true)
    .append("div")
    .attr("class", "tooltip");

  const offset = 4;

  function show(html, x, y) {
    tooltip.html(html).classed("visible", true);

    const { width: boundsWidth, height: boundsHeight } = selection
      .node()
      .getBoundingClientRect();

    const { width, height } = tooltip.node().getBoundingClientRect();

    const transX = x < boundsWidth / 2 ? x + offset : x - offset - width;
    const transY = y < boundsHeight / 2 ? y + offset : y - offset - height;

    tooltip.style("transform", `translate(${transX}px,${transY}px)`);
  }

  function hide() {
    tooltip.classed("visible", false);
  }

  return {
    show,
    hide,
  };
}
