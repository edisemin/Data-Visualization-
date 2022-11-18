// Reference https://observablehq.com/@d3/multi-line-chart
function multilineChart({
  selection,
  data: { clades, dates },
  valueAccessor,
  valueName,
  valueFormat,
}) {
  // Global variables
  let delaunay, points, highlighted, focus;

  // Setup
  const container = selection.append("div").attr("class", "multiline-chart");

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
    .domain(d3.extent(d3.merge(clades.map((d) => d.values.map(valueAccessor)))))
    .range([height - margin.bottom, margin.top])
    .nice();

  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  // Process data
  const data = clades.map((d) => ({
    name: d.name,
    color: d.color,
    values: d.values
      .map((e, i) => ({
        dateIndex: i,
        date: dates[i],
        value: valueAccessor(e),
      }))
      .filter((d) => d.value !== null),
  }));

  // Draw
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", moved)
    .on("mouseleave", left);

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
    .join("g")
    .attr("class", "series");

  const path = series
    .append("path")
    .attr("class", "series__path")
    .attr("fill", "none")
    .attr("stroke", (d) => d.color.fill)
    .attr("stroke-width", 1.5)
    .attr("d", (d) => line(d.values));

  const circle = series
    .append("g")
    .attr("class", "series__circles")
    .attr("fill", (d) => d.color.fill)
    .selectAll(".series__circle")
    .data((d) => d.values)
    .join("circle")
    .attr("class", "series__circle")
    .attr("r", 3)
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.value));

  const focusLine = svg
    .append("line")
    .attr("class", "focus-line")
    .attr("stroke", "currentColor")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke-opacity", 0);

  updateHighlight([]);

  function moved(event) {
    const [xm, ym] = d3.pointer(event);
    const pIndex = delaunay.find(xm, ym);
    const p = points[pIndex];
    if (!focus || p.name !== focus.name || p.dateIndex !== focus.dateIndex) {
      selection.dispatch("updatefocus", {
        detail: {
          name: p.name,
          dateIndex: p.dateIndex,
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

    points = d3.merge(
      data
        .filter((d) => highlighted.length === 0 || highlighted.includes(d.name))
        .map((d) =>
          d.values.map((e) =>
            Object.assign(
              {
                name: d.name,
              },
              e
            )
          )
        )
    );

    delaunay = d3.Delaunay.from(
      points,
      (d) => x(d.date),
      (d) => y(d.value)
    );
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
        d.values.find((e) => e.dateIndex === focus.dateIndex).value
      )}</span></div>
      `;

      const tx = x(dates[focus.dateIndex]);
      const ty = y(d.values.find((e) => e.dateIndex === focus.dateIndex).value);

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
