// Reference https://observablehq.com/@d3/normalized-stacked-area-chart
function stackedArea({
  selection,
  data: { clades, dates },
  valueAccessor,
  valueName,
  valueFormat,
}) {
  // Global variables
  let highlighted, focus;

  // Setup
  const container = selection.append("div").attr("class", "stacked-area");

  const tooltip = chartTooltip(container);

  const width = container.node().clientWidth;
  const height = 200;
  const margin = {
    top: 8,
    right: 16,
    bottom: 24,
    left: 48,
  };

  const x = d3
    .scaleUtc()
    .domain([dates[0], dates[dates.length - 1]])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, 1])
    .range([height - margin.bottom, margin.top]);

  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0((d) => y(d.stack[0]))
    .y1((d) => y(d.stack[1]));

  // Process data
  const monthlyTotal = Array(dates.length).fill(0);
  const data = clades
    .slice()
    .reverse()
    .map((d) => ({
      name: d.name,
      color: d.color,
      values: d.values.map((e, i, n) => {
        const value = valueAccessor(e);
        const stack = [monthlyTotal[i], (monthlyTotal[i] += value)];
        return {
          dateIndex: i,
          date: dates[i],
          value,
          stack,
        };
      }),
    }));

  // Draw
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const gXAxis = svg
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks((width - margin.left - margin.right) / 100))
    .call((g) => g.select(".domain").remove());

  const gYAxis = svg
    .append("g")
    .attr("class", "axis axis--y")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks((height - margin.top - margin.bottom) / 50))
    .call((g) => g.select(".domain").remove());

  const series = svg
    .append("g")
    .attr("class", "series-group")
    .selectAll(".series")
    .data(data, (d) => d.name)
    .join("path")
    .attr("class", "series")
    .attr("fill", (d) => d.color.fill)
    .attr("d", (d) => area(d.values))
    .on("mousemove", moved)
    .on("mouseleave", left);

  const focusLine = svg
    .append("line")
    .attr("class", "focus-line")
    .attr("stroke", "currentColor")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke-opacity", 0);

  updateHighlight([]);

  function moved(event, d) {
    const [xm] = d3.pointer(event);
    const seriesNonNullValues = d.values.filter((d) => d.value);
    const i = d3.bisectCenter(
      seriesNonNullValues.map((d) => dates[d.dateIndex]),
      x.invert(xm)
    );
    const dateIndex = seriesNonNullValues[i].dateIndex;
    if (!focus || d.name !== focus.name || dateIndex !== focus.dateIndex) {
      selection.dispatch("updatefocus", {
        detail: {
          name: d.name,
          dateIndex,
        },
        bubble: true,
      });
    }
  }

  function left() {
    selection.dispatch("updatefocus", {
      detail: null,
      bubble: true,
    });
  }

  function isMuted(d) {
    if (highlighted.length && !highlighted.includes(d.name)) return true;
    if (focus && focus.name !== d.name) return true;
    return false;
  }

  // Highlight
  function updateHighlight(newHighlighted) {
    highlighted = newHighlighted;

    series.classed("muted", isMuted);
  }

  // Focus
  function updateFocus(newFocus) {
    focus = newFocus;

    series.classed("muted", isMuted);

    focusLine
      .attr("stroke-opacity", focus ? 1 : 0)
      .attr(
        "transform",
        focus
          ? `translate(${x(dates[focus.dateIndex])},0)`
          : `translate(${margin.left},0)`
      );

    if (focus) {
      const d = data.find((d) => d.name === focus.name);

      const html = `
      <div>${d3.utcFormat("%b %Y")(dates[focus.dateIndex])}</div>
      <div>Clade: <span style="color: ${d.color.fill}">${d.name}</span></div>
      <div>${valueName}: <span class="tooltip-highlight">${valueFormat(
        d.values[focus.dateIndex].value
      )}</span></div>
      `;

      const tx = x(dates[focus.dateIndex]);
      // Tooltip y is anchored at the middle of the series' band
      const ty =
        (y(d.values[focus.dateIndex].stack[0]) +
          y(d.values[focus.dateIndex].stack[1])) /
        2;

      tooltip.show(html, tx, ty);
    } else {
      tooltip.hide();
    }
  }

  return {
    updateHighlight,
    updateFocus,
  };
}
